# DeliverShield AI — Complete Documentation

> AI-powered parametric income insurance platform for food-delivery partners (Swiggy / Zomato / Dunzo riders) in India. Automatic payouts when weather/curfew disruptions destroy daily earnings — no claim forms, no waiting.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Repository Layout](#4-repository-layout)
5. [Backend Deep-Dive](#5-backend-deep-dive)
6. [Frontend Deep-Dive](#6-frontend-deep-dive)
7. [Database Schema](#7-database-schema)
8. [Authentication Flow](#8-authentication-flow)
9. [Core Business Flows (End-to-End)](#9-core-business-flows-end-to-end)
10. [Parametric Trigger Engine](#10-parametric-trigger-engine)
11. [Fraud Detection Engine](#11-fraud-detection-engine)
12. [Premium & Payout Calculation](#12-premium--payout-calculation)
13. [Real-Time Notification System (SSE)](#13-real-time-notification-system-sse)
14. [API Reference](#14-api-reference)
15. [External Integrations](#15-external-integrations)
16. [Configuration & Environment](#16-configuration--environment)
17. [Running Locally / Deployment](#17-running-locally--deployment)
18. [Glossary](#18-glossary)

---

## 1. Project Overview

**DeliverShield AI** protects gig-economy delivery workers from income loss caused by weather and civic disruptions (heavy rain, extreme heat, floods, curfews, zone closures).

**Problem it solves**

- Delivery riders earn per-order. A rain-out, a 45 °C afternoon or a riot-day curfew = ₹0 income for that day.
- Traditional insurance is unaffordable, slow, paper-heavy and unsuitable for gig workers.

**How it solves it**

- Workers buy a **weekly parametric policy** (₹39 / ₹59 / ₹79).
- An always-on **trigger engine** polls weather + traffic + civic feeds every 30 s.
- When an objective threshold is crossed in a worker's zone, the system **auto-creates a claim, runs fraud checks, and pushes a UPI payout** — usually within ~18 seconds of detection.
- The worker sees a **real-time confetti popup** in their app: *"Heavy rain in Kukatpally. ₹233 credited."*

**Pilot city:** Hyderabad (10 zones pre-configured). Architecture is city-agnostic.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy ORM, APScheduler |
| **Database** | PostgreSQL (prod), SQLite (dev fallback) |
| **AI / ML** | XGBoost (premium pricing), Scikit-learn `IsolationForest` (anomaly), `DBSCAN` (fraud-ring clustering) |
| **Frontend** | React 18 (Vite), Tailwind CSS, Framer Motion, Recharts, React Router, Axios, React Hot Toast |
| **Real-time** | Server-Sent Events (SSE) |
| **Auth** | JWT (`python-jose`) + `passlib[pbkdf2_sha256]` |
| **External APIs** | OpenWeatherMap, MSG91 (OTP), Razorpay (UPI), TomTom (mocked), Google Maps Geocoding (mocked), IMD (mocked) |
| **Deploy** | Replit (dev), Vercel (frontend), Render (backend) |

---

## 3. High-Level Architecture

```
                      ┌──────────────────────────────────────┐
                      │   External Data Sources              │
                      │   OpenWeatherMap • IMD • TomTom      │
                      └──────────────┬───────────────────────┘
                                     │ (poll every 30s)
                                     ▼
┌────────────────────┐    ┌─────────────────────────────┐    ┌──────────────────┐
│  React PWA         │◄──►│  FastAPI Backend            │◄──►│  PostgreSQL      │
│  (Worker + Admin)  │SSE │  • Routes (REST)            │    │  workers/policies│
│                    │    │  • Trigger Monitor (cron)   │    │  claims/events   │
│                    │    │  • Fraud Engine (sklearn)   │    │  payouts         │
│                    │    │  • Premium Engine (xgboost) │    └──────────────────┘
│                    │    │  • Realtime Monitor (SSE)   │
└─────────┬──────────┘    └──────────┬──────────────────┘
          │                          │
          │                          ▼
          │              ┌───────────────────────┐
          └─────────────►│  MSG91 OTP / Razorpay │
                         │  UPI test mode        │
                         └───────────────────────┘
```

See [system-architecture.png](system-architecture.png) and [system-workflow.png](system-workflow.png) for visual diagrams.

---

## 4. Repository Layout

```
DeliverShield-AI/
├── main.py                       # Root entry (minimal stub)
├── pyproject.toml                # Python 3.12 project metadata
├── .replit                       # Replit dev workflow (parallel: backend:8000, frontend:5000)
├── .gitignore
├── README.md                     # Marketing/feature README
├── replit.md                     # Replit notes
├── system-architecture.png       # Architecture diagram
├── system-workflow.png           # End-to-end flow diagram
├── attached_assets/              # Marketing assets
│
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py               # FastAPI app, lifespan, seeding, route mounting
│       ├── config.py             # Settings, thresholds, plans, zone coords
│       ├── database.py           # SQLAlchemy engine + session
│       ├── auth.py               # JWT create/decode + role checks
│       ├── models/
│       │   ├── worker.py
│       │   ├── policy.py
│       │   ├── claim.py
│       │   ├── disruption.py
│       │   └── payout.py
│       ├── routes/
│       │   ├── auth.py
│       │   ├── workers.py
│       │   ├── policies.py
│       │   ├── claims.py
│       │   ├── payouts.py
│       │   ├── weather.py
│       │   ├── triggers.py
│       │   ├── admin.py
│       │   └── realtime.py       # SSE stream
│       └── services/
│           ├── fraud_detection.py
│           ├── income_estimator.py
│           ├── weather_service.py
│           ├── otp_service.py
│           ├── premium_calculator.py
│           ├── risk_engine.py
│           ├── trigger_monitor.py
│           ├── payout_service.py
│           ├── realtime_monitor.py
│           ├── platform_service.py
│           └── traffic_service.py
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        │   └── AppContext.jsx
        ├── services/
        │   └── api.js
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── LoginPage.jsx
        │   ├── WorkerDashboard.jsx
        │   ├── PoliciesPage.jsx
        │   ├── ClaimsPage.jsx
        │   ├── AdminDashboard.jsx
        │   ├── AdminClaimsPage.jsx
        │   └── SimulateDisruptionPage.jsx
        └── components/
            ├── Navbar.jsx
            ├── WalletCard.jsx
            ├── PolicyCard.jsx
            ├── ClaimCard.jsx
            ├── WeatherCard.jsx
            ├── TrustScoreMeter.jsx
            ├── RiskBadge.jsx
            ├── StatsCard.jsx
            ├── PayoutPopup.jsx
            ├── LiveWeatherBar.jsx
            ├── LiveFeed.jsx
            ├── DisruptionTimeline.jsx
            ├── Charts.jsx
            ├── LoadingSpinner.jsx
            └── EmptyState.jsx
```

---

## 5. Backend Deep-Dive

### 5.1 Application Bootstrap — `backend/app/main.py`

- Initialises a FastAPI app with CORS open to the React origin.
- Uses a `lifespan` context to:
  - Create all SQLAlchemy tables on startup.
  - **Seed demo data** on first run (8 sample workers across Hyderabad zones, sample policies, disruption events, sample claims, sample payouts).
  - Start the **APScheduler** background job that runs `trigger_monitor.check_all_zones()` every 30 seconds.
- Mounts all routers under `/api/...`.

### 5.2 Configuration — `backend/app/config.py`

Centralised settings (Pydantic `BaseSettings`):

- **Plans** — Basic ₹39 / Standard ₹59 / Premium ₹79 with `max_events`, `max_weekly_payout`.
- **Thresholds** — `RAIN_THRESHOLD_MM_HR = 15.0`, `HEAT_THRESHOLD_CELSIUS = 42.0`, `HEAT_SUSTAINED_HOURS = 3`, `FLOOD_WATERLOGGING_CM = 15.0`, `FRAUD_SCORE_THRESHOLD = 0.75`.
- **Day multipliers** — weekends `1.25`, weekdays `1.0`.
- **Zone coordinates** — 10 Hyderabad zones (Kukatpally, Banjara Hills, Old City, Madhapur, Gachibowli, Secunderabad, Hitec City, Begumpet, Jubilee Hills, Charminar) with lat/lng.
- **Secrets** read from env: `DATABASE_URL`, `OPENWEATHERMAP_API_KEY`, `MSG91_AUTH_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `JWT_SECRET_KEY`.

### 5.3 Models — `backend/app/models/`

| Model | Key fields |
|---|---|
| **Worker** | `id, name, phone (unique), email, platform, partner_id, delivery_zone, city, avg_daily_earnings, avg_orders_per_day, working_hours, trust_score, wallet_balance, password_hash, device_info(JSON), is_active, created_at` |
| **Policy** | `id, worker_id (FK), plan_type, weekly_premium, max_weekly_payout, max_events, events_used, coverage_start, coverage_end, status, risk_score, created_at` |
| **Claim** | `id, claim_hash (unique), worker_id, policy_id, event_id, disruption_type, disrupted_hours, hourly_rate, income_loss, payout_amount, day_multiplier, status, fraud_score, fraud_flags(JSON), gps_data(JSON), location_verified, created_at` — unique `(worker_id, event_id)` to prevent double-claims. |
| **DisruptionEvent** | `id, event_type, zone, city, severity, start_time, end_time, weather_data(JSON), source_confirmations(JSON), affected_workers, total_payouts, status, created_at` |
| **Payout** | `id, claim_id (FK, unique), worker_id, amount, payment_method, transaction_id, razorpay_payment_id, status, processed_at, created_at` |

### 5.4 Services — `backend/app/services/`

| Service | Responsibility |
|---|---|
| `weather_service.py` | Live OpenWeatherMap fetch (or realistic mock); checks per-zone thresholds; returns `{is_disruption, type, severity, ...}`. |
| `trigger_monitor.py` | Runs every 30 s: iterate zones → fetch weather → if disruption, create `DisruptionEvent`, find eligible workers, call income/fraud/payout pipeline. |
| `income_estimator.py` | `income_loss = (avg_daily_earnings / working_hours) × disrupted_hours × day_multiplier`. Caps payout at remaining `max_weekly_payout` and `max_events`. |
| `fraud_detection.py` | 7-layer fraud score (see §11). Uses `IsolationForest` + `DBSCAN`. Updates worker `trust_score`. |
| `premium_calculator.py` | Dynamic premium = `base + zone_risk_adj + seasonal_adj − trust_discount`. |
| `risk_engine.py` | XGBoost-style zone risk scoring (flood history, season, demographics). |
| `payout_service.py` | Creates `Payout`, calls Razorpay test-mode UPI transfer, updates `worker.wallet_balance`, marks claim `paid`. |
| `realtime_monitor.py` | Maintains in-memory SSE subscriber list; broadcasts events (`claim`, `payout`, `disruption`) as JSON over `/api/realtime/stream`. |
| `otp_service.py` | In-memory OTP store with 5-minute expiry; demo OTP returned in API body (would be replaced by real MSG91 SMS in prod). |
| `platform_service.py` | Mock Swiggy/Zomato order data (placeholder for real partner-API integration). |
| `traffic_service.py` | Mock TomTom traffic + zone-closure data. |

---

## 6. Frontend Deep-Dive

### 6.1 Pages

| File | Route | Purpose |
|---|---|---|
| [LandingPage.jsx](frontend/src/pages/LandingPage.jsx) | `/` | Marketing homepage; CTA to register/login. |
| [RegisterPage.jsx](frontend/src/pages/RegisterPage.jsx) | `/register` | Phone → OTP → profile (name, platform, zone, daily earnings, password). |
| [LoginPage.jsx](frontend/src/pages/LoginPage.jsx) | `/login` | Phone + password. |
| [WorkerDashboard.jsx](frontend/src/pages/WorkerDashboard.jsx) | `/dashboard/:workerId` | Wallet, active policy, risk score, recent claims, weather alerts, trust meter, live feed. |
| [PoliciesPage.jsx](frontend/src/pages/PoliciesPage.jsx) | `/policies/:workerId` | Browse 3 plans, subscribe (dynamic premium), policy history. |
| [ClaimsPage.jsx](frontend/src/pages/ClaimsPage.jsx) | `/claims/:workerId` | All claims with status / fraud score / payout breakdown. |
| [AdminDashboard.jsx](frontend/src/pages/AdminDashboard.jsx) | `/admin` | KPIs: workers, active policies, loss ratio, fraud rate, active events. |
| [AdminClaimsPage.jsx](frontend/src/pages/AdminClaimsPage.jsx) | `/admin/claims` | Searchable/filterable claims table. |
| [SimulateDisruptionPage.jsx](frontend/src/pages/SimulateDisruptionPage.jsx) | `/admin/simulate` | Manually fire mock weather event for a zone (for demos). |

### 6.2 Components

`Navbar`, `WalletCard` (animated counter), `PolicyCard`, `ClaimCard`, `WeatherCard`, `TrustScoreMeter`, `RiskBadge`, `StatsCard`, `PayoutPopup` (confetti modal), `LiveWeatherBar`, `LiveFeed`, `DisruptionTimeline`, `Charts` (Recharts), `LoadingSpinner`, `EmptyState`.

### 6.3 Global State & API Client

- [AppContext.jsx](frontend/src/context/AppContext.jsx) holds `currentWorker`, `isAuthenticated`, payout-popup state, and the SSE `EventSource`.
- [api.js](frontend/src/services/api.js) wraps every endpoint via Axios; an interceptor injects `Authorization: Bearer <token>` from `localStorage`.

### 6.4 Styling

Tailwind + custom utilities (`glass-card`, glow shadows). Framer Motion for page transitions and number-count animations. React Hot Toast for transient notifications.

---

## 7. Database Schema

```sql
workers (
  id, name, phone UNIQUE, email, platform, partner_id, delivery_zone, city,
  avg_daily_earnings, avg_orders_per_day, working_hours,
  trust_score, wallet_balance, password_hash, device_info JSONB,
  is_active, created_at
)

policies (
  id, worker_id FK, plan_type, weekly_premium, max_weekly_payout,
  max_events, events_used, coverage_start, coverage_end,
  status, risk_score, created_at
)

disruption_events (
  id, event_type, zone, city, severity,
  start_time, end_time, weather_data JSONB, source_confirmations JSONB,
  affected_workers, total_payouts, status, created_at
)

claims (
  id, claim_hash UNIQUE, worker_id FK, policy_id FK, event_id FK,
  disruption_type, disrupted_hours, hourly_rate, income_loss,
  payout_amount, day_multiplier,
  status, fraud_score, fraud_flags JSONB, gps_data JSONB, location_verified,
  created_at,
  UNIQUE (worker_id, event_id)
)

payouts (
  id, claim_id FK UNIQUE, worker_id FK, amount, payment_method,
  transaction_id, razorpay_payment_id, status,
  processed_at, created_at
)
```

Relationships:
- `Worker 1—n Policy`, `Worker 1—n Claim`, `Worker 1—n Payout`
- `Policy 1—n Claim`
- `DisruptionEvent 1—n Claim`
- `Claim 1—1 Payout`

---

## 8. Authentication Flow

### Worker Registration (OTP)

1. `POST /api/auth/send-otp` → `otp_service` generates 6-digit code, stores in-memory (5-min TTL), returns it in response body (demo mode; would be SMS via MSG91 in prod).
2. `POST /api/auth/register` with `{phone, otp, password, name, platform, zone, earnings, ...}`:
   - Verifies OTP.
   - Hashes password (`pbkdf2_sha256`).
   - Creates `Worker` row.
   - Returns JWT access token (`role: "worker"`, 30-day expiry).
3. Frontend stores token in `localStorage`.

### Worker Login

`POST /api/auth/login` with `{phone, password}` → password verify → JWT.

### Admin Login

`POST /api/auth/admin-login` with hardcoded credentials (`admin` / `DeliverShield@Admin123`) → JWT with `role: "admin"`. Admin routes are guarded by a FastAPI dependency that decodes the token and asserts `role == "admin"`.

### Token Use

Every API call includes `Authorization: Bearer <token>`. `GET /api/auth/me` round-trips the token and returns the current user profile.

---

## 9. Core Business Flows (End-to-End)

### 9.1 Subscribe to a Policy

```
Worker → PoliciesPage
  → GET /api/policies/plans                   (3 plans + features)
  → GET /api/policies/{worker_id}/active      (any current cover?)
  → POST /api/policies/subscribe              (plan_type, payment intent)
       │
       ▼
   premium_calculator.calculate(worker, plan, zone)
       │ = base + zone_risk + seasonal − trust_discount
       ▼
   Razorpay test-mode order → "paid"
       │
       ▼
   INSERT policy (coverage_start = today, coverage_end = today + 7d, events_used = 0)
       │
       ▼
   Response: {policy_id, premium, coverage_dates, max_events}
```

### 9.2 Automatic Payout (the headline flow)

```
APScheduler tick (every 30s)
   │
   ▼
trigger_monitor.check_all_zones()
   │
   ├── for zone in ZONES:
   │     weather = weather_service.fetch(zone)
   │     if weather.breaches_threshold:
   │         confirm_with_secondary_source(IMD)        ← dual confirmation
   │         create DisruptionEvent
   │
   ▼
for each worker with an active policy in the affected zone
and (events_used < max_events) and (today within coverage):
   │
   ├── income_estimator.estimate_loss(worker, disrupted_hours)
   │     hourly = avg_daily_earnings / working_hours
   │     loss   = hourly × disrupted_hours × day_multiplier
   │
   ├── fraud_detection.analyze(worker, event, gps_data)
   │     score, flags, location_verified, suggested_status
   │     update worker.trust_score
   │
   ├── payout_amount = min(loss, policy.max_weekly_payout − paid_this_week)
   │
   ├── INSERT claim   (status = approved | flagged based on fraud_score)
   ├── policy.events_used += 1
   ├── event.affected_workers += 1; event.total_payouts += payout_amount
   │
   ├── if approved:
   │      payout_service.process(claim, worker)
   │         → Razorpay UPI test-mode transfer
   │         → INSERT payout (status=completed)
   │         → worker.wallet_balance += amount
   │         → claim.status = "paid"
   │
   └── realtime_monitor.broadcast({type:"payout", worker_id, amount, ...})
            │
            ▼
       SSE → frontend → PayoutPopup (confetti) + wallet refresh
```

End-to-end latency: **~18 s** from threshold breach to UPI credit.

### 9.3 Flagged Claim Review

If `fraud_score ≥ 0.75`, claim is held with `status = flagged` for up to 4 h of admin review (admin sees it on `/admin/claims`). If unreviewed after the SLA, system auto-pays 80 % to balance UX vs risk.

---

## 10. Parametric Trigger Engine

| Disruption | Trigger condition |
|---|---|
| **Heavy Rain** | Sustained rainfall > 15 mm/hr **OR** cumulative > 100 mm/day |
| **Extreme Heat** | Temperature > 42 °C for ≥ 3 consecutive hours |
| **Flood / Waterlogging** | Official IMD flood alert **OR** waterlog depth > 15 cm |
| **Curfew / Zone Closure** | Government closure flag set in civic feed |

Every breach must be confirmed by **two independent sources** (e.g. OpenWeatherMap + IMD) before a claim fires. This eliminates single-feed glitches.

---

## 11. Fraud Detection Engine

`fraud_detection.py` runs **seven layers** per claim:

1. **GPS spoofing** — mock-location flag, teleport jumps (>X km in <1 min), perfectly stable coords.
2. **Movement pattern** — was the worker actually active in the 60 minutes before the event?
3. **Anomaly score** — `IsolationForest` over historical claim/earning vectors; threshold `0.75`.
4. **Fraud-ring clustering** — `DBSCAN` over recent claims; ≥ N claims within 100 m and 5 min ⇒ suspicious cluster.
5. **Device fingerprint** — `device_info` JSON cross-checked against past devices.
6. **Multi-source location verification** — GPS vs IP vs platform partner-id zone.
7. **Trust-score updates**:
   - Legitimate claim: `+2`
   - Anomaly: `−10`
   - GPS spoofing: `−20`
   - Fraud ring: `−30`

Trust score (0–100) feeds back into premium discounts and payout-cap decisions.

---

## 12. Premium & Payout Calculation

### Dynamic Premium

```
premium = base_rate(plan)
        + zone_risk_adj           (high-flood zones cost more)
        + seasonal_adj            (monsoon June–Sep: +15%)
        + historical_loss_adj     (rolling claim ratio for the zone)
        − trust_discount          (worker trust_score → up to −10%)
```

### Income Loss & Payout

```
hourly_rate    = worker.avg_daily_earnings / worker.working_hours
day_multiplier = 1.25 (weekend) | 1.0 (weekday)
income_loss    = hourly_rate × disrupted_hours × day_multiplier

payout_amount  = min(
  income_loss,
  policy.max_weekly_payout − already_paid_this_week
)
```

Capped further by `policy.max_events − policy.events_used`.

---

## 13. Real-Time Notification System (SSE)

- Endpoint: `GET /api/realtime/stream` (Server-Sent Events).
- `realtime_monitor.py` keeps an in-memory list of subscribers.
- On every `payout`, `claim`, or `disruption` lifecycle change, the service `broadcast()`s a JSON event.
- Frontend opens an `EventSource` in `AppContext`. On `payout` events for the current worker, `PayoutPopup` fires confetti and the wallet counter animates up.

---

## 14. API Reference

> Base: `http://localhost:8000` (dev). All routes prefixed with `/api`.

### Auth
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/send-otp` | Generate OTP for a phone |
| POST | `/auth/register` | OTP-verified registration (returns JWT) |
| POST | `/auth/login` | Phone + password (returns JWT) |
| POST | `/auth/admin-login` | Admin credentials (returns JWT) |
| GET  | `/auth/me` | Current user profile |

### Workers
| Method | Path | Purpose |
|---|---|---|
| POST | `/workers/register` | Create worker |
| GET  | `/workers/{worker_id}` | Profile |
| GET  | `/workers/{worker_id}/dashboard` | Dashboard payload |
| PUT  | `/workers/{worker_id}` | Update profile |

### Policies
| Method | Path | Purpose |
|---|---|---|
| GET  | `/policies/plans` | List 3 plans |
| POST | `/policies/subscribe` | Buy 7-day cover (dynamic premium) |
| GET  | `/policies/{worker_id}/active` | Active policy |
| GET  | `/policies/{worker_id}/history` | All policies |

### Claims & Payouts
| Method | Path | Purpose |
|---|---|---|
| GET  | `/claims/{worker_id}` | Worker claims |
| GET  | `/claims/detail/{claim_id}` | Claim + fraud analysis |
| POST | `/claims/manual-trigger` | Admin: trigger claim for testing |
| GET  | `/payouts/{worker_id}` | Worker payouts |

### Weather & Triggers
| Method | Path | Purpose |
|---|---|---|
| GET  | `/weather/{zone}` | Current weather |
| GET  | `/weather/{zone}/forecast` | 7-day forecast |
| GET  | `/weather/{zone}/risk` | Zone risk score |
| POST | `/triggers/check` | Manually run trigger sweep |
| GET  | `/triggers/active` | Active disruption events |
| POST | `/triggers/resolve/{event_id}` | Mark event resolved |

### Admin
| Method | Path | Purpose |
|---|---|---|
| GET  | `/admin/dashboard` | Platform KPIs |
| GET  | `/admin/claims` | All claims (filters) |
| GET  | `/admin/events` | All disruption events |
| GET  | `/admin/analytics` | Trends |
| POST | `/admin/simulate-disruption` | Fire mock event |

### Realtime
| Method | Path | Purpose |
|---|---|---|
| GET  | `/realtime/stream` | SSE event stream |

---

## 15. External Integrations

| Service | Used for | Mode |
|---|---|---|
| OpenWeatherMap | Live weather (rain/temp) per zone | Live (free tier) or mock |
| MSG91 | SMS OTP delivery | Mocked (OTP returned in API response) |
| Razorpay | UPI payouts | Test-mode sandbox |
| TomTom | Traffic / zone closures | Mocked |
| Google Maps Geocoding | Coords → zone | Mocked |
| IMD (India Met Dept) | Severe weather confirmation | Mocked |

---

## 16. Configuration & Environment

### Files

| File | Role |
|---|---|
| [main.py](main.py) | Root stub (delegates to backend) |
| [pyproject.toml](pyproject.toml) | Declares Python 3.12 |
| [.replit](.replit) | Replit dev workflow: parallel `Backend API` (uvicorn :8000) + `Frontend` (Vite :5000) |
| [backend/requirements.txt](backend/requirements.txt) | Python deps: fastapi, uvicorn, sqlalchemy, psycopg2, apscheduler, scikit-learn, xgboost, python-jose, passlib, httpx, … |
| [frontend/package.json](frontend/package.json) | React 18, Vite, Tailwind, Framer Motion, Recharts, Axios |

### Environment Variables

```
DATABASE_URL=postgresql://user:pass@host:5432/delivershield  # auto-set by Replit / Render
OPENWEATHERMAP_API_KEY=...                                   # default "demo_key"
MSG91_AUTH_KEY=...                                           # demo key in code
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
JWT_SECRET_KEY=delivershield_ai_secret_key_2024_hyderabad
```

---

## 17. Running Locally / Deployment

### Local (Replit-equivalent)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev    # Vite on :5000
```

Open `http://localhost:5000`. Backend API on `http://localhost:8000`. SSE stream available at `http://localhost:8000/api/realtime/stream`.

### Production

- **Frontend** → Vercel (build with `npm run build`, set `VITE_API_BASE_URL` env).
- **Backend** → Render web service (Python, start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
- **Database** → Render PostgreSQL or Neon; connection string in `DATABASE_URL`.
- Replace mock OTP/Razorpay keys with live credentials.

---

## 18. Glossary

| Term | Meaning |
|---|---|
| **Parametric insurance** | Pays out automatically when an objective metric crosses a threshold (no claim adjudication). |
| **Trigger event** | A confirmed disruption (heavy rain, heat, flood, curfew) that crosses a threshold in a zone. |
| **Zone** | One of the 10 pre-configured Hyderabad delivery zones. |
| **Trust score** | Per-worker 0–100 score updated by fraud engine; influences premium and payout decisions. |
| **Loss ratio** | Total payouts / total premiums collected (key admin KPI). |
| **Day multiplier** | Income-loss multiplier accounting for weekend earning power (1.25 weekend / 1.0 weekday). |
| **SSE** | Server-Sent Events — one-way realtime push from server to browser. |

---

*Document generated 2026-04-16. Source of truth is the code in `backend/app/` and `frontend/src/`.*
