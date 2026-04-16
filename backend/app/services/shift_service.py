"""
DeliverShield AI - Shift Service
Open / close shift sessions. Encapsulates the "is the worker on the clock"
state used as the first gate by the delivery-aware trigger engine.
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.shift import ShiftSession
from app.models.delivery import Delivery
from app.services.location_service import location_service


class ShiftService:
    def get_active_shift(self, db: Session, worker_id: str) -> Optional[ShiftSession]:
        return (
            db.query(ShiftSession)
            .filter(ShiftSession.worker_id == worker_id, ShiftSession.status == "active")
            .first()
        )

    def start_shift(
        self,
        db: Session,
        worker_id: str,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
    ) -> ShiftSession:
        existing = self.get_active_shift(db, worker_id)
        if existing:
            return existing

        zone = location_service.nearest_zone(lat, lng) if (lat is not None and lng is not None) else None

        shift = ShiftSession(
            id=str(uuid4()),
            worker_id=worker_id,
            started_at=datetime.now(timezone.utc),
            status="active",
            start_lat=lat,
            start_lng=lng,
            start_zone=zone,
            last_lat=lat,
            last_lng=lng,
            last_zone=zone,
            last_ping_at=datetime.now(timezone.utc) if lat is not None else None,
        )
        db.add(shift)
        db.commit()
        db.refresh(shift)
        return shift

    def end_shift(self, db: Session, worker_id: str) -> Optional[ShiftSession]:
        shift = self.get_active_shift(db, worker_id)
        if not shift:
            return None

        # Close any dangling deliveries
        open_deliveries = (
            db.query(Delivery)
            .filter(Delivery.worker_id == worker_id, Delivery.status == "active")
            .all()
        )
        for d in open_deliveries:
            d.status = "cancelled"
            d.ended_at = datetime.now(timezone.utc)

        shift.ended_at = datetime.now(timezone.utc)
        shift.status = "ended"
        db.commit()
        db.refresh(shift)
        return shift


shift_service = ShiftService()
