"""
DeliverShield AI - Policy Schemas
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class PolicyCreate(BaseModel):
    worker_id: str
    plan_type: str = Field(..., pattern="^(basic|standard|premium)$")


class PolicyUpdate(BaseModel):
    status: Optional[str] = None


class PolicyResponse(BaseModel):
    id: str
    worker_id: str
    plan_type: str
    weekly_premium: float
    max_weekly_payout: float
    max_events: int
    events_used: int
    coverage_start: date
    coverage_end: date
    status: str
    risk_score: float
    created_at: datetime

    model_config = {"from_attributes": True}


class PlanInfo(BaseModel):
    plan_type: str
    name: str
    weekly_premium: float
    max_weekly_payout: float
    max_events: int
    features: list[str] = []


class PremiumBreakdown(BaseModel):
    base_rate: float
    location_adjustment: float
    seasonal_adjustment: float
    historical_adjustment: float
    final_premium: float
    plan_type: str
    worker_zone: str
