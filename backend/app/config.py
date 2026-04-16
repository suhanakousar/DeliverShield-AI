"""
DeliverShield AI - Application Configuration
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "DeliverShield AI"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-Powered Parametric Income Insurance for Food Delivery Partners"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./delivershield.db")

    # External APIs
    OPENWEATHERMAP_API_KEY: str = os.getenv("OPENWEATHERMAP_API_KEY", "demo_key")

    # Razorpay (mock values for demo)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_delivershield_demo")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "mock_secret_key_for_demo")

    # CORS
    CORS_ORIGINS: list = ["*"]

    # Parametric Trigger Thresholds
    RAIN_THRESHOLD_MM_HR: float = 15.0
    RAIN_THRESHOLD_MM_DAY: float = 100.0
    HEAT_THRESHOLD_CELSIUS: float = 42.0
    HEAT_SUSTAINED_HOURS: int = 3
    FLOOD_WATERLOGGING_CM: float = 15.0
    AQI_THRESHOLD = 300  # AQI above 300 = hazardous, delivery unsafe

    # Insurance Plan Defaults
    PLANS = {
        "basic": {
            "name": "Basic Shield",
            "weekly_premium": 39.0,
            "max_weekly_payout": 500.0,
            "max_events": 2,
        },
        "standard": {
            "name": "Standard Shield",
            "weekly_premium": 59.0,
            "max_weekly_payout": 800.0,
            "max_events": 3,
        },
        "premium": {
            "name": "Premium Shield",
            "weekly_premium": 79.0,
            "max_weekly_payout": 1200.0,
            "max_events": -1,  # unlimited
        },
    }

    # Fraud Detection
    FRAUD_SCORE_THRESHOLD: float = 0.75
    TRUST_SCORE_DEFAULT: float = 70.0

    # Day Multipliers
    DAY_MULTIPLIERS = {
        "monday": 1.0,
        "tuesday": 1.0,
        "wednesday": 1.0,
        "thursday": 1.0,
        "friday": 1.15,
        "saturday": 1.25,
        "sunday": 1.25,
    }

    # Hyderabad Zone Coordinates (approximate centers)
    ZONE_COORDINATES = {
        "kukatpally": {"lat": 17.4947, "lon": 78.3996},
        "banjara_hills": {"lat": 17.4156, "lon": 78.4347},
        "lb_nagar": {"lat": 17.3457, "lon": 78.5522},
        "jubilee_hills": {"lat": 17.4325, "lon": 78.4070},
        "old_city": {"lat": 17.3616, "lon": 78.4747},
        "gachibowli": {"lat": 17.4401, "lon": 78.3489},
        "secunderabad": {"lat": 17.4399, "lon": 78.4983},
        "madhapur": {"lat": 17.4484, "lon": 78.3908},
        "ameerpet": {"lat": 17.4374, "lon": 78.4482},
        "dilsukhnagar": {"lat": 17.3687, "lon": 78.5247},
    }


settings = Settings()
