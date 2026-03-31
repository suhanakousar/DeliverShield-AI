import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiShieldCheck, HiCheck, HiStar, HiArrowRight, HiClock } from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { getPlans, getActivePlan, subscribePlan, getWorker } from '../services/api';
import PolicyCard from '../components/PolicyCard';
import LoadingSpinner from '../components/LoadingSpinner';

const PLAN_DETAILS = [
  {
    plan_type: 'basic',
    name: 'Basic Shield',
    emoji: '\uD83E\uDD49',
    weekly_premium: 39,
    max_payout: 500,
    max_events: 2,
    features: ['Weather disruption coverage', 'Up to 2 events/week', 'Max \u20B9500 payout', 'SMS notifications'],
    popular: false,
    gradient: 'from-slate-600 to-slate-700',
    borderColor: 'border-slate-600/50',
  },
  {
    plan_type: 'standard',
    name: 'Standard Shield',
    emoji: '\uD83E\uDD48',
    weekly_premium: 59,
    max_payout: 800,
    max_events: 3,
    features: ['All Basic features', 'Up to 3 events/week', 'Max \u20B9800 payout', 'Instant payouts', 'GPS verification', 'Trust score benefits'],
    popular: true,
    gradient: 'from-primary-600 to-primary-700',
    borderColor: 'border-primary-500/50',
  },
  {
    plan_type: 'premium',
    name: 'Premium Shield',
    emoji: '\uD83E\uDD47',
    weekly_premium: 79,
    max_payout: 1200,
    max_events: -1,
    features: ['All Standard features', 'Unlimited events', 'Max \u20B91,200 payout', 'Priority payouts', 'Multi-zone coverage', 'Premium trust score', 'Dedicated support'],
    popular: false,
    gradient: 'from-amber-600 to-amber-700',
    borderColor: 'border-amber-500/50',
  },
];

const PoliciesPage = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { currentWorker } = useApp();
  const [plans, setPlans] = useState(PLAN_DETAILS);
  const [activePolicy, setActivePolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [worker, setWorker] = useState(currentWorker);

  const fetchData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        getPlans(),
        getActivePlan(workerId),
        getWorker(workerId),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value) {
        const apiPlans = Array.isArray(results[0].value) ? results[0].value : results[0].value?.plans || [];
        if (apiPlans.length > 0) {
          // Merge API plans with our details
          const merged = PLAN_DETAILS.map(detail => {
            const apiPlan = apiPlans.find(p =>
              (p.plan_type || p.type || '').toLowerCase() === detail.plan_type
            );
            return apiPlan ? { ...detail, ...apiPlan } : detail;
          });
          setPlans(merged);
        }
      }

      if (results[1].status === 'fulfilled' && results[1].value) {
        setActivePolicy(results[1].value);
      }

      if (results[2].status === 'fulfilled' && results[2].value) {
        setWorker(results[2].value);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubscribe = async (planType) => {
    setSubscribing(planType);
    try {
      const data = {
        worker_id: workerId,
        plan_type: planType,
      };
      const result = await subscribePlan(data);
      toast.success(`Subscribed to ${planType.charAt(0).toUpperCase() + planType.slice(1)} Shield!`);
      setActivePolicy(result.policy || result);
      setTimeout(() => navigate(`/dashboard/${workerId}`), 1500);
    } catch (error) {
      console.error('Subscribe error:', error);
      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail)
        ? detail.map(e => e.msg || JSON.stringify(e)).join(', ')
        : (typeof detail === 'string' ? detail : 'Subscription failed. Please try again.');

      // Demo fallback
      if (!error.response) {
        const plan = plans.find(p => p.plan_type === planType);
        const demoPolicy = {
          id: `POL-${Date.now().toString(36).toUpperCase()}`,
          worker_id: workerId,
          plan_type: planType,
          status: 'active',
          is_active: true,
          weekly_premium: plan.weekly_premium,
          max_payout: plan.max_payout,
          max_events: plan.max_events,
          events_used: 0,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        setActivePolicy(demoPolicy);
        toast.success(`Subscribed to ${planType.charAt(0).toUpperCase() + planType.slice(1)} Shield! (Demo mode)`);
        setTimeout(() => navigate(`/dashboard/${workerId}`), 1500);
        return;
      }

      toast.error(errorMsg);
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading plans..." />;

  const hasPlan = activePolicy?.status === 'active' || activePolicy?.is_active;
  const currentPlanType = (activePolicy?.plan_type || activePolicy?.plan || '').toLowerCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {hasPlan ? 'Manage Your Policy' : 'Choose Your Shield'}
        </h1>
        <p className="text-slate-400">
          {hasPlan
            ? 'View your current coverage and explore upgrade options.'
            : 'Select a plan that fits your delivery schedule and budget.'
          }
        </p>
      </div>

      {/* Active Policy */}
      {hasPlan && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <HiShieldCheck className="w-5 h-5 text-accent-400" />
            Current Coverage
          </h2>
          <PolicyCard policy={activePolicy} />
        </div>
      )}

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-1">
          {hasPlan ? 'Upgrade or Change Plan' : 'Available Plans'}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {worker?.zone && `Pricing for ${worker.zone} zone. `}
          Plans renew weekly. Cancel anytime.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = hasPlan && currentPlanType === plan.plan_type;
            const isSubscribing = subscribing === plan.plan_type;

            return (
              <div
                key={plan.plan_type}
                className={`relative card border ${plan.borderColor} ${
                  plan.popular ? 'ring-2 ring-primary-500/40' : ''
                } ${isCurrentPlan ? 'ring-2 ring-accent-500/40' : ''} transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Labels */}
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <HiStar className="w-3 h-3" /> RECOMMENDED
                    </span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-accent-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <HiCheck className="w-3 h-3" /> CURRENT PLAN
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-6 pt-2">
                  <span className="text-4xl mb-3 block">{plan.emoji}</span>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-extrabold text-white">{`\u20B9${plan.weekly_premium}`}</span>
                    <span className="text-slate-400 text-sm">/week</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-700/30 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-slate-500">Max Payout</p>
                    <p className="text-sm font-bold text-white">{`\u20B9${plan.max_payout.toLocaleString('en-IN')}`}</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-slate-500">Max Events</p>
                    <p className="text-sm font-bold text-white">{plan.max_events === -1 ? 'Unlimited' : plan.max_events}</p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <HiCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Subscribe button */}
                <button
                  onClick={() => handleSubscribe(plan.plan_type)}
                  disabled={isCurrentPlan || isSubscribing}
                  className={`w-full py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : plan.popular
                      ? 'btn-primary'
                      : plan.plan_type === 'premium'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
                      : 'btn-outline'
                  }`}
                >
                  {isSubscribing ? (
                    <LoadingSpinner size="sm" text="" />
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : hasPlan ? (
                    <>Switch to {plan.name}</>
                  ) : (
                    <>Subscribe <HiArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info section */}
      <div className="card border border-slate-700/50 bg-slate-800/50">
        <div className="flex items-start gap-3">
          <HiClock className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-slate-300 mb-1">How Coverage Works</h4>
            <ul className="text-sm text-slate-500 space-y-1">
              <li>Plans are billed weekly and auto-renew.</li>
              <li>Coverage starts immediately upon subscription.</li>
              <li>When a qualifying disruption hits your zone, claims are generated automatically.</li>
              <li>Payouts are calculated based on your average earnings and disrupted hours.</li>
              <li>Higher trust scores can unlock better premium rates over time.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliciesPage;
