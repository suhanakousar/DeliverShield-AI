"""
DeliverShield AI - Claims Routes
Claim viewing, detail, and manual trigger endpoints.
"""

import json
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.worker import Worker
from app.models.policy import Policy
from app.models.claim import Claim
from app.models.disruption import DisruptionEvent
from app.models.payout import Payout
from app.schemas.claim import ClaimResponse, ClaimDetail, ManualTriggerRequest
from app.services.fraud_detection import fraud_detection_service
from app.services.income_estimator import income_estimator

router = APIRouter(prefix="/api/claims", tags=["Claims"])


@router.get("/{worker_id}", response_model=list[ClaimResponse])
async def get_worker_claims(worker_id: str, db: Session = Depends(get_db)):
    """Get all claims for a worker."""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    claims = (
        db.query(Claim)
        .filter(Claim.worker_id == worker_id)
        .order_by(Claim.created_at.desc())
        .all()
    )

    return claims


@router.get("/detail/{claim_id}")
async def get_claim_detail(claim_id: str, db: Session = Depends(get_db)):
    """Get detailed information about a specific claim, including fraud analysis."""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    worker = db.query(Worker).filter(Worker.id == claim.worker_id).first()
    event = db.query(DisruptionEvent).filter(DisruptionEvent.id == claim.event_id).first()
    payout = db.query(Payout).filter(Payout.claim_id == claim.id).first()

    # Build fraud analysis details
    fraud_analysis = {
        "fraud_score": claim.fraud_score,
        "flags": claim.get_fraud_flags(),
        "location_verified": claim.location_verified,
        "recommendation": (
            "reject" if claim.fraud_score >= 0.75
            else ("flag" if claim.fraud_score >= 0.5 else "approve")
        ),
    }

    event_details = None
    if event:
        event_details = {
            "id": event.id,
            "event_type": event.event_type,
            "zone": event.zone,
            "severity": event.severity,
            "start_time": event.start_time.isoformat() if event.start_time else None,
            "end_time": event.end_time.isoformat() if event.end_time else None,
            "status": event.status,
            "affected_workers": event.affected_workers,
        }

    payout_info = None
    if payout:
        payout_info = {
            "id": payout.id,
            "amount": payout.amount,
            "status": payout.status,
            "transaction_id": payout.transaction_id,
            "payment_method": payout.payment_method,
            "processed_at": payout.processed_at.isoformat() if payout.processed_at else None,
        }

    return {
        "claim": ClaimResponse.model_validate(claim).model_dump(),
        "fraud_analysis": fraud_analysis,
        "event_details": event_details,
        "payout_info": payout_info,
        "worker_name": worker.name if worker else "",
        "worker_zone": worker.delivery_zone if worker else "",
    }


@router.post("/manual-trigger")
async def manual_trigger_claim(
    request: ManualTriggerRequest,
    db: Session = Depends(get_db),
):
    """
    Admin endpoint to manually trigger a claim for testing.
    Creates a disruption event and a claim for the specified worker.
    """
    # Validate worker
    worker = db.query(Worker).filter(Worker.id == request.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Find active policy
    today = datetime.now(timezone.utc).date()
    policy = (
        db.query(Policy)
        .filter(
            Policy.worker_id == worker.id,
            Policy.status == "active",
            Policy.coverage_start <= today,
            Policy.coverage_end >= today,
        )
        .first()
    )
    if not policy:
        raise HTTPException(status_code=400, detail="Worker has no active policy")

    # Check event limits
    if policy.max_events != -1 and policy.events_used >= policy.max_events:
        raise HTTPException(status_code=400, detail="Event limit reached for current policy")

    # Create disruption event
    event = DisruptionEvent(
        id=str(uuid4()),
        event_type=request.event_type,
        zone=request.zone,
        city="Hyderabad",
        severity="high",
        start_time=datetime.now(timezone.utc),
        weather_data=json.dumps({"source": "manual_trigger", "type": request.event_type}),
        source_confirmations=json.dumps([{"source": "admin_manual", "confirmed": True}]),
        status="active",
        affected_workers=1,
    )
    db.add(event)
    db.flush()

    # Calculate income loss
    loss_data = income_estimator.estimate_loss(worker, request.disrupted_hours)
    payout_data = income_estimator.calculate_payout(loss_data["income_loss"], policy)

    # Run fraud detection
    claim_data = {
        "gps_data": request.gps_data,
        "zone": request.zone,
        "disrupted_hours": request.disrupted_hours,
        "payout_amount": payout_data["payout_amount"],
        "recent_claim_count": db.query(Claim).filter(Claim.worker_id == worker.id).count(),
        "time_to_claim_minutes": 0,
    }
    fraud_result = fraud_detection_service.analyze_claim(claim_data, worker, event)

    # Create claim
    claim = Claim(
        id=str(uuid4()),
        worker_id=worker.id,
        policy_id=policy.id,
        event_id=event.id,
        disruption_type=request.event_type,
        disrupted_hours=request.disrupted_hours,
        hourly_rate=loss_data["hourly_rate"],
        income_loss=loss_data["income_loss"],
        payout_amount=payout_data["payout_amount"],
        day_multiplier=loss_data["day_multiplier"],
        status=fraud_result["suggested_status"],
        fraud_score=fraud_result["fraud_score"],
        fraud_flags=json.dumps(fraud_result["flags"]),
        gps_data=json.dumps(request.gps_data or {}),
        location_verified=fraud_result["location_verified"],
    )
    db.add(claim)

    # Update policy events used
    policy.events_used += 1
    worker.trust_score = fraud_result["trust_score_update"]["new"]

    # Update event total payouts
    event.total_payouts = payout_data["payout_amount"]

    db.commit()

    return {
        "claim": ClaimResponse.model_validate(claim).model_dump(),
        "event_id": event.id,
        "income_loss_breakdown": loss_data,
        "payout_breakdown": payout_data,
        "fraud_analysis": fraud_result,
        "message": f"Claim {claim.status} - Payout: Rs.{payout_data['payout_amount']:.2f}",
    }
