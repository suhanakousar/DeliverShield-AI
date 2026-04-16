import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiShieldCheck, HiClock, HiCurrencyRupee, HiExclamation,
  HiArrowRight, HiRefresh, HiLightningBolt, HiBell,
} from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { getWorkerDashboard, getWeather, getClaims, getActivePlan, connectToRealtimeEvents } from '../services/api';
import StatsCard from '../components/StatsCard';
import WeatherCard from '../components/WeatherCard';
import TrustScoreMeter from '../components/TrustScoreMeter';
import PolicyCard from '../components/PolicyCard';
import ClaimCard from '../components/ClaimCard';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import LiveFeed from '../components/LiveFeed';
import WalletCard from '../components/WalletCard';

const DEMO_DASHBOARD = {
  worker: { name: 'Delivery Partner', zone: 'Kukatpally', platform: 'Swiggy', trust_score: 82, avg_daily_earnings: 800, wallet_balance: 0 },
  coverage: { is_active: false, plan_type: null, days_remaining: 0, events_used: 0, max_events: 0 },
  risk: { daily_risk_score: 35, disruption_probability: 0.22, risk_level: 'medium' },
  earnings: { total_protected: 4800, total_payouts: 640, this_week_earnings: 800 },
  recent_claims: [],
};

const WorkerDashboard = () => {
  const { workerId } = useParams();
  const { currentWorker, setCurrentWorker, showPayoutPopup } = useApp();
  const [dashboard, setDashboard] = useState(null);
  const [weather, setWeather] = useState(null);
  const [claims, setClaims] = useState([]);
  const [activePolicy, setActivePolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [recentPayout, setRecentPayout] = useState(null);
  const sseRef = useRef(null);

  const fetchData = useCallback(async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true);

      const results = await Promise.allSettled([
        getWorkerDashboard(workerId),
        getWeather(currentWorker?.zone || currentWorker?.delivery_zone || 'kukatpally'),
        getClaims(workerId),
        getActivePlan(workerId),
      ]);

      const [dashResult, weatherResult, claimsResult, policyResult] = results;

      if (dashResult.status === 'fulfilled') {
        setDashboard(dashResult.value);
        if (dashResult.value.worker) {
          const updatedWorker = dashResult.value.worker;
          setCurrentWorker(prev => ({ ...prev, ...updatedWorker }));
        }
      } else {
        setDashboard({ ...DEMO_DASHBOARD, worker: { ...DEMO_DASHBOARD.worker, ...(currentWorker || {}) } });
      }

      if (weatherResult.status === 'fulfilled') setWeather(weatherResult.value);
      if (claimsResult.status === 'fulfilled') {
        const claimsData = Array.isArray(claimsResult.value) ? claimsResult.value : claimsResult.value?.claims || [];
        setClaims(claimsData);
      }
      if (policyResult.status === 'fulfilled') setActivePolicy(policyResult.value);

      if (showRefreshToast) toast.success('Dashboard refreshed');
      setLastUpdated(new Date());
    } catch (error) {
      setDashboard({ ...DEMO_DASHBOARD, worker: { ...DEMO_DASHBOARD.worker, ...(currentWorker || {}) } });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workerId, currentWorker, setCurrentWorker]);

  // SSE subscription for real-time events
  useEffect(() => {
    const handleEvent = (event) => {
      if (event.type === 'payout_processed' || event.type === 'claims_created') {
        const amount = event.amount || event.payout_amount || event.total_amount;
        const disruptionType = event.disruption_type || event.event_type || 'heavy_rain';
        if (amount && amount > 0) {
          // Only show popup if event is for this worker
          if (!event.worker_id || event.worker_id === workerId) {
            setRecentPayout(amount);
            showPayoutPopup(amount, disruptionType);
            fetchData(false); // refresh data after payout
          }
        }
      }
      if (event.type === 'disruption_detected') {
        toast.error(`⚠️ ${event.event_type?.replace('_', ' ') || 'Disruption'} detected in ${event.zone || 'your zone'}!`, {
          duration: 6000,
        });
      }
    };

    const handleError = () => {};
    sseRef.current = connectToRealtimeEvents(handleEvent, handleError);

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [workerId, showPayoutPopup, fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <LoadingSpinner fullScreen text="Loading dashboard..." />;

  const worker = dashboard?.worker || currentWorker || DEMO_DASHBOARD.worker;
  const coverage = dashboard?.coverage || DEMO_DASHBOARD.coverage;
  const risk = dashboard?.risk || DEMO_DASHBOARD.risk;
  const earnings = dashboard?.earnings || DEMO_DASHBOARD.earnings;
  const trustScore = worker?.trust_score ?? 75;
  const zone = worker?.delivery_zone || worker?.zone || currentWorker?.delivery_zone || currentWorker?.zone || 'kukatpally';
  const hasCoverage = coverage?.is_active || activePolicy?.status === 'active';
  const recentClaims = claims.slice(0, 5);
  const walletBalance = worker?.wallet_balance ?? currentWorker?.wallet_balance ?? 0;
  const totalPayouts = earnings?.total_payouts || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 flex-wrap">
            Welcome, {worker.name || 'Partner'} 👋
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              (worker.platform || '').toLowerCase() === 'zomato' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }`}>
              {(worker.platform || '').toLowerCase() === 'zomato' ? '🔴 Zomato' : '🟠 Swiggy'} Connected
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            <span className="live-dot" />
            <span>Live monitoring active · {zone.replace('_', ' ')} Zone</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <HiRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Coverage CTA if not active */}
      {!hasCoverage && (
        <div className="card border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-primary-500/5 mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/15 rounded-xl flex items-center justify-center">
                <HiExclamation className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">You're Not Protected</h3>
                <p className="text-sm text-slate-400">Subscribe to a plan to get income protection during disruptions.</p>
              </div>
            </div>
            <Link to={`/policies/${workerId}`} className="btn-primary flex items-center gap-2 whitespace-nowrap">
              Get Protected <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Wallet + Stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-1">
          <WalletCard
            balance={walletBalance}
            totalPayouts={totalPayouts}
            recentAmount={recentPayout}
          />
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatsCard
            icon={HiShieldCheck}
            label="Coverage Status"
            value={hasCoverage ? 'Active' : 'Inactive'}
            color={hasCoverage ? 'accent' : 'red'}
            changeLabel={hasCoverage ? `${(coverage.plan_type || 'Standard').charAt(0).toUpperCase() + (coverage.plan_type || 'standard').slice(1)} Plan` : 'No active plan'}
          />
          <StatsCard
            icon={HiExclamation}
            label="Risk Score"
            value={`${risk.daily_risk_score || 0}/100`}
            color={risk.daily_risk_score > 60 ? 'red' : risk.daily_risk_score > 35 ? 'amber' : 'accent'}
            changeLabel={`${((risk.disruption_probability || 0) * 100).toFixed(0)}% disruption chance`}
          />
          <StatsCard
            icon={HiCurrencyRupee}
            label="Total Protected"
            value={`₹${(earnings.total_protected || 0).toLocaleString('en-IN')}`}
            color="primary"
            changeLabel="This coverage period"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Today's Risk */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Today's Risk</h3>
                <RiskBadge level={risk.risk_level || 'low'} size="lg" />
              </div>
              <div className="text-center mb-4">
                <p className="text-5xl font-bold text-white mb-1">{risk.daily_risk_score || 0}</p>
                <p className="text-sm text-slate-400">Risk Score</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">Disruption Probability</span>
                  <span className="font-semibold text-white">{((risk.disruption_probability || 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      risk.disruption_probability > 0.6 ? 'bg-red-500' :
                      risk.disruption_probability > 0.35 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(risk.disruption_probability || 0) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Weather */}
            <WeatherCard weather={weather} zone={zone} />
          </div>

          {/* Active Policy */}
          {hasCoverage && (activePolicy || coverage) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span className="badge-active-glow w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Active Policy
                </h3>
                <Link to={`/policies/${workerId}`} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                  Manage <HiArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <PolicyCard policy={activePolicy || { ...coverage, status: 'active' }} compact />
            </div>
          )}

          {/* Recent Claims */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Recent Claims</h3>
              <Link to={`/claims/${workerId}`} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                View All <HiArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentClaims.length > 0 ? (
              <div className="space-y-3">
                {recentClaims.map((claim, i) => (
                  <ClaimCard key={claim.id || i} claim={claim} expandable={false} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={HiShieldCheck}
                title="No Claims Yet"
                message={hasCoverage ? 'No disruptions detected yet. Your coverage is active.' : 'Subscribe to a plan to start getting protection.'}
              />
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Trust Score */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4 text-center">Trust Score</h3>
            <TrustScoreMeter score={trustScore} size="lg" />
            <p className="text-xs text-slate-500 text-center mt-4">
              Higher trust scores unlock better premiums and faster payouts.
            </p>
          </div>

          {/* Earnings Summary */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Earnings Protected</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-sm text-slate-400">Avg Daily Earnings</span>
                <span className="font-semibold text-white">₹{worker.avg_daily_earnings || 800}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <span className="text-sm text-slate-400">Weekly Protected</span>
                <span className="font-semibold text-primary-400">
                  ₹{((worker.avg_daily_earnings || 800) * 6).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <span className="text-sm text-slate-400">Total Payouts</span>
                <span className="font-bold text-emerald-400">₹{(totalPayouts || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link to={`/claims/${workerId}`} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group">
                <HiCurrencyRupee className="w-5 h-5 text-primary-400" />
                <span className="text-sm text-slate-300 group-hover:text-white">View All Claims</span>
                <HiArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-primary-400" />
              </Link>
              <Link to={`/policies/${workerId}`} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group">
                <HiShieldCheck className="w-5 h-5 text-accent-400" />
                <span className="text-sm text-slate-300 group-hover:text-white">
                  {hasCoverage ? 'Manage Policy' : 'Get Coverage'}
                </span>
                <HiArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-primary-400" />
              </Link>
              <Link to={`/policies/${workerId}`} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group">
                <HiClock className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-slate-300 group-hover:text-white">Coverage History</span>
                <HiArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-primary-400" />
              </Link>
              <Link to={`/admin/simulate`} className="flex items-center gap-3 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg hover:bg-primary-500/20 transition-colors group">
                <HiLightningBolt className="w-5 h-5 text-primary-400" />
                <span className="text-sm text-primary-300 group-hover:text-white">Test Disruption</span>
                <HiArrowRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-primary-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Live Feed */}
      <div className="mt-6">
        <LiveFeed compact maxEvents={15} />
      </div>
    </div>
  );
};

export default WorkerDashboard;
