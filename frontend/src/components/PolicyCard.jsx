import React from 'react';
import { format } from 'date-fns';

const tierIcons = {
  basic: { emoji: '\uD83E\uDD49', label: 'Basic Shield' },
  standard: { emoji: '\uD83E\uDD48', label: 'Standard Shield' },
  premium: { emoji: '\uD83E\uDD47', label: 'Premium Shield' },
};

const PolicyCard = ({ policy, compact = false }) => {
  if (!policy) return null;

  const planType = (policy.plan_type || policy.plan || 'basic').toLowerCase();
  const tier = tierIcons[planType] || tierIcons.basic;
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
      <div className={`card border ${isActive ? 'border-primary-500/30' : 'border-slate-700/50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{tier.emoji}</span>
            <div>
              <p className="font-semibold text-white">{tier.label}</p>
              <p className="text-xs text-slate-400">
                {premium ? `\u20B9${premium}/week` : ''}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isActive
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-600/30 text-slate-400 border border-slate-600/30'
          }`}>
            {isActive ? 'Active' : 'Expired'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`card border ${isActive ? 'border-primary-500/30' : 'border-slate-700/50'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{tier.emoji}</span>
          <div>
            <h3 className="text-lg font-bold text-white">{tier.label}</h3>
            <p className="text-sm text-primary-400 font-medium">
              {premium ? `\u20B9${premium}/week` : ''}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          isActive
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'bg-slate-600/30 text-slate-400 border border-slate-600/30'
        }`}>
          {isActive ? 'Active' : 'Expired'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-700/30 rounded-lg p-3">
          <p className="text-xs text-slate-500">Max Payout</p>
          <p className="text-lg font-bold text-white">{maxPayout ? `\u20B9${maxPayout}` : '--'}</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-3">
          <p className="text-xs text-slate-500">Max Events</p>
          <p className="text-lg font-bold text-white">{maxEvents || '--'}</p>
        </div>
      </div>

      {/* Coverage period */}
      {startDate && endDate && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-1">Coverage Period</p>
          <p className="text-sm text-slate-300">
            {format(new Date(startDate), 'dd MMM yyyy')} &rarr; {format(new Date(endDate), 'dd MMM yyyy')}
          </p>
        </div>
      )}

      {/* Events progress */}
      {maxEvents !== 'Unlimited' && policy.max_events > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Events Used</span>
            <span className="text-slate-300 font-medium">{eventsUsed} / {maxEvents}</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(eventsProgress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Payout utilization */}
      {maxPayout > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Payout Used</span>
            <span className="text-slate-300 font-medium">{`\u20B9${payoutUsed}`} / {`\u20B9${maxPayout}`}</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                payoutProgress > 80 ? 'bg-red-500' : payoutProgress > 50 ? 'bg-amber-500' : 'bg-accent-500'
              }`}
              style={{ width: `${Math.min(payoutProgress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyCard;
