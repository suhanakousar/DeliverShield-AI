"""
Local OTP delivery and verification service for in-app demo flow.
"""

from datetime import datetime, timedelta, timezone
import random
import string

from app.config import settings


class OTPService:
    def __init__(self):
        self.demo_store: dict[str, dict] = {}

    @staticmethod
    def _normalize_phone(phone: str) -> str:
        trimmed = phone.strip()
        if trimmed.startswith("+"):
            trimmed = trimmed[1:]
        if trimmed.startswith("91") and len(trimmed) == 12:
            return trimmed
        return f"{settings.DEFAULT_COUNTRY_CODE}{trimmed}"

    def send_otp(self, phone: str) -> dict:
        normalized_phone = self._normalize_phone(phone)
        otp = "".join(random.choices(string.digits, k=6))
        self.demo_store[normalized_phone] = {
            "otp": otp,
            "expires": datetime.now(timezone.utc) + timedelta(minutes=5),
        }
        return {
            "success": True,
            "message": f"OTP generated for {phone[-4:].rjust(len(phone), '*')}",
            "provider": "demo",
            "demo_otp": otp,
        }

    def verify_otp(self, phone: str, otp: str) -> bool:
        normalized_phone = self._normalize_phone(phone)
        stored = self.demo_store.get(normalized_phone)
        if not stored:
            return False
        if datetime.now(timezone.utc) > stored["expires"]:
            del self.demo_store[normalized_phone]
            return False
        if stored["otp"] != otp:
            return False
        del self.demo_store[normalized_phone]
        return True


otp_service = OTPService()
