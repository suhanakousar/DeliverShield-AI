# 🛡️ DeliverShield AI
### AI-Powered Parametric Income Insurance for Food Delivery Partners

> **Guidewire DEVTrails 2026** · Phase 1 — Ideation & Foundation · Submission Deadline: March 20, 2026

---

## 📋 Table of Contents

1. [Executive Summary](#-executive-summary)
2. [Problem Statement](#-problem-statement)
3. [Our Solution](#-our-solution)
4. [Persona & Scenarios](#-persona--scenarios)
5. [Weekly Pricing Model](#-weekly-pricing-model)
6. [Parametric Trigger Logic](#-parametric-trigger-logic)
7. [AI / ML Integration Plan](#-ai--ml-integration-plan)
8. [System Architecture](#-system-architecture)
9. [Application Workflow](#-application-workflow)
10. [Fraud Detection Design](#-fraud-detection-design)
11. [Tech Stack](#-tech-stack)
12. [6-Week Development Plan](#-6-week-development-plan)
13. [What Makes Us Stand Out](#-what-makes-us-stand-out)
14. [Business Viability](#-business-viability)
15. [Constraints Compliance](#-constraints-compliance)

---

## 🎯 Executive Summary

**DeliverShield AI** is a parametric income insurance platform built exclusively for **Swiggy and Zomato delivery partners** in India.

When external disruptions — heavy rain, extreme heat, flooding, or curfews — prevent workers from completing deliveries, our AI system:

- 🔍 **Automatically detects** the disruption event at the worker's GPS location
- 🧠 **AI-calculates** the exact income lost based on their registered earnings profile
- 💸 **Instantly triggers** a payout — no manual claim, no paperwork, no delay

> **This is parametric insurance:** payout is triggered by an objective external event, not a subjective claim.

A Swiggy delivery partner in Hyderabad earns ₹700–₹900/day. A single heavy-rain afternoon can wipe out 50–100% of those earnings with zero recourse. DeliverShield AI gives them a safety net that works automatically — and costs less than ₹10/day.

---

## 🚨 Problem Statement

### Who Are We Solving For?

India has over **5 million active food delivery partners** working with Swiggy and Zomato. These workers are self-employed gig workers who earn entirely on a per-delivery, per-day basis — no employee benefits, no sick leave, no income protection.

| Attribute | Detail |
|-----------|--------|
| **Persona** | Swiggy / Zomato Food Delivery Partner |
| **Location** | Tier 1 & Tier 2 Indian cities (Hyderabad, Bangalore, Mumbai, Chennai) |
| **Daily Earnings** | ₹700 – ₹900 (18–22 orders × ₹35–₹45 per order) |
| **Working Hours** | 10:00 AM – 10:00 PM (peak: lunch 12–2 PM, dinner 7–10 PM) |
| **Income Model** | Per-delivery commission — zero earnings if not working |
| **Risk Exposure** | Heavy rain, extreme heat, flooding, curfews, platform outages |

### The Financial Impact

External disruptions reduce gig workers' monthly earnings by **20–30%**, yet they have absolutely no financial safety net. When a disruption hits:

- They lose income immediately and completely for the disrupted period
- They cannot claim any compensation from the delivery platform
- Traditional insurance products do not cover gig income loss
- Microfinance or savings buffers are minimal for this income bracket

> ⚠️ **The Gap:** Currently, zero affordable, automated income protection products exist for India's 5 million+ food delivery partners. This is exactly what DeliverShield AI solves.

---

## 💡 Our Solution

### What Is Parametric Insurance?

| Traditional Insurance | DeliverShield AI (Parametric) |
|----------------------|-------------------------------|
| Worker files a manual claim | System detects disruption automatically |
| Investigation & approval required | AI validates event against external data |
| Payout in days or weeks | Payout within minutes of event confirmation |
| Subjective assessment | Objective trigger threshold (e.g., rain > 15mm/hr) |
| High administrative cost | Zero-touch, fully automated pipeline |

### The Zero-Touch Claim Flow

```
Worker's GPS Location Monitored
          ↓
Weather / Flood / Traffic API detects threshold breach
          ↓
Cross-validation with secondary data source
          ↓
AI calculates income loss from worker's earnings profile
          ↓
Fraud check (GPS validation + anomaly detection)
          ↓
Instant payout credited to worker wallet
          ↓
Worker receives push notification with payout details
```

The entire experience for the worker is: **subscribe once → stay protected → get paid automatically.**

---

## 👤 Persona & Scenarios

### Persona: Arjun, Zomato Delivery Partner — Hyderabad

> Arjun works 10 AM–10 PM daily, averaging 20 orders at ₹40 each = **₹800/day**. He supports his family on this income. During monsoon season, heavy rain regularly forces him off the road for 3–5 hours at a time.

---

### Scenario 1 — Heavy Rain (Most Common)

```
📍 Location: Kukatpally, Hyderabad
🌧️ Event: Rainfall hits 18mm/hr at 6:30 PM (dinner peak)

System Action:
  → OpenWeatherMap API detects threshold breach (> 15mm/hr)
  → Worker GPS confirmed in active delivery zone
  → Disruption duration: 3.5 hours
  → Income loss calculated: ₹800 ÷ 12hrs × 3.5hrs = ₹233
  → Fraud check passed ✅
  → ₹233 credited to Arjun's wallet at 6:35 PM
  → Notification: "Heavy rain detected in your area. ₹233 payout processed."
```

---

### Scenario 2 — Extreme Heat (Summer)

```
📍 Location: LB Nagar, Hyderabad
🌡️ Event: Temperature reaches 44°C sustained for 4 hours

System Action:
  → Temperature API detects threshold breach (> 42°C for 3+ hrs)
  → Worker GPS confirmed active
  → Disruption: Full afternoon block (12 PM – 4 PM)
  → Income loss calculated: ₹800 ÷ 12hrs × 4hrs = ₹267
  → ₹267 credited instantly
  → Safety alert sent: "Extreme heat advisory. Consider pausing. Coverage active."
```

---

### Scenario 3 — Curfew / Zone Closure

```
📍 Location: Old City, Hyderabad
🚧 Event: Local curfew imposed — zone closed from 2 PM

System Action:
  → Government alert API detects zone closure
  → Worker's last GPS ping confirmed inside closed zone
  → Full zone-closure duration covered
  → Income loss calculated for all disrupted hours
  → Instant payout triggered + safety alert sent
```

---

## 💰 Weekly Pricing Model

### Why Weekly?

Food delivery partners operate on a **weekly cash cycle**. Monthly or annual insurance commitments are impractical for workers managing day-to-day cash flow. Our weekly model mirrors how they earn — making insurance feel affordable and relevant.

### Plan Tiers

| Plan | Weekly Premium | Max Weekly Payout | Disruption Events |
|------|---------------|-------------------|-------------------|
| 🥉 Basic Shield | ₹39 / week | ₹500 | Up to 2 events |
| 🥈 Standard Shield | ₹59 / week | ₹800 | Up to 3 events |
| 🥇 Premium Shield | ₹79 / week | ₹1,200 | Unlimited events |

> At ₹59/week, Standard Shield costs **less than ₹10/day** — less than the cost of one missed delivery.

### AI-Driven Dynamic Premium Formula

The weekly premium is **not fixed**. Our AI engine adjusts it based on the worker's specific risk profile:

```
Weekly Premium = Base Rate
               + Location Risk Score    (flood zone, waterlogging history)
               + Seasonal Risk Factor   (monsoon multiplier: June–September)
               + Historical Loss Rate   (zone-level claims from past 90 days)
               − Safe Zone Discount     (historically low-disruption areas)
```

### Pricing Examples

| Worker Zone | Base Rate | Adjustments | Final Weekly Premium |
|-------------|-----------|-------------|----------------------|
| Banjara Hills (low flood risk) | ₹59 | −₹5 safe zone discount | **₹54/week** |
| Kukatpally (flood-prone) | ₹59 | +₹10 flood zone, +₹5 monsoon | **₹74/week** |
| Jubilee Hills (moderate) | ₹59 | +₹3 historical claims | **₹62/week** |

---

## ⚡ Parametric Trigger Logic

We monitor **4 primary disruption triggers** most impactful for food delivery workers:

| # | Trigger | Parameter | Threshold | Income Loss Calculation |
|---|---------|-----------|-----------|------------------------|
| 1 | 🌧️ Heavy Rain | Rainfall (mm/hr) | > 15mm/hr sustained OR > 100mm/day | Hours disrupted × worker's hourly rate |
| 2 | 🌡️ Extreme Heat | Temperature (°C) | > 42°C sustained for 3+ hours | Full disruption period at hourly rate |
| 3 | 🌊 Flood Alert | Waterlogging depth / Official alert | Depth > 15cm OR Alert = TRUE | Full disruption until alert cleared |
| 4 | 🚧 Curfew / Zone Closure | Government order | Zone closure = TRUE | All active hours in closed zone |

### Trigger Decision Logic

```python
def should_trigger_claim(worker_location, current_conditions):

    rainfall = current_conditions["rainfall_mm_per_hr"]
    temperature = current_conditions["temp_celsius"]
    flood_alert = current_conditions["flood_alert"]
    zone_closed = current_conditions["zone_closure"]

    if rainfall > 15:
        return trigger_claim(reason="HEAVY_RAIN", worker=worker_location)

    if temperature > 42 and current_conditions["heat_duration_hrs"] >= 3:
        return trigger_claim(reason="EXTREME_HEAT", worker=worker_location)

    if flood_alert or current_conditions["waterlog_depth_cm"] > 15:
        return trigger_claim(reason="FLOOD_ALERT", worker=worker_location)

    if zone_closed:
        return trigger_claim(reason="ZONE_CLOSURE", worker=worker_location)

    return None  # No trigger
```

> **Cross-Validation Rule:** Every trigger must be confirmed by **2 independent data sources** before a claim fires — preventing false payouts from API errors.

---

## 🧠 AI / ML Integration Plan

### Model 1 — Risk Profiling Engine (Premium Calculation)

| Component | Detail |
|-----------|--------|
| **Algorithm** | Gradient Boosting Regressor (XGBoost) |
| **Training Inputs** | Worker location, delivery zone flood maps, 2-year historical rainfall, seasonal weather patterns, past city disruption events |
| **Output** | Risk Score (0–100) → mapped to weekly premium adjustment |
| **Update Frequency** | Weekly retraining as new claim data accumulates |

### Model 2 — Income Loss Estimation Engine

| Component | Detail |
|-----------|--------|
| **Algorithm** | Rule-based engine + Linear Regression for edge cases |
| **Inputs** | Worker's registered daily order count, earning per order, day-of-week multiplier (weekends earn 20–30% more), hours disrupted |
| **Output** | Estimated income loss in ₹ for the disruption period |
| **Formula** | `Loss = (Daily Income ÷ Working Hours) × Disrupted Hours × Day Multiplier` |

### Model 3 — Fraud Detection (Isolation Forest)

| Component | Detail |
|-----------|--------|
| **Algorithm** | Isolation Forest (unsupervised anomaly detection) |
| **Why Isolation Forest?** | Learns "normal" claim patterns over time — flags genuine outliers without manual rule updates |
| **Training Data** | Historical claim records, GPS logs, weather event timestamps |
| **Output** | Anomaly score (0–1). Score > 0.75 = flagged for review |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    WORKER PWA (React.js)                     │
│   Register → Buy Plan → Live Risk Monitor → Payout History  │
└─────────────────────┬────────────────────────────────────────┘
                      │  REST API (HTTPS)
┌─────────────────────▼────────────────────────────────────────┐
│              BACKEND API  (Python — FastAPI)                 │
│    Auth  |  Policy Engine  |  Claims Engine  |  Payouts      │
└──────┬──────────────┬──────────────────┬─────────────────────┘
       │              │                  │
┌──────▼──────┐ ┌─────▼──────┐  ┌───────▼──────────┐
│  AI RISK    │ │ DISRUPTION │  │  FRAUD DETECTION │
│  ENGINE     │ │  MONITOR   │  │     MODULE       │
│             │ │            │  │                  │
│  XGBoost    │ │ Weather API│  │ Isolation Forest │
│  (premium)  │ │ Flood API  │  │ GPS Validation   │
│  Regression │ │ Traffic API│  │ Dupe Detection   │
│  (loss est) │ │ 15min poll │  │ Anomaly Scoring  │
└──────┬──────┘ └─────┬──────┘  └───────┬──────────┘
       │              │                  │
┌──────▼──────────────▼──────────────────▼──────────┐
│              PostgreSQL DATABASE                   │
│  Workers | Policies | Claims | Payouts | Events   │
└─────────────────────┬──────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────┐
│     PAYMENT GATEWAY  (Razorpay Test Mode)          │
│         Instant UPI wallet credit (mock)           │
└─────────────────────┬──────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────┐
│        ADMIN DASHBOARD  (React + Recharts)         │
│  Loss Ratios | Risk Heatmap | Fraud Alerts         │
│  AI Forecast: Next 7-day disruption predictions    │
└────────────────────────────────────────────────────┘
```

### External API Integrations

| API / Service | Purpose | Availability |
|--------------|---------|--------------|
| OpenWeatherMap API | Real-time rainfall, temperature, weather alerts | Free tier — 1,000 calls/day |
| India Meteorological Dept (IMD) | Official flood alerts and severe weather warnings | Public JSON feed |
| TomTom Traffic API | Real-time traffic congestion for curfew detection | Free tier (mock acceptable) |
| Google Maps Geocoding | Convert worker GPS to zone for risk scoring | Free tier — $200/month credit |
| Razorpay Test Mode | Simulate instant UPI payout to worker wallet | Sandbox — no real money |

### Platform Choice: Progressive Web App (PWA)

We chose **React PWA over native mobile** because:
- ✅ Installable on Android (primary device for delivery workers) without app store approval
- ✅ Instant deployment — no app store review cycle during the hackathon
- ✅ Easier to demo and judge via browser on desktop or mobile
- ✅ Can migrate to React Native in Phase 3 if user research supports it

---

## 🔄 Application Workflow

### Worker Journey

```
1. SIGN UP
   Worker enters: Name, Phone, City, Platform (Swiggy/Zomato),
   Average orders/day, Earning per order

          ↓

2. AI RISK PROFILE GENERATED
   System calculates Location Risk Score → Recommended plan
   Shown to worker: "Your zone is medium risk. Recommended: Standard Shield ₹59/week"

          ↓

3. CHOOSE & PAY WEEKLY PLAN
   Worker selects plan → Pays via mock UPI → Coverage activates instantly

          ↓

4. SYSTEM MONITORS CONTINUOUSLY
   Every 15 minutes: Weather API + Flood API polled for worker's GPS zone

          ↓

5. DISRUPTION DETECTED
   Threshold breached → Cross-validated → Income loss calculated

          ↓

6. FRAUD CHECK  (automated, < 2 seconds)
   GPS validated + anomaly scored + duplicate check

          ↓

7. INSTANT PAYOUT
   Amount credited to worker wallet → Push notification sent

          ↓

8. WORKER DASHBOARD
   Shows: Active coverage, weekly earnings protected, payout history, next-day risk forecast
```

### Admin / Insurer Journey

```
Dashboard → Live view of all active policies and disruption events
         → Loss ratio tracker per city / zone
         → Fraud alert queue with anomaly scores
         → Risk heatmap (city map: red / yellow / green zones)
         → AI Forecast: Next 7-day predicted disruption events and expected claims
```

---

## 🛡️ Fraud Detection Design

| Fraud Type | Detection Method |
|-----------|-----------------|
| **GPS Spoofing** | Compare claimed GPS with cell tower triangulation + delivery platform last-known location |
| **Fake Weather Claim** | Cross-validate claim timestamp with IMD / OpenWeatherMap historical archive for exact coordinates |
| **Claim Clustering** | Flag if 20+ workers in same micro-zone claim simultaneously without weather API confirmation |
| **Duplicate Claims** | SHA-256 hash of `(worker_id + event_id)` — one claim per event, enforced at DB level |
| **Inactive Worker Claim** | If worker shows zero app activity in 60 minutes before disruption, flag for review |

### Why Isolation Forest Over Rule-Based Checks?

Most teams will build simple if/else fraud rules. We use **Isolation Forest** because:

- It learns what "normal" claim behavior looks like across all workers
- It catches fraud patterns not explicitly programmed — new fraud types detected automatically
- The anomaly score (0–1) gives nuanced risk levels rather than binary pass/fail
- As the platform scales, the model improves without manual rule updates

---

## ⚙️ Tech Stack

| Layer | Technology | Justification |
|-------|-----------|--------------|
| **Frontend** | React.js + Tailwind CSS (PWA) | Fast development, responsive, installable on Android |
| **Backend** | Python — FastAPI | Async, perfect for real-time event-driven APIs |
| **Database** | PostgreSQL | Relational model fits policies/claims/workers well |
| **AI / ML** | XGBoost, Scikit-learn, Pandas | Industry-standard, fast to prototype, well-documented |
| **Disruption APIs** | OpenWeatherMap, IMD, TomTom (mock) | Free tiers sufficient; mock APIs accepted per rules |
| **Payment Gateway** | Razorpay Test Mode / UPI Simulator | Sandbox allows instant payout demonstration |
| **Hosting** | Vercel (Frontend) + Render (Backend) | Free tiers, instant deploy from GitHub |
| **Version Control** | GitHub | Single repo used across all 3 phases as required |
| **Charts / Analytics** | Recharts (React) | Lightweight, integrates natively with React dashboard |

---

## 🗓️ 6-Week Development Plan

| Phase | Timeline | Theme | Key Deliverables |
|-------|----------|-------|-----------------|
| 🌱 **Seed** | Mar 4–20 | Ideation & Foundation | Idea Document, README, System Design, UI Wireframes, 2-min Strategy Video |
| 📈 **Scale** | Mar 21–Apr 4 | Automation & Protection | Worker registration, AI premium calculator, live disruption monitor, 4 automated triggers, claims engine, mock payout, 2-min demo video |
| 🚀 **Soar** | Apr 5–17 | Scale & Optimise | Advanced fraud detection, admin dashboard with predictive analytics, safety alerts, end-to-end demo, final pitch deck |

### Phase 2 Sprint Checklist (March 21 – April 4)
- [ ] Worker registration + onboarding flow (React PWA)
- [ ] AI premium calculator (XGBoost with synthetic training data)
- [ ] Live disruption monitor — OpenWeatherMap API polling every 15 min
- [ ] 4 automated parametric triggers (rain, heat, flood, curfew)
- [ ] Basic claims engine + Razorpay mock payout
- [ ] Insurance policy management (view, renew, cancel)

### Phase 3 Sprint Checklist (April 5 – April 17)
- [ ] Train Isolation Forest fraud detection model
- [ ] Admin dashboard: loss ratio, risk heatmap, 7-day disruption forecast
- [ ] Worker safety alerts (push notifications before high-risk periods)
- [ ] Full end-to-end demo: trigger fake rainstorm → auto-claim → instant payout
- [ ] Final pitch deck (PDF): persona, AI architecture, business viability

---

## ✨ What Makes Us Stand Out

| Feature | DeliverShield AI | Typical Competitor |
|---------|-----------------|-------------------|
| **Claim Process** | Zero-touch — fully automated | Manual form submission |
| **Fraud Detection** | ML-based Isolation Forest (learns patterns) | Simple rule-based checks |
| **Pricing Model** | AI dynamic pricing per delivery zone | Fixed flat weekly fee |
| **Payout Speed** | Instant (within minutes of trigger) | Manual review required |
| **Risk Alerts** | Morning push notification with daily risk forecast | None |
| **Admin Analytics** | Predictive 7-day disruption forecast | Basic claim count |
| **Cross-Validation** | Every trigger confirmed by 2 data sources | Single API check |

> 🏆 **Winning Insight:** DeliverShield AI thinks like both an **insurer** (managing risk, loss ratio, fraud) and a **worker-first product** (zero friction, instant payout, proactive alerts). This dual perspective is what separates a student project from a real startup product.

---

## 📊 Business Viability

### Market Opportunity

| Metric | Estimate |
|--------|---------|
| Active food delivery partners in India | ~5 million |
| Average weekly premium (Standard plan) | ₹59 |
| Monthly revenue per worker | ₹236 |
| Expected disruption events per city per month | 8–12 significant events |
| Target loss ratio | < 65% (standard for parametric insurance) |
| Break-even subscriber base | ~10,000 active workers |

### Why This Business Model Works

1. **Weekly pricing** removes the commitment barrier for daily-wage workers
2. **Parametric payouts** keep administrative costs near zero — no claims officers needed
3. **AI pricing** allows premiums to reflect actual risk — protecting the insurer's loss ratio
4. **Network effects** — as more workers subscribe, fraud and risk models continuously improve
5. **Expansion path** — same platform can onboard Zepto/Blinkit or Amazon delivery partners with minimal changes

---

## ✅ Constraints Compliance

| Constraint | Our Approach | Status |
|-----------|-------------|--------|
| **Loss of income ONLY** — no health, accident, vehicle, or life coverage | All triggers and payouts strictly tied to income loss from work disruption. Zero health or vehicle components. | ✅ Compliant |
| **Weekly pricing model** | All plans structured and priced on a 7-day basis. No monthly or annual options. | ✅ Compliant |
| **Single delivery persona** | Swiggy / Zomato food delivery partners only. | ✅ Compliant |
| **AI/ML integration required** | XGBoost (premium), Isolation Forest (fraud), Regression (income loss). | ✅ Compliant |
| **Parametric automation** | Full zero-touch automated trigger pipeline — no manual claim process. | ✅ Compliant |
| **Mock APIs acceptable** | OpenWeatherMap free tier + mock APIs for traffic and platform data. | ✅ Compliant |
| **Same repo across all phases** | Single GitHub repo used for Phase 1, 2, and 3. | ✅ Compliant |

---

## 🔗 Links

| Resource | Link |
|----------|------|
| **GitHub Repository** | `github.com/[team]/delivershield-ai` |
| **2-Minute Strategy Video** | *(to be added before March 20)* |
| **UI Prototype (Figma)** | *(to be added)* |

---

<div align="center">

**DeliverShield AI** · *Because every delivery partner deserves a safety net.*

Guidewire DEVTrails 2026 · Phase 1 Idea Document

</div>
