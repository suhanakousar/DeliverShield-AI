"""
DeliverShield AI - Shift Management Routes
Start / end a worker shift. Required gate for delivery-aware payouts.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.worker import Worker
from app.services.shift_service import shift_service
from app.services.realtime_monitor import realtime_monitor


router = APIRouter(prefix="/api/shift", tags=["Shift"])


class ShiftStartRequest(BaseModel):
    worker_id: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class ShiftEndRequest(BaseModel):
    worker_id: str


def _shift_payload(shift) -> dict:
    return {
        "shift_id": shift.id,
        "worker_id": shift.worker_id,
        "status": shift.status,
        "started_at": shift.started_at.isoformat() if shift.started_at else None,
        "ended_at": shift.ended_at.isoformat() if shift.ended_at else None,
        "duration_minutes": round(shift.duration_minutes, 1),
        "start_zone": shift.start_zone,
        "last_zone": shift.last_zone,
        "last_lat": shift.last_lat,
        "last_lng": shift.last_lng,
        "total_distance_km": round(shift.total_distance_km or 0.0, 2),
        "deliveries_completed": shift.deliveries_completed or 0,
    }


@router.post("/start")
async def start_shift(req: ShiftStartRequest, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == req.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    shift = shift_service.start_shift(db, req.worker_id, req.lat, req.lng)
    payload = _shift_payload(shift)

    realtime_monitor._push_event("shift_started", {
        "worker_id": worker.id,
        "worker_name": worker.name,
        "shift_id": shift.id,
        "zone": shift.start_zone,
        "message": f"🟢 {worker.name} started a shift",
    })
    return payload


@router.post("/end")
async def end_shift(req: ShiftEndRequest, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == req.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    shift = shift_service.end_shift(db, req.worker_id)
    if not shift:
        raise HTTPException(status_code=400, detail="No active shift to end")

    payload = _shift_payload(shift)
    realtime_monitor._push_event("shift_ended", {
        "worker_id": worker.id,
        "worker_name": worker.name,
        "shift_id": shift.id,
        "duration_minutes": payload["duration_minutes"],
        "distance_km": payload["total_distance_km"],
        "message": f"🔴 {worker.name} ended shift after {payload['duration_minutes']:.0f} min",
    })
    return payload


@router.get("/{worker_id}/active")
async def get_active_shift(worker_id: str, db: Session = Depends(get_db)):
    shift = shift_service.get_active_shift(db, worker_id)
    if not shift:
        return {"active": False, "shift": None}
    return {"active": True, "shift": _shift_payload(shift)}
