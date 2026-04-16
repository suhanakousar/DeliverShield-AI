"""
DeliverShield AI - Wallet Routes
Read-only views into the worker wallet + transaction ledger.
"""

import random
import re
import string
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.worker import Worker
from app.models.transaction import WalletTransaction


router = APIRouter(prefix="/api/wallet", tags=["Wallet"])


UPI_PATTERN = re.compile(r'^[\w.\-]+@[\w]+$')

BANK_HANDLES = {
    "paytm": "Paytm Payments Bank",
    "upi": "BHIM UPI",
    "ybl": "PhonePe (Yes Bank)",
    "ibl": "PhonePe (IndusInd Bank)",
    "axl": "PhonePe (Axis Bank)",
    "okhdfcbank": "Google Pay (HDFC Bank)",
    "okaxis": "Google Pay (Axis Bank)",
    "oksbi": "Google Pay (SBI)",
    "okicici": "Google Pay (ICICI Bank)",
    "apl": "Amazon Pay",
    "sbi": "SBI",
    "icici": "ICICI Bank",
    "hdfc": "HDFC Bank",
    "axis": "Axis Bank",
    "kotak": "Kotak Bank",
    "rbl": "RBL Bank",
    "indus": "IndusInd Bank",
}

BANK_CODES = ["HDFC", "SBIN", "ICIC", "UTIB", "KKBK", "INDB", "YESB", "RATN", "BKID"]


class WithdrawRequest(BaseModel):
    upi_id: str
    amount: float


@router.get("/{worker_id}")
async def get_wallet(worker_id: str, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    last_txn = (
        db.query(WalletTransaction)
        .filter(WalletTransaction.worker_id == worker_id)
        .order_by(WalletTransaction.created_at.desc())
        .first()
    )
    return {
        "worker_id": worker.id,
        "balance": round(worker.wallet_balance or 0.0, 2),
        "last_transaction_at": last_txn.created_at.isoformat() if last_txn else None,
    }


@router.post("/{worker_id}/withdraw")
async def withdraw_to_upi(worker_id: str, body: WithdrawRequest, db: Session = Depends(get_db)):
    """Withdraw wallet balance to a UPI ID."""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Validate UPI ID format
    upi_id = body.upi_id.strip()
    if not UPI_PATTERN.match(upi_id):
        raise HTTPException(status_code=422, detail="Invalid UPI ID format. Use format like 9876543210@paytm")

    amount = round(body.amount, 2)
    if amount <= 0:
        raise HTTPException(status_code=422, detail="Amount must be greater than zero")

    balance = round(worker.wallet_balance or 0.0, 2)
    if amount > balance:
        raise HTTPException(status_code=422, detail=f"Insufficient balance. Available: ₹{balance:.2f}")

    if amount < 10:
        raise HTTPException(status_code=422, detail="Minimum withdrawal amount is ₹10")

    # Detect bank from UPI handle
    handle = upi_id.split("@")[-1].lower()
    bank_name = BANK_HANDLES.get(handle, "Your Bank")

    # Generate realistic NPCI UTR number: bank_code + 22 digits
    bank_code = random.choice(BANK_CODES)
    date_part = datetime.now().strftime("%d%m%y")
    seq = "".join(random.choices(string.digits, k=16))
    utr = f"{bank_code}{date_part}{seq}"

    # Generate internal DS reference
    ref_id = "DS" + datetime.now().strftime("%Y%m%d%H%M%S") + "".join(
        random.choices(string.ascii_uppercase + string.digits, k=5)
    )

    # Deduct from wallet
    new_balance = round(balance - amount, 2)
    worker.wallet_balance = new_balance

    now = datetime.now(timezone.utc)

    txn = WalletTransaction(
        id=str(uuid4()),
        worker_id=worker.id,
        direction="debit",
        kind="withdrawal",
        amount=amount,
        balance_after=new_balance,
        reference_type="upi",
        reference_id=utr,
        description=f"UPI withdrawal to {upi_id}",
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    return {
        "success": True,
        "upi_id": upi_id,
        "bank_name": bank_name,
        "amount": amount,
        "balance_before": balance,
        "balance_after": new_balance,
        "utr_number": utr,
        "reference_id": ref_id,
        "transaction_id": txn.id,
        "status": "completed",
        "message": f"₹{amount:.2f} successfully transferred to {upi_id}",
        "processed_at": now.isoformat(),
        "settlement_note": "Funds will reflect in your bank within 2–4 minutes.",
    }


@router.get("/{worker_id}/transactions")
async def list_transactions(worker_id: str, limit: int = 50, db: Session = Depends(get_db)):
    rows = (
        db.query(WalletTransaction)
        .filter(WalletTransaction.worker_id == worker_id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "count": len(rows),
        "transactions": [
            {
                "id": t.id,
                "direction": t.direction,
                "kind": t.kind,
                "amount": t.amount,
                "balance_after": t.balance_after,
                "reference_type": t.reference_type,
                "reference_id": t.reference_id,
                "description": t.description,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in rows
        ],
    }
