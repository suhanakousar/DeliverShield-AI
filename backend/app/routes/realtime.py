"""
Real-time routes: Server-Sent Events (SSE) for live updates and notifications.
"""
import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.services.realtime_monitor import realtime_monitor

router = APIRouter(prefix="/api/realtime", tags=["Realtime"])


@router.get("/events")
async def sse_events(request: Request):
    """
    Server-Sent Events endpoint for real-time updates.
    Streams: weather_update, disruption_detected, claims_created, payout_processed
    """
    queue = realtime_monitor.subscribe()

    async def event_generator():
        try:
            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connected', 'message': 'Real-time monitoring active', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"

            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break

                try:
                    # Wait for events with timeout (sends keepalive)
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"event: {event['type']}\ndata: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Send keepalive comment
                    yield f": keepalive {datetime.now(timezone.utc).isoformat()}\n\n"
        finally:
            realtime_monitor.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.get("/notifications")
async def get_notifications(limit: int = 50):
    """Get recent real-time events/notifications."""
    events = realtime_monitor.get_recent_events(limit)
    return {
        "notifications": events,
        "count": len(events),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/status")
async def get_monitor_status():
    """Get the real-time monitor status and stats."""
    return {
        "monitor": realtime_monitor.get_stats(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/start")
async def start_monitor():
    """Start the real-time monitor."""
    await realtime_monitor.start()
    return {"message": "Real-time monitor started", "status": realtime_monitor.get_stats()}


@router.post("/stop")
async def stop_monitor():
    """Stop the real-time monitor."""
    await realtime_monitor.stop()
    return {"message": "Real-time monitor stopped", "status": realtime_monitor.get_stats()}
