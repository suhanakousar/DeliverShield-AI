import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineCheck, HiOutlineX, HiOutlineCurrencyRupee, HiOutlineShieldCheck } from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { getPlans, getActivePlan, subscribePlan, getWorker } from '../services/api';
import PolicyCard from '../components/PolicyCard';
import LoadingSpinner from '../components/LoadingSpinner';

const PLAN_DETAILS = [
  {
    plan_type: 'basic',
    name: 'Basic Shield',
    weekly_premium: 39,
    max_payout: 500,
    max_events: 2,
    features: ['Weather disruption coverage', 'Up to 2 events/week', 'Max ₹500 payout'],
    popular: false,
  },
  {
    plan_type: 'standard',
    name: 'Standard Shield',
    weekly_premium: 59,
    max_payout: 800,
    max_events: 3,
    features: ['All Basic features', 'Up to 3 events/week', 'Instant payouts via UPI', 'Trust score benefits'],
    popular: true,
  },
  {
    plan_type: 'premium',
    name: 'Premium Shield',
    weekly_premium: 79,
    max_payout: 1200,
    max_events: -1,
    features: ['Unlimited events', 'Max ₹1,200 payout', 'Priority payouts', 'Multi-zone coverage'],
    popular: false,
  },
];

const PaymentModal = ({ plan, onSuccess, onCancel }) => {
  const [step, setStep] = useState('review'); 
  const [upiId, setUpiId] = useState('');

  const handlePay = async () => {
    if (!upiId.trim()) { toast.error('Enter UPI ID'); return; }
    setStep('processing');
    await new Promise(r => setTimeout(r, 2000));
    setStep('success');
    await new Promise(r => setTimeout(r, 1000));
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-base-900 border border-base-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-base-800 flex justify-between items-center bg-base-950/50">
          <h3 className="font-bold text-lg text-base-100">Checkout</h3>
          <button onClick={onCancel} className="text-base-500 hover:text-base-300">
            <HiOutlineX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 'review' && (
            <>
              <div className="bg-base-950 rounded-2xl p-5 border border-base-800">
                <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-2">Selected Plan</p>
                <p className="text-xl font-bold text-base-100 mb-4">{plan.name}</p>
                <div className="flex justify-between items-center pt-4 border-t border-base-800">
                  <span className="font-medium text-base-400">Total Due</span>
                  <span className="text-2xl font-bold text-primary-500">₹{plan.weekly_premium}</span>
                </div>
              </div>

              <div>
                <label className="label">Enter UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="name@upi"
                  className="input-field"
                  autoFocus
                />
              </div>

              <button onClick={handlePay} className="btn-primary w-full gap-2">
                <HiOutlineCurrencyRupee className="w-5 h-5" /> Pay Now
              </button>
            </>
          )}

          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center">
              <LoadingSpinner size="lg" text="Processing Payment" />
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-success-500/20 text-success-500 rounded-full flex items-center justify-center mb-6">
                <HiOutlineCheck className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-base-100 mb-2">Payment Successful</h3>
              <p className="text-base-400">Activating your coverage...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const PoliciesPage = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState(PLAN_DETAILS);
  const [activePolicy, setActivePolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentPlan, setPaymentPlan] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([getPlans(), getActivePlan(workerId)]);
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
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubscribe = async () => {
    try {
      const result = await subscribePlan({ worker_id: workerId, plan_type: paymentPlan.plan_type });
      toast.success('Shield activated! You are now covered.');
      setActivePolicy(result.policy || result);
      setPaymentPlan(null);
      fetchData();
    } catch (error) {
      setPaymentPlan(null);
      toast.error(error?.response?.data?.detail || 'Could not activate plan. Please try again.');
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading plans" />;

  const hasPlan = activePolicy?.status === 'active' || activePolicy?.is_active;

  return (
    <div className="pb-12 space-y-12">
      <AnimatePresence>
        {paymentPlan && (
          <PaymentModal
            plan={paymentPlan}
            onSuccess={handleSubscribe}
            onCancel={() => setPaymentPlan(null)}
          />
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tighter text-base-100 mb-2">
          Coverage Plans
        </h1>
        <p className="text-base-400 font-medium">Protect your income from weather disruptions.</p>
      </div>

      {hasPlan && (
        <section>
          <h2 className="text-xs font-bold text-base-500 uppercase tracking-wider mb-4">Current Policy</h2>
          <PolicyCard policy={activePolicy} />
        </section>
      )}

      <section>
        <h2 className="text-xs font-bold text-base-500 uppercase tracking-wider mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, i) => {
            const isCurrent = hasPlan && (activePolicy?.plan_type || '').toLowerCase() === plan.plan_type;

            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`card p-8 flex flex-col h-full ${plan.popular ? 'border-primary-500/50 bg-primary-900/10' : 'border-base-800'}`}
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-bold font-sans tracking-tight text-base-100 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-base-100">₹{plan.weekly_premium}</span>
                    <span className="text-base-500 font-medium">/wk</span>
                  </div>
                </div>

                <div className="space-y-4 flex-1 mb-8">
                  <div className="flex justify-between items-center border-b border-base-800/50 pb-2">
                    <span className="text-sm font-medium text-base-400">Max Payout</span>
                    <span className="font-bold text-base-200">₹{plan.max_payout}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-base-800/50 pb-2">
                    <span className="text-sm font-medium text-base-400">Events Covered</span>
                    <span className="font-bold text-base-200">{plan.max_events === -1 ? 'Unlimited' : plan.max_events}</span>
                  </div>
                  {plan.features.slice(2).map((f, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <HiOutlineCheck className="w-5 h-5 text-success-500 shrink-0" />
                      <span className="text-sm font-medium text-base-300">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setPaymentPlan(plan)}
                  disabled={isCurrent}
                  className={`w-full py-4 rounded-xl font-bold transition-colors ${
                    isCurrent ? 'bg-base-800 text-base-500 cursor-not-allowed' 
                    : plan.popular ? 'bg-primary-500 hover:bg-primary-400 text-base-950 shadow-lg shadow-primary-500/20' 
                    : 'bg-base-800 hover:bg-base-700 text-base-100'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : 'Select Plan'}
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default PoliciesPage;
