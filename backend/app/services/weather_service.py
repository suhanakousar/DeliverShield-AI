"""
DeliverShield AI - Weather Service
Fetches real-time weather data and checks parametric trigger thresholds.
"""

import random
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from app.config import settings


class WeatherService:
    """Fetches weather data from OpenWeatherMap or falls back to realistic mock data."""

    ZONE_COORDINATES = settings.ZONE_COORDINATES

    # Base weather profiles for Hyderabad by season
    SEASONAL_PROFILES = {
        "summer": {  # March - May
            "temp_range": (32, 41),
            "humidity_range": (20, 45),
            "rainfall_chance": 0.1,
            "rainfall_range": (0, 5),
        },
        "monsoon": {  # June - September
            "temp_range": (24, 34),
            "humidity_range": (65, 95),
            "rainfall_chance": 0.6,
            "rainfall_range": (0, 40),
        },
        "post_monsoon": {  # October - November
            "temp_range": (22, 32),
            "humidity_range": (50, 75),
            "rainfall_chance": 0.3,
            "rainfall_range": (0, 20),
        },
        "winter": {  # December - February
            "temp_range": (14, 30),
            "humidity_range": (30, 60),
            "rainfall_chance": 0.05,
            "rainfall_range": (0, 3),
        },
    }

    @staticmethod
    def _get_season() -> str:
        month = datetime.now().month
        if month in (3, 4, 5):
            return "summer"
        elif month in (6, 7, 8, 9):
            return "monsoon"
        elif month in (10, 11):
            return "post_monsoon"
        else:
            return "winter"

    @staticmethod
    def _get_zone_weather_modifier(zone: str) -> dict:
        """Some zones are more prone to waterlogging/heat."""
        modifiers = {
            "old_city": {"rain_mult": 1.3, "temp_offset": 1.5, "flood_risk": 0.3},
            "lb_nagar": {"rain_mult": 1.2, "temp_offset": 0.5, "flood_risk": 0.25},
            "kukatpally": {"rain_mult": 1.1, "temp_offset": 0.0, "flood_risk": 0.15},
            "dilsukhnagar": {"rain_mult": 1.2, "temp_offset": 0.5, "flood_risk": 0.2},
            "secunderabad": {"rain_mult": 1.0, "temp_offset": 0.0, "flood_risk": 0.1},
            "banjara_hills": {"rain_mult": 0.9, "temp_offset": -0.5, "flood_risk": 0.05},
            "jubilee_hills": {"rain_mult": 0.9, "temp_offset": -0.5, "flood_risk": 0.05},
            "gachibowli": {"rain_mult": 1.0, "temp_offset": -0.3, "flood_risk": 0.08},
            "madhapur": {"rain_mult": 1.0, "temp_offset": 0.0, "flood_risk": 0.1},
            "ameerpet": {"rain_mult": 1.05, "temp_offset": 0.3, "flood_risk": 0.12},
        }
        return modifiers.get(zone, {"rain_mult": 1.0, "temp_offset": 0.0, "flood_risk": 0.1})

    def _generate_mock_weather(self, zone: str) -> dict:
        """Generate realistic mock weather for a Hyderabad zone.

        Includes a ~10-15% chance of extreme values that breach parametric
        trigger thresholds, making the real-time demo feel alive.
        """
        season = self._get_season()
        profile = self.SEASONAL_PROFILES[season]
        modifier = self._get_zone_weather_modifier(zone)

        # Use time-based seed mixed with zone for variability between checks
        # (each call still uses random, but the extreme-event roll varies naturally)
        extreme_roll = random.random()

        # ~8% chance of an extreme heat spike (push temp above 42C threshold)
        if extreme_roll < 0.08:
            temp = round(random.uniform(42.5, 47.0) + modifier["temp_offset"], 1)
        else:
            temp = round(random.uniform(*profile["temp_range"]) + modifier["temp_offset"], 1)

        humidity = round(random.uniform(*profile["humidity_range"]), 1)

        # ~10% chance of heavy rain event regardless of season
        heavy_rain_roll = random.random()
        if heavy_rain_roll < 0.10:
            # Force a heavy rain event that breaches the 15mm/hr threshold
            is_raining = True
            rainfall = round(random.uniform(16.0, 45.0) * modifier["rain_mult"], 1)
        else:
            is_raining = random.random() < profile["rainfall_chance"]
            if is_raining:
                rainfall = round(
                    random.uniform(*profile["rainfall_range"]) * modifier["rain_mult"], 1
                )
            else:
                rainfall = 0.0

        wind_speed = round(random.uniform(5, 30), 1)

        conditions = []
        if rainfall > 15:
            conditions.append("heavy_rain")
        elif rainfall > 5:
            conditions.append("moderate_rain")
        elif rainfall > 0:
            conditions.append("light_rain")

        if temp > 42:
            conditions.append("extreme_heat")
        elif temp > 38:
            conditions.append("very_hot")

        if not conditions:
            if humidity > 80:
                conditions.append("humid")
            elif temp > 30:
                conditions.append("hot")
            else:
                conditions.append("clear")

        # Simulate AQI (Hyderabad often has moderate AQI)
        aqi = random.randint(50, 200)

        # Waterlogging: also has a small independent chance of breaching 15cm
        if rainfall > 10:
            waterlogging = round(random.uniform(0, 25) * modifier["flood_risk"], 1)
        elif random.random() < 0.04:
            # ~4% chance of waterlogging from prior rainfall even without current rain
            waterlogging = round(random.uniform(15.5, 30.0) * modifier["flood_risk"], 1)
        else:
            waterlogging = 0.0

        return {
            "zone": zone,
            "city": "Hyderabad",
            "temperature": temp,
            "feels_like": round(temp + random.uniform(-2, 4), 1),
            "humidity": humidity,
            "rainfall_mm_hr": rainfall,
            "rainfall_mm_day": round(rainfall * random.uniform(2, 8), 1) if rainfall > 0 else 0.0,
            "wind_speed": wind_speed,
            "wind_direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
            "weather_condition": conditions[0],
            "weather_description": ", ".join(conditions),
            "aqi": aqi,
            "visibility_km": round(random.uniform(2, 10), 1),
            "cloud_cover_pct": random.randint(10, 100) if is_raining else random.randint(0, 60),
            "waterlogging_cm": waterlogging,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "mock_weather_service",
            "season": season,
        }

    @staticmethod
    def _wmo_to_condition(code: int) -> str:
        """Map WMO weather code to condition string."""
        if code in (61, 63, 65, 80, 81, 82):
            return "heavy_rain" if code in (65, 82) else "moderate_rain"
        if code in (51, 53, 55):
            return "light_rain"
        if code in (71, 73, 75, 77):
            return "snow"
        if code in (95, 96, 99):
            return "thunderstorm"
        if code in (1, 2, 3):
            return "cloudy"
        if code == 0:
            return "clear"
        return "clear"

    async def _get_open_meteo(self, zone: str, city: str) -> dict:
        """Fetch real weather from Open-Meteo (free, no API key required)."""
        coords = self.ZONE_COORDINATES.get(zone, {"lat": 17.385, "lon": 78.4867})
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": coords["lat"],
                    "longitude": coords["lon"],
                    "current": "temperature_2m,relative_humidity_2m,apparent_temperature,rain,wind_speed_10m,wind_direction_10m,weather_code,cloud_cover",
                    "hourly": "precipitation,visibility",
                    "timezone": "Asia/Kolkata",
                    "forecast_days": 1,
                },
            )
        if response.status_code != 200:
            return None

        data = response.json()
        c = data.get("current", {})
        hourly = data.get("hourly", {})

        rain_1h = c.get("rain", 0.0) or 0.0
        hourly_precip = hourly.get("precipitation", [])
        rain_day = sum(hourly_precip) if hourly_precip else rain_1h * 6

        vis_list = hourly.get("visibility", [])
        visibility_m = vis_list[0] if vis_list else 10000
        visibility_km = round(visibility_m / 1000, 1)

        wmo_code = c.get("weather_code", 0)
        condition = self._wmo_to_condition(wmo_code)

        temp = c.get("temperature_2m", 30.0)
        return {
            "zone": zone,
            "city": city,
            "temperature": round(temp, 1),
            "feels_like": round(c.get("apparent_temperature", temp), 1),
            "humidity": c.get("relative_humidity_2m", 50),
            "rainfall_mm_hr": round(rain_1h, 2),
            "rainfall_mm_day": round(rain_day, 2),
            "wind_speed": round(c.get("wind_speed_10m", 0), 1),
            "wind_direction": str(c.get("wind_direction_10m", 0)),
            "weather_condition": condition,
            "weather_description": condition.replace("_", " ").title(),
            "aqi": None,
            "visibility_km": visibility_km,
            "cloud_cover_pct": c.get("cloud_cover", 0),
            "waterlogging_cm": 0.0,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "open-meteo",
        }

    async def get_weather_by_coords(self, lat: float, lon: float) -> dict:
        """Fetch real weather from Open-Meteo for exact lat/lon coordinates."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "temperature_2m,relative_humidity_2m,apparent_temperature,rain,wind_speed_10m,wind_direction_10m,weather_code,cloud_cover",
                    "hourly": "precipitation,visibility",
                    "timezone": "auto",
                    "forecast_days": 1,
                },
            )
        if response.status_code != 200:
            raise RuntimeError(f"Open-Meteo returned {response.status_code}")

        data = response.json()
        c = data.get("current", {})
        hourly = data.get("hourly", {})

        rain_1h = c.get("rain", 0.0) or 0.0
        hourly_precip = hourly.get("precipitation", [])
        rain_day = sum(hourly_precip) if hourly_precip else rain_1h * 6

        vis_list = hourly.get("visibility", [])
        visibility_m = vis_list[0] if vis_list else 10000
        visibility_km = round(visibility_m / 1000, 1)

        wmo_code = c.get("weather_code", 0)
        condition = self._wmo_to_condition(wmo_code)

        temp = c.get("temperature_2m", 30.0)
        return {
            "lat": lat,
            "lon": lon,
            "temperature": round(temp, 1),
            "feels_like": round(c.get("apparent_temperature", temp), 1),
            "humidity": c.get("relative_humidity_2m", 50),
            "rainfall_mm_hr": round(rain_1h, 2),
            "rainfall_mm_day": round(rain_day, 2),
            "wind_speed": round(c.get("wind_speed_10m", 0), 1),
            "wind_direction": str(c.get("wind_direction_10m", 0)),
            "weather_condition": condition,
            "weather_description": condition.replace("_", " ").title(),
            "aqi": None,
            "visibility_km": visibility_km,
            "cloud_cover_pct": c.get("cloud_cover", 0),
            "waterlogging_cm": 0.0,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "open-meteo",
        }

    async def get_current_weather(self, zone: str, city: str = "Hyderabad") -> dict:
        """Get current weather. Tries Open-Meteo first (free), then OpenWeatherMap, then mock."""
        # 1. Try Open-Meteo (completely free, no API key)
        try:
            result = await self._get_open_meteo(zone, city)
            if result:
                return result
        except Exception:
            pass

        # 2. Try OpenWeatherMap if a real key is configured
        if settings.OPENWEATHERMAP_API_KEY != "demo_key":
            try:
                coords = self.ZONE_COORDINATES.get(zone, {"lat": 17.385, "lon": 78.4867})
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(
                        "https://api.openweathermap.org/data/2.5/weather",
                        params={
                            "lat": coords["lat"],
                            "lon": coords["lon"],
                            "appid": settings.OPENWEATHERMAP_API_KEY,
                            "units": "metric",
                        },
                    )
                    if response.status_code == 200:
                        data = response.json()
                        rain_1h = data.get("rain", {}).get("1h", 0.0)
                        return {
                            "zone": zone,
                            "city": city,
                            "temperature": data["main"]["temp"],
                            "feels_like": data["main"]["feels_like"],
                            "humidity": data["main"]["humidity"],
                            "rainfall_mm_hr": rain_1h,
                            "rainfall_mm_day": rain_1h * 6,
                            "wind_speed": data["wind"]["speed"],
                            "wind_direction": data["wind"].get("deg", "N/A"),
                            "weather_condition": data["weather"][0]["main"].lower(),
                            "weather_description": data["weather"][0]["description"],
                            "aqi": None,
                            "visibility_km": data.get("visibility", 10000) / 1000,
                            "cloud_cover_pct": data["clouds"]["all"],
                            "waterlogging_cm": 0.0,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "source": "openweathermap",
                        }
            except Exception:
                pass

        # 3. Fall back to realistic mock data
        return self._generate_mock_weather(zone)

    async def get_forecast(self, zone: str, city: str = "Hyderabad") -> list:
        """Return a 7-day forecast (mock data)."""
        forecast = []
        season = self._get_season()
        profile = self.SEASONAL_PROFILES[season]
        modifier = self._get_zone_weather_modifier(zone)

        for day_offset in range(7):
            day_date = datetime.now(timezone.utc) + timedelta(days=day_offset)
            temp_high = round(random.uniform(profile["temp_range"][0] + 3, profile["temp_range"][1]) + modifier["temp_offset"], 1)
            temp_low = round(temp_high - random.uniform(5, 12), 1)
            is_raining = random.random() < profile["rainfall_chance"]
            rainfall = round(random.uniform(*profile["rainfall_range"]) * modifier["rain_mult"], 1) if is_raining else 0.0

            forecast.append({
                "date": day_date.strftime("%Y-%m-%d"),
                "day_name": day_date.strftime("%A"),
                "temp_high": temp_high,
                "temp_low": temp_low,
                "humidity": round(random.uniform(*profile["humidity_range"]), 1),
                "rainfall_mm": rainfall,
                "condition": "rain" if is_raining else ("hot" if temp_high > 38 else "clear"),
                "wind_speed": round(random.uniform(5, 25), 1),
                "risk_level": "high" if (rainfall > 15 or temp_high > 42) else ("medium" if (rainfall > 5 or temp_high > 38) else "low"),
            })

        return forecast

    def check_thresholds(self, weather_data: dict) -> list:
        """Check weather data against parametric trigger thresholds."""
        breaches = []

        rainfall_hr = weather_data.get("rainfall_mm_hr", 0)
        rainfall_day = weather_data.get("rainfall_mm_day", 0)
        temperature = weather_data.get("temperature", 0)
        waterlogging = weather_data.get("waterlogging_cm", 0)

        # Heavy Rain trigger
        if rainfall_hr > settings.RAIN_THRESHOLD_MM_HR or rainfall_day > settings.RAIN_THRESHOLD_MM_DAY:
            severity = "extreme" if rainfall_hr > 30 else ("high" if rainfall_hr > 20 else "medium")
            breaches.append({
                "trigger_type": "heavy_rain",
                "severity": severity,
                "details": {
                    "rainfall_mm_hr": rainfall_hr,
                    "rainfall_mm_day": rainfall_day,
                    "threshold_hr": settings.RAIN_THRESHOLD_MM_HR,
                    "threshold_day": settings.RAIN_THRESHOLD_MM_DAY,
                },
                "message": f"Heavy rain detected: {rainfall_hr}mm/hr (threshold: {settings.RAIN_THRESHOLD_MM_HR}mm/hr)",
            })

        # Extreme Heat trigger
        if temperature > settings.HEAT_THRESHOLD_CELSIUS:
            severity = "extreme" if temperature > 46 else ("high" if temperature > 44 else "medium")
            breaches.append({
                "trigger_type": "extreme_heat",
                "severity": severity,
                "details": {
                    "temperature": temperature,
                    "threshold": settings.HEAT_THRESHOLD_CELSIUS,
                },
                "message": f"Extreme heat detected: {temperature}C (threshold: {settings.HEAT_THRESHOLD_CELSIUS}C)",
            })

        # Flood trigger
        if waterlogging > settings.FLOOD_WATERLOGGING_CM:
            severity = "extreme" if waterlogging > 30 else ("high" if waterlogging > 20 else "medium")
            breaches.append({
                "trigger_type": "flood",
                "severity": severity,
                "details": {
                    "waterlogging_cm": waterlogging,
                    "threshold_cm": settings.FLOOD_WATERLOGGING_CM,
                },
                "message": f"Flood/waterlogging detected: {waterlogging}cm (threshold: {settings.FLOOD_WATERLOGGING_CM}cm)",
            })

        # Severe Pollution
        aqi = weather_data.get("aqi") or 0
        if aqi > settings.AQI_THRESHOLD:
            breaches.append({
                "trigger_type": "severe_pollution",
                "severity": "extreme" if aqi > 400 else "high",
                "details": {"aqi": aqi, "threshold": settings.AQI_THRESHOLD},
                "message": f"Hazardous air quality: AQI {aqi} (threshold: {settings.AQI_THRESHOLD})",
            })

        return breaches


# Singleton instance
weather_service = WeatherService()
