"""
DeliverShield AI - Location Tracking Routes
High-frequency GPS ping ingestion + retrieval.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.worker import Worker
from app.services.location_service import location_service
from app.services.shift_service import shift_service


router = APIRouter(prefix="/api/location", tags=["Location"])


class LocationUpdateRequest(BaseModel):
    worker_id: str
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    speed_kmh: Optional[float] = 0.0
    accuracy_m: Optional[float] = None
    heading: Optional[float] = None
    is_mock: Optional[bool] = False


@router.post("/update")
async def update_location(req: LocationUpdateRequest, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == req.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    active_shift = shift_service.get_active_shift(db, req.worker_id)

    log = location_service.record_ping(
        db,
        worker_id=req.worker_id,
        lat=req.lat,
        lng=req.lng,
        speed_kmh=req.speed_kmh or 0.0,
        accuracy_m=req.accuracy_m,
        heading=req.heading,
        is_mock=bool(req.is_mock),
        shift_id=active_shift.id if active_shift else None,
    )

    return {
        "ok": True,
        "log_id": log.id,
        "zone": log.zone,
        "is_jump": log.is_jump,
        "distance_from_prev_km": log.distance_from_prev_km,
        "shift_active": bool(active_shift),
    }


@router.get("/{worker_id}/recent")
async def recent_locations(worker_id: str, minutes: int = 30, limit: int = 100, db: Session = Depends(get_db)):
    logs = location_service.recent_logs(db, worker_id, minutes=minutes, limit=limit)
    return {
        "count": len(logs),
        "locations": [
            {
                "id": l.id,
                "lat": l.lat,
                "lng": l.lng,
                "speed_kmh": l.speed_kmh,
                "zone": l.zone,
                "is_jump": l.is_jump,
                "is_mock": l.is_mock,
                "recorded_at": l.recorded_at.isoformat() if l.recorded_at else None,
            }
            for l in logs
        ],
    }


@router.get("/{worker_id}/status")
async def movement_status(worker_id: str, minutes: int = 5, db: Session = Depends(get_db)):
    movement = location_service.is_worker_moving(db, worker_id, minutes=minutes)
    latest = location_service.latest_location(db, worker_id)
    return {
        "movement": movement,
        "latest": (
            {
                "lat": latest.lat,
                "lng": latest.lng,
                "zone": latest.zone,
                "speed_kmh": latest.speed_kmh,
                "recorded_at": latest.recorded_at.isoformat() if latest.recorded_at else None,
            }
            if latest else None
        ),
    }
