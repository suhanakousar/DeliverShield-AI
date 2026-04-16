"""
DeliverShield AI - Delivery Lifecycle Routes
Start / end a delivery. A worker is "delivery-active" when they have an
open delivery row — this is the second gate (after shift_active) for any
delivery-aware payout.
"""

from typing import Optional
from uuid import uuid4
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.worker import Worker
from app.models.delivery import Delivery
from app.models.shift import ShiftSession
from app.services.shift_service import shift_service
from app.services.location_service import haversine_km
from app.services.realtime_monitor import realtime_monitor


router = APIRouter(prefix="/api/delivery", tags=["Delivery"])


class DeliveryStartRequest(BaseModel):
    worker_id: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    drop_lat: Optional[float] = None
    drop_lng: Optional[float] = None
    order_ref: Optional[str] = None
    platform: Optional[str] = None


class DeliveryEndRequest(BaseModel):
    worker_id: str
    delivery_id: Optional[str] = None
    earnings: Optional[float] = None


def _serialize(d: Delivery) -> dict:
    return {
        "delivery_id": d.id,
        "worker_id": d.worker_id,
        "shift_id": d.shift_id,
        "status": d.status,
        "started_at": d.started_at.isoformat() if d.started_at else None,
        "ended_at": d.ended_at.isoformat() if d.ended_at else None,
        "pickup_lat": d.pickup_lat,
        "pickup_lng": d.pickup_lng,
        "drop_lat": d.drop_lat,
        "drop_lng": d.drop_lng,
        "distance_km": round(d.distance_km or 0.0, 2),
        "duration_minutes": round(d.duration_minutes or 0.0, 1),
        "earnings": d.earnings or 0.0,
        "order_ref": d.order_ref,
        "platform": d.platform,
        "delayed_by_disruption": d.delayed_by_disruption,
    }


def _active_delivery(db: Session, worker_id: str) -> Optional[Delivery]:
    return (
        db.query(Delivery)
        .filter(Delivery.worker_id == worker_id, Delivery.status == "active")
        .order_by(Delivery.started_at.desc())
        .first()
    )


@router.post("/start")
async def start_delivery(req: DeliveryStartRequest, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == req.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    shift = shift_service.get_active_shift(db, req.worker_id)
    if not shift:
        raise HTTPException(status_code=400, detail="Cannot start a delivery without an active shift")

    existing = _active_delivery(db, req.worker_id)
    if existing:
        return _serialize(existing)

    distance = 0.0
    if req.pickup_lat is not None and req.drop_lat is not None:
        distance = haversine_km(req.pickup_lat, req.pickup_lng, req.drop_lat, req.drop_lng)

    delivery = Delivery(
        id=str(uuid4()),
        worker_id=req.worker_id,
        shift_id=shift.id,
        status="active",
        started_at=datetime.now(timezone.utc),
        pickup_lat=req.pickup_lat,
        pickup_lng=req.pickup_lng,
        drop_lat=req.drop_lat,
        drop_lng=req.drop_lng,
        distance_km=distance,
        platform=req.platform or worker.platform,
        order_ref=req.order_ref,
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    realtime_monitor._push_event("delivery_started", {
        "worker_id": worker.id,
        "worker_name": worker.name,
        "delivery_id": delivery.id,
        "platform": delivery.platform,
        "message": f"🛵 {worker.name} started a delivery",
    })
    return _serialize(delivery)


@router.post("/end")
async def end_delivery(req: DeliveryEndRequest, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == req.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    delivery = None
    if req.delivery_id:
        delivery = db.query(Delivery).filter(Delivery.id == req.delivery_id).first()
    if not delivery:
        delivery = _active_delivery(db, req.worker_id)
    if not delivery or delivery.status != "active":
        raise HTTPException(status_code=400, detail="No active delivery to end")

    delivery.status = "completed"
    delivery.ended_at = datetime.now(timezone.utc)
    started = delivery.started_at
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    delivery.duration_minutes = (delivery.ended_at - started).total_seconds() / 60.0

    earnings = req.earnings if req.earnings is not None else round(
        (worker.avg_daily_earnings or 800.0) / max(worker.avg_orders_per_day or 20, 1), 2
    )
    delivery.earnings = earnings

    shift = db.query(ShiftSession).filter_by(id=delivery.shift_id).first() if delivery.shift_id else None
    if shift:
        shift.deliveries_completed = (shift.deliveries_completed or 0) + 1
        shift.earnings_estimated = (shift.earnings_estimated or 0.0) + earnings

    db.commit()
    db.refresh(delivery)

    realtime_monitor._push_event("delivery_completed", {
        "worker_id": worker.id,
        "worker_name": worker.name,
        "delivery_id": delivery.id,
        "earnings": delivery.earnings,
        "duration_minutes": round(delivery.duration_minutes, 1),
        "message": f"✅ {worker.name} completed a delivery (+₹{delivery.earnings:.0f})",
    })
    return _serialize(delivery)


@router.get("/{worker_id}/active")
async def get_active_delivery(worker_id: str, db: Session = Depends(get_db)):
    delivery = _active_delivery(db, worker_id)
    return {"active": bool(delivery), "delivery": _serialize(delivery) if delivery else None}


@router.get("/{worker_id}/recent")
async def recent_deliveries(worker_id: str, limit: int = 20, db: Session = Depends(get_db)):
    rows = (
        db.query(Delivery)
        .filter(Delivery.worker_id == worker_id)
        .order_by(Delivery.started_at.desc())
        .limit(limit)
        .all()
    )
    return {"count": len(rows), "deliveries": [_serialize(d) for d in rows]}
