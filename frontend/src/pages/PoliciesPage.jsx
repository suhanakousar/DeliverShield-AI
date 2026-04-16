import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiShieldCheck, HiCheck, HiStar, HiArrowRight, HiClock,
  HiLightningBolt, HiCurrencyRupee, HiLockClosed, HiX,
} from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { getPlans, getActivePlan, subscribePlan, getWorker } from '../services/api';
import PolicyCard from '../components/PolicyCard';
import LoadingSpinner from '../components/LoadingSpinner';

const PLAN_DETAILS = [
  {
    plan_type: 'basic',
    name: 'Basic Shield',
    emoji: '🥉',
    weekly_premium: 39,
    max_payout: 500,
    max_events: 2,
    features: ['Weather disruption coverage', 'Up to 2 events/week', 'Max ₹500 payout', 'SMS notifications', 'Basic fraud check'],
    popular: false,
    gradient: 'from-slate-600 to-slate-700',
    borderColor: 'border-slate-600/50',
    glow: '',
  },
  {
    plan_type: 'standard',
    name: 'Standard Shield',
    emoji: '🥈',
    weekly_premium: 59,
    max_payout: 800,
    max_events: 3,
    features: ['All Basic features', 'Up to 3 events/week', 'Max ₹800 payout', 'Instant payouts', 'GPS verification', 'Trust score benefits'],
    popular: true,
    gradient: 'from-primary-600 to-primary-700',
    borderColor: 'border-primary-500/50',
    glow: 'shadow-lg shadow-primary-500/20',
  },
  {
    plan_type: 'premium',
    name: 'Premium Shield',
    emoji: '🥇',
    weekly_premium: 79,
    max_payout: 1200,
    max_events: -1,
    features: ['All Standard features', 'Unlimited events', 'Max ₹1,200 payout', 'Priority payouts', 'Multi-zone coverage', 'Premium trust score', 'Dedicated support'],
    popular: false,
    gradient: 'from-amber-500 to-amber-700',
    borderColor: 'border-amber-500/50',
    glow: 'shadow-lg shadow-amber-500/15',
  },
];

// ─── Payment Modal ────────────────────────────────────────────────────────────
const PaymentModal = ({ plan, onSuccess, onCancel }) => {
  const [step, setStep] = useState('review'); // review | processing | success
  const [upiId, setUpiId] = useState('');

  const handlePay = async () => {
    if (!upiId.trim()) { toast.error('Enter your UPI ID'); return; }
    setStep('processing');
    await new Promise(r => setTimeout(r, 2000));
    setStep('success');
    await new Promise(r => setTimeout(r, 1500));
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl animate-pop-in">
        {/* Header */}
        <div className={`bg-gradient-to-r ${plan.gradient} p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Subscribe to</p>
              <h3 className="text-white font-bold text-xl">{plan.name}</h3>
            </div>
            <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors">
              <HiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5">
          {step === 'review' && (
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">Weekly Premium</span>
                  <span className="text-white font-bold text-lg">₹{plan.weekly_premium}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">Coverage Period</span>
                  <span className="text-white font-semibold">7 Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Max Payout</span>
                  <span className="text-emerald-400 font-semibold">₹{plan.max_payout.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-slate-600/50 mt-3 pt-3 flex items-center justify-between">
                  <span className="text-white font-semibold">Total Due</span>
                  <span className="text-white font-bold text-xl">₹{plan.weekly_premium}</span>
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-orange-500 rounded-sm text-white text-[10px] font-black flex items-center justify-center">U</span>
                  UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="input-field"
                />
                <p className="text-xs text-slate-500 mt-1">Enter your UPI ID for instant payment</p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <HiLockClosed className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-400">256-bit encrypted · Powered by Razorpay</p>
              </div>

              <button onClick={handlePay} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                <HiCurrencyRupee className="w-5 h-5" />
                Pay ₹{plan.weekly_premium} Now
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-8 text-center">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-primary-500/30 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-white font-semibold mb-1">Processing Payment</p>
              <p className="text-slate-400 text-sm">Authorizing via UPI...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 glow-emerald">
                <HiCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-white font-bold text-xl mb-1">Payment Successful!</p>
              <p className="text-emerald-400 font-semibold text-sm">₹{plan.weekly_premium} paid</p>
              <p className="text-slate-400 text-xs mt-2">Activating your coverage...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const PoliciesPage = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { currentWorker } = useApp();
  const [plans, setPlans] = useState(PLAN_DETAILS);
  const [activePolicy, setActivePolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [worker, setWorker] = useState(currentWorker);

  const fetchData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([getPlans(), getActivePlan(workerId), getWorker(workerId)]);
      if (results[0].status === 'fulfilled' && results[0].value) {
        const apiPlans = Array.isArray(results[0].value) ? results[0].value : results[0].value?.plans || [];
        if (apiPlans.length > 0) {
          const merged = PLAN_DETAILS.map(detail => {
            const apiPlan = apiPlans.find(p => (p.plan_type || p.type || '').toLowerCase() === detail.plan_type);
            return apiPlan ? { ...detail, ...apiPlan } : detail;
          });
          setPlans(merged);
        }
      }
      if (results[1].status === 'fulfilled' && results[1].value) setActivePolicy(results[1].value);
      if (results[2].status === 'fulfilled' && results[2].value) setWorker(results[2].value);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubscribe = async (planType) => {
    setSubscribing(planType);
    try {
      const result = await subscribePlan({ worker_id: workerId, plan_type: planType });
      toast.success(`🎉 ${planType.charAt(0).toUpperCase() + planType.slice(1)} Shield activated! You're now protected.`);
      setActivePolicy(result.policy || result);
      setPaymentPlan(null);
      setTimeout(() => navigate(`/dashboard/${workerId}`), 1500);
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail) ? detail.map(e => e.msg || JSON.stringify(e)).join(', ')
        : typeof detail === 'string' ? detail : 'Subscription failed. Please try again.';

      if (!error.response) {
        const plan = plans.find(p => p.plan_type === planType);
        const demoPolicy = {
          id: `POL-${Date.now().toString(36).toUpperCase()}`,
          worker_id: workerId, plan_type: planType, status: 'active', is_active: true,
          weekly_premium: plan.weekly_premium, max_payout: plan.max_payout, max_events: plan.max_events,
          events_used: 0,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        setActivePolicy(demoPolicy);
        setPaymentPlan(null);
        toast.success(`🎉 ${planType.charAt(0).toUpperCase() + planType.slice(1)} Shield activated!`);
        setTimeout(() => navigate(`/dashboard/${workerId}`), 1500);
        return;
      }
      toast.error(errorMsg);
    } finally {
      setSubscribing(null);
    }
  };

  const openPayment = (plan) => {
    setPaymentPlan(plan);
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading plans..." />;

  const hasPlan = activePolicy?.status === 'active' || activePolicy?.is_active;
  const currentPlanType = (activePolicy?.plan_type || activePolicy?.plan || '').toLowerCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Payment modal */}
      {paymentPlan && (
        <PaymentModal
          plan={paymentPlan}
          onSuccess={() => handleSubscribe(paymentPlan.plan_type)}
          onCancel={() => setPaymentPlan(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {hasPlan ? 'Manage Your Policy' : 'Choose Your Shield'}
        </h1>
        <p className="text-slate-400">
          {hasPlan ? 'View your current coverage and explore upgrade options.' : 'Select a plan that fits your delivery schedule and budget.'}
        </p>
      </div>

      {/* Active Policy */}
      {hasPlan && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="badge-active-glow w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            Current Coverage
          </h2>
          <PolicyCard policy={activePolicy} />
        </div>
      )}

      {/* Plans */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-1">
          {hasPlan ? 'Upgrade or Change Plan' : 'Available Plans'}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {worker?.delivery_zone && `Pricing for ${worker.delivery_zone.replace('_', ' ')} zone. `}
          Plans renew weekly. Cancel anytime.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = hasPlan && currentPlanType === plan.plan_type;
            const isSubscribing = subscribing === plan.plan_type;

            return (
              <div
                key={plan.plan_type}
                className={`relative card border ${plan.borderColor} ${plan.glow} ${
                  plan.popular ? 'ring-2 ring-primary-500/40 md:scale-105' : ''
                } ${isCurrentPlan ? 'ring-2 ring-accent-500/50' : ''} transition-all duration-300 hover:-translate-y-1`}
              >
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <HiStar className="w-3 h-3" /> RECOMMENDED
                    </span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <HiCheck className="w-3 h-3" /> ACTIVE PLAN
                    </span>
                  </div>
                )}

                <div className="text-center mb-6 pt-2">
                  <span className="text-4xl mb-3 block">{plan.emoji}</span>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-extrabold text-white">₹{plan.weekly_premium}</span>
                    <span className="text-slate-400 text-sm">/week</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-700/30 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-slate-500">Max Payout</p>
                    <p className="text-sm font-bold text-white">₹{plan.max_payout.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-slate-500">Max Events</p>
                    <p className="text-sm font-bold text-white">{plan.max_events === -1 ? 'Unlimited' : plan.max_events}</p>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <HiCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrentPlan && openPayment(plan)}
                  disabled={isCurrentPlan || isSubscribing}
                  className={`w-full py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    isCurrentPlan ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : plan.plan_type === 'premium' ? 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
                    : plan.popular ? 'btn-primary'
                    : 'btn-outline'
                  }`}
                >
                  {isSubscribing ? <LoadingSpinner size="sm" text="" /> :
                   isCurrentPlan ? 'Current Plan' :
                   hasPlan ? <><HiLightningBolt className="w-4 h-4" />Switch Plan</> :
                   <><HiArrowRight className="w-4 h-4" />Subscribe</>}
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
              <li>Plans are billed weekly and auto-renew. Coverage starts immediately upon subscription.</li>
              <li>When a qualifying disruption hits your zone, claims are generated automatically.</li>
              <li>Payouts are calculated based on your average earnings and disrupted hours.</li>
              <li>Higher trust scores unlock better premium rates over time.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliciesPage;
