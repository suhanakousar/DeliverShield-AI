import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShieldCheck, HiOutlineLightningBolt, HiOutlineCurrencyRupee, HiOutlineEye, HiArrowRight, HiCheck, HiStar } from 'react-icons/hi';
import { useApp } from '../context/AppContext';

const plans = [
  {
    name: 'Basic Shield',
    price: 39,
    maxPayout: 500,
    features: ['Weather disruption coverage', 'Up to 2 events/week', 'Max ₹500 payout', 'SMS notifications'],
    popular: false,
  },
  {
    name: 'Standard Shield',
    price: 59,
    maxPayout: 800,
    features: ['All Basic features', 'Up to 3 events/week', 'Instant payouts via UPI', 'Trust score benefits'],
    popular: true,
  },
  {
    name: 'Premium Shield',
    price: 79,
    maxPayout: 1200,
    features: ['Unlimited events', 'Max ₹1,200 payout', 'Priority 60s payouts', 'Multi-zone coverage'],
    popular: false,
  },
];

const features = [
  {
    icon: HiOutlineEye,
    title: 'AI Weather Detection',
    description: 'Our system monitors weather, traffic, and disruptions across Hyderabad zones 24/7.',
  },
  {
    icon: HiOutlineLightningBolt,
    title: 'Instant 60s Payouts',
    description: 'No paperwork. No claims to file. Money hits your wallet automatically when a disruption is detected.',
  },
  {
    icon: HiOutlineCurrencyRupee,
    title: 'Fair Pricing',
    description: 'Premiums adjust based on your zone risk and trust score. Good partners pay less.',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Fraud Protection',
    description: 'Built-in GPS verification and pattern analysis ensures the system remains fair for everyone.',
  },
];

const LandingPage = () => {
  const { currentWorker } = useApp();
  const workerId = currentWorker?.worker_id || currentWorker?.id;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="flex flex-col gap-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-24 lg:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-base-950 to-base-950 -z-10" />
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center max-w-4xl mx-auto px-4"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-400 font-bold text-xs uppercase tracking-wider mb-8">
            <HiOutlineShieldCheck className="w-4 h-4" />
            Parametric Income Insurance
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold font-sans tracking-tighter text-base-100 mb-6 leading-tight">
            Protect your earnings.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">No paperwork required.</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-base-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            DeliverShield automatically detects heavy rain, heatwaves, and floods in your zone and pays you instantly for lost delivery time.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {workerId ? (
              <Link to={`/dashboard/${workerId}`} className="btn-primary w-full sm:w-auto text-lg px-8 shadow-xl shadow-primary-500/20">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/register" className="btn-primary w-full sm:w-auto text-lg px-8 shadow-xl shadow-primary-500/20">
                Start Protecting — ₹39/wk
              </Link>
            )}
            <Link to="/admin" className="btn-secondary w-full sm:w-auto text-lg px-8">
              Admin Overview
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="px-4">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
        >
          {features.map((feature, i) => (
            <motion.div key={i} variants={itemVariants} className="card bg-base-900 border border-base-800 p-8 hover:border-primary-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-base-950 border border-base-800 flex items-center justify-center text-primary-500 mb-6">
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-base-100 mb-3 font-sans tracking-tight">{feature.title}</h3>
              <p className="text-base-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold font-sans tracking-tighter text-base-100 mb-4">Choose your shield.</h2>
          <p className="text-base-400 max-w-2xl mx-auto">Affordable protection designed specifically for gig workers in Hyderabad.</p>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center"
        >
          {plans.map((plan, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              className={`relative card p-8 flex flex-col h-full ${plan.popular ? 'border-primary-500 bg-primary-900/10 shadow-2xl shadow-primary-500/10 md:scale-105 z-10' : 'border-base-800 bg-base-900'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-base-950 text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full flex items-center gap-1">
                  <HiStar className="w-3 h-3" /> Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold font-sans tracking-tight text-base-100 mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-8 pb-8 border-b border-base-800">
                <span className="text-4xl font-extrabold text-base-100">₹{plan.price}</span>
                <span className="text-base-500 font-medium">/week</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <HiCheck className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-primary-400' : 'text-base-500'}`} />
                    <span className="text-base-300 text-sm">{feat}</span>
                  </li>
                ))}
              </ul>

              <Link to="/register" className={`w-full py-4 rounded-xl font-bold text-center transition-colors ${plan.popular ? 'bg-primary-500 hover:bg-primary-400 text-base-950' : 'bg-base-800 hover:bg-base-700 text-base-100'}`}>
                Get Started
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
};

export default LandingPage;
