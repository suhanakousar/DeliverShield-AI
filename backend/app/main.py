"""
DeliverShield AI - Main Application
AI-Powered Parametric Income Insurance for Food Delivery Partners
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import Worker, Policy, DisruptionEvent, Claim, Payout
from app.routes import workers, policies, claims, payouts, weather, admin, triggers
from app.routes.realtime import router as realtime_router
from app.routes.auth import router as auth_router
from app.routes.shift import router as shift_router
from app.routes.location import router as location_router
from app.routes.delivery import router as delivery_router
from app.routes.wallet import router as wallet_router
from app.services.realtime_monitor import realtime_monitor


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup: create tables
    Base.metadata.create_all(bind=engine)
    print(f"[DeliverShield AI] Database tables created.")

    # Seed initial data if database is empty
    db = SessionLocal()
    try:
        worker_count = db.query(Worker).count()
        if worker_count == 0:
            print("[DeliverShield AI] Empty database detected. Seeding initial data...")
            _seed_initial_data(db)
            print("[DeliverShield AI] Initial data seeded successfully.")
        else:
            print(f"[DeliverShield AI] Database has {worker_count} workers. Skipping seed.")
    except Exception as e:
        print(f"[DeliverShield AI] Seed error: {e}")
    finally:
        db.close()

    print(f"[DeliverShield AI] Application started. API docs at /docs")

    # Start real-time monitoring
    await realtime_monitor.start()
    print("[DeliverShield AI] Real-time monitor started (checking every 30s).")

    yield

    # Shutdown
    await realtime_monitor.stop()
    print("[DeliverShield AI] Real-time monitor stopped.")
    print("[DeliverShield AI] Application shutting down.")


def _seed_initial_data(db):
    """Seed the database with sample data for demo purposes."""
    import json
    from uuid import uuid4
    from datetime import timedelta

    today = datetime.now(timezone.utc).date()

    # Sample workers across Hyderabad zones
    sample_workers = [
        {
            "name": "Rajesh Kumar",
            "phone": "9876543210",
            "email": "rajesh.k@email.com",
            "platform": "swiggy",
            "partner_id": "SWG-HYD-1001",
            "delivery_zone": "kukatpally",
            "avg_daily_earnings": 850.0,
            "avg_orders_per_day": 22,
            "working_hours": 12.0,
            "trust_score": 82.0,
        },
        {
            "name": "Priya Sharma",
            "phone": "9876543211",
            "email": "priya.s@email.com",
            "platform": "zomato",
            "partner_id": "ZMT-HYD-2001",
            "delivery_zone": "banjara_hills",
            "avg_daily_earnings": 900.0,
            "avg_orders_per_day": 24,
            "working_hours": 11.0,
            "trust_score": 88.0,
        },
        {
            "name": "Mohammed Irfan",
            "phone": "9876543212",
            "email": "irfan.m@email.com",
            "platform": "swiggy",
            "partner_id": "SWG-HYD-1002",
            "delivery_zone": "old_city",
            "avg_daily_earnings": 750.0,
            "avg_orders_per_day": 18,
            "working_hours": 12.0,
            "trust_score": 65.0,
        },
        {
            "name": "Lakshmi Devi",
            "phone": "9876543213",
            "email": "lakshmi.d@email.com",
            "platform": "zomato",
            "partner_id": "ZMT-HYD-2002",
            "delivery_zone": "lb_nagar",
            "avg_daily_earnings": 780.0,
            "avg_orders_per_day": 19,
            "working_hours": 10.0,
            "trust_score": 75.0,
        },
        {
            "name": "Venkat Reddy",
            "phone": "9876543214",
            "email": "venkat.r@email.com",
            "platform": "swiggy",
            "partner_id": "SWG-HYD-1003",
            "delivery_zone": "gachibowli",
            "avg_daily_earnings": 920.0,
            "avg_orders_per_day": 25,
            "working_hours": 12.0,
            "trust_score": 91.0,
        },
        {
            "name": "Arun Prasad",
            "phone": "9876543215",
            "email": "arun.p@email.com",
            "platform": "zomato",
            "partner_id": "ZMT-HYD-2003",
            "delivery_zone": "secunderabad",
            "avg_daily_earnings": 800.0,
            "avg_orders_per_day": 20,
            "working_hours": 12.0,
            "trust_score": 70.0,
        },
        {
            "name": "Fatima Begum",
            "phone": "9876543216",
            "email": "fatima.b@email.com",
            "platform": "swiggy",
            "partner_id": "SWG-HYD-1004",
            "delivery_zone": "dilsukhnagar",
            "avg_daily_earnings": 770.0,
            "avg_orders_per_day": 18,
            "working_hours": 10.0,
            "trust_score": 78.0,
        },
        {
            "name": "Suresh Yadav",
            "phone": "9876543217",
            "email": "suresh.y@email.com",
            "platform": "zomato",
            "partner_id": "ZMT-HYD-2004",
            "delivery_zone": "madhapur",
            "avg_daily_earnings": 880.0,
            "avg_orders_per_day": 23,
            "working_hours": 11.0,
            "trust_score": 85.0,
        },
    ]

    workers = []
    for w_data in sample_workers:
        worker = Worker(id=str(uuid4()), **w_data, city="Hyderabad")
        db.add(worker)
        workers.append(worker)

    db.flush()

    # Create active policies for most workers
    plan_cycle = ["basic", "standard", "premium", "standard", "premium", "basic", "standard", "premium"]
    policies = []
    for i, worker in enumerate(workers):
        plan_type = plan_cycle[i % len(plan_cycle)]
        plan_config = settings.PLANS[plan_type]

        policy = Policy(
            id=str(uuid4()),
            worker_id=worker.id,
            plan_type=plan_type,
            weekly_premium=plan_config["weekly_premium"],
            max_weekly_payout=plan_config["max_weekly_payout"],
            max_events=plan_config["max_events"],
            events_used=0,
            coverage_start=today - timedelta(days=2),
            coverage_end=today + timedelta(days=5),
            status="active",
            risk_score=50.0 + (i * 5),
        )
        db.add(policy)
        policies.append(policy)

    db.flush()

    # Create past disruption events
    past_events = [
        {
            "event_type": "heavy_rain",
            "zone": "old_city",
            "severity": "high",
            "start_time": datetime.now(timezone.utc) - timedelta(days=3, hours=6),
            "end_time": datetime.now(timezone.utc) - timedelta(days=3, hours=2),
            "affected_workers": 2,
            "total_payouts": 450.0,
            "status": "resolved",
        },
        {
            "event_type": "extreme_heat",
            "zone": "kukatpally",
            "severity": "medium",
            "start_time": datetime.now(timezone.utc) - timedelta(days=5, hours=8),
            "end_time": datetime.now(timezone.utc) - timedelta(days=5, hours=4),
            "affected_workers": 1,
            "total_payouts": 200.0,
            "status": "resolved",
        },
        {
            "event_type": "flood",
            "zone": "lb_nagar",
            "severity": "extreme",
            "start_time": datetime.now(timezone.utc) - timedelta(days=1, hours=10),
            "end_time": datetime.now(timezone.utc) - timedelta(days=1, hours=3),
            "affected_workers": 1,
            "total_payouts": 380.0,
            "status": "resolved",
        },
        {
            "event_type": "heavy_rain",
            "zone": "dilsukhnagar",
            "severity": "high",
            "start_time": datetime.now(timezone.utc) - timedelta(hours=5),
            "end_time": None,
            "affected_workers": 1,
            "total_payouts": 250.0,
            "status": "active",
        },
    ]

    events = []
    for e_data in past_events:
        event = DisruptionEvent(
            id=str(uuid4()),
            city="Hyderabad",
            weather_data=json.dumps({"source": "seed_data", "type": e_data["event_type"]}),
            source_confirmations=json.dumps([{"source": "seed", "confirmed": True}]),
            **e_data,
        )
        db.add(event)
        events.append(event)

    db.flush()

    # Create sample claims
    # Event 0 (heavy_rain in old_city) -> worker 2 (Mohammed Irfan, old_city)
    claim1 = Claim(
        id=str(uuid4()),
        worker_id=workers[2].id,
        policy_id=policies[2].id,
        event_id=events[0].id,
        disruption_type="heavy_rain",
        disrupted_hours=4.0,
        hourly_rate=62.5,
        income_loss=250.0,
        payout_amount=250.0,
        day_multiplier=1.0,
        status="paid",
        fraud_score=0.12,
        fraud_flags=json.dumps([]),
        location_verified=True,
    )
    db.add(claim1)
    policies[2].events_used += 1

    # Event 1 (extreme_heat in kukatpally) -> worker 0 (Rajesh Kumar, kukatpally)
    claim2 = Claim(
        id=str(uuid4()),
        worker_id=workers[0].id,
        policy_id=policies[0].id,
        event_id=events[1].id,
        disruption_type="extreme_heat",
        disrupted_hours=3.0,
        hourly_rate=70.83,
        income_loss=212.5,
        payout_amount=212.5,
        day_multiplier=1.0,
        status="paid",
        fraud_score=0.08,
        fraud_flags=json.dumps([]),
        location_verified=True,
    )
    db.add(claim2)
    policies[0].events_used += 1

    # Event 2 (flood in lb_nagar) -> worker 3 (Lakshmi Devi, lb_nagar)
    claim3 = Claim(
        id=str(uuid4()),
        worker_id=workers[3].id,
        policy_id=policies[3].id,
        event_id=events[2].id,
        disruption_type="flood",
        disrupted_hours=6.0,
        hourly_rate=78.0,
        income_loss=468.0,
        payout_amount=380.0,
        day_multiplier=1.0,
        status="approved",
        fraud_score=0.15,
        fraud_flags=json.dumps([]),
        location_verified=True,
    )
    db.add(claim3)
    policies[3].events_used += 1

    # Event 3 (heavy_rain in dilsukhnagar) -> worker 6 (Fatima Begum, dilsukhnagar)
    claim4 = Claim(
        id=str(uuid4()),
        worker_id=workers[6].id,
        policy_id=policies[6].id,
        event_id=events[3].id,
        disruption_type="heavy_rain",
        disrupted_hours=4.0,
        hourly_rate=77.0,
        income_loss=308.0,
        payout_amount=250.0,
        day_multiplier=1.0,
        status="approved",
        fraud_score=0.22,
        fraud_flags=json.dumps([]),
        location_verified=True,
    )
    db.add(claim4)
    policies[6].events_used += 1

    db.flush()

    # Create payouts for paid claims
    payout1 = Payout(
        id=str(uuid4()),
        claim_id=claim1.id,
        worker_id=workers[2].id,
        amount=250.0,
        payment_method="upi",
        transaction_id="DS20260328143022ABCDEF",
        razorpay_payment_id="pay_demo_001",
        status="completed",
        processed_at=datetime.now(timezone.utc) - timedelta(days=3),
    )
    db.add(payout1)

    payout2 = Payout(
        id=str(uuid4()),
        claim_id=claim2.id,
        worker_id=workers[0].id,
        amount=212.5,
        payment_method="upi",
        transaction_id="DS20260326091510GHIJKL",
        razorpay_payment_id="pay_demo_002",
        status="completed",
        processed_at=datetime.now(timezone.utc) - timedelta(days=5),
    )
    db.add(payout2)

    db.commit()


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(workers.router)
app.include_router(policies.router)
app.include_router(claims.router)
app.include_router(payouts.router)
app.include_router(weather.router)
app.include_router(admin.router)
app.include_router(triggers.router)
app.include_router(realtime_router)
app.include_router(auth_router)
app.include_router(shift_router)
app.include_router(location_router)
app.include_router(delivery_router)
app.include_router(wallet_router)


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint with API information."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
