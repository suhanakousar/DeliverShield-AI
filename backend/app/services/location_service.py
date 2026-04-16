"""
DeliverShield AI - Location Service
Ingests live GPS pings, computes distance/speed, maps coordinates → zone,
flags GPS jumps and exposes "is the worker actually moving" helpers used by
the delivery-aware trigger and fraud engines.
"""

import math
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy.orm import Session

from app.config import settings
from app.models.location import LocationLog
from app.models.shift import ShiftSession


MAX_PLAUSIBLE_SPEED_KMH = 90.0  # for delivery scooters w/ buffer
MOVEMENT_THRESHOLD_KMH = 2.0    # below this we treat as stationary
RECENT_WINDOW_MINUTES = 10      # window for "currently moving" check


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two GPS points (km)."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))


class LocationService:
    """Geolocation ingestion + analysis."""

    def nearest_zone(self, lat: float, lng: float) -> Optional[str]:
        """Snap a coordinate to the nearest configured Hyderabad zone."""
        best_zone = None
        best_dist = float("inf")
        for zone, coords in settings.ZONE_COORDINATES.items():
            d = haversine_km(lat, lng, coords["lat"], coords["lon"])
            if d < best_dist:
                best_dist = d
                best_zone = zone
        # Only assign zone if within ~5 km (otherwise worker isn't really in any zone)
        if best_dist <= 5.0:
            return best_zone
        return None

    def record_ping(
        self,
        db: Session,
        worker_id: str,
        lat: float,
        lng: float,
        speed_kmh: float = 0.0,
        accuracy_m: Optional[float] = None,
        heading: Optional[float] = None,
        is_mock: bool = False,
        shift_id: Optional[str] = None,
    ) -> LocationLog:
        """Persist a single GPS ping and compute jump/distance fields."""
        prev = (
            db.query(LocationLog)
            .filter(LocationLog.worker_id == worker_id)
            .order_by(LocationLog.recorded_at.desc())
            .first()
        )

        distance_km = 0.0
        is_jump = False
        if prev:
            distance_km = haversine_km(prev.lat, prev.lng, lat, lng)
            prev_time = prev.recorded_at
            if prev_time.tzinfo is None:
                prev_time = prev_time.replace(tzinfo=timezone.utc)
            elapsed_h = max(
                (datetime.now(timezone.utc) - prev_time).total_seconds() / 3600.0,
                1e-6,
            )
            implied_speed = distance_km / elapsed_h
            if implied_speed > MAX_PLAUSIBLE_SPEED_KMH and distance_km > 5.0:
                is_jump = True

        zone = self.nearest_zone(lat, lng)

        log = LocationLog(
            id=str(uuid4()),
            worker_id=worker_id,
            shift_id=shift_id,
            lat=lat,
            lng=lng,
            speed_kmh=speed_kmh,
            accuracy_m=accuracy_m,
            heading=heading,
            zone=zone,
            is_mock=is_mock,
            is_jump=is_jump,
            distance_from_prev_km=round(distance_km, 4),
            recorded_at=datetime.now(timezone.utc),
        )
        db.add(log)

        # Update active shift's last-seen + accumulators
        shift = (
            db.query(ShiftSession)
            .filter(ShiftSession.worker_id == worker_id, ShiftSession.status == "active")
            .first()
        )
        if shift:
            if not is_jump:
                shift.total_distance_km = (shift.total_distance_km or 0.0) + distance_km
            shift.last_lat = lat
            shift.last_lng = lng
            shift.last_zone = zone
            shift.last_ping_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(log)
        return log

    def recent_logs(
        self,
        db: Session,
        worker_id: str,
        minutes: int = RECENT_WINDOW_MINUTES,
        limit: int = 50,
    ) -> list[LocationLog]:
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        return (
            db.query(LocationLog)
            .filter(LocationLog.worker_id == worker_id, LocationLog.recorded_at >= cutoff)
            .order_by(LocationLog.recorded_at.desc())
            .limit(limit)
            .all()
        )

    def is_worker_moving(self, db: Session, worker_id: str, minutes: int = 5) -> dict:
        """
        Returns whether the worker has shown real movement in the last N minutes.
        Used by trigger_monitor as one of the gating conditions.
        """
        logs = self.recent_logs(db, worker_id, minutes=minutes, limit=20)
        if len(logs) < 2:
            return {
                "moving": False,
                "reason": "insufficient_pings",
                "ping_count": len(logs),
                "distance_km": 0.0,
                "avg_speed_kmh": 0.0,
            }

        # Sum distance over the window (logs are desc-ordered)
        ordered = list(reversed(logs))
        total_distance = 0.0
        for i in range(1, len(ordered)):
            total_distance += haversine_km(
                ordered[i - 1].lat, ordered[i - 1].lng,
                ordered[i].lat, ordered[i].lng,
            )

        first_t = ordered[0].recorded_at
        last_t = ordered[-1].recorded_at
        if first_t.tzinfo is None:
            first_t = first_t.replace(tzinfo=timezone.utc)
        if last_t.tzinfo is None:
            last_t = last_t.replace(tzinfo=timezone.utc)
        elapsed_h = max((last_t - first_t).total_seconds() / 3600.0, 1e-6)
        avg_speed = total_distance / elapsed_h

        moving = avg_speed >= MOVEMENT_THRESHOLD_KMH and total_distance > 0.1
        return {
            "moving": moving,
            "reason": "ok" if moving else "stationary",
            "ping_count": len(ordered),
            "distance_km": round(total_distance, 3),
            "avg_speed_kmh": round(avg_speed, 2),
        }

    def latest_location(self, db: Session, worker_id: str) -> Optional[LocationLog]:
        return (
            db.query(LocationLog)
            .filter(LocationLog.worker_id == worker_id)
            .order_by(LocationLog.recorded_at.desc())
            .first()
        )


location_service = LocationService()
