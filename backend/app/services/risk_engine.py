"""
DeliverShield AI - Risk Engine
Calculates zone-level and worker-level risk scores using mock ML features.
"""

import random
from datetime import datetime

from app.config import settings


class RiskEngine:
    """
    Risk scoring engine that combines zone, weather, seasonal, and historical factors
    to produce a 0-100 risk score. Uses pre-defined weights for demo purposes;
    can be swapped with a real XGBoost model.
    """

    # Zone risk profiles: base risk factors
    ZONE_RISK_PROFILES = {
        "kukatpally": {
            "flood_history": 0.4,
            "waterlogging_prone": 0.5,
            "heat_exposure": 0.6,
            "traffic_density": 0.7,
            "infrastructure": 0.5,
        },
        "banjara_hills": {
            "flood_history": 0.1,
            "waterlogging_prone": 0.1,
            "heat_exposure": 0.4,
            "traffic_density": 0.6,
            "infrastructure": 0.2,
        },
        "lb_nagar": {
            "flood_history": 0.7,
            "waterlogging_prone": 0.8,
            "heat_exposure": 0.5,
            "traffic_density": 0.6,
            "infrastructure": 0.6,
        },
        "jubilee_hills": {
            "flood_history": 0.1,
            "waterlogging_prone": 0.1,
            "heat_exposure": 0.4,
            "traffic_density": 0.5,
            "infrastructure": 0.2,
        },
        "old_city": {
            "flood_history": 0.8,
            "waterlogging_prone": 0.9,
            "heat_exposure": 0.7,
            "traffic_density": 0.9,
            "infrastructure": 0.8,
        },
        "gachibowli": {
            "flood_history": 0.2,
            "waterlogging_prone": 0.2,
            "heat_exposure": 0.5,
            "traffic_density": 0.5,
            "infrastructure": 0.3,
        },
        "secunderabad": {
            "flood_history": 0.3,
            "waterlogging_prone": 0.3,
            "heat_exposure": 0.5,
            "traffic_density": 0.7,
            "infrastructure": 0.4,
        },
        "madhapur": {
            "flood_history": 0.3,
            "waterlogging_prone": 0.3,
            "heat_exposure": 0.5,
            "traffic_density": 0.8,
            "infrastructure": 0.3,
        },
        "ameerpet": {
            "flood_history": 0.4,
            "waterlogging_prone": 0.4,
            "heat_exposure": 0.6,
            "traffic_density": 0.8,
            "infrastructure": 0.5,
        },
        "dilsukhnagar": {
            "flood_history": 0.6,
            "waterlogging_prone": 0.7,
            "heat_exposure": 0.6,
            "traffic_density": 0.7,
            "infrastructure": 0.6,
        },
    }

    # Feature weights (simulating trained model)
    WEIGHTS = {
        "flood_history": 0.25,
        "waterlogging_prone": 0.20,
        "heat_exposure": 0.15,
        "traffic_density": 0.10,
        "infrastructure": 0.10,
        "seasonal": 0.15,
        "recent_events": 0.05,
    }

    @staticmethod
    def _get_seasonal_risk_factor() -> float:
        """Return seasonal risk multiplier."""
        month = datetime.now().month
        # Monsoon is highest risk
        seasonal_map = {
            1: 0.2, 2: 0.2, 3: 0.3, 4: 0.5, 5: 0.6,
            6: 0.8, 7: 0.9, 8: 0.9, 9: 0.7, 10: 0.5,
            11: 0.3, 12: 0.2,
        }
        return seasonal_map.get(month, 0.5)

    def calculate_risk_score(self, zone: str, city: str = "Hyderabad") -> dict:
        """
        Calculate a 0-100 risk score for a zone.

        Returns dict with score and breakdown of contributing factors.
        """
        zone_key = zone.lower().replace(" ", "_")
        profile = self.ZONE_RISK_PROFILES.get(zone_key, {
            "flood_history": 0.3,
            "waterlogging_prone": 0.3,
            "heat_exposure": 0.5,
            "traffic_density": 0.5,
            "infrastructure": 0.4,
        })

        seasonal_factor = self._get_seasonal_risk_factor()
        # Simulate recent event count influence (add slight randomness for demo)
        recent_events_factor = random.uniform(0.0, 0.4)

        # Weighted score calculation
        raw_score = (
            profile["flood_history"] * self.WEIGHTS["flood_history"]
            + profile["waterlogging_prone"] * self.WEIGHTS["waterlogging_prone"]
            + profile["heat_exposure"] * self.WEIGHTS["heat_exposure"]
            + profile["traffic_density"] * self.WEIGHTS["traffic_density"]
            + profile["infrastructure"] * self.WEIGHTS["infrastructure"]
            + seasonal_factor * self.WEIGHTS["seasonal"]
            + recent_events_factor * self.WEIGHTS["recent_events"]
        )

        # Scale to 0-100
        risk_score = round(min(max(raw_score * 100, 0), 100), 1)

        # Risk level classification
        if risk_score >= 75:
            risk_level = "extreme"
        elif risk_score >= 55:
            risk_level = "high"
        elif risk_score >= 35:
            risk_level = "medium"
        else:
            risk_level = "low"

        return {
            "zone": zone_key,
            "city": city,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "factors": {
                "flood_history": round(profile["flood_history"] * 100, 1),
                "waterlogging_prone": round(profile["waterlogging_prone"] * 100, 1),
                "heat_exposure": round(profile["heat_exposure"] * 100, 1),
                "traffic_density": round(profile["traffic_density"] * 100, 1),
                "infrastructure_risk": round(profile["infrastructure"] * 100, 1),
                "seasonal_risk": round(seasonal_factor * 100, 1),
            },
            "top_risks": self._get_top_risks(profile, seasonal_factor),
            "recommendations": self._get_recommendations(risk_level, profile),
        }

    def _get_top_risks(self, profile: dict, seasonal: float) -> list:
        """Identify the top risk factors for a zone."""
        all_factors = {
            "Flood History": profile["flood_history"],
            "Waterlogging": profile["waterlogging_prone"],
            "Heat Exposure": profile["heat_exposure"],
            "Traffic Density": profile["traffic_density"],
            "Poor Infrastructure": profile["infrastructure"],
            "Seasonal Weather": seasonal,
        }
        sorted_factors = sorted(all_factors.items(), key=lambda x: x[1], reverse=True)
        return [{"factor": name, "severity": round(val * 100, 1)} for name, val in sorted_factors[:3]]

    @staticmethod
    def _get_recommendations(risk_level: str, profile: dict) -> list:
        """Generate risk-based recommendations for the worker."""
        recs = []
        if risk_level in ("extreme", "high"):
            recs.append("Consider upgrading to Premium Shield for unlimited event coverage")
            recs.append("Enable real-time weather alerts for your delivery zone")
        if profile.get("flood_history", 0) > 0.5:
            recs.append("Your zone has high flood history - avoid low-lying routes during rain")
        if profile.get("heat_exposure", 0) > 0.6:
            recs.append("High heat exposure zone - carry water and take breaks during peak hours")
        if risk_level == "low":
            recs.append("Your zone has low risk - Basic Shield may be sufficient")
        if not recs:
            recs.append("Standard Shield provides good coverage for your zone's risk level")
        return recs

    def get_daily_risk_briefing(self, worker) -> dict:
        """Generate a daily risk briefing for a specific worker."""
        zone_risk = self.calculate_risk_score(worker.delivery_zone, worker.city)
        day_name = datetime.now().strftime("%A").lower()
        day_mult = settings.DAY_MULTIPLIERS.get(day_name, 1.0)

        return {
            "worker_id": worker.id,
            "worker_name": worker.name,
            "zone": worker.delivery_zone,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "day": day_name.capitalize(),
            "zone_risk": zone_risk,
            "day_multiplier": day_mult,
            "earnings_at_risk": round(worker.avg_daily_earnings * day_mult, 2),
            "hourly_rate": round(worker.hourly_rate, 2),
            "summary": (
                f"Risk level for {worker.delivery_zone} today is {zone_risk['risk_level'].upper()}. "
                f"Your estimated daily earnings of Rs.{worker.avg_daily_earnings * day_mult:.0f} "
                f"are {'well protected' if zone_risk['risk_level'] in ('low', 'medium') else 'at elevated risk'}."
            ),
        }


# Singleton instance
risk_engine = RiskEngine()
