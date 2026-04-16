"""
DeliverShield AI - Weather Routes
Weather data, forecasts, and risk assessments for delivery zones.
"""

from fastapi import APIRouter, Query

from app.services.weather_service import weather_service
from app.services.risk_engine import risk_engine

router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get("/by-coords")
async def get_weather_by_coords(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Get real weather for an arbitrary lat/lon (2km precision via Open-Meteo)."""
    weather_data = await weather_service.get_weather_by_coords(lat, lon)
    breaches = weather_service.check_thresholds(weather_data)
    return {
        "weather": weather_data,
        "thresholds_breached": len(breaches) > 0,
        "breaches": breaches,
        "alert_active": len(breaches) > 0,
    }


@router.get("/{zone}")
async def get_zone_weather(zone: str):
    """Get current weather for a delivery zone."""
    weather_data = await weather_service.get_current_weather(zone)

    # Also check if any thresholds are breached
    breaches = weather_service.check_thresholds(weather_data)

    return {
        "weather": weather_data,
        "thresholds_breached": len(breaches) > 0,
        "breaches": breaches,
        "alert_active": len(breaches) > 0,
    }


@router.get("/{zone}/forecast")
async def get_zone_forecast(zone: str):
    """Get 7-day weather forecast for a delivery zone."""
    forecast = await weather_service.get_forecast(zone)
    return {
        "zone": zone,
        "forecast": forecast,
        "high_risk_days": [
            day for day in forecast if day.get("risk_level") in ("high", "extreme")
        ],
    }


@router.get("/{zone}/risk")
async def get_zone_risk(zone: str):
    """Get comprehensive risk assessment for a delivery zone."""
    risk_data = risk_engine.calculate_risk_score(zone)
    weather_data = await weather_service.get_current_weather(zone)
    breaches = weather_service.check_thresholds(weather_data)

    return {
        "risk_assessment": risk_data,
        "current_weather": weather_data,
        "active_triggers": breaches,
        "overall_status": (
            "alert" if breaches
            else ("caution" if risk_data["risk_score"] > 55 else "normal")
        ),
    }
