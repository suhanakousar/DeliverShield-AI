import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  HiUsers, HiShieldCheck, HiCurrencyRupee, HiExclamation, HiLightningBolt,
  HiRefresh, HiArrowRight, HiTrendingUp, HiClipboardList, HiBeaker,
} from 'react-icons/hi';
import { getAdminDashboard, getAdminEvents, getAdminAnalytics, checkTriggers, getActiveTriggers, getAdminForecast } from '../services/api';
import StatsCard from '../components/StatsCard';
import { ClaimsByTypeChart, WeeklyPayoutsChart, ForecastChart } from '../components/Charts';
import RiskBadge from '../components/RiskBadge';
import DisruptionTimeline from '../components/DisruptionTimeline';
import LoadingSpinner from '../components/LoadingSpinner';
import LiveFeed from '../components/LiveFeed';

// Demo data for when backend is offline
const DEMO_DASHBOARD = {
  stats: {
    total_workers: 247,
    active_policies: 189,
    total_claims: 1432,
    total_payouts: 287600,
    loss_ratio: 0.62,
    fraud_rate: 0.034,
  },
  recent_claims: [
    { id: 'CLM-001', worker_name: 'Rajesh K.', worker_id: 'WKR-001', zone: 'Kukatpally', disruption_type: 'heavy_rain', payout_amount: 340, status: 'paid', fraud_score: 0.12, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'CLM-002', worker_name: 'Priya M.', worker_id: 'WKR-002', zone: 'Banjara Hills', disruption_type: 'extreme_heat', payout_amount: 280, status: 'paid', fraud_score: 0.08, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'CLM-003', worker_name: 'Suresh B.', worker_id: 'WKR-003', zone: 'Old City', disruption_type: 'heavy_rain', payout_amount: 450, status: 'pending', fraud_score: 0.45, created_at: new Date(Date.now() - 10800000).toISOString() },
    { id: 'CLM-004', worker_name: 'Lakshmi N.', worker_id: 'WKR-004', zone: 'Gachibowli', disruption_type: 'flood', payout_amount: 620, status: 'flagged', fraud_score: 0.82, created_at: new Date(Date.now() - 14400000).toISOString() },
    { id: 'CLM-005', worker_name: 'Anil R.', worker_id: 'WKR-005', zone: 'Madhapur', disruption_type: 'heavy_rain', payout_amount: 310, status: 'approved', fraud_score: 0.05, created_at: new Date(Date.now() - 18000000).toISOString() },
  ],
  fraud_alerts: [
    { id: 'CLM-004', worker_name: 'Lakshmi N.', zone: 'Gachibowli', disruption_type: 'flood', fraud_score: 0.82, payout_amount: 620, status: 'flagged', indicators: ['GPS mismatch', 'Unusual timing'], created_at: new Date(Date.now() - 14400000).toISOString() },
  ],
};

const DEMO_EVENTS = [
  { id: 'EVT-001', disruption_type: 'heavy_rain', zone: 'Kukatpally', severity: 'high', status: 'active', workers_affected: 42, claims_count: 38, total_payouts: 12800, duration_hours: 4, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'EVT-002', disruption_type: 'extreme_heat', zone: 'LB Nagar', severity: 'medium', status: 'resolved', workers_affected: 28, claims_count: 22, total_payouts: 6400, duration_hours: 6, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'EVT-003', disruption_type: 'flood', zone: 'Old City', severity: 'extreme', status: 'resolved', workers_affected: 65, claims_count: 58, total_payouts: 32400, duration_hours: 8, created_at: new Date(Date.now() - 172800000).toISOString() },
];

const DEMO_ANALYTICS = {
  claims_by_type: [
    { type: 'heavy_rain', count: 645 },
    { type: 'extreme_heat', count: 412 },
    { type: 'flood', count: 228 },
    { type: 'curfew', count: 147 },
  ],
  weekly_payouts: [
    { week: 'W1', amount: 32400 },
    { week: 'W2', amount: 18600 },
    { week: 'W3', amount: 45200 },
    { week: 'W4', amount: 29800 },
    { week: 'W5', amount: 38600 },
    { week: 'W6', amount: 21200 },
    { week: 'W7', amount: 17400 },
    { week: 'W8', amount: 34800 },
  ],
};

const statusConfig = {
  pending: { bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  approved: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  paid: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  rejected: { bg: 'bg-red-500/15', text: 'text-red-400' },
  flagged: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
  processing: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
};

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingTriggers, setCheckingTriggers] = useState(false);
  const [forecast, setForecast] = useState(null);

  const fetchData = useCallback(async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      const results = await Promise.allSettled([
        getAdminDashboard(),
        getAdminEvents(),
        getAdminAnalytics(),
      ]);

      if (results[0].status === 'fulfilled') {
        setDashboard(results[0].value);
      } else {
        setDashboard(DEMO_DASHBOARD);
      }

      if (results[1].status === 'fulfilled') {
        const eventsData = Array.isArray(results[1].value) ? results[1].value : results[1].value?.events || [];
        setEvents(eventsData.length > 0 ? eventsData : DEMO_EVENTS);
      } else {
        setEvents(DEMO_EVENTS);
      }

      if (results[2].status === 'fulfilled') {
        setAnalytics(results[2].value);
      } else {
        setAnalytics(DEMO_ANALYTICS);
      }

      try {
        const forecastData = await getAdminForecast();
        setForecast(forecastData);
      } catch (e) { console.log('Forecast not available'); }

      if (showToast) toast.success('Dashboard refreshed');
    } catch (error) {
      console.error('Admin dashboard error:', error);
      setDashboard(DEMO_DASHBOARD);
      setEvents(DEMO_EVENTS);
      setAnalytics(DEMO_ANALYTICS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => fetchData(false), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCheckTriggers = async () => {
    setCheckingTriggers(true);
    try {
      const result = await checkTriggers();
      toast.success(`Triggers checked! ${result.events_created || 0} new events detected.`);
      fetchData(false);
    } catch (error) {
      toast.error('Trigger check failed (backend may be offline)');
    } finally {
      setCheckingTriggers(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading admin dashboard..." />;

  const stats = dashboard?.stats || DEMO_DASHBOARD.stats;
  const recentClaims = dashboard?.recent_claims || DEMO_DASHBOARD.recent_claims;
  const fraudAlerts = dashboard?.fraud_alerts || DEMO_DASHBOARD.fraud_alerts;
  const claimsByType = analytics?.claims_by_type || DEMO_ANALYTICS.claims_by_type;
  const weeklyPayouts = analytics?.weekly_payouts || DEMO_ANALYTICS.weekly_payouts;
  const activeEvents = events.filter(e => e.status === 'active');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">Platform overview and event management</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <HiRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleCheckTriggers}
            disabled={checkingTriggers}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <HiLightningBolt className={`w-4 h-4 ${checkingTriggers ? 'animate-pulse' : ''}`} />
            Check Triggers
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatsCard icon={HiUsers} label="Total Workers" value={stats.total_workers?.toLocaleString('en-IN') || '0'} color="primary" />
        <StatsCard icon={HiShieldCheck} label="Active Policies" value={stats.active_policies?.toLocaleString('en-IN') || '0'} color="accent" />
        <StatsCard icon={HiClipboardList} label="Total Claims" value={stats.total_claims?.toLocaleString('en-IN') || '0'} color="blue" />
        <StatsCard icon={HiCurrencyRupee} label="Total Payouts" value={`\u20B9${(stats.total_payouts || 0).toLocaleString('en-IN')}`} color="amber" />
        <StatsCard icon={HiTrendingUp} label="Loss Ratio" value={`${((stats.loss_ratio || 0) * 100).toFixed(1)}%`} color={stats.loss_ratio > 0.7 ? 'red' : 'accent'} />
        <StatsCard icon={HiExclamation} label="Fraud Rate" value={`${((stats.fraud_rate || 0) * 100).toFixed(1)}%`} color={stats.fraud_rate > 0.05 ? 'red' : 'accent'} />
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link to="/admin/simulate" className="btn-primary flex items-center gap-2 text-sm">
          <HiBeaker className="w-4 h-4" />
          Simulate Disruption
        </Link>
        <Link to="/admin/claims" className="btn-outline flex items-center gap-2 text-sm">
          <HiClipboardList className="w-4 h-4" />
          Manage Claims
        </Link>
      </div>

      {/* Active Events Alert */}
      {activeEvents.length > 0 && (
        <div className="card border border-amber-500/30 bg-amber-500/5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <HiExclamation className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-amber-400">
              {activeEvents.length} Active Disruption{activeEvents.length > 1 ? 's' : ''}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeEvents.map((event, i) => (
              <div key={event.id || i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white capitalize">{(event.disruption_type || '').replace(/_/g, ' ')}</span>
                  <RiskBadge level={event.severity || 'medium'} />
                </div>
                <p className="text-xs text-slate-400">{event.zone}</p>
                <p className="text-xs text-slate-500 mt-1">{event.workers_affected || 0} workers affected</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid - Charts + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left side - Charts (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Claims by Type Chart */}
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Claims by Type</h3>
              <ClaimsByTypeChart data={claimsByType} />
            </div>

            {/* Weekly Payouts Chart */}
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Weekly Payouts</h3>
              <WeeklyPayoutsChart data={weeklyPayouts} />
            </div>
          </div>
        </div>

        {/* Right side - Live Feed (1 col) */}
        <div>
          <LiveFeed maxEvents={25} showWeatherUpdates />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Claims Table - 2 cols */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Claims</h3>
            <Link to="/admin/claims" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View All <HiArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Worker</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Zone</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">Type</th>
                  <th className="text-right py-2 px-3 text-slate-500 font-medium">Amount</th>
                  <th className="text-center py-2 px-3 text-slate-500 font-medium">Fraud</th>
                  <th className="text-center py-2 px-3 text-slate-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentClaims.map((claim, i) => {
                  const score = claim.fraud_score || 0;
                  const status = statusConfig[(claim.status || 'pending').toLowerCase()] || statusConfig.pending;
                  return (
                    <tr key={claim.id || i} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                      <td className="py-2.5 px-3 text-white">{claim.worker_name || claim.worker_id || '--'}</td>
                      <td className="py-2.5 px-3 text-slate-400">{claim.zone || '--'}</td>
                      <td className="py-2.5 px-3 text-slate-300 capitalize">{(claim.disruption_type || '').replace(/_/g, ' ')}</td>
                      <td className="py-2.5 px-3 text-right text-white font-medium">{`\u20B9${(claim.payout_amount || 0).toLocaleString('en-IN')}`}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          score > 0.75 ? 'bg-red-500/15 text-red-400' :
                          score > 0.3 ? 'bg-amber-500/15 text-amber-400' :
                          'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          {(score * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          {(claim.status || 'pending').charAt(0).toUpperCase() + (claim.status || 'pending').slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fraud Alerts - 1 col */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <HiExclamation className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-white">Fraud Alerts</h3>
          </div>

          {fraudAlerts && fraudAlerts.length > 0 ? (
            <div className="space-y-3">
              {fraudAlerts.map((alert, i) => (
                <div key={alert.id || i} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{alert.worker_name || alert.worker_id}</span>
                    <span className="text-xs font-bold text-red-400">{((alert.fraud_score || 0) * 100).toFixed(0)}% risk</span>
                  </div>
                  <p className="text-xs text-slate-400">{alert.zone} | {(alert.disruption_type || '').replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-500 mt-1">{`\u20B9${(alert.payout_amount || 0).toLocaleString('en-IN')}`} payout</p>
                  {alert.indicators && alert.indicators.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {alert.indicators.map((ind, j) => (
                        <span key={j} className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">{ind}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No fraud alerts at this time.</p>
          )}

          <Link to="/admin/claims" className="block text-center text-sm text-primary-400 hover:text-primary-300 mt-4">
            Review All Claims
          </Link>
        </div>
      </div>

      {/* Predictive Forecast */}
      <div className="mt-6 bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">7-Day Disruption Forecast</h3>
        <ForecastChart data={forecast?.zones?.[0]?.daily_forecast?.map((d, i) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] || `Day ${i+1}`,
          risk: d.risk_score || Math.floor(Math.random() * 60) + 20,
          rain_prob: d.rain_probability || Math.floor(Math.random() * 80) + 10,
        })) || []} />
        {forecast && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Average Risk: {forecast.average_risk_score?.toFixed(1)}/100</span>
            <span>{forecast.zones?.length || 0} zones monitored</span>
          </div>
        )}
      </div>

      {/* Disruption Timeline */}
      <div className="mt-6 card">
        <h3 className="font-semibold text-white mb-4">Disruption Event Timeline</h3>
        <DisruptionTimeline events={events.slice(0, 10)} />
      </div>
    </div>
  );
};

export default AdminDashboard;
