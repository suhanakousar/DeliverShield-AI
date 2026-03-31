"""
DeliverShield AI - Claim Schemas
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ClaimCreate(BaseModel):
    worker_id: str
    policy_id: str
    event_id: str
    disruption_type: str
    disrupted_hours: float = Field(..., gt=0)
    gps_data: Optional[dict] = None


class ClaimResponse(BaseModel):
    id: str
    worker_id: str
    policy_id: str
    event_id: str
    disruption_type: str
    disrupted_hours: float
    hourly_rate: float
    income_loss: float
    payout_amount: float
    day_multiplier: float
    status: str
    fraud_score: float
    location_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ClaimDetail(BaseModel):
    claim: ClaimResponse
    fraud_analysis: Optional[dict] = None
    event_details: Optional[dict] = None
    payout_info: Optional[dict] = None
    worker_name: str = ""
    worker_zone: str = ""


class ManualTriggerRequest(BaseModel):
    worker_id: str
    event_type: str = Field(..., pattern="^(heavy_rain|extreme_heat|flood|curfew)$")
    disrupted_hours: float = Field(..., gt=0, le=12)
    zone: str
    gps_data: Optional[dict] = None
