"""
DeliverShield AI - Policy Model
Insurance policies subscribed by workers.
"""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, Float, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Policy(Base):
    __tablename__ = "policies"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    worker_id = Column(String, ForeignKey("workers.id"), nullable=False, index=True)
    plan_type = Column(String(20), nullable=False)  # basic / standard / premium
    weekly_premium = Column(Float, nullable=False)
    max_weekly_payout = Column(Float, nullable=False)
    max_events = Column(Integer, nullable=False)  # -1 for unlimited
    events_used = Column(Integer, default=0)
    coverage_start = Column(Date, nullable=False)
    coverage_end = Column(Date, nullable=False)
    status = Column(String(20), default="active")  # active / expired / cancelled
    risk_score = Column(Float, default=50.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    worker = relationship("Worker", back_populates="policies")
    claims = relationship("Claim", back_populates="policy", lazy="dynamic")

    @property
    def has_events_remaining(self) -> bool:
        if self.max_events == -1:
            return True
        return self.events_used < self.max_events

    @property
    def is_coverage_active(self) -> bool:
        today = datetime.now(timezone.utc).date()
        return (
            self.status == "active"
            and self.coverage_start <= today <= self.coverage_end
        )

    def __repr__(self):
        return f"<Policy(id={self.id}, plan={self.plan_type}, status={self.status})>"
