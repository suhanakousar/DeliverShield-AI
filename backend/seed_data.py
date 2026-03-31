"""
DeliverShield AI - Database Seeder Script
Run this to populate the database with realistic demo data.

Usage: python seed_data.py
"""

import json
import sys
import os
from datetime import datetime, timedelta, timezone
from uuid import uuid4

# Ensure app modules are importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.worker import Worker
from app.models.policy import Policy
from app.models.disruption import DisruptionEvent
from app.models.claim import Claim
from app.models.payout import Payout


def seed_database():
    """Seed the database with comprehensive demo data."""

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    db = SessionLocal()

    try:
        # Check if data already exists
        existing_workers = db.query(Worker).count()
        if existing_workers > 0:
            print(f"Database already has {existing_workers} workers. Clearing existing data...")
            db.query(Payout).delete()
            db.query(Claim).delete()
            db.query(DisruptionEvent).delete()
            db.query(Policy).delete()
            db.query(Worker).delete()
            db.commit()
            print("Existing data cleared.")

        today = datetime.now(timezone.utc).date()
        now = datetime.now(timezone.utc)

        # =====================================================
        # 1. CREATE WORKERS
        # =====================================================
        print("Creating workers...")

        workers_data = [
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
            {
                "name": "Deepak Chauhan",
                "phone": "9876543218",
                "email": "deepak.c@email.com",
                "platform": "swiggy",
                "partner_id": "SWG-HYD-1005",
                "delivery_zone": "ameerpet",
                "avg_daily_earnings": 820.0,
                "avg_orders_per_day": 21,
                "working_hours": 12.0,
                "trust_score": 73.0,
            },
            {
                "name": "Kavitha Nair",
                "phone": "9876543219",
                "email": "kavitha.n@email.com",
                "platform": "zomato",
                "partner_id": "ZMT-HYD-2005",
                "delivery_zone": "jubilee_hills",
                "avg_daily_earnings": 950.0,
                "avg_orders_per_day": 26,
                "working_hours": 11.0,
                "trust_score": 92.0,
            },
        ]

        workers = []
        for w_data in workers_data:
            worker = Worker(
                id=str(uuid4()),
                city="Hyderabad",
                device_info=json.dumps({
                    "model": "Android",
                    "os_version": "13",
                    "app_version": "2.5.1",
                }),
                **w_data,
            )
            db.add(worker)
            workers.append(worker)

        db.flush()
        print(f"  Created {len(workers)} workers.")

        # =====================================================
        # 2. CREATE POLICIES
        # =====================================================
        print("Creating policies...")

        plan_assignments = [
            "basic", "premium", "standard", "standard", "premium",
            "basic", "standard", "premium", "basic", "premium",
        ]

        policies = []
        for i, worker in enumerate(workers):
            plan_type = plan_assignments[i]
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
                risk_score=40.0 + (i * 6),
            )
            db.add(policy)
            policies.append(policy)

        db.flush()
        print(f"  Created {len(policies)} active policies.")

        # =====================================================
        # 3. CREATE DISRUPTION EVENTS
        # =====================================================
        print("Creating disruption events...")

        events_data = [
            {
                "event_type": "heavy_rain",
                "zone": "old_city",
                "severity": "high",
                "start_time": now - timedelta(days=3, hours=6),
                "end_time": now - timedelta(days=3, hours=2),
                "status": "resolved",
                "weather": {
                    "rainfall_mm_hr": 22.5,
                    "rainfall_mm_day": 85.0,
                    "temperature": 26.0,
                    "humidity": 92.0,
                },
            },
            {
                "event_type": "extreme_heat",
                "zone": "kukatpally",
                "severity": "medium",
                "start_time": now - timedelta(days=5, hours=8),
                "end_time": now - timedelta(days=5, hours=4),
                "status": "resolved",
                "weather": {
                    "temperature": 44.2,
                    "humidity": 25.0,
                    "rainfall_mm_hr": 0,
                    "heat_index": 48.0,
                },
            },
            {
                "event_type": "flood",
                "zone": "lb_nagar",
                "severity": "extreme",
                "start_time": now - timedelta(days=1, hours=10),
                "end_time": now - timedelta(days=1, hours=3),
                "status": "resolved",
                "weather": {
                    "rainfall_mm_hr": 35.0,
                    "rainfall_mm_day": 120.0,
                    "waterlogging_cm": 25.0,
                    "temperature": 24.0,
                },
            },
            {
                "event_type": "heavy_rain",
                "zone": "dilsukhnagar",
                "severity": "high",
                "start_time": now - timedelta(hours=5),
                "end_time": None,
                "status": "active",
                "weather": {
                    "rainfall_mm_hr": 18.0,
                    "rainfall_mm_day": 65.0,
                    "temperature": 25.0,
                    "humidity": 88.0,
                },
            },
        ]

        events = []
        for e_data in events_data:
            weather = e_data.pop("weather")
            event = DisruptionEvent(
                id=str(uuid4()),
                city="Hyderabad",
                weather_data=json.dumps(weather),
                source_confirmations=json.dumps([
                    {"source": "weather_api", "confirmed": True},
                    {"source": "parametric_trigger", "confirmed": True},
                ]),
                affected_workers=0,
                total_payouts=0.0,
                **e_data,
            )
            db.add(event)
            events.append(event)

        db.flush()
        print(f"  Created {len(events)} disruption events.")

        # =====================================================
        # 4. CREATE CLAIMS
        # =====================================================
        print("Creating claims...")

        claims_data = [
            # Event 0: heavy_rain old_city -> Mohammed Irfan (worker[2])
            {
                "worker_idx": 2,
                "policy_idx": 2,
                "event_idx": 0,
                "disruption_type": "heavy_rain",
                "disrupted_hours": 4.0,
                "income_loss": 250.0,
                "payout_amount": 250.0,
                "status": "paid",
                "fraud_score": 0.12,
            },
            # Event 1: extreme_heat kukatpally -> Rajesh Kumar (worker[0])
            {
                "worker_idx": 0,
                "policy_idx": 0,
                "event_idx": 1,
                "disruption_type": "extreme_heat",
                "disrupted_hours": 3.0,
                "income_loss": 212.50,
                "payout_amount": 212.50,
                "status": "paid",
                "fraud_score": 0.08,
            },
            # Event 2: flood lb_nagar -> Lakshmi Devi (worker[3])
            {
                "worker_idx": 3,
                "policy_idx": 3,
                "event_idx": 2,
                "disruption_type": "flood",
                "disrupted_hours": 6.0,
                "income_loss": 468.0,
                "payout_amount": 380.0,
                "status": "approved",
                "fraud_score": 0.15,
            },
            # Event 3: heavy_rain dilsukhnagar -> Fatima Begum (worker[6])
            {
                "worker_idx": 6,
                "policy_idx": 6,
                "event_idx": 3,
                "disruption_type": "heavy_rain",
                "disrupted_hours": 4.0,
                "income_loss": 308.0,
                "payout_amount": 250.0,
                "status": "approved",
                "fraud_score": 0.22,
            },
            # Additional claim: flagged one for demo
            {
                "worker_idx": 8,
                "policy_idx": 8,
                "event_idx": 0,
                "disruption_type": "heavy_rain",
                "disrupted_hours": 8.0,
                "income_loss": 546.67,
                "payout_amount": 0.0,
                "status": "flagged",
                "fraud_score": 0.68,
                "fraud_flags": ["coordinates_outside_hyderabad", "no_delivery_activity_before_event"],
            },
        ]

        claims = []
        for c_data in claims_data:
            worker = workers[c_data["worker_idx"]]
            policy = policies[c_data["policy_idx"]]
            event = events[c_data["event_idx"]]

            hourly_rate = worker.avg_daily_earnings / worker.working_hours

            claim = Claim(
                id=str(uuid4()),
                worker_id=worker.id,
                policy_id=policy.id,
                event_id=event.id,
                disruption_type=c_data["disruption_type"],
                disrupted_hours=c_data["disrupted_hours"],
                hourly_rate=round(hourly_rate, 2),
                income_loss=c_data["income_loss"],
                payout_amount=c_data["payout_amount"],
                day_multiplier=1.0,
                status=c_data["status"],
                fraud_score=c_data["fraud_score"],
                fraud_flags=json.dumps(c_data.get("fraud_flags", [])),
                gps_data=json.dumps({}),
                location_verified=c_data["status"] != "flagged",
            )
            db.add(claim)
            claims.append(claim)

            # Update policy events used
            policy.events_used += 1

            # Update event stats
            event.affected_workers += 1
            if c_data["status"] in ("approved", "paid"):
                event.total_payouts += c_data["payout_amount"]

        db.flush()
        print(f"  Created {len(claims)} claims.")

        # =====================================================
        # 5. CREATE PAYOUTS
        # =====================================================
        print("Creating payouts...")

        payouts_data = [
            {
                "claim_idx": 0,
                "worker_idx": 2,
                "amount": 250.0,
                "transaction_id": "DS20260328143022ABCDEF",
                "razorpay_id": "pay_demo_seed_001",
                "status": "completed",
                "processed_at": now - timedelta(days=3),
            },
            {
                "claim_idx": 1,
                "worker_idx": 0,
                "amount": 212.50,
                "transaction_id": "DS20260326091510GHIJKL",
                "razorpay_id": "pay_demo_seed_002",
                "status": "completed",
                "processed_at": now - timedelta(days=5),
            },
        ]

        for p_data in payouts_data:
            payout = Payout(
                id=str(uuid4()),
                claim_id=claims[p_data["claim_idx"]].id,
                worker_id=workers[p_data["worker_idx"]].id,
                amount=p_data["amount"],
                payment_method="upi",
                transaction_id=p_data["transaction_id"],
                razorpay_payment_id=p_data["razorpay_id"],
                status=p_data["status"],
                processed_at=p_data["processed_at"],
            )
            db.add(payout)

        db.commit()
        print(f"  Created {len(payouts_data)} payouts.")

        # =====================================================
        # SUMMARY
        # =====================================================
        print("\n" + "=" * 50)
        print("SEED DATA SUMMARY")
        print("=" * 50)
        print(f"Workers:    {len(workers)}")
        print(f"Policies:   {len(policies)}")
        print(f"Events:     {len(events)}")
        print(f"Claims:     {len(claims)}")
        print(f"Payouts:    {len(payouts_data)}")
        print("=" * 50)
        print("\nWorkers by zone:")
        for w in workers:
            p = next((pol for pol in policies if pol.worker_id == w.id), None)
            print(f"  {w.name:20s} | {w.delivery_zone:15s} | {w.platform:6s} | Trust: {w.trust_score:5.1f} | Plan: {p.plan_type if p else 'none'}")
        print("\nDatabase seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
