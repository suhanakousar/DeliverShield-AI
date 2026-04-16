"""
DeliverShield AI - Worker Model
Represents a food delivery partner (Swiggy/Zomato).
"""

import json
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Worker(Base):
    __tablename__ = "workers"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    email = Column(String(120), nullable=True)
    platform = Column(String(20), nullable=False)  # swiggy / zomato
    partner_id = Column(String(50), nullable=True)  # platform-specific ID
    delivery_zone = Column(String(50), nullable=False)
    city = Column(String(50), default="Hyderabad")
    avg_daily_earnings = Column(Float, default=800.0)
    avg_orders_per_day = Column(Integer, default=20)
    working_hours = Column(Float, default=12.0)
    trust_score = Column(Float, default=70.0)
    wallet_balance = Column(Float, default=0.0)
    password_hash = Column(String, nullable=True)
    device_info = Column(Text, nullable=True)  # JSON string
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    policies = relationship("Policy", back_populates="worker", lazy="dynamic")
    claims = relationship("Claim", back_populates="worker", lazy="dynamic")
    payouts = relationship("Payout", back_populates="worker", lazy="dynamic")

    @property
    def hourly_rate(self) -> float:
        if self.working_hours and self.working_hours > 0:
            return self.avg_daily_earnings / self.working_hours
        return 0.0

    def get_device_info(self) -> dict:
        if self.device_info:
            try:
                return json.loads(self.device_info)
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    def set_device_info(self, data: dict):
        self.device_info = json.dumps(data)

    def __repr__(self):
        return f"<Worker(id={self.id}, name={self.name}, zone={self.delivery_zone})>"
