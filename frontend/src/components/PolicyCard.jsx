import React from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { HiShieldCheck, HiLightningBolt } from 'react-icons/hi';

const PolicyCard = ({ policy, compact = false }) => {
  if (!policy) return null;

  const planType = (policy.plan_type || policy.plan || 'basic').toLowerCase();
  
  const planStyles = {
    basic: { bg: 'bg-base-800', border: 'border-base-700', text: 'text-base-300', icon: 'text-base-400', label: 'Basic Shield' },
    standard: { bg: 'bg-primary-900/20', border: 'border-primary-500/30', text: 'text-primary-400', icon: 'text-primary-500', label: 'Standard Shield' },
    premium: { bg: 'bg-warning-900/20', border: 'border-warning-500/30', text: 'text-warning-400', icon: 'text-warning-500', label: 'Premium Shield' },
  };

  const style = planStyles[planType] || planStyles.basic;
  const isActive = policy.status === 'active' || policy.is_active;
  const premium = policy.weekly_premium || policy.premium;
  const maxPayout = policy.max_payout || policy.max_weekly_payout;
  const maxEvents = policy.max_events === -1 || policy.max_events === 'unlimited' ? 'Unlimited' : policy.max_events;
  const eventsUsed = policy.events_used || policy.claims_count || 0;
  const startDate = policy.start_date || policy.created_at;
  const endDate = policy.end_date || policy.expires_at;

  const eventsProgress = maxEvents === 'Unlimited' ? 0 : (eventsUsed / (policy.max_events || 1)) * 100;
  const payoutUsed = policy.total_payouts || 0;
  const payoutProgress = maxPayout ? (payoutUsed / maxPayout) * 100 : 0;

  if (compact) {
    return (
      <div className={`rounded-2xl p-4 border ${style.bg} ${style.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-base-950/50 border ${style.border}`}>
              <HiShieldCheck className={`w-6 h-6 ${style.icon}`} />
            </div>
            <div>
              <p className="font-bold text-base-100">{style.label}</p>
              <p className="text-sm font-medium text-base-400">
                {premium ? `₹${premium} / week` : ''}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isActive ? 'bg-success-500/20 text-success-400 border border-success-500/30' : 'bg-base-800 text-base-500 border border-base-700'
          }`}>
            {isActive ? 'Active' : 'Expired'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`card overflow-hidden border-2 ${isActive ? style.border : 'border-base-800 opacity-75'}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-base-950 border ${style.border}`}>
            <HiShieldCheck className={`w-8 h-8 ${style.icon}`} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-sans text-base-100">{style.label}</h3>
            <p className={`font-semibold mt-1 ${style.text}`}>
              {premium ? `₹${premium} weekly premium` : ''}
            </p>
          </div>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
          isActive ? 'bg-success-500 text-base-950' : 'bg-base-800 text-base-500'
        }`}>
          {isActive ? 'Currently Active' : 'Expired'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-base-950/50 rounded-xl p-4 border border-base-800">
          <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-1">Max Payout / Week</p>
          <p className="text-2xl font-bold text-base-100">{maxPayout ? `₹${maxPayout.toLocaleString('en-IN')}` : '--'}</p>
        </div>
        <div className="bg-base-950/50 rounded-xl p-4 border border-base-800">
          <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-1">Events Covered</p>
          <p className="text-2xl font-bold text-base-100">{maxEvents || '--'}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Events progress */}
        {maxEvents !== 'Unlimited' && policy.max_events > 0 && (
          <div>
            <div className="flex items-center justify-between text-sm font-semibold mb-2">
              <span className="text-base-400">Events Used</span>
              <span className="text-base-100">{eventsUsed} <span className="text-base-500">/ {maxEvents}</span></span>
            </div>
            <div className="w-full bg-base-800 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(eventsProgress, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-primary-500 h-full rounded-full"
              />
            </div>
          </div>
        )}

        {/* Payout progress */}
        {maxPayout > 0 && (
          <div>
            <div className="flex items-center justify-between text-sm font-semibold mb-2">
              <span className="text-base-400">Payout Used</span>
              <span className="text-base-100">₹{payoutUsed.toLocaleString('en-IN')} <span className="text-base-500">/ ₹{maxPayout.toLocaleString('en-IN')}</span></span>
            </div>
            <div className="w-full bg-base-800 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(payoutProgress, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${payoutProgress > 80 ? 'bg-danger-500' : payoutProgress > 50 ? 'bg-warning-500' : 'bg-success-500'}`}
              />
            </div>
          </div>
        )}
      </div>

      {startDate && endDate && (
        <div className="mt-8 pt-4 border-t border-base-800 flex items-center justify-between text-sm font-medium">
          <span className="text-base-500">Coverage Period</span>
          <span className="text-base-300">
            {format(new Date(startDate), 'MMM d, yyyy')} — {format(new Date(endDate), 'MMM d, yyyy')}
          </span>
        </div>
      )}
    </div>
  );
};

export default PolicyCard;
