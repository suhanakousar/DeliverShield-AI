"""
DeliverShield AI - Delivery Platform API Simulation
Mock Swiggy/Zomato platform data for worker activity verification.
"""
import random
from datetime import datetime, timezone, timedelta


class PlatformService:
    """Simulates Swiggy/Zomato platform APIs for worker activity data."""

    def get_worker_activity(self, worker_id: str, platform: str = "zomato") -> dict:
        """Get simulated worker activity from delivery platform."""
        now = datetime.now(timezone.utc)
        is_active = random.random() > 0.1  # 90% chance active

        orders_today = random.randint(8, 22) if is_active else 0
        earnings_today = orders_today * random.randint(35, 50)

        last_order_minutes_ago = random.randint(5, 45) if is_active else random.randint(120, 480)
        last_order_time = now - timedelta(minutes=last_order_minutes_ago)

        # Simulate recent GPS pings from platform
        recent_locations = []
        if is_active:
            base_lat = 17.385 + random.uniform(-0.05, 0.05)
            base_lon = 78.486 + random.uniform(-0.05, 0.05)
            for i in range(5):
                recent_locations.append({
                    "latitude": base_lat + random.uniform(-0.005, 0.005),
                    "longitude": base_lon + random.uniform(-0.005, 0.005),
                    "timestamp": (now - timedelta(minutes=i * 10)).isoformat(),
                    "accuracy_meters": random.uniform(5.0, 25.0),
                })

        return {
            "worker_id": worker_id,
            "platform": platform,
            "source": f"mock_{platform}_api",
            "is_online": is_active,
            "is_on_delivery": is_active and random.random() > 0.4,
            "orders_today": orders_today,
            "earnings_today": earnings_today,
            "avg_rating": round(random.uniform(4.0, 5.0), 1),
            "last_order_time": last_order_time.isoformat(),
            "last_order_minutes_ago": last_order_minutes_ago,
            "recent_locations": recent_locations,
            "app_version": f"{'Zomato' if platform == 'zomato' else 'Swiggy'} v{random.choice(['4.2.1', '4.3.0', '4.3.2'])}",
            "device_online_since": (now - timedelta(hours=random.randint(2, 10))).isoformat(),
            "timestamp": now.isoformat(),
        }

    def verify_worker_active(self, worker_id: str, platform: str, event_time: datetime) -> dict:
        """Verify if a worker was active on the platform at the time of an event."""
        activity = self.get_worker_activity(worker_id, platform)
        was_active = activity["is_online"] and activity["last_order_minutes_ago"] < 60

        return {
            "worker_id": worker_id,
            "platform": platform,
            "was_active_at_event": was_active,
            "last_order_minutes_before_event": activity["last_order_minutes_ago"],
            "orders_today": activity["orders_today"],
            "platform_gps_available": len(activity["recent_locations"]) > 0,
            "confidence": 0.9 if was_active else 0.3,
            "source": activity["source"],
        }


platform_service = PlatformService()
