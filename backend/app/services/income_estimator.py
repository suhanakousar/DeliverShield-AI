"""
DeliverShield AI - Income Loss Estimator
Calculates income loss and payouts using parametric formulas.
"""

from datetime import datetime

from app.config import settings


class IncomeEstimator:
    """
    Income Loss Formula:
    Loss = (Daily Income / Working Hours) x Disrupted Hours x Day Multiplier

    Day Multipliers:
    - Weekdays (Mon-Thu): 1.0
    - Friday evening: 1.15
    - Weekends (Sat-Sun): 1.25
    """

    DAY_MULTIPLIERS = settings.DAY_MULTIPLIERS

    def get_day_multiplier(self, day_of_week: str = None) -> float:
        """Get the day multiplier. If no day specified, use today."""
        if day_of_week is None:
            day_of_week = datetime.now().strftime("%A").lower()
        else:
            day_of_week = day_of_week.lower()
        return self.DAY_MULTIPLIERS.get(day_of_week, 1.0)

    def estimate_loss(
        self,
        worker,
        disrupted_hours: float,
        day_of_week: str = None,
    ) -> dict:
        """
        Estimate income loss for a worker based on disrupted hours.

        Args:
            worker: Worker model instance
            disrupted_hours: Number of hours disrupted
            day_of_week: Optional day name (e.g., "monday")

        Returns:
            Dict with loss calculation breakdown
        """
        daily_income = worker.avg_daily_earnings
        working_hours = worker.working_hours

        if working_hours <= 0:
            working_hours = 12.0

        hourly_rate = daily_income / working_hours

        # Cap disrupted hours to working hours
        disrupted_hours = min(disrupted_hours, working_hours)

        day_multiplier = self.get_day_multiplier(day_of_week)

        # Core formula
        income_loss = hourly_rate * disrupted_hours * day_multiplier
        income_loss = round(income_loss, 2)

        return {
            "daily_income": daily_income,
            "working_hours": working_hours,
            "hourly_rate": round(hourly_rate, 2),
            "disrupted_hours": disrupted_hours,
            "day_of_week": day_of_week or datetime.now().strftime("%A").lower(),
            "day_multiplier": day_multiplier,
            "income_loss": income_loss,
            "formula": f"({daily_income} / {working_hours}) x {disrupted_hours} x {day_multiplier}",
        }

    def calculate_payout(self, income_loss: float, policy) -> dict:
        """
        Calculate actual payout after applying policy limits.

        Applies:
        - Maximum weekly payout limit
        - Remaining coverage (max_weekly_payout - already paid out this week)
        - Event limit check
        """
        if not policy:
            return {
                "payout_amount": 0.0,
                "reason": "no_active_policy",
                "income_loss": income_loss,
                "coverage_remaining": 0.0,
            }

        # Check event limits
        if policy.max_events != -1 and policy.events_used >= policy.max_events:
            return {
                "payout_amount": 0.0,
                "reason": "event_limit_reached",
                "income_loss": income_loss,
                "events_used": policy.events_used,
                "max_events": policy.max_events,
                "coverage_remaining": 0.0,
            }

        # Calculate remaining coverage for this week
        # In a real system, sum payouts for the current coverage period
        max_payout = policy.max_weekly_payout
        # Approximate remaining: max_weekly_payout - (events_used * average_payout)
        estimated_used = policy.events_used * (max_payout / max(policy.max_events, 3))
        remaining_coverage = max(0, max_payout - estimated_used)

        # Payout is the minimum of income loss and remaining coverage
        payout_amount = min(income_loss, remaining_coverage)
        payout_amount = round(payout_amount, 2)

        return {
            "payout_amount": payout_amount,
            "income_loss": income_loss,
            "max_weekly_payout": max_payout,
            "remaining_coverage": round(remaining_coverage, 2),
            "events_used": policy.events_used,
            "max_events": policy.max_events,
            "plan_type": policy.plan_type,
            "capped": payout_amount < income_loss,
            "reason": "approved" if payout_amount > 0 else "coverage_exhausted",
        }


# Singleton instance
income_estimator = IncomeEstimator()
