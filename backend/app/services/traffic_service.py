"""
DeliverShield AI - Traffic Data Service
Mock TomTom Traffic API integration for zone closure and congestion data.
"""
import random
from datetime import datetime, timezone

from app.config import settings


class TrafficService:
    """Mock TomTom Traffic API for zone closure and congestion detection."""

    ZONE_TRAFFIC_PROFILES = {
        "kukatpally": {"base_congestion": 65, "closure_probability": 0.03},
        "banjara_hills": {"base_congestion": 50, "closure_probability": 0.01},
        "old_city": {"base_congestion": 80, "closure_probability": 0.05},
        "lb_nagar": {"base_congestion": 60, "closure_probability": 0.02},
        "gachibowli": {"base_congestion": 55, "closure_probability": 0.02},
        "jubilee_hills": {"base_congestion": 45, "closure_probability": 0.01},
        "secunderabad": {"base_congestion": 70, "closure_probability": 0.04},
        "madhapur": {"base_congestion": 60, "closure_probability": 0.02},
        "ameerpet": {"base_congestion": 75, "closure_probability": 0.03},
        "dilsukhnagar": {"base_congestion": 65, "closure_probability": 0.03},
    }

    def get_traffic_data(self, zone: str) -> dict:
        """Get current traffic conditions for a zone (mock TomTom API)."""
        profile = self.ZONE_TRAFFIC_PROFILES.get(
            zone.lower().replace(" ", "_"),
            {"base_congestion": 50, "closure_probability": 0.02}
        )

        congestion = max(0, min(100, profile["base_congestion"] + random.randint(-20, 20)))
        is_closed = random.random() < profile["closure_probability"]
        has_curfew = random.random() < 0.01  # 1% chance of curfew
        has_strike = random.random() < 0.02  # 2% chance of local strike

        incidents = []
        if is_closed:
            incidents.append({"type": "road_closure", "severity": "high", "description": "Major road closed"})
        if has_strike:
            incidents.append({"type": "local_strike", "severity": "medium", "description": "Market area bandh"})

        return {
            "zone": zone,
            "source": "mock_tomtom_traffic_api",
            "congestion_level": congestion,
            "congestion_status": "severe" if congestion > 80 else "heavy" if congestion > 60 else "moderate" if congestion > 40 else "light",
            "zone_closed": is_closed or has_curfew,
            "curfew_active": has_curfew,
            "strike_active": has_strike,
            "incidents": incidents,
            "travel_time_multiplier": 1.0 + (congestion / 100.0),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def check_zone_accessibility(self, zone: str) -> dict:
        """Check if a delivery zone is accessible."""
        traffic = self.get_traffic_data(zone)
        accessible = not traffic["zone_closed"] and traffic["congestion_level"] < 90

        return {
            "zone": zone,
            "accessible": accessible,
            "reason": "Zone closed" if traffic["zone_closed"] else ("Severe congestion" if not accessible else "Accessible"),
            "traffic_data": traffic,
        }


traffic_service = TrafficService()
