import React from 'react';
import { Link } from 'react-router-dom';
import { HiShieldCheck, HiLightningBolt, HiCurrencyRupee, HiEye, HiArrowRight, HiCheck, HiStar } from 'react-icons/hi';
import { useApp } from '../context/AppContext';

const plans = [
  {
    name: 'Basic Shield',
    emoji: '\uD83E\uDD49',
    price: 39,
    maxPayout: 500,
    maxEvents: 2,
    features: ['Weather disruption coverage', 'Up to 2 events/week', 'Max \u20B9500 payout', 'SMS notifications', 'Basic fraud check'],
    popular: false,
    color: 'from-slate-500 to-slate-600',
    borderColor: 'border-slate-600/50',
    buttonClass: 'btn-outline',
  },
  {
    name: 'Standard Shield',
    emoji: '\uD83E\uDD48',
    price: 59,
    maxPayout: 800,
    maxEvents: 3,
    features: ['All Basic features', 'Up to 3 events/week', 'Max \u20B9800 payout', 'Instant payouts', 'GPS verification', 'Trust score benefits'],
    popular: true,
    color: 'from-primary-500 to-primary-700',
    borderColor: 'border-primary-500/50',
    buttonClass: 'btn-primary',
  },
  {
    name: 'Premium Shield',
    emoji: '\uD83E\uDD47',
    price: 79,
    maxPayout: 1200,
    maxEvents: -1,
    features: ['All Standard features', 'Unlimited events', 'Max \u20B91,200 payout', 'Priority payouts', 'Multi-zone coverage', 'Premium trust score', 'Dedicated support'],
    popular: false,
    color: 'from-amber-500 to-amber-700',
    borderColor: 'border-amber-500/50',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 active:scale-95',
  },
];

const features = [
  {
    icon: HiEye,
    title: 'Automatic Detection',
    description: 'AI monitors weather, traffic, and disruptions in real-time across all delivery zones in Hyderabad.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
  },
  {
    icon: HiLightningBolt,
    title: 'Instant Payouts',
    description: 'Claims processed in under 60 seconds. No paperwork, no waiting. Money hits your account automatically.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
  },
  {
    icon: HiCurrencyRupee,
    title: 'Smart Pricing',
    description: 'Premiums adjusted by zone risk and trust score. Good delivery partners pay less over time.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
  },
  {
    icon: HiShieldCheck,
    title: 'Fraud Protection',
    description: 'Multi-layer AI fraud detection with GPS verification, pattern analysis, and trust scoring.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
  },
];

const steps = [
  { number: '01', title: 'Subscribe', description: 'Pick a plan starting at just \u20B939/week. Register in 2 minutes with your Swiggy/Zomato partner ID.', color: 'text-primary-400' },
  { number: '02', title: 'Disruption Detected', description: 'Our AI monitors weather and events 24/7. When heavy rain, floods, or extreme heat hits your zone, we know instantly.', color: 'text-amber-400' },
  { number: '03', title: 'Get Paid', description: 'Payouts calculated automatically based on your lost income. Money sent directly to your account. Zero paperwork.', color: 'text-emerald-400' },
];

const LandingPage = () => {
  const { currentWorker } = useApp();
  const workerId = currentWorker?.worker_id || currentWorker?.id;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-primary-900/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-6 animate-fade-in">
              <HiShieldCheck className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-300 font-medium">AI-Powered Parametric Insurance</span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 animate-fade-in leading-tight">
              <span className="text-white">Income Protection for</span>
              <br />
              <span className="gradient-text">Delivery Partners</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-2xl mx-auto animate-fade-in leading-relaxed">
              AI-powered parametric insurance that pays automatically when disruptions hit.
              No claims to file. No paperwork. Just protection when you need it most.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in">
              {workerId ? (
                <Link to={`/dashboard/${workerId}`} className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
                  Go to Dashboard
                  <HiArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2 shadow-lg shadow-primary-500/25">
                  Get Started Free
                  <HiArrowRight className="w-5 h-5" />
                </Link>
              )}
              <Link to="/admin" className="btn-outline text-lg px-8 py-3">
                Admin Dashboard
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto animate-fade-in">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{`\u20B959`}</p>
                <p className="text-xs sm:text-sm text-slate-500">per week</p>
              </div>
              <div className="text-center border-x border-slate-700">
                <p className="text-2xl sm:text-3xl font-bold text-white">&lt;60s</p>
                <p className="text-xs sm:text-sm text-slate-500">payout time</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">Zero</p>
                <p className="text-xs sm:text-sm text-slate-500">paperwork</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why DeliverShield<span className="text-primary-400">?</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Built specifically for Swiggy and Zomato delivery partners in Hyderabad.
              Smart, fast, and fair.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card-hover group">
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Three simple steps to protect your income. No complex forms, no lengthy processes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center group">
                {/* Connector line (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-slate-700 to-slate-800" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-2xl border border-slate-700 mb-5 group-hover:border-primary-500/50 transition-colors">
                  <span className={`text-2xl font-bold ${step.color}`}>{step.number}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Choose Your Shield
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Affordable plans designed for delivery partners earning ~{`\u20B9800/day`}.
              Start protecting your income today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative card border ${plan.borderColor} ${
                  plan.popular ? 'ring-2 ring-primary-500/50 scale-105 md:scale-110' : ''
                } transition-all duration-300 hover:-translate-y-1`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <HiStar className="w-3 h-3" /> RECOMMENDED
                    </span>
                  </div>
                )}

                <div className="text-center mb-6 pt-2">
                  <span className="text-4xl mb-2 block">{plan.emoji}</span>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-extrabold text-white">{`\u20B9${plan.price}`}</span>
                    <span className="text-slate-400 text-sm">/week</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Max payout: {`\u20B9${plan.maxPayout.toLocaleString('en-IN')}`}/week
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <HiCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`${plan.buttonClass} w-full block text-center`}
                >
                  Get {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="card border border-primary-500/20 bg-gradient-to-br from-slate-800 to-primary-900/20 p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Protect Your Income?
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
              Join hundreds of delivery partners in Hyderabad who never worry about lost income during disruptions.
            </p>
            <Link
              to="/register"
              className="btn-primary text-lg px-10 py-3 inline-flex items-center gap-2 shadow-lg shadow-primary-500/25"
            >
              Start Now — {`\u20B939/week`}
              <HiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <HiShieldCheck className="w-5 h-5 text-primary-400" />
              <span className="font-bold text-white">DeliverShield AI</span>
            </div>
            <p className="text-sm text-slate-500">
              AI-Powered Parametric Insurance for Delivery Partners
            </p>
            <p className="text-xs text-slate-600">
              Built for Hyderabad delivery ecosystem
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
