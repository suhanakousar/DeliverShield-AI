"""
Real-time monitoring service that runs in the background.
Checks weather conditions periodically and auto-triggers disruption events.
"""
import asyncio
import json
from datetime import datetime, timezone
from uuid import uuid4
from collections import deque

from app.database import SessionLocal
from app.services.weather_service import weather_service
from app.services.trigger_monitor import trigger_monitor
from app.services.payout_service import payout_service
from app.models.claim import Claim
from app.models.worker import Worker
from app.config import settings


class RealtimeMonitor:
    def __init__(self):
        self.is_running = False
        self.check_interval = 30  # seconds
        self.event_queue = deque(maxlen=100)  # Last 100 events
        self.subscribers = []  # SSE subscribers
        self.last_check = None
        self.stats = {
            "checks_performed": 0,
            "triggers_fired": 0,
            "claims_created": 0,
            "total_payouts": 0.0,
        }

    async def start(self):
        """Start the background monitoring loop."""
        if self.is_running:
            return
        self.is_running = True
        asyncio.create_task(self._monitor_loop())

    async def stop(self):
        self.is_running = False

    async def _monitor_loop(self):
        """Main monitoring loop - checks all zones periodically."""
        while self.is_running:
            try:
                await self._check_all_zones()
            except Exception as e:
                self._push_event("error", {"message": str(e)})
            await asyncio.sleep(self.check_interval)

    async def _check_all_zones(self):
        """Check weather for all zones and trigger events if thresholds breached."""
        self.stats["checks_performed"] += 1
        self.last_check = datetime.now(timezone.utc).isoformat()

        self._push_event("monitor_check", {
            "message": "Checking all zones for disruption triggers...",
            "check_number": self.stats["checks_performed"],
            "timestamp": self.last_check,
        })

        db = SessionLocal()
        try:
            for zone in settings.ZONE_COORDINATES.keys():
                weather_data = await weather_service.get_current_weather(zone)
                breaches = weather_service.check_thresholds(weather_data)

                if breaches:
                    for breach in breaches:
                        self.stats["triggers_fired"] += 1

                        # Create disruption event
                        event = await trigger_monitor.create_disruption_event(
                            trigger_type=breach["trigger_type"],
                            zone=zone,
                            severity=breach["severity"],
                            weather_data=weather_data,
                            db=db,
                        )

                        self._push_event("disruption_detected", {
                            "event_id": event.id,
                            "event_type": event.event_type,
                            "zone": zone,
                            "severity": breach["severity"],
                            "trigger_data": breach,
                            "message": f"🚨 {breach['trigger_type'].replace('_', ' ').title()} detected in {zone.replace('_', ' ').title()}!",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })

                        # Process affected workers
                        result = trigger_monitor.process_affected_workers(event, db)

                        if result["total_workers_affected"] > 0:
                            self.stats["claims_created"] += result["total_workers_affected"]

                            self._push_event("claims_created", {
                                "event_id": event.id,
                                "zone": zone,
                                "workers_affected": result["total_workers_affected"],
                                "claims_approved": result["claims_approved"],
                                "claims_flagged": result["claims_flagged"],
                                "total_payout": result["total_payout"],
                                "message": f"✅ {result['total_workers_affected']} workers affected, {result['claims_approved']} claims approved",
                                "claims": result["claims"],
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                            })

                            # Process payouts for approved claims
                            for claim_info in result["claims"]:
                                if claim_info["status"] == "approved":
                                    claim = db.query(Claim).filter(Claim.id == claim_info["claim_id"]).first()
                                    worker = db.query(Worker).filter(Worker.id == claim_info["worker_id"]).first()
                                    if claim and worker:
                                        payout_result = payout_service.process_payout(claim, worker, db)
                                        if payout_result.get("success"):
                                            self.stats["total_payouts"] += payout_result["amount"]
                                            self._push_event("payout_processed", {
                                                "worker_name": worker.name,
                                                "worker_id": worker.id,
                                                "amount": payout_result["amount"],
                                                "transaction_id": payout_result["transaction_id"],
                                                "message": f"💰 ₹{payout_result['amount']:.0f} paid to {worker.name} via UPI",
                                                "timestamp": datetime.now(timezone.utc).isoformat(),
                                            })
        finally:
            db.close()

    def _push_event(self, event_type: str, data: dict):
        """Push an event to all subscribers and the event queue."""
        event = {
            "id": str(uuid4()),
            "type": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.event_queue.append(event)

        # Notify all SSE subscribers
        for queue in self.subscribers:
            try:
                queue.put_nowait(event)
            except Exception:
                pass

    def subscribe(self):
        """Create a new SSE subscriber queue."""
        queue = asyncio.Queue()
        self.subscribers.append(queue)
        return queue

    def unsubscribe(self, queue):
        """Remove an SSE subscriber."""
        if queue in self.subscribers:
            self.subscribers.remove(queue)

    def get_recent_events(self, limit: int = 50):
        """Get recent events from the queue."""
        events = list(self.event_queue)
        return events[-limit:]

    def get_stats(self):
        """Get monitoring stats."""
        return {
            **self.stats,
            "is_running": self.is_running,
            "last_check": self.last_check,
            "subscribers_count": len(self.subscribers),
            "events_in_queue": len(self.event_queue),
        }


# Singleton
realtime_monitor = RealtimeMonitor()
