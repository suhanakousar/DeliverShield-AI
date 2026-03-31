"""
DeliverShield AI - Disruption Event Model
Parametric trigger events (weather, flood, curfew).
"""

import json
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, Float, Integer, DateTime, Text
from sqlalchemy.orm import relationship

from app.database import Base


class DisruptionEvent(Base):
    __tablename__ = "disruption_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    event_type = Column(String(30), nullable=False)  # heavy_rain / extreme_heat / flood / curfew
    zone = Column(String(50), nullable=False, index=True)
    city = Column(String(50), default="Hyderabad")
    severity = Column(String(20), nullable=False)  # low / medium / high / extreme
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    weather_data = Column(Text, nullable=True)  # JSON string
    source_confirmations = Column(Text, nullable=True)  # JSON string
    affected_workers = Column(Integer, default=0)
    total_payouts = Column(Float, default=0.0)
    status = Column(String(20), default="active")  # active / resolved / monitoring
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    claims = relationship("Claim", back_populates="event", lazy="dynamic")

    def get_weather_data(self) -> dict:
        if self.weather_data:
            try:
                return json.loads(self.weather_data)
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    def set_weather_data(self, data: dict):
        self.weather_data = json.dumps(data)

    def get_source_confirmations(self) -> list:
        if self.source_confirmations:
            try:
                return json.loads(self.source_confirmations)
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    def set_source_confirmations(self, data: list):
        self.source_confirmations = json.dumps(data)

    @property
    def duration_hours(self) -> float | None:
        if self.end_time and self.start_time:
            delta = self.end_time - self.start_time
            return delta.total_seconds() / 3600.0
        return None

    def __repr__(self):
        return f"<DisruptionEvent(id={self.id}, type={self.event_type}, zone={self.zone})>"
