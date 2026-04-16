import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUsers, HiOutlineShieldCheck, HiOutlineCurrencyRupee, HiOutlineExclamationCircle, HiOutlineTrendingUp, HiOutlineLightningBolt } from 'react-icons/hi';
import { getAdminDashboard, getAdminEvents, getAdminAnalytics, checkTriggers } from '../services/api';
import StatsCard from '../components/StatsCard';
import { ClaimsByTypeChart, WeeklyPayoutsChart } from '../components/Charts';
import DisruptionTimeline from '../components/DisruptionTimeline';
import LoadingSpinner from '../components/LoadingSpinner';
import LiveFeed from '../components/LiveFeed';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [data, setData] = useState({ dashboard: null, events: [], analytics: null });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([getAdminDashboard(), getAdminEvents(), getAdminAnalytics()]);
      setData({
        dashboard: results[0].status === 'fulfilled' ? results[0].value : null,
        events: results[1].status === 'fulfilled'
          ? (Array.isArray(results[1].value) ? results[1].value : results[1].value?.events || [])
          : [],
        analytics: results[2].status === 'fulfilled' ? results[2].value : null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCheck = async () => {
    setChecking(true);
    try {
      await checkTriggers();
      toast.success('Trigger check completed — events processed');
      fetchData();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Trigger check failed');
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading Platform Data" />;

  const db = data.dashboard || {};
  const analytics = data.analytics || {};

  const totalPayouts = db.total_payout_amount ?? 0;
  const totalClaims  = db.total_claims ?? 0;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tighter text-base-100 mb-2">Platform Overview</h1>
          <p className="text-base-400 font-medium">Real-time metrics and disruption monitoring.</p>
        </div>
        <button onClick={handleCheck} disabled={checking} className="btn-secondary whitespace-nowrap gap-2">
          <HiOutlineLightningBolt className={`w-5 h-5 ${checking ? 'animate-pulse text-primary-500' : ''}`} />
          {checking ? 'Running Check...' : 'Force Trigger Check'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard icon={HiOutlineUsers}           label="Total Workers"    value={db.total_workers ?? 0}             color="primary" />
        <StatsCard icon={HiOutlineShieldCheck}     label="Active Policies"  value={db.active_policies ?? 0}           color="accent" />
        <StatsCard icon={HiOutlineCurrencyRupee}   label="Total Payouts"    value={`₹${(totalPayouts / 1000).toFixed(1)}k`} color="amber" />
        <StatsCard icon={HiOutlineTrendingUp}      label="Loss Ratio"       value={`${((db.loss_ratio ?? 0) * 100).toFixed(1)}%`} color={(db.loss_ratio ?? 0) > 0.7 ? 'red' : 'blue'} />
        <StatsCard icon={HiOutlineExclamationCircle} label="Fraud Rate"     value={`${((db.fraud_rate ?? 0) * 100).toFixed(1)}%`} color={(db.fraud_rate ?? 0) > 0.05 ? 'red' : 'purple'} />
        <StatsCard icon={HiOutlineCurrencyRupee}   label="Avg Payout"       value={`₹${Math.round(totalPayouts / (totalClaims || 1))}`} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-bold font-sans text-base-100 mb-6">Disruptions by Type</h3>
              <ClaimsByTypeChart data={analytics.claims_by_type} />
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-bold font-sans text-base-100 mb-6">Weekly Payout Volume</h3>
              <WeeklyPayoutsChart data={analytics.weekly_payouts} />
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold font-sans text-base-100 mb-6">Active Disruption Timeline</h3>
            <DisruptionTimeline events={data.events} />
          </div>
        </div>

        <div className="lg:col-span-1 h-[800px]">
          <LiveFeed maxEvents={30} showWeatherUpdates={true} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
