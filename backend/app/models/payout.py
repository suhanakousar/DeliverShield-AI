"""
DeliverShield AI - Payout Model
Payment transactions for approved claims.
"""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Payout(Base):
    __tablename__ = "payouts"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    claim_id = Column(String, ForeignKey("claims.id"), nullable=False, unique=True, index=True)
    worker_id = Column(String, ForeignKey("workers.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(20), default="upi")
    transaction_id = Column(String(100), nullable=False)
    razorpay_payment_id = Column(String(100), nullable=True)
    status = Column(String(20), default="pending")  # pending / processing / completed / failed
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    claim = relationship("Claim", back_populates="payout")
    worker = relationship("Worker", back_populates="payouts")

    def __repr__(self):
        return f"<Payout(id={self.id}, amount={self.amount}, status={self.status})>"
