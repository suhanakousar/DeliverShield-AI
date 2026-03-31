"""
DeliverShield AI - Dynamic Premium Calculator
Calculates risk-adjusted insurance premiums for delivery partners.
"""

from datetime import datetime

from app.config import settings


class PremiumCalculator:
    """
    Dynamic Premium Formula:
    Base Rate + Location Risk Score + Seasonal Risk Factor + Historical Loss Rate - Safe Zone Discount
    """

    BASE_RATES = {
        "basic": 39.0,
        "standard": 59.0,
        "premium": 79.0,
    }

    # Zone risk adjustments (positive = riskier, negative = safer)
    ZONE_RISK_ADJUSTMENTS = {
        "old_city": 15.0,        # Flood-prone, narrow streets
        "lb_nagar": 12.0,        # Waterlogging issues
        "dilsukhnagar": 10.0,    # Traffic + waterlogging
        "kukatpally": 8.0,       # Moderate risk
        "ameerpet": 5.0,         # Moderate traffic
        "secunderabad": 3.0,     # Moderate
        "madhapur": 0.0,         # Average
        "gachibowli": -2.0,      # Better infrastructure
        "banjara_hills": -5.0,   # Good drainage
        "jubilee_hills": -5.0,   # Good infrastructure
    }

    # Historical loss rates by zone (claims payout / premium collected ratio)
    HISTORICAL_LOSS_RATES = {
        "old_city": 0.18,
        "lb_nagar": 0.15,
        "dilsukhnagar": 0.14,
        "kukatpally": 0.10,
        "ameerpet": 0.08,
        "secunderabad": 0.07,
        "madhapur": 0.06,
        "gachibowli": 0.05,
        "banjara_hills": 0.04,
        "jubilee_hills": 0.03,
    }

    @staticmethod
    def _get_seasonal_factor() -> float:
        """Monsoon season (June-Sept) gets +15% premium adjustment."""
        month = datetime.now().month
        if month in (6, 7, 8, 9):
            return 0.15  # 15% increase during monsoon
        elif month in (4, 5):
            return 0.08  # 8% increase during peak summer (heat risk)
        elif month in (10, 11):
            return 0.05  # 5% post-monsoon residual risk
        else:
            return 0.0   # No seasonal adjustment in winter

    def calculate_premium(self, worker, plan_type: str) -> dict:
        """
        Calculate dynamic premium for a worker based on their zone, season, and history.

        Returns a breakdown dict with all adjustment components.
        """
        base_rate = self.BASE_RATES.get(plan_type, 39.0)
        zone = worker.delivery_zone.lower().replace(" ", "_")

        # Location risk adjustment
        location_adj = self.ZONE_RISK_ADJUSTMENTS.get(zone, 0.0)

        # Seasonal factor
        seasonal_factor = self._get_seasonal_factor()
        seasonal_adj = round(base_rate * seasonal_factor, 2)

        # Historical loss rate adjustment
        loss_rate = self.HISTORICAL_LOSS_RATES.get(zone, 0.08)
        historical_adj = round(base_rate * loss_rate, 2)

        # Trust score discount: higher trust = lower premium
        trust_discount = 0.0
        if worker.trust_score >= 90:
            trust_discount = -5.0
        elif worker.trust_score >= 80:
            trust_discount = -3.0
        elif worker.trust_score < 50:
            trust_discount = 5.0  # Low trust surcharge

        # Final premium calculation
        final_premium = round(
            base_rate + location_adj + seasonal_adj + historical_adj + trust_discount,
            2,
        )

        # Ensure minimum premium (can't go below 70% of base)
        min_premium = round(base_rate * 0.7, 2)
        final_premium = max(final_premium, min_premium)

        return {
            "base_rate": base_rate,
            "location_adjustment": location_adj,
            "seasonal_adjustment": seasonal_adj,
            "seasonal_factor": seasonal_factor,
            "historical_adjustment": historical_adj,
            "historical_loss_rate": loss_rate,
            "trust_discount": trust_discount,
            "final_premium": final_premium,
            "plan_type": plan_type,
            "worker_zone": zone,
            "breakdown_text": (
                f"Base: Rs.{base_rate} + "
                f"Location: Rs.{location_adj:+.2f} + "
                f"Season: Rs.{seasonal_adj:+.2f} + "
                f"History: Rs.{historical_adj:+.2f} + "
                f"Trust: Rs.{trust_discount:+.2f} = "
                f"Rs.{final_premium}"
            ),
        }


# Singleton instance
premium_calculator = PremiumCalculator()
