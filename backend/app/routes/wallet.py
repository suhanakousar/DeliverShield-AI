"""
DeliverShield AI - Wallet Routes
Read-only views into the worker wallet + transaction ledger.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.worker import Worker
from app.models.transaction import WalletTransaction


router = APIRouter(prefix="/api/wallet", tags=["Wallet"])


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
