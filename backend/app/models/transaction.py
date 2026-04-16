"""
DeliverShield AI - Wallet Transaction Model
Append-only ledger of every credit/debit on the worker's wallet
(payouts in, premium debits, withdrawals, manual adjustments).
"""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    worker_id = Column(String, ForeignKey("workers.id"), nullable=False, index=True)

    # credit | debit
    direction = Column(String(10), nullable=False)
    # payout | premium | withdrawal | adjustment
    kind = Column(String(20), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)

    reference_type = Column(String(20), nullable=True)  # claim / policy / payout
    reference_id = Column(String, nullable=True)

    description = Column(String(255), nullable=True)
    meta = Column(Text, nullable=True)  # JSON blob

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    worker = relationship("Worker", back_populates="transactions")

    def __repr__(self):
        return f"<WalletTransaction({self.direction} {self.amount} {self.kind})>"
