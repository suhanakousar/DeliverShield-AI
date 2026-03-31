"""
DeliverShield AI - Admin Routes
Dashboard, analytics, and disruption simulation endpoints.
"""

import json
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.worker import Worker
from app.models.policy import Policy
from app.models.claim import Claim
from app.models.payout import Payout
from app.models.disruption import DisruptionEvent
from app.schemas.disruption import DisruptionSimulate
from app.services.trigger_monitor import trigger_monitor
from app.services.payout_service import payout_service

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard")
async def admin_dashboard(db: Session = Depends(get_db)):
    """
    Admin dashboard with key metrics:
    - Total workers, active policies, total claims, total payouts
    - Loss ratio, fraud rate, active events
    """
    today = datetime.now(timezone.utc).date()

    total_workers = db.query(func.count(Worker.id)).scalar() or 0
    active_workers = db.query(func.count(Worker.id)).filter(Worker.is_active == True).scalar() or 0

    active_policies = (
        db.query(func.count(Policy.id))
        .filter(
            Policy.status == "active",
            Policy.coverage_start <= today,
            Policy.coverage_end >= today,
        )
        .scalar() or 0
    )

    total_claims = db.query(func.count(Claim.id)).scalar() or 0
    approved_claims = db.query(func.count(Claim.id)).filter(Claim.status.in_(["approved", "paid"])).scalar() or 0
    flagged_claims = db.query(func.count(Claim.id)).filter(Claim.status == "flagged").scalar() or 0
    rejected_claims = db.query(func.count(Claim.id)).filter(Claim.status == "rejected").scalar() or 0

    total_payout_amount = db.query(func.sum(Payout.amount)).filter(Payout.status == "completed").scalar() or 0.0
    total_premium_collected = db.query(func.sum(Policy.weekly_premium)).scalar() or 0.0

    loss_ratio = round(total_payout_amount / total_premium_collected, 4) if total_premium_collected > 0 else 0.0
    fraud_rate = round(flagged_claims / total_claims, 4) if total_claims > 0 else 0.0

    active_events = db.query(func.count(DisruptionEvent.id)).filter(DisruptionEvent.status == "active").scalar() or 0

    return {
        "total_workers": total_workers,
        "active_workers": active_workers,
        "active_policies": active_policies,
        "total_claims": total_claims,
        "approved_claims": approved_claims,
        "flagged_claims": flagged_claims,
        "rejected_claims": rejected_claims,
        "total_payout_amount": round(total_payout_amount, 2),
        "total_premium_collected": round(total_premium_collected, 2),
        "loss_ratio": loss_ratio,
        "fraud_rate": fraud_rate,
        "active_events": active_events,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/claims")
async def list_all_claims(
    status: Optional[str] = Query(None, description="Filter by status"),
    zone: Optional[str] = Query(None, description="Filter by zone"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all claims with optional filters."""
    query = db.query(Claim).join(Worker, Claim.worker_id == Worker.id)

    if status:
        query = query.filter(Claim.status == status)
    if zone:
        query = query.filter(Worker.delivery_zone == zone)

    total = query.count()
    claims = query.order_by(Claim.created_at.desc()).offset(offset).limit(limit).all()

    claims_list = []
    for claim in claims:
        worker = db.query(Worker).filter(Worker.id == claim.worker_id).first()
        claims_list.append({
            "id": claim.id,
            "worker_id": claim.worker_id,
            "worker_name": worker.name if worker else "Unknown",
            "worker_zone": worker.delivery_zone if worker else "Unknown",
            "disruption_type": claim.disruption_type,
            "disrupted_hours": claim.disrupted_hours,
            "income_loss": claim.income_loss,
            "payout_amount": claim.payout_amount,
            "status": claim.status,
            "fraud_score": claim.fraud_score,
            "location_verified": claim.location_verified,
            "created_at": claim.created_at.isoformat() if claim.created_at else None,
        })

    return {
        "total": total,
        "claims": claims_list,
        "limit": limit,
        "offset": offset,
    }


@router.get("/events")
async def list_all_events(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List all disruption events."""
    query = db.query(DisruptionEvent)
    if status:
        query = query.filter(DisruptionEvent.status == status)

    events = query.order_by(DisruptionEvent.created_at.desc()).all()

    events_list = []
    for event in events:
        events_list.append({
            "id": event.id,
            "event_type": event.event_type,
            "zone": event.zone,
            "city": event.city,
            "severity": event.severity,
            "start_time": event.start_time.isoformat() if event.start_time else None,
            "end_time": event.end_time.isoformat() if event.end_time else None,
            "affected_workers": event.affected_workers,
            "total_payouts": event.total_payouts,
            "status": event.status,
            "created_at": event.created_at.isoformat() if event.created_at else None,
        })

    return {"total": len(events_list), "events": events_list}


@router.get("/analytics")
async def get_analytics(db: Session = Depends(get_db)):
    """Detailed analytics: claims by type, payouts by zone, fraud metrics."""

    # Claims by disruption type
    claims_by_type = (
        db.query(Claim.disruption_type, func.count(Claim.id), func.sum(Claim.payout_amount))
        .group_by(Claim.disruption_type)
        .all()
    )
    claims_by_type_data = [
        {
            "type": row[0],
            "count": row[1],
            "total_payout": round(row[2] or 0, 2),
        }
        for row in claims_by_type
    ]

    # Payouts by zone
    payouts_by_zone = (
        db.query(Worker.delivery_zone, func.count(Claim.id), func.sum(Claim.payout_amount))
        .join(Claim, Worker.id == Claim.worker_id)
        .filter(Claim.status.in_(["approved", "paid"]))
        .group_by(Worker.delivery_zone)
        .all()
    )
    payouts_by_zone_data = [
        {
            "zone": row[0],
            "claims_count": row[1],
            "total_payout": round(row[2] or 0, 2),
        }
        for row in payouts_by_zone
    ]

    # Claims by status
    claims_by_status = (
        db.query(Claim.status, func.count(Claim.id))
        .group_by(Claim.status)
        .all()
    )
    claims_by_status_data = {row[0]: row[1] for row in claims_by_status}

    # Fraud metrics
    total_claims = db.query(func.count(Claim.id)).scalar() or 0
    avg_fraud_score = db.query(func.avg(Claim.fraud_score)).scalar() or 0.0
    high_fraud_claims = db.query(func.count(Claim.id)).filter(Claim.fraud_score >= 0.5).scalar() or 0

    # Average payout
    avg_payout = db.query(func.avg(Claim.payout_amount)).filter(Claim.status.in_(["approved", "paid"])).scalar() or 0.0

    # Workers by platform
    workers_by_platform = (
        db.query(Worker.platform, func.count(Worker.id))
        .group_by(Worker.platform)
        .all()
    )
    workers_by_platform_data = {row[0]: row[1] for row in workers_by_platform}

    # Plans distribution
    today = datetime.now(timezone.utc).date()
    plans_distribution = (
        db.query(Policy.plan_type, func.count(Policy.id))
        .filter(Policy.status == "active", Policy.coverage_end >= today)
        .group_by(Policy.plan_type)
        .all()
    )
    plans_data = {row[0]: row[1] for row in plans_distribution}

    return {
        "claims_by_type": claims_by_type_data,
        "payouts_by_zone": payouts_by_zone_data,
        "claims_by_status": claims_by_status_data,
        "fraud_metrics": {
            "total_claims_analyzed": total_claims,
            "average_fraud_score": round(avg_fraud_score, 4),
            "high_fraud_claims": high_fraud_claims,
            "fraud_rate": round(high_fraud_claims / total_claims, 4) if total_claims > 0 else 0,
        },
        "financial": {
            "average_payout": round(avg_payout, 2),
            "total_payouts": round(
                db.query(func.sum(Payout.amount)).filter(Payout.status == "completed").scalar() or 0, 2
            ),
            "total_premiums": round(
                db.query(func.sum(Policy.weekly_premium)).scalar() or 0, 2
            ),
        },
        "workers_by_platform": workers_by_platform_data,
        "plans_distribution": plans_data,
    }


@router.post("/simulate-disruption")
async def simulate_disruption(
    sim_data: DisruptionSimulate,
    db: Session = Depends(get_db),
):
    """
    Simulate a disruption event end-to-end:
    1. Create a DisruptionEvent
    2. Find all workers with active policies in that zone
    3. Run fraud detection on each
    4. Create claims
    5. Process payouts for approved claims
    6. Return summary
    """
    # Normalize zone name to lowercase with underscores
    zone = sim_data.zone.lower().replace(" ", "_")

    # Create the disruption event
    event = await trigger_monitor.create_disruption_event(
        trigger_type=sim_data.event_type,
        zone=zone,
        severity=sim_data.severity,
        weather_data=sim_data.weather_data or {
            "source": "simulation",
            "event_type": sim_data.event_type,
            "severity": sim_data.severity,
        },
        db=db,
    )

    # Override disrupted hours if specified
    original_hours = trigger_monitor.SEVERITY_DISRUPTED_HOURS.get(sim_data.severity, 3.0)
    trigger_monitor.SEVERITY_DISRUPTED_HOURS[sim_data.severity] = sim_data.disrupted_hours

    # Process affected workers (creates claims with fraud detection)
    processing_result = trigger_monitor.process_affected_workers(event, db)

    # Restore original hours mapping
    trigger_monitor.SEVERITY_DISRUPTED_HOURS[sim_data.severity] = original_hours

    # Process payouts for approved claims
    payouts_processed = 0
    payout_results = []
    for claim_info in processing_result["claims"]:
        if claim_info["status"] == "approved":
            claim = db.query(Claim).filter(Claim.id == claim_info["claim_id"]).first()
            worker = db.query(Worker).filter(Worker.id == claim_info["worker_id"]).first()
            if claim and worker:
                payout_result = payout_service.process_payout(claim, worker, db)
                payout_results.append(payout_result)
                if payout_result.get("success"):
                    payouts_processed += 1

    return {
        "event": {
            "id": event.id,
            "event_type": event.event_type,
            "zone": event.zone,
            "severity": event.severity,
            "status": event.status,
            "start_time": event.start_time.isoformat() if event.start_time else None,
        },
        "processing": processing_result,
        "payouts": {
            "processed": payouts_processed,
            "total_amount": round(processing_result["total_payout"], 2),
            "details": payout_results,
        },
        "summary": {
            "workers_affected": processing_result["total_workers_affected"],
            "claims_approved": processing_result["claims_approved"],
            "claims_flagged": processing_result["claims_flagged"],
            "claims_rejected": processing_result["claims_rejected"],
            "total_payout": round(processing_result["total_payout"], 2),
        },
    }


@router.get("/forecast")
async def get_disruption_forecast(db: Session = Depends(get_db)):
    """7-day predictive disruption forecast using risk engine."""
    from app.services.risk_engine import risk_engine
    from app.services.weather_service import weather_service

    forecast_data = []
    for zone in ["kukatpally", "banjara_hills", "old_city", "gachibowli", "lb_nagar", "madhapur", "secunderabad", "dilsukhnagar"]:
        zone_risk = risk_engine.calculate_risk_score(zone, "Hyderabad")
        forecast = await weather_service.get_forecast(zone, "Hyderabad")

        zone_forecast = {
            "zone": zone,
            "risk_score": zone_risk["risk_score"],
            "risk_level": zone_risk["risk_level"],
            "daily_forecast": forecast[:7] if isinstance(forecast, list) else forecast.get("forecast", [])[:7],
            "top_risks": zone_risk.get("top_risks", []),
        }
        forecast_data.append(zone_forecast)

    # Overall city prediction
    avg_risk = sum(z["risk_score"] for z in forecast_data) / len(forecast_data) if forecast_data else 0

    return {
        "city": "Hyderabad",
        "forecast_period": "7 days",
        "average_risk_score": round(avg_risk, 1),
        "zones": forecast_data,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
