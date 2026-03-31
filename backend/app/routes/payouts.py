"""
DeliverShield AI - Payout Routes
Payment processing and history endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.worker import Worker
from app.models.claim import Claim
from app.models.payout import Payout
from app.schemas.payout import PayoutResponse
from app.services.payout_service import payout_service

router = APIRouter(prefix="/api/payouts", tags=["Payouts"])


@router.get("/{worker_id}", response_model=list[PayoutResponse])
async def get_worker_payouts(worker_id: str, db: Session = Depends(get_db)):
    """Get payout history for a worker."""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    payouts = (
        db.query(Payout)
        .filter(Payout.worker_id == worker_id)
        .order_by(Payout.created_at.desc())
        .all()
    )

    return payouts


@router.post("/process/{claim_id}")
async def process_payout(claim_id: str, db: Session = Depends(get_db)):
    """
    Process payout for an approved claim.
    Simulates UPI payment via Razorpay.
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status not in ("approved", "pending"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot process payout for claim with status '{claim.status}'"
        )

    worker = db.query(Worker).filter(Worker.id == claim.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Check for existing payout
    existing = db.query(Payout).filter(Payout.claim_id == claim_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Payout already processed for this claim",
        )

    result = payout_service.process_payout(claim, worker, db)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Payment processing failed"))

    return result
