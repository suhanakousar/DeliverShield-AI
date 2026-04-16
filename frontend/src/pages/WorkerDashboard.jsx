import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineShieldCheck, HiOutlineClock, HiOutlineCurrencyRupee, HiOutlineExclamationCircle,
  HiArrowRight, HiOutlineLightningBolt
} from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { getWorkerDashboard, getWeather, getClaims, getActivePlan } from '../services/api';
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
  earnings: { total_protected: 4800, total_payouts: 640 },
  recent_claims: [],
};

const WorkerDashboard = () => {
  const { workerId } = useParams();
  const { currentWorker, setCurrentWorker } = useApp();
  const [data, setData] = useState({ dashboard: null, weather: null, claims: [], policy: null });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const zone = currentWorker?.delivery_zone || 'kukatpally';
      const results = await Promise.allSettled([
        getWorkerDashboard(workerId),
        getWeather(zone),
        getClaims(workerId),
        getActivePlan(workerId),
      ]);

      setData({
        dashboard: results[0].status === 'fulfilled' ? results[0].value : DEMO_DASHBOARD,
        weather: results[1].status === 'fulfilled' ? results[1].value : null,
        claims: results[2].status === 'fulfilled' ? (Array.isArray(results[2].value) ? results[2].value : results[2].value?.claims || []) : [],
        policy: results[3].status === 'fulfilled' ? results[3].value : null,
      });
      
      if (results[0].status === 'fulfilled' && results[0].value?.worker) {
        setCurrentWorker(prev => ({ ...prev, ...results[0].value.worker }));
      }
    } catch (error) {
      setData(prev => ({ ...prev, dashboard: DEMO_DASHBOARD }));
    } finally {
      setLoading(false);
    }
  }, [workerId, currentWorker, setCurrentWorker]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <LoadingSpinner fullScreen text="Loading Dashboard" />;

  const { dashboard, weather, claims, policy } = data;
  const worker = dashboard?.worker || currentWorker || DEMO_DASHBOARD.worker;
  const risk = dashboard?.risk || DEMO_DASHBOARD.risk;
  const earnings = dashboard?.earnings || DEMO_DASHBOARD.earnings;
  const hasCoverage = dashboard?.coverage?.is_active || policy?.status === 'active';

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tighter text-base-100">
            Welcome, {worker.name}
          </h1>
          <p className="text-base-400 font-medium mt-1">Live monitoring active for {worker.delivery_zone || 'your zone'}.</p>
        </div>
        {!hasCoverage && (
          <Link to={`/policies/${workerId}`} className="btn-primary shrink-0 shadow-lg shadow-primary-500/20">
            Activate Coverage
          </Link>
        )}
      </div>

      {!hasCoverage && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card border-warning-500/50 bg-warning-900/10 flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
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

      {/* Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 min-h-[300px]">
          <WalletCard balance={worker.wallet_balance} totalPayouts={earnings.total_payouts} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <WeatherCard weather={weather} zone={worker.delivery_zone} />
          
          <div className="card flex flex-col justify-between p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-base-500 uppercase tracking-wider text-xs">Trust Score</h3>
              <span className="text-xs font-bold text-primary-400 bg-primary-500/10 px-2 py-1 rounded-md">Impacts Pricing</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <TrustScoreMeter score={worker.trust_score ?? 75} size="md" />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {hasCoverage && (policy || dashboard?.coverage) && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold font-sans tracking-tight text-base-100">Active Policy</h3>
                <Link to={`/policies/${workerId}`} className="text-sm font-bold text-primary-500 hover:text-primary-400">Manage Plan</Link>
              </div>
              <PolicyCard policy={policy || { ...dashboard.coverage, status: 'active' }} />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-sans tracking-tight text-base-100">Recent Claims</h3>
              <Link to={`/claims/${workerId}`} className="text-sm font-bold text-primary-500 hover:text-primary-400">View All</Link>
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
                message="We're monitoring your zone. If a disruption occurs, your claim will appear here automatically."
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-base-500 uppercase tracking-wider text-xs mb-6">Zone Risk Level</h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-6xl font-extrabold font-sans tracking-tighter text-base-100 leading-none">{risk.daily_risk_score}</span>
              <span className="text-base-500 font-bold mb-1">/ 100</span>
            </div>
            <p className="text-sm font-medium text-base-400 mb-6">Current calculated disruption risk</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-base-400">Disruption Probability</span>
                <span className="text-warning-400">{((risk.disruption_probability || 0) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-base-800 rounded-full overflow-hidden">
                <div className="h-full bg-warning-500 rounded-full" style={{ width: `${(risk.disruption_probability || 0) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="h-[300px]">
            <LiveFeed compact />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
