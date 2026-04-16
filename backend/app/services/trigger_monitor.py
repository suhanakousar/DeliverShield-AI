"""
DeliverShield AI - Parametric Trigger Monitor
The heart of the parametric insurance automation.
Monitors weather conditions, detects trigger breaches, and auto-creates claims.
"""

import json
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.config import settings
from app.models.disruption import DisruptionEvent
from app.models.worker import Worker
from app.models.policy import Policy
from app.models.claim import Claim
from app.models.shift import ShiftSession
from app.models.delivery import Delivery
from app.services.weather_service import weather_service
from app.services.fraud_detection import fraud_detection_service
from app.services.income_estimator import income_estimator
from app.services.location_service import location_service


class TriggerMonitor:
    """
    Parametric Trigger Engine

    Triggers:
    1. Heavy Rain: >15mm/hr sustained OR >100mm/day
    2. Extreme Heat: >42C sustained for 3+ hours
    3. Flood Alert: official alert=TRUE OR waterlogging >15cm
    4. Curfew/Zone Closure: government zone closure=TRUE

    When a trigger fires, the system automatically:
    1. Creates a DisruptionEvent
    2. Finds all workers with active policies in the affected zone
    3. Runs fraud detection on each worker
    4. Creates claims for eligible workers
    5. Queues payouts for approved claims
    """

    SEVERITY_DISRUPTED_HOURS = {
        "low": 2.0,
        "medium": 3.0,
        "high": 4.0,
        "extreme": 6.0,
    }

    async def check_triggers(self, zone: str, weather_data: dict = None, db: Session = None) -> dict:
        """
        Check a zone for parametric trigger conditions.

        Args:
            zone: Delivery zone name
            weather_data: Optional pre-fetched weather data
            db: Database session (needed for creating events)

        Returns:
            Dict with trigger results
        """
        if weather_data is None:
            weather_data = await weather_service.get_current_weather(zone)

        # Check thresholds
        breaches = weather_service.check_thresholds(weather_data)

        results = {
            "zone": zone,
            "weather_data": weather_data,
            "triggers_fired": len(breaches),
            "breaches": breaches,
            "events_created": [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        if breaches and db:
            for breach in breaches:
                event = await self.create_disruption_event(
                    trigger_type=breach["trigger_type"],
                    zone=zone,
                    severity=breach["severity"],
                    weather_data=weather_data,
                    db=db,
                )
                results["events_created"].append({
                    "event_id": event.id,
                    "type": event.event_type,
                    "severity": event.severity,
                })

        return results

    async def check_all_zones(self, db: Session) -> dict:
        """Check all Hyderabad zones for trigger conditions."""
        all_results = {}
        total_triggers = 0
        total_events = 0

        for zone in settings.ZONE_COORDINATES.keys():
            result = await self.check_triggers(zone, db=db)
            all_results[zone] = result
            total_triggers += result["triggers_fired"]
            total_events += len(result["events_created"])

        return {
            "zones_checked": len(settings.ZONE_COORDINATES),
            "total_triggers_fired": total_triggers,
            "total_events_created": total_events,
            "results": all_results,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def create_disruption_event(
        self,
        trigger_type: str,
        zone: str,
        severity: str,
        weather_data: dict,
        db: Session,
        source_confirmations: list = None,
    ) -> DisruptionEvent:
        """Create a disruption event in the database."""
        if source_confirmations is None:
            source_confirmations = [
                {"source": "weather_api", "confirmed": True, "timestamp": datetime.now(timezone.utc).isoformat()},
                {"source": "parametric_trigger", "confirmed": True, "threshold_breached": trigger_type},
            ]

        event = DisruptionEvent(
            id=str(uuid4()),
            event_type=trigger_type,
            zone=zone,
            city="Hyderabad",
            severity=severity,
            start_time=datetime.now(timezone.utc),
            weather_data=json.dumps(weather_data),
            source_confirmations=json.dumps(source_confirmations),
            status="active",
        )

        db.add(event)
        db.commit()
        db.refresh(event)

        return event

    def process_affected_workers(self, event: DisruptionEvent, db: Session) -> dict:
        """
        DELIVERY-AWARE worker matching.

        For each candidate worker we apply four gates BEFORE creating a claim:
          1. Active policy + remaining coverage
          2. Active shift (worker is on the clock)
          3. Active delivery OR very recent delivery activity
          4. Live GPS proves the worker is *physically present in the disrupted
             zone* AND moving (not just registered to that zone)

        Workers who are off-shift, idle, or not actually in the affected zone
        are skipped — we record them in `skipped` for diagnostics.
        """
        today = datetime.now(timezone.utc).date()
        zone_normalized = event.zone.lower().replace(" ", "_")

        # Pull ALL active policies, then filter via delivery-aware gates below
        candidates = (
            db.query(Worker, Policy)
            .join(Policy, Worker.id == Policy.worker_id)
            .filter(
                Worker.is_active == True,
                Policy.status == "active",
                Policy.coverage_start <= today,
                Policy.coverage_end >= today,
            )
            .all()
        )

        claims_created = []
        skipped = []
        claims_approved = 0
        claims_flagged = 0
        claims_rejected = 0
        total_payout = 0.0

        disrupted_hours = self.SEVERITY_DISRUPTED_HOURS.get(event.severity, 3.0)

        for worker, policy in candidates:
            # Gate 0: event/coverage limits
            if policy.max_events != -1 and policy.events_used >= policy.max_events:
                continue

            existing_claim = db.query(Claim).filter(
                Claim.worker_id == worker.id,
                Claim.event_id == event.id
            ).first()
            if existing_claim:
                continue

            # Gate 1: shift must be active
            shift = (
                db.query(ShiftSession)
                .filter(ShiftSession.worker_id == worker.id, ShiftSession.status == "active")
                .first()
            )
            if not shift:
                skipped.append({"worker_id": worker.id, "reason": "no_active_shift"})
                continue

            # Gate 2: delivery active (or completed in last 30 min)
            active_delivery = (
                db.query(Delivery)
                .filter(Delivery.worker_id == worker.id, Delivery.status == "active")
                .first()
            )
            if not active_delivery:
                # Allow recently-completed delivery as a soft pass
                recent_cutoff = datetime.now(timezone.utc) - timedelta(minutes=30)
                recent_delivery = (
                    db.query(Delivery)
                    .filter(
                        Delivery.worker_id == worker.id,
                        Delivery.status == "completed",
                        Delivery.ended_at >= recent_cutoff,
                    )
                    .first()
                )
                if not recent_delivery:
                    skipped.append({"worker_id": worker.id, "reason": "no_active_delivery"})
                    continue

            # Gate 3: live GPS must place the worker in the disrupted zone
            latest = location_service.latest_location(db, worker.id)
            if not latest or not latest.zone:
                skipped.append({"worker_id": worker.id, "reason": "no_gps_data"})
                continue
            if latest.zone.lower() != zone_normalized:
                skipped.append({
                    "worker_id": worker.id,
                    "reason": "gps_zone_mismatch",
                    "current_zone": latest.zone,
                })
                continue

            # Gate 4: worker must actually be moving (real delivery behaviour)
            movement = location_service.is_worker_moving(db, worker.id, minutes=10)
            if not movement["moving"]:
                skipped.append({
                    "worker_id": worker.id,
                    "reason": "not_moving",
                    "movement": movement,
                })
                continue

            # Calculate income loss
            loss_data = income_estimator.estimate_loss(worker, disrupted_hours)
            payout_data = income_estimator.calculate_payout(loss_data["income_loss"], policy)

            if payout_data["payout_amount"] <= 0:
                continue

            # Build rich claim_data for fraud engine using REAL GPS history
            recent_logs = location_service.recent_logs(db, worker.id, minutes=60, limit=30)
            gps_history = [
                {"lat": l.lat, "lon": l.lng, "timestamp": l.recorded_at.timestamp()}
                for l in reversed(recent_logs)
            ]
            claim_data = {
                "gps_data": {
                    "latitude": latest.lat,
                    "longitude": latest.lng,
                    "accuracy_meters": latest.accuracy_m,
                    "is_mock": latest.is_mock,
                    "history": gps_history,
                },
                "zone": latest.zone,
                "disrupted_hours": disrupted_hours,
                "payout_amount": payout_data["payout_amount"],
                "recent_claim_count": worker.claims.count() if hasattr(worker.claims, 'count') else 0,
                "time_to_claim_minutes": 0,
                "shift_active": True,
                "delivery_active": bool(active_delivery),
                "movement": movement,
            }

            fraud_result = fraud_detection_service.analyze_claim(claim_data, worker, event)

            # Create the claim
            claim = Claim(
                id=str(uuid4()),
                worker_id=worker.id,
                policy_id=policy.id,
                event_id=event.id,
                disruption_type=event.event_type,
                disrupted_hours=disrupted_hours,
                hourly_rate=loss_data["hourly_rate"],
                income_loss=loss_data["income_loss"],
                payout_amount=payout_data["payout_amount"],
                day_multiplier=loss_data["day_multiplier"],
                status=fraud_result["suggested_status"],
                fraud_score=fraud_result["fraud_score"],
                fraud_flags=json.dumps(fraud_result["flags"]),
                gps_data=json.dumps(claim_data.get("gps_data") or {}),
                location_verified=fraud_result["location_verified"],
            )

            db.add(claim)

            # Update policy events used
            policy.events_used += 1

            # Update worker trust score
            worker.trust_score = fraud_result["trust_score_update"]["new"]

            # Track stats
            if fraud_result["suggested_status"] == "approved":
                claims_approved += 1
                total_payout += payout_data["payout_amount"]
            elif fraud_result["suggested_status"] == "flagged":
                claims_flagged += 1
            else:
                claims_rejected += 1

            claims_created.append({
                "claim_id": claim.id,
                "worker_id": worker.id,
                "worker_name": worker.name,
                "status": claim.status,
                "payout_amount": payout_data["payout_amount"],
                "fraud_score": fraud_result["fraud_score"],
                "income_loss": loss_data["income_loss"],
            })

        # Update event stats
        event.affected_workers = len(claims_created)
        event.total_payouts = total_payout

        db.commit()

        return {
            "event_id": event.id,
            "event_type": event.event_type,
            "zone": event.zone,
            "severity": event.severity,
            "disrupted_hours": disrupted_hours,
            "total_workers_affected": len(claims_created),
            "claims_approved": claims_approved,
            "claims_flagged": claims_flagged,
            "claims_rejected": claims_rejected,
            "total_payout": round(total_payout, 2),
            "claims": claims_created,
            "skipped_workers": skipped,
        }

    def evaluate_trigger(self, conditions: dict) -> dict:
        """
        Evaluate a set of conditions against parametric triggers.

        Args:
            conditions: Dict with keys like rainfall_mm_hr, temperature, waterlogging_cm,
                        flood_alert, curfew_active

        Returns:
            Dict with trigger evaluation results
        """
        triggered = []

        # Heavy Rain
        if (
            conditions.get("rainfall_mm_hr", 0) > settings.RAIN_THRESHOLD_MM_HR
            or conditions.get("rainfall_mm_day", 0) > settings.RAIN_THRESHOLD_MM_DAY
        ):
            triggered.append({
                "type": "heavy_rain",
                "reason": "Rainfall exceeds threshold",
                "data": {
                    "rainfall_mm_hr": conditions.get("rainfall_mm_hr", 0),
                    "rainfall_mm_day": conditions.get("rainfall_mm_day", 0),
                },
            })

        # Extreme Heat
        if conditions.get("temperature", 0) > settings.HEAT_THRESHOLD_CELSIUS:
            triggered.append({
                "type": "extreme_heat",
                "reason": "Temperature exceeds threshold",
                "data": {"temperature": conditions.get("temperature", 0)},
            })

        # Flood Alert
        if (
            conditions.get("flood_alert", False)
            or conditions.get("waterlogging_cm", 0) > settings.FLOOD_WATERLOGGING_CM
        ):
            triggered.append({
                "type": "flood",
                "reason": "Flood alert or waterlogging detected",
                "data": {
                    "flood_alert": conditions.get("flood_alert", False),
                    "waterlogging_cm": conditions.get("waterlogging_cm", 0),
                },
            })

        # Curfew / Zone Closure
        if conditions.get("curfew_active", False) or conditions.get("zone_closure", False):
            triggered.append({
                "type": "curfew",
                "reason": "Government curfew or zone closure",
                "data": {
                    "curfew_active": conditions.get("curfew_active", False),
                    "zone_closure": conditions.get("zone_closure", False),
                },
            })

        # Severe Pollution / Hazardous AQI
        if conditions.get("aqi", 0) > settings.AQI_THRESHOLD:
            triggered.append({
                "type": "severe_pollution",
                "reason": "Air quality hazardous for outdoor work",
                "data": {"aqi": conditions.get("aqi", 0)},
            })

        return {
            "triggers_fired": len(triggered),
            "triggered": triggered,
            "conditions_checked": conditions,
        }


# Singleton instance
trigger_monitor = TriggerMonitor()
