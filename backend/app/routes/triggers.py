"""
DeliverShield AI - Trigger Routes
Parametric trigger checking and disruption event management.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.disruption import DisruptionEvent
from app.services.trigger_monitor import trigger_monitor
from app.services.payout_service import payout_service
from app.models.claim import Claim
from app.models.worker import Worker

router = APIRouter(prefix="/api/triggers", tags=["Triggers"])


@router.post("/check")
async def check_all_triggers(db: Session = Depends(get_db)):
    """
    Check all zones for parametric trigger conditions.
    Can be called by the scheduler or manually.
    If triggers fire, automatically creates events and processes claims.
    """
    results = await trigger_monitor.check_all_zones(db)

    # For any events created, process affected workers
    processing_summaries = []
    for zone, zone_result in results["results"].items():
        for event_info in zone_result.get("events_created", []):
            event = db.query(DisruptionEvent).filter(
                DisruptionEvent.id == event_info["event_id"]
            ).first()
            if event:
                processing = trigger_monitor.process_affected_workers(event, db)
                processing_summaries.append(processing)

                # Auto-process payouts for approved claims
                for claim_info in processing.get("claims", []):
                    if claim_info["status"] == "approved":
                        claim = db.query(Claim).filter(Claim.id == claim_info["claim_id"]).first()
                        worker = db.query(Worker).filter(Worker.id == claim_info["worker_id"]).first()
                        if claim and worker:
                            payout_service.process_payout(claim, worker, db)

    return {
        "trigger_check": results,
        "processing_summaries": processing_summaries,
        "message": f"Checked {results['zones_checked']} zones. "
                   f"{results['total_triggers_fired']} triggers fired. "
                   f"{results['total_events_created']} events created.",
    }


@router.get("/active")
async def get_active_events(db: Session = Depends(get_db)):
    """Get all currently active disruption events."""
    events = (
        db.query(DisruptionEvent)
        .filter(DisruptionEvent.status == "active")
        .order_by(DisruptionEvent.created_at.desc())
        .all()
    )

    events_list = []
    for event in events:
        events_list.append({
            "id": event.id,
            "event_type": event.event_type,
            "zone": event.zone,
            "city": event.city,
            "severity": event.severity,
            "start_time": event.start_time.isoformat() if event.start_time else None,
            "affected_workers": event.affected_workers,
            "total_payouts": event.total_payouts,
            "status": event.status,
            "duration_hours": event.duration_hours,
        })

    return {"active_events": events_list, "count": len(events_list)}


@router.post("/resolve/{event_id}")
async def resolve_event(event_id: str, db: Session = Depends(get_db)):
    """Resolve/end a disruption event."""
    event = db.query(DisruptionEvent).filter(DisruptionEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status == "resolved":
        raise HTTPException(status_code=400, detail="Event already resolved")

    event.status = "resolved"
    event.end_time = datetime.now(timezone.utc)

    db.commit()
    db.refresh(event)

    return {
        "event_id": event.id,
        "status": event.status,
        "end_time": event.end_time.isoformat(),
        "duration_hours": event.duration_hours,
        "message": f"Event {event.event_type} in {event.zone} resolved after {event.duration_hours:.1f} hours",
    }
