"""
DeliverShield AI - Location Log Model
Stores high-frequency GPS pings from a worker during a shift.
Used by the delivery-aware trigger engine and fraud detection (GPS jumps,
movement pattern, location verification).
"""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship

from app.database import Base


class LocationLog(Base):
    __tablename__ = "location_logs"
    __table_args__ = (
        Index("ix_location_worker_time", "worker_id", "recorded_at"),
    )

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    worker_id = Column(String, ForeignKey("workers.id"), nullable=False, index=True)
    shift_id = Column(String, ForeignKey("shift_sessions.id"), nullable=True, index=True)

    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    accuracy_m = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    zone = Column(String(50), nullable=True, index=True)

    is_mock = Column(Boolean, default=False)
    is_jump = Column(Boolean, default=False)  # flagged as a teleport
    distance_from_prev_km = Column(Float, default=0.0)

    recorded_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    worker = relationship("Worker", back_populates="locations")

    def __repr__(self):
        return f"<LocationLog(worker={self.worker_id}, lat={self.lat}, lng={self.lng})>"
