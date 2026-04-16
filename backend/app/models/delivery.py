"""
DeliverShield AI - Delivery Model
Represents an in-progress / completed delivery during a shift.
A worker is "delivery-active" when they have an open delivery row.
This is the second gate (after shift_active) for delivery-aware payouts.
"""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    worker_id = Column(String, ForeignKey("workers.id"), nullable=False, index=True)
    shift_id = Column(String, ForeignKey("shift_sessions.id"), nullable=True, index=True)

    status = Column(String(20), default="active", index=True)  # active / completed / cancelled
    started_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)

    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    drop_lat = Column(Float, nullable=True)
    drop_lng = Column(Float, nullable=True)

    distance_km = Column(Float, default=0.0)
    duration_minutes = Column(Float, default=0.0)
    earnings = Column(Float, default=0.0)
    order_ref = Column(String(64), nullable=True)
    platform = Column(String(20), nullable=True)
    delayed_by_disruption = Column(Boolean, default=False)

    worker = relationship("Worker", back_populates="deliveries")

    @property
    def is_active(self) -> bool:
        return self.status == "active" and self.ended_at is None

    def __repr__(self):
        return f"<Delivery(id={self.id}, worker={self.worker_id}, status={self.status})>"
