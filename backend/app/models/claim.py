"""
DeliverShield AI - Claim Model
Insurance claims auto-generated or manually filed by workers.
"""

import json
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Claim(Base):
    __tablename__ = "claims"
    __table_args__ = (
        UniqueConstraint('worker_id', 'event_id', name='uq_worker_event_claim'),
    )

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    claim_hash = Column(String(64), unique=True, nullable=True)
    worker_id = Column(String, ForeignKey("workers.id"), nullable=False, index=True)
    policy_id = Column(String, ForeignKey("policies.id"), nullable=False, index=True)
    event_id = Column(String, ForeignKey("disruption_events.id"), nullable=False, index=True)
    disruption_type = Column(String(30), nullable=False)
    disrupted_hours = Column(Float, nullable=False)
    hourly_rate = Column(Float, nullable=False)
    income_loss = Column(Float, nullable=False)
    payout_amount = Column(Float, nullable=False)
    day_multiplier = Column(Float, default=1.0)
    status = Column(String(20), default="pending")  # pending / approved / paid / rejected / flagged
    fraud_score = Column(Float, default=0.0)
    fraud_flags = Column(Text, nullable=True)  # JSON list
    gps_data = Column(Text, nullable=True)  # JSON
    location_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    worker = relationship("Worker", back_populates="claims")
    policy = relationship("Policy", back_populates="claims")
    event = relationship("DisruptionEvent", back_populates="claims")
    payout = relationship("Payout", back_populates="claim", uselist=False)

    def get_fraud_flags(self) -> list:
        if self.fraud_flags:
            try:
                return json.loads(self.fraud_flags)
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    def set_fraud_flags(self, flags: list):
        self.fraud_flags = json.dumps(flags)

    def get_gps_data(self) -> dict:
        if self.gps_data:
            try:
                return json.loads(self.gps_data)
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    def set_gps_data(self, data: dict):
        self.gps_data = json.dumps(data)

    def __repr__(self):
        return f"<Claim(id={self.id}, type={self.disruption_type}, status={self.status})>"
