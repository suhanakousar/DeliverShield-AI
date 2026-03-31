"""
DeliverShield AI - Disruption Event Schemas
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DisruptionCreate(BaseModel):
    event_type: str = Field(..., pattern="^(heavy_rain|extreme_heat|flood|curfew|severe_pollution)$")
    zone: str
    city: str = "Hyderabad"
    severity: str = Field(..., pattern="^(low|medium|high|extreme)$")
    weather_data: Optional[dict] = None
    source_confirmations: Optional[list] = None


class DisruptionResponse(BaseModel):
    id: str
    event_type: str
    zone: str
    city: str
    severity: str
    start_time: datetime
    end_time: Optional[datetime] = None
    affected_workers: int
    total_payouts: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DisruptionSimulate(BaseModel):
    event_type: str = Field(..., pattern="^(heavy_rain|extreme_heat|flood|curfew|severe_pollution)$")
    zone: str
    severity: str = Field(default="high", pattern="^(low|medium|high|extreme)$")
    disrupted_hours: float = Field(default=3.0, gt=0, le=12)
    weather_data: Optional[dict] = None


class DisruptionSummary(BaseModel):
    event: DisruptionResponse
    claims_created: int
    claims_approved: int
    claims_flagged: int
    total_payout: float
    affected_workers_list: list = []
