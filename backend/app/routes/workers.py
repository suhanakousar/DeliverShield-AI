"""
DeliverShield AI - Worker Routes
Registration, profile, and dashboard endpoints for delivery partners.
"""

import json
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.worker import Worker
from app.models.policy import Policy
from app.models.claim import Claim
from app.schemas.worker import WorkerCreate, WorkerResponse, WorkerUpdate, WorkerDashboard
from app.services.risk_engine import risk_engine
from app.services.weather_service import weather_service

router = APIRouter(prefix="/api/workers", tags=["Workers"])


@router.post("/register", response_model=WorkerResponse, status_code=201)
async def register_worker(worker_data: WorkerCreate, db: Session = Depends(get_db)):
    """Register a new delivery partner."""
    # Check if phone already registered
    existing = db.query(Worker).filter(Worker.phone == worker_data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # Normalize zone and platform names
    zone_normalized = worker_data.delivery_zone.lower().replace(" ", "_")
    platform_normalized = worker_data.platform.lower()

    # Calculate initial risk score for the worker's zone
    zone_risk = risk_engine.calculate_risk_score(zone_normalized, worker_data.city)

    worker = Worker(
        id=str(uuid4()),
        name=worker_data.name,
        phone=worker_data.phone,
        email=worker_data.email,
        platform=platform_normalized,
        partner_id=worker_data.partner_id,
        delivery_zone=zone_normalized,
        city=worker_data.city,
        avg_daily_earnings=worker_data.avg_daily_earnings,
        avg_orders_per_day=worker_data.avg_orders_per_day,
        working_hours=worker_data.working_hours,
        trust_score=70.0,
        device_info=json.dumps(worker_data.device_info) if worker_data.device_info else None,
    )

    db.add(worker)
    db.commit()
    db.refresh(worker)

    return worker


@router.get("/{worker_id}", response_model=WorkerResponse)
async def get_worker(worker_id: str, db: Session = Depends(get_db)):
    """Get a worker's profile."""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker


@router.get("/{worker_id}/dashboard")
async def get_worker_dashboard(worker_id: str, db: Session = Depends(get_db)):
    """
    Get comprehensive worker dashboard with active policy, recent claims,
    risk score, earnings protected, and weather alerts.
    """
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Get active policy
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).date()
    active_policy = (
        db.query(Policy)
        .filter(
            Policy.worker_id == worker_id,
            Policy.status == "active",
            Policy.coverage_start <= today,
            Policy.coverage_end >= today,
        )
        .first()
    )

    policy_data = None
    coverage_status = "none"
    if active_policy:
        coverage_status = "active"
        policy_data = {
            "id": active_policy.id,
            "plan_type": active_policy.plan_type,
            "weekly_premium": active_policy.weekly_premium,
            "max_weekly_payout": active_policy.max_weekly_payout,
            "max_events": active_policy.max_events,
            "events_used": active_policy.events_used,
            "coverage_start": active_policy.coverage_start.isoformat(),
            "coverage_end": active_policy.coverage_end.isoformat(),
            "events_remaining": (
                "unlimited"
                if active_policy.max_events == -1
                else active_policy.max_events - active_policy.events_used
            ),
        }
    else:
        # Check for any expired policy
        expired = (
            db.query(Policy)
            .filter(Policy.worker_id == worker_id, Policy.status == "expired")
            .first()
        )
        if expired:
            coverage_status = "expired"

    # Get recent claims (last 10)
    recent_claims = (
        db.query(Claim)
        .filter(Claim.worker_id == worker_id)
        .order_by(Claim.created_at.desc())
        .limit(10)
        .all()
    )
    claims_list = [
        {
            "id": c.id,
            "disruption_type": c.disruption_type,
            "disrupted_hours": c.disrupted_hours,
            "income_loss": c.income_loss,
            "payout_amount": c.payout_amount,
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in recent_claims
    ]

    # Calculate earnings protected
    earnings_protected = sum(
        c.payout_amount for c in recent_claims if c.status in ("approved", "paid")
    )

    # Get risk score
    zone_risk = risk_engine.calculate_risk_score(worker.delivery_zone, worker.city)

    # Get current weather alert if any
    weather_data = await weather_service.get_current_weather(worker.delivery_zone)
    breaches = weather_service.check_thresholds(weather_data)
    weather_alert = None
    if breaches:
        weather_alert = {
            "active": True,
            "triggers": breaches,
            "weather": weather_data,
        }
    else:
        weather_alert = {
            "active": False,
            "weather": {
                "temperature": weather_data.get("temperature"),
                "rainfall_mm_hr": weather_data.get("rainfall_mm_hr"),
                "condition": weather_data.get("weather_condition"),
            },
        }

    return {
        "worker": WorkerResponse.model_validate(worker).model_dump(),
        "active_policy": policy_data,
        "recent_claims": claims_list,
        "risk_score": zone_risk["risk_score"],
        "risk_level": zone_risk["risk_level"],
        "earnings_protected": round(earnings_protected, 2),
        "coverage_status": coverage_status,
        "weather_alert": weather_alert,
        "trust_score": worker.trust_score,
    }


@router.put("/{worker_id}", response_model=WorkerResponse)
async def update_worker(worker_id: str, update_data: WorkerUpdate, db: Session = Depends(get_db)):
    """Update a worker's profile."""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    update_dict = update_data.model_dump(exclude_unset=True)

    if "device_info" in update_dict and update_dict["device_info"] is not None:
        update_dict["device_info"] = json.dumps(update_dict["device_info"])

    for field, value in update_dict.items():
        setattr(worker, field, value)

    db.commit()
    db.refresh(worker)

    return worker
