"""
DeliverShield AI - Payout Schemas
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PayoutCreate(BaseModel):
    claim_id: str
    worker_id: str
    amount: float
    payment_method: str = "upi"


class PayoutResponse(BaseModel):
    id: str
    claim_id: str
    worker_id: str
    amount: float
    payment_method: str
    transaction_id: str
    razorpay_payment_id: Optional[str] = None
    status: str
    processed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PayoutSummary(BaseModel):
    total_payouts: int
    total_amount: float
    pending_amount: float
    completed_amount: float
