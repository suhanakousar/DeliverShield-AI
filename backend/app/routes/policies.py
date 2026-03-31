"""
DeliverShield AI - Policy Routes
Insurance plan subscription and management endpoints.
"""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.worker import Worker
from app.models.policy import Policy
from app.schemas.policy import PolicyCreate, PolicyResponse, PlanInfo
from app.services.premium_calculator import premium_calculator
from app.services.risk_engine import risk_engine

router = APIRouter(prefix="/api/policies", tags=["Policies"])


@router.get("/plans", response_model=list[PlanInfo])
async def list_plans():
    """List all available insurance plans with base pricing."""
    plans = []
    for plan_type, plan_data in settings.PLANS.items():
        features = []
        if plan_type == "basic":
            features = [
                "Up to 2 covered events per week",
                "Max Rs.500 weekly payout",
                "Heavy rain & extreme heat coverage",
                "UPI instant payout",
            ]
        elif plan_type == "standard":
            features = [
                "Up to 3 covered events per week",
                "Max Rs.800 weekly payout",
                "All weather events covered",
                "Priority UPI payout",
                "SMS weather alerts",
            ]
        else:  # premium
            features = [
                "Unlimited events per week",
                "Max Rs.1,200 weekly payout",
                "All events including curfew",
                "Instant UPI payout",
                "Real-time weather alerts",
                "Priority support",
            ]

        plans.append(PlanInfo(
            plan_type=plan_type,
            name=plan_data["name"],
            weekly_premium=plan_data["weekly_premium"],
            max_weekly_payout=plan_data["max_weekly_payout"],
            max_events=plan_data["max_events"],
            features=features,
        ))

    return plans


@router.post("/subscribe", status_code=201)
async def subscribe_to_plan(policy_data: PolicyCreate, db: Session = Depends(get_db)):
    """
    Subscribe a worker to an insurance plan.
    Calculates dynamic premium and creates a 7-day policy.
    """
    # Validate worker
    worker = db.query(Worker).filter(Worker.id == policy_data.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Check for existing active policy
    today = datetime.now(timezone.utc).date()
    existing_active = (
        db.query(Policy)
        .filter(
            Policy.worker_id == worker.id,
            Policy.status == "active",
            Policy.coverage_end >= today,
        )
        .first()
    )
    if existing_active:
        raise HTTPException(
            status_code=400,
            detail="Worker already has an active policy. Wait for current policy to expire or cancel it first.",
        )

    # Validate plan type
    if policy_data.plan_type not in settings.PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan type")

    plan_config = settings.PLANS[policy_data.plan_type]

    # Calculate dynamic premium
    premium_breakdown = premium_calculator.calculate_premium(worker, policy_data.plan_type)

    # Calculate risk score for the zone
    zone_risk = risk_engine.calculate_risk_score(worker.delivery_zone, worker.city)

    # Create policy with 7-day coverage
    coverage_start = today
    coverage_end = today + timedelta(days=7)

    policy = Policy(
        id=str(uuid4()),
        worker_id=worker.id,
        plan_type=policy_data.plan_type,
        weekly_premium=premium_breakdown["final_premium"],
        max_weekly_payout=plan_config["max_weekly_payout"],
        max_events=plan_config["max_events"],
        events_used=0,
        coverage_start=coverage_start,
        coverage_end=coverage_end,
        status="active",
        risk_score=zone_risk["risk_score"],
    )

    db.add(policy)
    db.commit()
    db.refresh(policy)

    return {
        "policy": PolicyResponse.model_validate(policy).model_dump(),
        "premium_breakdown": premium_breakdown,
        "zone_risk": zone_risk,
        "message": f"Successfully subscribed to {plan_config['name']}. Coverage: {coverage_start} to {coverage_end}",
    }


@router.get("/{worker_id}/active")
async def get_active_policy(worker_id: str, db: Session = Depends(get_db)):
    """Get the active policy for a worker."""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

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

    if not active_policy:
        return {"active_policy": None, "message": "No active policy found"}

    return {
        "active_policy": PolicyResponse.model_validate(active_policy).model_dump(),
        "events_remaining": (
            "unlimited"
            if active_policy.max_events == -1
            else max(0, active_policy.max_events - active_policy.events_used)
        ),
        "days_remaining": (active_policy.coverage_end - today).days,
    }


@router.get("/{worker_id}/history", response_model=list[PolicyResponse])
async def get_policy_history(worker_id: str, db: Session = Depends(get_db)):
    """Get all policies (current and past) for a worker."""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    policies = (
        db.query(Policy)
        .filter(Policy.worker_id == worker_id)
        .order_by(Policy.created_at.desc())
        .all()
    )

    return policies
