import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineShieldCheck, HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import {
  getWorkerDashboard, getWeather, getClaims, getActivePlan, getWallet,
} from '../services/api';
import WeatherCard from '../components/WeatherCard';
import TrustScoreMeter from '../components/TrustScoreMeter';
import PolicyCard from '../components/PolicyCard';
import ClaimCard from '../components/ClaimCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import LiveFeed from '../components/LiveFeed';
import WalletCard from '../components/WalletCard';
import ShiftControl from '../components/ShiftControl';
import LiveMap from '../components/LiveMap';
import AlertsBanner from '../components/AlertsBanner';

// Mirrors backend ZONE_COORDINATES (Hyderabad)
const ZONES = [
  { key: 'kukatpally',    label: 'Kukatpally',    lat: 17.4947, lon: 78.3996 },
  { key: 'banjara_hills', label: 'Banjara Hills', lat: 17.4156, lon: 78.4347 },
  { key: 'lb_nagar',      label: 'LB Nagar',      lat: 17.3457, lon: 78.5522 },
  { key: 'jubilee_hills', label: 'Jubilee Hills', lat: 17.4325, lon: 78.4070 },
  { key: 'old_city',      label: 'Old City',      lat: 17.3616, lon: 78.4747 },
  { key: 'gachibowli',    label: 'Gachibowli',    lat: 17.4401, lon: 78.3489 },
  { key: 'secunderabad',  label: 'Secunderabad',  lat: 17.4399, lon: 78.4983 },
  { key: 'madhapur',      label: 'Madhapur',      lat: 17.4484, lon: 78.3908 },
  { key: 'ameerpet',      label: 'Ameerpet',      lat: 17.4374, lon: 78.4482 },
  { key: 'dilsukhnagar',  label: 'Dilsukhnagar',  lat: 17.3687, lon: 78.5247 },
];

function deriveRisk({ rainfall_mm_hr = 0, temperature = 0, waterlogging_cm = 0, aqi = 0 }) {
  if (waterlogging_cm > 30 || rainfall_mm_hr > 30 || temperature > 46 || aqi > 400) return 'extreme';
  if (waterlogging_cm > 15 || rainfall_mm_hr > 15 || temperature > 42 || aqi > 300) return 'high';
  if (rainfall_mm_hr > 5 || temperature > 38 || aqi > 200) return 'medium';
  return 'low';
}

const DEMO = {
  worker: { name: 'Delivery Partner', delivery_zone: 'kukatpally', platform: 'swiggy', trust_score: 75, avg_daily_earnings: 800, wallet_balance: 0 },
  risk: { daily_risk_score: 35, disruption_probability: 0.22, risk_level: 'medium' },
  earnings: { total_protected: 0, total_payouts: 0 },
  recent_claims: [],
};

export default function WorkerDashboard() {
  const { workerId } = useParams();
  const { currentWorker, setCurrentWorker, liveEvents, activeAlert } = useApp();
  const [dashboard, setDashboard] = useState(null);
  const [weather, setWeather] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [claims, setClaims] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState({ shiftActive: false, deliveryActive: false });
  const [zoneRisks, setZoneRisks] = useState({}); // { zone_key: 'low'|...}
  const [coords, setCoords] = useState(null);

  const workerZone = currentWorker?.delivery_zone || dashboard?.worker?.delivery_zone || 'kukatpally';

  const fetchAll = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        getWorkerDashboard(workerId),
        getWeather(workerZone),
        getClaims(workerId),
        getActivePlan(workerId),
        getWallet(workerId),
      ]);
      const [dash, w, c, p, wa] = results;
      if (dash.status === 'fulfilled') {
        setDashboard(dash.value);
        if (dash.value?.worker) setCurrentWorker((prev) => ({ ...prev, ...dash.value.worker }));
      }
      if (w.status === 'fulfilled') setWeather(w.value?.weather || w.value);
      if (c.status === 'fulfilled') setClaims(Array.isArray(c.value) ? c.value : (c.value?.claims || []));
      if (p.status === 'fulfilled') setPolicy(p.value);
      if (wa.status === 'fulfilled') setWallet(wa.value);
    } finally {
      setLoading(false);
    }
  }, [workerId, workerZone, setCurrentWorker]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 15000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // Live weather refresh every 5s for the user's zone
  useEffect(() => {
    if (!workerZone) return;
    const id = setInterval(() => {
      getWeather(workerZone).then(d => setWeather(d?.weather || d)).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [workerZone]);

  // Drive map zone colors from live SSE weather_update events
  useEffect(() => {
    const updates = liveEvents.filter((e) => e.type === 'weather_update');
    if (!updates.length) return;
    setZoneRisks((prev) => {
      const next = { ...prev };
      for (const u of updates) {
        if (!u.zone) continue;
        if (next[u.zone]) continue; // most-recent first; keep first seen
        next[u.zone] = deriveRisk({
          rainfall_mm_hr: u.rainfall_mm_hr,
          temperature: u.temperature,
          waterlogging_cm: u.waterlogging_cm || 0,
          aqi: u.aqi || 0,
        });
      }
      return next;
    });
  }, [liveEvents]);

  // Track GPS coords from the global navigator (read-only mirror of ShiftControl)
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const zonesForMap = useMemo(
    () => ZONES.map((z) => ({ ...z, risk: zoneRisks[z.key] || 'low' })),
    [zoneRisks]
  );

  if (loading) return <LoadingSpinner fullScreen text="Loading Dashboard" />;

  const worker = dashboard?.worker || currentWorker || DEMO.worker;
  const risk = dashboard?.risk || DEMO.risk;
  const earnings = dashboard?.earnings || DEMO.earnings;
  const hasCoverage = dashboard?.coverage?.is_active || policy?.status === 'active';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tighter text-base-100">
            Welcome, {worker.name}
          </h1>
          <p className="text-base-400 font-medium mt-1">
            {activity.shiftActive
              ? '🟢 Live monitoring active — your earnings are protected.'
              : '⚪ Off-shift. Start a shift below to enable parametric protection.'}
          </p>
        </div>
        {!hasCoverage && (
          <Link to={`/policies/${workerId}`} className="btn-primary shrink-0 shadow-lg shadow-primary-500/20">
            Activate Coverage
          </Link>
        )}
      </div>

      {/* Disruption banner (driven by SSE) */}
      {activeAlert && <AlertsBanner alert={activeAlert} />}

      {/* No-coverage warning */}
      {!hasCoverage && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card border-warning-500/50 bg-warning-900/10 flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning-500/20 flex items-center justify-center text-warning-400 shrink-0">
              <HiOutlineExclamationCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base-100 text-lg">Your income is not protected</h3>
              <p className="text-base-400 text-sm">Subscribe to a plan to receive payouts during weather disruptions.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Row 1 — Shift control + Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ShiftControl workerId={workerId} onShiftChange={setActivity} />
        </div>
        <div>
          <WalletCard balance={wallet.balance ?? worker.wallet_balance} totalPayouts={earnings.total_payouts} />
        </div>
      </div>

      {/* Row 2 — Live Weather + Risk + Trust */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WeatherCard weather={weather} zone={workerZone} />

        <div className="card p-6">
          <h3 className="font-bold text-base-500 uppercase tracking-wider text-xs mb-4">Zone Risk Score</h3>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-6xl font-extrabold font-sans tracking-tighter text-base-100 leading-none">
              {risk.daily_risk_score}
            </span>
            <span className="text-base-500 font-bold mb-1">/ 100</span>
          </div>
          <p className="text-sm font-medium text-base-400 mb-4">
            Calculated disruption risk for {workerZone.replace(/_/g, ' ')}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-base-400">Disruption Probability</span>
              <span className="text-warning-400">{((risk.disruption_probability || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full h-2.5 bg-base-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-danger-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(risk.disruption_probability || 0) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        <div className="card flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base-500 uppercase tracking-wider text-xs">Trust Score</h3>
            <span className="text-xs font-bold text-primary-400 bg-primary-500/10 px-2 py-1 rounded-md">
              Impacts Pricing
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <TrustScoreMeter score={worker.trust_score ?? 75} size="md" />
          </div>
        </div>
      </div>

      {/* Row 3 — Live Map + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveMap
            coords={coords}
            zones={zonesForMap}
            activeZoneKey={activeAlert?.zone}
            currentZoneKey={workerZone}
          />
        </div>
        <div className="lg:col-span-1 h-[450px]">
          <LiveFeed compact />
        </div>
      </div>

      {/* Row 4 — Active policy + claims */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {hasCoverage && (policy || dashboard?.coverage) && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold font-sans tracking-tight text-base-100">Active Policy</h3>
                <Link to={`/policies/${workerId}`} className="text-sm font-bold text-primary-500 hover:text-primary-400">
                  Manage Plan
                </Link>
              </div>
              <PolicyCard policy={policy || { ...dashboard.coverage, status: 'active' }} />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-sans tracking-tight text-base-100">Recent Claims</h3>
              <Link to={`/claims/${workerId}`} className="text-sm font-bold text-primary-500 hover:text-primary-400">
                View All
              </Link>
            </div>
            {claims.length > 0 ? (
              <div className="space-y-4">
                {claims.slice(0, 3).map((claim, i) => (
                  <ClaimCard key={claim.id || i} claim={claim} expandable={false} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={HiOutlineShieldCheck}
                title="No claims yet"
                message="We're monitoring your zone. If a disruption hits while you're delivering, your claim will appear here automatically."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
