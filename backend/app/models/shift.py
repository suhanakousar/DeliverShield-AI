"""
DeliverShield AI - Shift Session Model
Tracks when a worker is "on the clock" — required gate for any auto-payout.
"""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class ShiftSession(Base):
    __tablename__ = "shift_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    worker_id = Column(String, ForeignKey("workers.id"), nullable=False, index=True)
    started_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="active", index=True)  # active / ended

    start_lat = Column(Float, nullable=True)
    start_lng = Column(Float, nullable=True)
    start_zone = Column(String(50), nullable=True)

    last_lat = Column(Float, nullable=True)
    last_lng = Column(Float, nullable=True)
    last_zone = Column(String(50), nullable=True)
    last_ping_at = Column(DateTime, nullable=True)

    total_distance_km = Column(Float, default=0.0)
    deliveries_completed = Column(Integer, default=0)
    earnings_estimated = Column(Float, default=0.0)

    worker = relationship("Worker", back_populates="shifts")

    @property
    def is_active(self) -> bool:
        return self.status == "active" and self.ended_at is None

    @property
    def duration_minutes(self) -> float:
        end = self.ended_at or datetime.now(timezone.utc)
        start = self.started_at
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        return (end - start).total_seconds() / 60.0

    def __repr__(self):
        return f"<ShiftSession(id={self.id}, worker={self.worker_id}, status={self.status})>"
