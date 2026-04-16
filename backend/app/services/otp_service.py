"""
OTP delivery and verification service.

Supports:
- MSG91 OTP API when configured
- Local demo OTP fallback when MSG91 credentials are missing
"""

from datetime import datetime, timedelta, timezone
import random
import string
from typing import Optional

import httpx

from app.config import settings


class OTPService:
    def __init__(self):
        self.demo_store: dict[str, dict] = {}

    @property
    def using_msg91(self) -> bool:
        return bool(settings.MSG91_AUTH_KEY and settings.MSG91_SENDER_ID)

    @staticmethod
    def _generate_otp() -> str:
        return "".join(random.choices(string.digits, k=settings.OTP_LENGTH))

    @staticmethod
    def _normalize_phone(phone: str) -> str:
        trimmed = phone.strip()
        if trimmed.startswith("+"):
            trimmed = trimmed[1:]
        if trimmed.startswith("91") and len(trimmed) == 12:
            return trimmed
        return f"{settings.DEFAULT_COUNTRY_CODE}{trimmed}"

    async def send_otp(self, phone: str) -> dict:
        normalized_phone = self._normalize_phone(phone)

        if self.using_msg91:
            otp = self._generate_otp()
            params = {
                "authkey": settings.MSG91_AUTH_KEY,
                "mobile": normalized_phone,
                "sender": settings.MSG91_SENDER_ID,
                "otp": otp,
                "otp_expiry": settings.OTP_EXPIRY_MINUTES,
            }
            if settings.MSG91_TEMPLATE_ID:
                params["template_id"] = settings.MSG91_TEMPLATE_ID
            if settings.MSG91_OTP_MESSAGE:
                params["message"] = settings.MSG91_OTP_MESSAGE

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(settings.MSG91_SEND_OTP_URL, params=params)
                response.raise_for_status()
                payload = response.json()

            return {
                "success": True,
                "message": f"OTP sent to {phone[-4:].rjust(len(phone), '*')}",
                "expires_in": settings.OTP_EXPIRY_MINUTES * 60,
                "provider": "msg91",
                "provider_response": payload,
            }

        otp = self._generate_otp()
        self.demo_store[phone] = {
            "otp": otp,
            "expires": datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES),
        }
        return {
            "success": True,
            "message": f"OTP sent to {phone[-4:].rjust(len(phone), '*')}",
            "demo_otp": otp,
            "expires_in": settings.OTP_EXPIRY_MINUTES * 60,
            "provider": "demo",
        }

    async def verify_otp(self, phone: str, otp: str) -> bool:
        normalized_phone = self._normalize_phone(phone)

        if self.using_msg91:
            params = {
                "authkey": settings.MSG91_AUTH_KEY,
                "mobile": normalized_phone,
                "otp": otp,
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(settings.MSG91_VERIFY_OTP_URL, params=params)
                response.raise_for_status()
                payload = response.json()

            return payload.get("type") == "success" or "verified" in str(payload.get("message", "")).lower()

        stored = self.demo_store.get(phone)
        if not stored:
            return False
        if datetime.now(timezone.utc) > stored["expires"]:
            del self.demo_store[phone]
            return False
        if stored["otp"] != otp:
            return False
        del self.demo_store[phone]
        return True


otp_service = OTPService()
