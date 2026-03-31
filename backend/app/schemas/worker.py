"""
DeliverShield AI - Worker Schemas
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class WorkerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None
    platform: str = Field(..., pattern="^(swiggy|zomato|Swiggy|Zomato)$")
    partner_id: Optional[str] = None
    delivery_zone: str = Field(..., min_length=2)
    city: str = "Hyderabad"
    avg_daily_earnings: float = 800.0
    avg_orders_per_day: int = 20
    working_hours: float = 12.0
    device_info: Optional[dict] = None


class WorkerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    platform: Optional[str] = None
    partner_id: Optional[str] = None
    delivery_zone: Optional[str] = None
    avg_daily_earnings: Optional[float] = None
    avg_orders_per_day: Optional[int] = None
    working_hours: Optional[float] = None
    device_info: Optional[dict] = None


class WorkerResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    platform: str
    partner_id: Optional[str] = None
    delivery_zone: str
    city: str
    avg_daily_earnings: float
    avg_orders_per_day: int
    working_hours: float
    trust_score: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkerDashboard(BaseModel):
    worker: WorkerResponse
    active_policy: Optional[dict] = None
    recent_claims: list = []
    risk_score: float = 50.0
    earnings_protected: float = 0.0
    coverage_status: str = "none"  # none / active / expired
    weather_alert: Optional[dict] = None
    trust_score: float = 70.0
