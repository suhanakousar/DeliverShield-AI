"""
DeliverShield AI - Authentication Routes
JWT-based auth with mock OTP verification.
"""

import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.database import get_db
from app.models.worker import Worker

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Config
SECRET_KEY = "delivershield_ai_secret_key_2024_hyderabad"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory OTP store: { phone: { otp, expires, name } }
OTP_STORE: dict = {}


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


# ───────────────────────── Helpers ─────────────────────────

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_worker_id(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("worker_id")
    except JWTError:
        return None


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


# ───────────────────────── Routes ─────────────────────────

@router.post("/send-otp")
async def send_otp(request: SendOTPRequest):
    """
    Send OTP to phone number.
    For demo: OTP is always shown in the response (in production, send via SMS).
    """
    otp = generate_otp()
    OTP_STORE[request.phone] = {
        "otp": otp,
        "expires": datetime.now(timezone.utc) + timedelta(minutes=10),
        "name": request.name,
    }
    # In production: send SMS via Twilio/MSG91
    # For demo: return OTP in response
    return {
        "success": True,
        "message": f"OTP sent to {request.phone[-4:].rjust(len(request.phone), '*')}",
        "demo_otp": otp,  # Remove in production
        "expires_in": 600,
    }


@router.post("/register", response_model=TokenResponse)
async def register_with_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Complete registration after OTP verification.
    Creates worker account and issues JWT token.
    """
    # Verify OTP
    stored = OTP_STORE.get(request.phone)
    if not stored:
        raise HTTPException(status_code=400, detail="OTP not found. Please request a new one.")
    if stored["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")
    if datetime.now(timezone.utc) > stored["expires"]:
        del OTP_STORE[request.phone]
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")

    # Check if already registered
    existing = db.query(Worker).filter(Worker.phone == request.phone).first()
    if existing:
        # Already registered - just log them in
        del OTP_STORE[request.phone]
        token = create_access_token({"worker_id": existing.id, "phone": existing.phone})
        return TokenResponse(
            access_token=token,
            worker_id=existing.id,
            name=existing.name,
            phone=existing.phone,
        )

    # Create new worker
    from uuid import uuid4
    zone_normalized = (request.delivery_zone or "kukatpally").lower().replace(" ", "_")
    platform_normalized = (request.platform or "swiggy").lower()

    worker = Worker(
        id=str(uuid4()),
        name=request.name or stored.get("name", "Partner"),
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

    del OTP_STORE[request.phone]

    token = create_access_token({"worker_id": worker.id, "phone": worker.phone})
    return TokenResponse(
        access_token=token,
        worker_id=worker.id,
        name=worker.name,
        phone=worker.phone,
    )


@router.post("/login", response_model=TokenResponse)
async def login_with_otp(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with phone + OTP."""
    stored = OTP_STORE.get(request.phone)
    if not stored:
        raise HTTPException(status_code=400, detail="OTP not found. Please request a new OTP first.")
    if stored["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")
    if datetime.now(timezone.utc) > stored["expires"]:
        del OTP_STORE[request.phone]
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")

    worker = db.query(Worker).filter(Worker.phone == request.phone).first()
    if not worker:
        raise HTTPException(
            status_code=404,
            detail="No account found for this phone. Please register first.",
        )

    del OTP_STORE[request.phone]

    token = create_access_token({"worker_id": worker.id, "phone": worker.phone})
    return TokenResponse(
        access_token=token,
        worker_id=worker.id,
        name=worker.name,
        phone=worker.phone,
    )


@router.get("/me")
async def get_me(token: str, db: Session = Depends(get_db)):
    """Get current authenticated worker."""
    worker_id = get_current_worker_id(token)
    if not worker_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    return {
        "worker_id": worker.id,
        "name": worker.name,
        "phone": worker.phone,
        "email": worker.email,
        "platform": worker.platform,
        "delivery_zone": worker.delivery_zone,
        "wallet_balance": worker.wallet_balance or 0.0,
        "trust_score": worker.trust_score,
    }
