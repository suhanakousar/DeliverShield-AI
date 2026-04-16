# DeliverShield AI

## Overview
AI-Powered Parametric Income Insurance platform for food delivery partners (Swiggy/Zomato) in India. Protects workers from income loss caused by weather disruptions (heavy rain, extreme heat, floods) using parametric triggers and automatic payouts without manual claims.

## Architecture

### Frontend (React)
- **Framework**: React 18 with Create React App
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Port**: 5000 (dev)
- **Location**: `frontend/`
- **Key files**: `src/App.jsx`, `src/pages/`, `src/components/`, `src/services/api.js`

### Backend (FastAPI/Python)
- **Framework**: FastAPI with Uvicorn
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL (via `DATABASE_URL` env var) / SQLite fallback
- **Port**: 8000
- **Location**: `backend/`
- **Key files**: `app/main.py`, `app/config.py`, `app/routes/`, `app/services/`

## Workflows
- **Start application**: Runs the React frontend on port 5000 (`cd frontend && npm start`)
- **Backend API**: Runs the FastAPI backend on port 8000 (`cd backend && uvicorn app.main:app --host localhost --port 8000 --reload`)

## Key Features
- **Parametric Triggers**: Auto-detects weather disruptions (rain >15mm/hr, temp >42°C)
- **Fraud Detection**: GPS spoofing detection, movement pattern analysis, Trust Score system
- **Dynamic Pricing**: Zone-based risk (Hyderabad zones) and seasonal premium adjustments
- **AI/ML**: XGBoost for risk profiling, Isolation Forest for anomaly detection, DBSCAN for fraud rings
- **Real-time Monitoring**: APScheduler polls weather data every 30 seconds

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-set by Replit)
- `OPENWEATHERMAP_API_KEY`: Weather API key (defaults to "demo_key")
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`: Payment keys (defaults to mock values)

## Frontend-Backend Communication
- Frontend uses `REACT_APP_API_URL` env var (defaults to `http://localhost:8000`)
- Backend CORS allows all origins in development
- SSE (Server-Sent Events) used for real-time notifications

## Database
- Auto-seeds 8 sample delivery workers in Hyderabad on first run
- Models: Worker, Policy, DisruptionEvent, Claim, Payout
