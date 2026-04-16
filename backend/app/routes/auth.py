"""
DeliverShield AI - Authentication Routes
JWT-based auth with local OTP signup and phone/password login.
"""

from typing import Optional

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
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class SendOTPRequest(BaseModel):
    phone: str
    name: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    password: str
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
    password: str


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


@router.post("/send-otp")
async def send_otp(request: SendOTPRequest):
    return otp_service.send_otp(request.phone)


@router.post("/register", response_model=TokenResponse)
async def register_with_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    if not otp_service.verify_otp(request.phone, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP. Please try again.")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = db.query(Worker).filter(Worker.phone == request.phone).first()
    if existing:
        if existing.password_hash:
            raise HTTPException(status_code=400, detail="Phone number already registered. Please log in.")

        existing.name = request.name or existing.name
        existing.email = request.email or existing.email
        existing.platform = (request.platform or existing.platform or "swiggy").lower()
        existing.partner_id = request.partner_id or existing.partner_id
        existing.delivery_zone = (request.delivery_zone or existing.delivery_zone or "kukatpally").lower().replace(" ", "_")
        existing.city = request.city or existing.city or "Hyderabad"
        existing.avg_daily_earnings = request.avg_daily_earnings or existing.avg_daily_earnings or 800.0
        existing.avg_orders_per_day = request.avg_orders_per_day or existing.avg_orders_per_day or 20
        existing.working_hours = request.working_hours or existing.working_hours or 12.0
        existing.password_hash = pwd_context.hash(request.password)

        db.add(existing)
        db.commit()
        db.refresh(existing)

        token = create_access_token({"worker_id": existing.id, "phone": existing.phone, "role": "worker"})
        return TokenResponse(
            access_token=token,
            worker_id=existing.id,
            name=existing.name,
            phone=existing.phone,
            role="worker",
        )

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
        password_hash=pwd_context.hash(request.password),
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
async def login_with_password(request: LoginRequest, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.phone == request.phone).first()
    if not worker:
        raise HTTPException(status_code=404, detail="No account found for this phone. Please register first.")
    if not worker.password_hash or not pwd_context.verify(request.password, worker.password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")

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
    if request.username != ADMIN_USERNAME or request.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")

    token = create_access_token({"role": "admin", "username": request.username})
    return AdminTokenResponse(access_token=token, username=request.username)


@router.get("/me")
async def get_me(token: str, db: Session = Depends(get_db)):
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
