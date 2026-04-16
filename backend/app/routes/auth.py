"""
DeliverShield AI - Authentication Routes
JWT-based auth with worker/admin roles and MSG91 OTP support.
"""

from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.auth import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    create_access_token,
    decode_token,
)
from app.database import get_db
from app.models.worker import Worker
from app.services.otp_service import otp_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ───────────────────────── Schemas ─────────────────────────

class SendOTPRequest(BaseModel):
    phone: str
    name: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
    email: Optional[str] = None
    platform: Optional[str] = None
    partner_id: Optional[str] = None
    delivery_zone: Optional[str] = None
    avg_daily_earnings: Optional[float] = 800.0
    avg_orders_per_day: Optional[int] = 20
    working_hours: Optional[float] = 12.0
    city: Optional[str] = "Hyderabad"


class LoginRequest(BaseModel):
    phone: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    worker_id: str
    name: str
    phone: str
    role: str = "worker"


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "admin"
    username: str


# ───────────────────────── Helpers ─────────────────────────


def get_current_worker_id(token: str) -> Optional[str]:
    try:
        payload = decode_token(token)
        return payload.get("worker_id")
    except HTTPException:
        return None


# ───────────────────────── Routes ─────────────────────────

@router.post("/send-otp")
async def send_otp(request: SendOTPRequest):
    """
    Send OTP to phone number.

    Uses MSG91 when configured; otherwise falls back to demo OTP mode.
    """
    try:
        return await otp_service.send_otp(request.phone)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Failed to send OTP via MSG91") from exc


@router.post("/register", response_model=TokenResponse)
async def register_with_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Complete registration after OTP verification.
    Creates worker account and issues JWT token.
    """
    if not await otp_service.verify_otp(request.phone, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP. Please try again.")

    # Check if already registered
    existing = db.query(Worker).filter(Worker.phone == request.phone).first()
    if existing:
        # Already registered - just log them in
        token = create_access_token({"worker_id": existing.id, "phone": existing.phone, "role": "worker"})
        return TokenResponse(
            access_token=token,
            worker_id=existing.id,
            name=existing.name,
            phone=existing.phone,
            role="worker",
        )

    # Create new worker
    from uuid import uuid4
    zone_normalized = (request.delivery_zone or "kukatpally").lower().replace(" ", "_")
    platform_normalized = (request.platform or "swiggy").lower()

    worker = Worker(
        id=str(uuid4()),
        name=request.name or "Partner",
        phone=request.phone,
        email=request.email,
        platform=platform_normalized,
        partner_id=request.partner_id,
        delivery_zone=zone_normalized,
        city=request.city or "Hyderabad",
        avg_daily_earnings=request.avg_daily_earnings or 800.0,
        avg_orders_per_day=request.avg_orders_per_day or 20,
        working_hours=request.working_hours or 12.0,
        trust_score=70.0,
        wallet_balance=0.0,
    )

    db.add(worker)
    db.commit()
    db.refresh(worker)

    token = create_access_token({"worker_id": worker.id, "phone": worker.phone, "role": "worker"})
    return TokenResponse(
        access_token=token,
        worker_id=worker.id,
        name=worker.name,
        phone=worker.phone,
        role="worker",
    )


@router.post("/login", response_model=TokenResponse)
async def login_with_otp(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with phone + OTP."""
    if not await otp_service.verify_otp(request.phone, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP. Please try again.")

    worker = db.query(Worker).filter(Worker.phone == request.phone).first()
    if not worker:
        raise HTTPException(
            status_code=404,
            detail="No account found for this phone. Please register first.",
        )

    token = create_access_token({"worker_id": worker.id, "phone": worker.phone, "role": "worker"})
    return TokenResponse(
        access_token=token,
        worker_id=worker.id,
        name=worker.name,
        phone=worker.phone,
        role="worker",
    )


@router.post("/admin-login", response_model=AdminTokenResponse)
async def admin_login(request: AdminLoginRequest):
    """Authenticate an admin operator."""
    if request.username != ADMIN_USERNAME or request.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")

    token = create_access_token({"role": "admin", "username": request.username})
    return AdminTokenResponse(access_token=token, username=request.username)


@router.get("/me")
async def get_me(token: str, db: Session = Depends(get_db)):
    """Get current authenticated worker."""
    payload = decode_token(token)

    if payload.get("role") == "admin":
        return {
            "role": "admin",
            "username": payload.get("username", ADMIN_USERNAME),
        }

    worker_id = payload.get("worker_id")
    if not worker_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    return {
        "role": "worker",
        "worker_id": worker.id,
        "name": worker.name,
        "phone": worker.phone,
        "email": worker.email,
        "platform": worker.platform,
        "delivery_zone": worker.delivery_zone,
        "wallet_balance": worker.wallet_balance or 0.0,
        "trust_score": worker.trust_score,
    }
