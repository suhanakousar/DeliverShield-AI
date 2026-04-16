"""
DeliverShield AI - Payout Service
Handles payment processing via mock Razorpay integration.
"""

import random
import string
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.config import settings
from app.models.payout import Payout
from app.models.claim import Claim


class PayoutService:
    """Mock payment processing service simulating Razorpay UPI payments."""

    @staticmethod
    def _generate_transaction_id() -> str:
        """Generate a mock transaction ID."""
        prefix = "DS"
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"{prefix}{timestamp}{random_part}"

    @staticmethod
    def _generate_razorpay_id() -> str:
        """Generate a mock Razorpay payment ID."""
        random_part = "".join(random.choices(string.ascii_letters + string.digits, k=14))
        return f"pay_{random_part}"

    def simulate_upi_payment(self, amount: float, upi_id: str = None) -> dict:
        """
        Simulate a UPI payment via Razorpay.

        In production, this would:
        1. Create a Razorpay payout
        2. Initiate fund transfer to worker's UPI ID
        3. Handle callbacks for status updates
        """
        # Simulate 95% success rate
        success = random.random() < 0.95

        transaction_id = self._generate_transaction_id()
        razorpay_id = self._generate_razorpay_id()

        if success:
            return {
                "success": True,
                "transaction_id": transaction_id,
                "razorpay_payment_id": razorpay_id,
                "amount": amount,
                "currency": "INR",
                "upi_id": upi_id or "worker@upi",
                "status": "completed",
                "message": f"Rs.{amount:.2f} transferred successfully via UPI",
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "razorpay_key": settings.RAZORPAY_KEY_ID,
            }
        else:
            return {
                "success": False,
                "transaction_id": transaction_id,
                "razorpay_payment_id": None,
                "amount": amount,
                "currency": "INR",
                "upi_id": upi_id or "worker@upi",
                "status": "failed",
                "message": "Payment failed - will retry automatically",
                "error_code": random.choice(["INSUFFICIENT_FUNDS", "UPI_TIMEOUT", "BANK_DECLINED"]),
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }

    def process_payout(self, claim: Claim, worker, db: Session) -> dict:
        """
        Process a payout for an approved claim.

        Steps:
        1. Validate claim status
        2. Simulate UPI payment
        3. Create Payout record
        4. Update claim status
        """
        if claim.status not in ("approved", "pending"):
            return {
                "success": False,
                "error": f"Claim status is '{claim.status}', expected 'approved' or 'pending'",
            }

        if claim.payout_amount <= 0:
            return {
                "success": False,
                "error": "Claim payout amount is zero or negative",
            }

        # Check if payout already exists
        existing_payout = db.query(Payout).filter(Payout.claim_id == claim.id).first()
        if existing_payout:
            return {
                "success": False,
                "error": "Payout already exists for this claim",
                "payout_id": existing_payout.id,
            }

        # Simulate UPI payment
        payment_result = self.simulate_upi_payment(claim.payout_amount)

        # Create payout record
        payout = Payout(
            id=str(uuid4()),
            claim_id=claim.id,
            worker_id=worker.id,
            amount=claim.payout_amount,
            payment_method="upi",
            transaction_id=payment_result["transaction_id"],
            razorpay_payment_id=payment_result.get("razorpay_payment_id"),
            status=payment_result["status"],
            processed_at=datetime.now(timezone.utc) if payment_result["success"] else None,
        )

        db.add(payout)

        # Update claim status and credit wallet
        if payment_result["success"]:
            claim.status = "paid"
            # Credit worker's wallet balance
            worker.wallet_balance = (worker.wallet_balance or 0.0) + claim.payout_amount
        else:
            claim.status = "approved"  # Keep approved for retry

        db.commit()
        db.refresh(payout)

        return {
            "success": payment_result["success"],
            "payout_id": payout.id,
            "transaction_id": payout.transaction_id,
            "razorpay_payment_id": payout.razorpay_payment_id,
            "amount": payout.amount,
            "status": payout.status,
            "message": payment_result["message"],
            "claim_id": claim.id,
            "worker_id": worker.id,
        }


# Singleton instance
payout_service = PayoutService()
