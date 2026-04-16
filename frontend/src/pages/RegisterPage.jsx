import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiShieldCheck, HiUser, HiPhone, HiMail, HiIdentification,
  HiLocationMarker, HiCurrencyRupee, HiClipboardList, HiLockClosed,
  HiArrowRight, HiRefresh, HiCheck,
} from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { sendOtp, registerWithOtp } from '../services/api';

const ZONES = [
  'Kukatpally', 'Banjara Hills', 'LB Nagar', 'Jubilee Hills', 'Old City',
  'Gachibowli', 'Secunderabad', 'Madhapur', 'Ameerpet', 'Dilsukhnagar',
];
const PLATFORMS = ['Swiggy', 'Zomato'];

const STEPS = [
  { label: 'Details', icon: HiUser },
  { label: 'OTP', icon: HiLockClosed },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [step, setStep] = useState(0); // 0 = details, 1 = OTP
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    platform: '',
    partner_id: '',
    zone: '',
    avg_daily_earnings: 800,
    avg_orders_per_day: 20,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email';
    if (!formData.platform) e.platform = 'Select a platform';
    if (!formData.partner_id.trim()) e.partner_id = 'Partner ID is required';
    if (!formData.zone) e.zone = 'Select your delivery zone';
    if (formData.avg_daily_earnings < 100 || formData.avg_daily_earnings > 5000) e.avg_daily_earnings = 'Enter ₹100–₹5,000';
    if (formData.avg_orders_per_day < 1 || formData.avg_orders_per_day > 100) e.avg_orders_per_day = 'Enter 1–100 orders';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await sendOtp(formData.phone.trim(), formData.name);
      setDemoOtp(result.demo_otp);
      setStep(1);
      toast.success('OTP sent to your phone!');
    } catch (err) {
      const msg = err.response?.data?.detail;
      const errorMsg = Array.isArray(msg) ? msg.map(e => e.msg || JSON.stringify(e)).join(', ')
        : typeof msg === 'string' ? msg : 'Failed to send OTP';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegister = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (otp.trim().length !== 6) {
      setOtpError('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const result = await registerWithOtp({
        phone: formData.phone.trim(),
        otp: otp.trim(),
        name: formData.name,
        email: formData.email || undefined,
        platform: formData.platform,
        partner_id: formData.partner_id,
        delivery_zone: formData.zone,
        avg_daily_earnings: Number(formData.avg_daily_earnings),
        avg_orders_per_day: Number(formData.avg_orders_per_day),
      });
      login(result);
      toast.success(`Welcome to DeliverShield, ${formData.name}! 🎉`);
      navigate(`/dashboard/${result.worker_id}`);
    } catch (err) {
      const msg = err.response?.data?.detail;
      const errorMsg = Array.isArray(msg) ? msg.map(e => e.msg || JSON.stringify(e)).join(', ')
        : typeof msg === 'string' ? msg : 'Registration failed';
      setOtpError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ icon: Icon, label, name, type = 'text', placeholder, ...props }) => (
    <div>
      <label htmlFor={name} className="label flex items-center gap-1.5">
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={formData[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className={`input-field ${errors[name] ? 'ring-2 ring-red-500 border-red-500' : ''}`}
        {...props}
      />
      {errors[name] && <p className="text-xs text-red-400 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/15 rounded-2xl mb-4 border border-primary-500/20">
            <HiShieldCheck className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Join DeliverShield</h1>
          <p className="text-slate-400 text-sm">Register in 2 minutes. Start protecting your income today.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                i === step
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : i < step
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-700/50 text-slate-400'
              }`}>
                {i < step ? <HiCheck className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 transition-colors duration-300 ${i < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {step === 0 ? (
          <form onSubmit={handleSendOtp} className="glass-card rounded-2xl p-6 space-y-5">
            <InputField icon={HiUser} label="Full Name" name="name" placeholder="Enter your full name" />

            <div>
              <label className="label flex items-center gap-1.5">
                <HiPhone className="w-4 h-4 text-slate-500" /> Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">+91</span>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength={10}
                  className={`input-field pl-14 ${errors.phone ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
            </div>

            <InputField icon={HiMail} label="Email (optional)" name="email" type="email" placeholder="your@email.com" />

            <div>
              <label htmlFor="platform" className="label flex items-center gap-1.5">
                <HiClipboardList className="w-4 h-4 text-slate-500" /> Platform
              </label>
              <select
                id="platform" name="platform" value={formData.platform} onChange={handleChange}
                className={`select-field ${errors.platform ? 'ring-2 ring-red-500 border-red-500' : ''}`}
              >
                <option value="">Select platform</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.platform && <p className="text-xs text-red-400 mt-1">{errors.platform}</p>}
            </div>

            <InputField icon={HiIdentification} label="Partner ID" name="partner_id" placeholder="Your Swiggy/Zomato partner ID" />

            <div>
              <label htmlFor="zone" className="label flex items-center gap-1.5">
                <HiLocationMarker className="w-4 h-4 text-slate-500" /> Delivery Zone
              </label>
              <select
                id="zone" name="zone" value={formData.zone} onChange={handleChange}
                className={`select-field ${errors.zone ? 'ring-2 ring-red-500 border-red-500' : ''}`}
              >
                <option value="">Select your zone</option>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              {errors.zone && <p className="text-xs text-red-400 mt-1">{errors.zone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="avg_daily_earnings" className="label flex items-center gap-1.5">
                  <HiCurrencyRupee className="w-4 h-4 text-slate-500" /> Daily Earnings (₹)
                </label>
                <input
                  id="avg_daily_earnings" name="avg_daily_earnings" type="number"
                  value={formData.avg_daily_earnings} onChange={handleChange}
                  className={`input-field ${errors.avg_daily_earnings ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                  min={100} max={5000}
                />
                {errors.avg_daily_earnings && <p className="text-xs text-red-400 mt-1">{errors.avg_daily_earnings}</p>}
              </div>
              <div>
                <label htmlFor="avg_orders_per_day" className="label">Orders/Day</label>
                <input
                  id="avg_orders_per_day" name="avg_orders_per_day" type="number"
                  value={formData.avg_orders_per_day} onChange={handleChange}
                  className={`input-field ${errors.avg_orders_per_day ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                  min={1} max={100}
                />
                {errors.avg_orders_per_day && <p className="text-xs text-red-400 mt-1">{errors.avg_orders_per_day}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                <> Send OTP <HiArrowRight className="w-5 h-5" /> </>
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold">Login</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyRegister} className="glass-card rounded-2xl p-6 space-y-5">
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-400 mb-1">OTP sent to</p>
              <p className="font-bold text-white">+91 {formData.phone}</p>
              {demoOtp && (
                <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                  <p className="text-xs text-amber-400">Demo OTP: <span className="font-mono font-bold text-amber-300 text-lg">{demoOtp}</span></p>
                </div>
              )}
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <HiLockClosed className="w-4 h-4 text-primary-400" /> Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                placeholder="000000"
                maxLength={6}
                className={`input-field text-center text-2xl font-mono tracking-widest ${otpError ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                autoFocus
              />
              {otpError && <p className="text-xs text-red-400 mt-1">{otpError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account...
                </span>
              ) : (
                <> <HiShieldCheck className="w-5 h-5" /> Verify & Join </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStep(0); setOtp(''); setOtpError(''); }}
              className="w-full text-sm text-slate-400 hover:text-white flex items-center justify-center gap-1 py-2 transition-colors"
            >
              <HiRefresh className="w-4 h-4" /> Go back & edit details
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
