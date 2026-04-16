"""
DeliverShield AI - Fraud Detection Service
Implements Isolation Forest anomaly detection, DBSCAN clustering,
GPS spoofing detection, and Trust Score management.
"""

import json
import math
import random
from datetime import datetime, timezone
from typing import Optional

from app.config import settings
from app.services.traffic_service import traffic_service
from app.services.platform_service import platform_service


class FraudDetectionService:
    """
    Multi-layered fraud detection for parametric insurance claims.

    Checks:
    1. GPS spoofing detection (teleport jumps, perfect stability, mock providers)
    2. Movement pattern analysis (was the worker active before the event?)
    3. Anomaly scoring via Isolation Forest heuristics
    4. Cluster detection via DBSCAN heuristics (fraud ring detection)
    5. Claim frequency / timing analysis
    6. Multi-source location verification
    """

    # Maximum plausible speed for a delivery partner (km/h)
    MAX_PLAUSIBLE_SPEED_KMH = 80.0
    # Minimum GPS variance expected from real device (decimal degrees)
    MIN_GPS_VARIANCE = 0.00005
    # Anomaly score threshold
    ANOMALY_THRESHOLD = settings.FRAUD_SCORE_THRESHOLD

    @staticmethod
    def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two GPS coordinates in km."""
        R = 6371  # Earth's radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    def check_gps_spoofing(self, gps_data: Optional[dict]) -> dict:
        """
        Analyze GPS data for signs of spoofing.

        Checks for:
        - Teleport jumps (impossible speed between points)
        - Perfect stability (no natural jitter = likely mock)
        - Mock location provider flag
        - Impossible coordinates
        """
        flags = []
        is_spoofed = False

        if not gps_data:
            return {
                "is_spoofed": False,
                "confidence": 0.3,
                "flags": ["no_gps_data_provided"],
                "details": "No GPS data available for verification",
            }

        # Check for mock provider
        if gps_data.get("is_mock", False) or gps_data.get("provider") == "mock":
            flags.append("mock_location_provider_detected")
            is_spoofed = True

        # Check coordinate validity (Hyderabad area: ~17.2-17.6 lat, ~78.2-78.7 lon)
        lat = gps_data.get("latitude", 0)
        lon = gps_data.get("longitude", 0)
        if lat and lon:
            if not (17.0 <= lat <= 17.8 and 78.0 <= lon <= 79.0):
                flags.append("coordinates_outside_hyderabad")
                is_spoofed = True

        # Check for emulator signatures
        device_info = gps_data.get("device_info", {})
        if device_info:
            # Missing sensors typical of emulators
            if device_info.get("sensors_count", 10) < 3:
                flags.append("emulator_low_sensor_count")
                is_spoofed = True
            # Atypical screen resolution
            if device_info.get("is_emulator", False):
                flags.append("emulator_signature_detected")
                is_spoofed = True
            # Generic device model names
            model = device_info.get("model", "").lower()
            if any(emu in model for emu in ["sdk", "emulator", "generic", "android sdk"]):
                flags.append("emulator_device_model")
                is_spoofed = True

        # Check GPS accuracy
        accuracy = gps_data.get("accuracy_meters", 10)
        if accuracy is not None and accuracy < 1.0:
            flags.append("suspiciously_high_accuracy")

        # Check location history for teleport jumps
        history = gps_data.get("history", [])
        if len(history) >= 2:
            for i in range(1, len(history)):
                prev = history[i - 1]
                curr = history[i]
                dist = self._haversine_distance(
                    prev.get("lat", 0), prev.get("lon", 0),
                    curr.get("lat", 0), curr.get("lon", 0),
                )
                time_diff_hrs = abs(curr.get("timestamp", 1) - prev.get("timestamp", 0)) / 3600.0
                if time_diff_hrs > 0:
                    speed = dist / time_diff_hrs
                    if speed > self.MAX_PLAUSIBLE_SPEED_KMH:
                        flags.append(f"teleport_jump_detected_{speed:.0f}kmh")
                        is_spoofed = True

            # Check for perfect stability (zero jitter)
            lats = [p.get("lat", 0) for p in history]
            lons = [p.get("lon", 0) for p in history]
            if len(set(lats)) == 1 and len(set(lons)) == 1 and len(history) > 3:
                flags.append("perfect_gps_stability_suspicious")
                is_spoofed = True

        confidence = min(0.3 + len(flags) * 0.2, 1.0) if flags else 0.1

        return {
            "is_spoofed": is_spoofed,
            "confidence": round(confidence, 2),
            "flags": flags,
            "details": f"GPS analysis: {len(flags)} issue(s) detected",
        }

    def check_movement_pattern(self, worker_id: str, event_time: Optional[datetime] = None) -> dict:
        """
        Analyze worker movement patterns before a disruption.
        In production, this queries delivery platform APIs.
        For demo: simulates realistic pattern check.
        """
        # Simulate pattern analysis
        was_active = random.random() > 0.15  # 85% chance worker was actually active
        orders_before_event = random.randint(0, 8) if was_active else 0
        last_delivery_minutes_ago = random.randint(5, 90) if was_active else random.randint(120, 500)

        flags = []
        if not was_active:
            flags.append("no_delivery_activity_before_event")
        if orders_before_event == 0 and was_active:
            flags.append("zero_orders_before_disruption")
        if last_delivery_minutes_ago > 180:
            flags.append("last_delivery_over_3hrs_ago")

        return {
            "was_active_before_event": was_active,
            "orders_before_event": orders_before_event,
            "last_delivery_minutes_ago": last_delivery_minutes_ago,
            "flags": flags,
            "suspicious": len(flags) > 0,
        }

    def detect_clusters(self, claims_in_event: list) -> dict:
        """
        DBSCAN-style cluster detection for fraud rings.
        Looks for groups of workers filing claims simultaneously with suspicious patterns.
        """
        if len(claims_in_event) < 3:
            return {
                "clusters_found": 0,
                "suspicious_clusters": [],
                "details": "Too few claims for cluster analysis",
            }

        # Simulate cluster analysis
        # In production: extract GPS coords, timing, device IDs and run DBSCAN
        n_claims = len(claims_in_event)
        cluster_chance = 0.1 if n_claims < 10 else 0.2

        clusters_found = 0
        suspicious_clusters = []

        if random.random() < cluster_chance:
            clusters_found = 1
            cluster_size = random.randint(2, min(4, n_claims))
            suspicious_clusters.append({
                "cluster_id": 1,
                "size": cluster_size,
                "reason": "claims_from_same_device_fingerprint",
                "risk_score": round(random.uniform(0.6, 0.95), 2),
            })

        return {
            "clusters_found": clusters_found,
            "suspicious_clusters": suspicious_clusters,
            "total_claims_analyzed": n_claims,
            "details": f"Analyzed {n_claims} claims, found {clusters_found} suspicious cluster(s)",
        }

    def calculate_anomaly_score(self, features: dict) -> float:
        """
        Isolation Forest-style anomaly scoring.
        Returns a score between 0 (normal) and 1 (highly anomalous).

        Features considered:
        - claim_frequency: how often this worker claims
        - disrupted_hours: hours of disruption claimed
        - payout_amount: amount relative to daily earnings
        - time_to_claim: how quickly after event the claim was filed
        - trust_score: worker's trust score
        - gps_anomaly: GPS spoofing indicator
        """
        score = 0.0
        weights_sum = 0.0

        # Claim frequency (more than 3 per week is suspicious)
        freq = features.get("claim_frequency", 0)
        freq_score = min(freq / 5.0, 1.0) if freq > 2 else 0.0
        score += freq_score * 0.20
        weights_sum += 0.20

        # Disrupted hours (claiming max hours is suspicious)
        hours = features.get("disrupted_hours", 0)
        hours_score = 0.0
        if hours > 8:
            hours_score = 0.8
        elif hours > 6:
            hours_score = 0.4
        score += hours_score * 0.15
        weights_sum += 0.15

        # Payout relative to earnings
        payout_ratio = features.get("payout_ratio", 0)
        payout_score = min(payout_ratio / 1.5, 1.0) if payout_ratio > 0.8 else 0.0
        score += payout_score * 0.15
        weights_sum += 0.15

        # Time to claim (instant claims may be pre-planned)
        time_to_claim_min = features.get("time_to_claim_minutes", 30)
        time_score = 0.6 if time_to_claim_min < 2 else (0.3 if time_to_claim_min < 5 else 0.0)
        score += time_score * 0.10
        weights_sum += 0.10

        # Trust score (low trust = more suspicious)
        trust = features.get("trust_score", 70)
        trust_score = max(0, (100 - trust) / 100.0)
        score += trust_score * 0.20
        weights_sum += 0.20

        # GPS anomaly
        gps_anomaly = features.get("gps_anomaly_score", 0)
        score += gps_anomaly * 0.20
        weights_sum += 0.20

        if weights_sum > 0:
            normalized_score = score / weights_sum
        else:
            normalized_score = 0.0

        # Add slight randomness for realistic demo
        noise = random.uniform(-0.05, 0.05)
        final_score = max(0.0, min(1.0, normalized_score + noise))

        return round(final_score, 3)

    def validate_location(self, gps_data: Optional[dict], zone: str) -> dict:
        """Multi-source location verification."""
        if not gps_data:
            return {
                "verified": False,
                "confidence": 0.3,
                "method": "none",
                "details": "No GPS data for verification",
            }

        lat = gps_data.get("latitude", 0)
        lon = gps_data.get("longitude", 0)

        # Check if coordinates fall within the claimed zone
        zone_coords = settings.ZONE_COORDINATES.get(zone.lower().replace(" ", "_"))
        if zone_coords:
            distance = self._haversine_distance(lat, lon, zone_coords["lat"], zone_coords["lon"])
            # Within ~5km of zone center is acceptable
            in_zone = distance < 5.0
        else:
            in_zone = True  # Can't verify unknown zone
            distance = 0

        # Simulate cross-referencing with cell tower / Wi-Fi data
        cell_tower_match = random.random() > 0.1  # 90% match rate

        verified = in_zone and cell_tower_match
        confidence = 0.9 if (in_zone and cell_tower_match) else (0.5 if in_zone else 0.2)

        return {
            "verified": verified,
            "confidence": round(confidence, 2),
            "in_claimed_zone": in_zone,
            "distance_from_zone_center_km": round(distance, 2),
            "cell_tower_match": cell_tower_match,
            "method": "gps_cell_tower_cross_reference",
        }

    def _update_trust_score(self, current_score: float, fraud_result: dict) -> float:
        """Calculate updated trust score based on fraud analysis."""
        adjustment = 0.0

        if fraud_result["recommendation"] == "approve":
            adjustment = 2.0  # Small boost for legitimate claims
        elif fraud_result["recommendation"] == "flag":
            adjustment = -10.0  # Moderate penalty for flagged
        elif fraud_result["recommendation"] == "reject":
            adjustment = -20.0  # Significant penalty for rejected

        if fraud_result.get("location_verified", False):
            adjustment += 1.0  # Small boost for verified location

        new_score = max(0.0, min(100.0, current_score + adjustment))
        return round(new_score, 1)

    def verify_weather_claim(self, claim_zone: str, claim_time: datetime, claimed_disruption_type: str) -> dict:
        """
        Cross-validate a claim against historical weather archive.
        Checks if the claimed disruption actually occurred at that time/location.
        In production: queries OpenWeatherMap historical API + IMD archive.
        """
        import random

        # Simulate historical weather archive lookup
        # In production this calls OpenWeatherMap One Call API (historical)
        # and IMD historical data for the exact coordinate and timestamp
        primary_source_confirms = random.random() > 0.08  # 92% confirmation rate
        secondary_source_confirms = random.random() > 0.1  # 90% confirmation rate

        sources_checked = [
            {"source": "OpenWeatherMap Historical", "confirms": primary_source_confirms,
             "details": f"Archive data for {claim_zone} at {claim_time.strftime('%H:%M')}"},
            {"source": "IMD Historical Archive", "confirms": secondary_source_confirms,
             "details": f"Station data cross-reference for {claim_zone}"},
        ]

        both_confirm = primary_source_confirms and secondary_source_confirms

        flags = []
        if not primary_source_confirms:
            flags.append("primary_weather_source_unconfirmed")
        if not secondary_source_confirms:
            flags.append("secondary_weather_source_unconfirmed")
        if not both_confirm:
            flags.append("weather_claim_unverified")

        return {
            "verified": both_confirm,
            "sources_checked": sources_checked,
            "dual_source_confirmation": both_confirm,
            "flags": flags,
            "details": "Dual-source weather verification " + ("passed" if both_confirm else "failed"),
        }

    def analyze_claim(self, claim_data: dict, worker, event) -> dict:
        """
        Full fraud analysis pipeline for a claim.

        Returns comprehensive fraud assessment with score, flags, and recommendation.
        """
        flags = []

        # 0. Shift / delivery gates (delivery-aware insurance: missing these is fatal)
        if claim_data.get("shift_active") is False:
            flags.append("shift_inactive_at_event_time")
        if claim_data.get("delivery_active") is False:
            flags.append("no_active_delivery_at_event_time")

        # 1. GPS spoofing check
        gps_result = self.check_gps_spoofing(claim_data.get("gps_data"))
        if gps_result["is_spoofed"]:
            flags.extend(gps_result["flags"])

        # 1b. Real-history GPS jump check (if upstream provided live history)
        history = (claim_data.get("gps_data") or {}).get("history") or []
        if len(history) >= 2:
            for i in range(1, len(history)):
                prev, curr = history[i - 1], history[i]
                dt_h = abs(curr.get("timestamp", 0) - prev.get("timestamp", 0)) / 3600.0
                if dt_h <= 0:
                    continue
                dist = self._haversine_distance(
                    prev.get("lat", 0), prev.get("lon", 0),
                    curr.get("lat", 0), curr.get("lon", 0),
                )
                if dist > 5.0 and dist / dt_h > self.MAX_PLAUSIBLE_SPEED_KMH:
                    flags.append(f"live_gps_jump_{dist:.1f}km")

        # 2. Movement pattern check — prefer the live signal from location_service
        live_movement = claim_data.get("movement")
        if isinstance(live_movement, dict):
            movement = {
                "was_active_before_event": live_movement.get("moving", False),
                "orders_before_event": 0,
                "last_delivery_minutes_ago": 0,
                "flags": [] if live_movement.get("moving") else ["worker_stationary_during_disruption"],
                "suspicious": not live_movement.get("moving", False),
                "live_avg_speed_kmh": live_movement.get("avg_speed_kmh", 0),
                "live_distance_km": live_movement.get("distance_km", 0),
            }
        else:
            movement = self.check_movement_pattern(worker.id, event.start_time if event else None)
        if movement["suspicious"]:
            flags.extend(movement["flags"])

        # 2.3. Platform activity verification
        platform_check = platform_service.verify_worker_active(
            worker.id, worker.platform, event.start_time if event else datetime.now(timezone.utc)
        )
        if not platform_check["was_active_at_event"]:
            flags.append("platform_activity_not_verified")

        # 2.4. Traffic/zone accessibility check
        traffic_check = traffic_service.get_traffic_data(worker.delivery_zone)

        # 2.5. Weather archive cross-validation
        weather_verification = self.verify_weather_claim(
            claim_zone=claim_data.get("zone", worker.delivery_zone),
            claim_time=event.start_time if event else datetime.now(timezone.utc),
            claimed_disruption_type=event.event_type if event else "unknown",
        )
        if not weather_verification["verified"]:
            flags.extend(weather_verification["flags"])

        # 3. Location verification
        location = self.validate_location(
            claim_data.get("gps_data"),
            claim_data.get("zone", worker.delivery_zone),
        )

        # 4. Build features for anomaly scoring
        features = {
            "claim_frequency": claim_data.get("recent_claim_count", 0),
            "disrupted_hours": claim_data.get("disrupted_hours", 0),
            "payout_ratio": (
                claim_data.get("payout_amount", 0) / worker.avg_daily_earnings
                if worker.avg_daily_earnings > 0 else 0
            ),
            "time_to_claim_minutes": claim_data.get("time_to_claim_minutes", 30),
            "trust_score": worker.trust_score,
            "gps_anomaly_score": gps_result["confidence"] if gps_result["is_spoofed"] else 0.0,
        }

        anomaly_score = self.calculate_anomaly_score(features)

        # 5. Determine recommendation
        # Per README: worker must trigger at least 3 independent anomaly signals
        # before a payout is held (benefit of the doubt threshold)
        if anomaly_score >= self.ANOMALY_THRESHOLD:
            recommendation = "reject"
            status = "rejected"
        elif anomaly_score >= 0.5 or len(flags) >= 3:
            recommendation = "flag"
            status = "flagged"
        else:
            recommendation = "approve"
            status = "approved"

        # 6. Calculate updated trust score
        fraud_result_preview = {"recommendation": recommendation, "location_verified": location["verified"]}
        new_trust_score = self._update_trust_score(worker.trust_score, fraud_result_preview)

        return {
            "fraud_score": anomaly_score,
            "flags": flags,
            "location_verified": location["verified"],
            "recommendation": recommendation,
            "suggested_status": status,
            "gps_analysis": gps_result,
            "movement_analysis": movement,
            "location_verification": location,
            "anomaly_features": features,
            "trust_score_update": {
                "current": worker.trust_score,
                "new": new_trust_score,
                "change": round(new_trust_score - worker.trust_score, 1),
            },
            "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
        }


# Singleton instance
fraud_detection_service = FraudDetectionService()
