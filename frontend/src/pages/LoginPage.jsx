import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiShieldCheck, HiPhone, HiLockClosed, HiArrowRight, HiRefresh } from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { sendOtp, loginWithOtp } from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setPhoneError('');
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setPhoneError('Enter a valid 10-digit Indian mobile number');
      return;
    }
    setLoading(true);
    try {
      const result = await sendOtp(phone.trim());
      setDemoOtp(result.demo_otp);
      setStep('otp');
      toast.success('OTP sent! Check your phone.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (otp.trim().length !== 6) {
      setOtpError('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const result = await loginWithOtp(phone.trim(), otp.trim());
      login(result);
      toast.success(`Welcome back, ${result.name}!`);
      navigate(`/dashboard/${result.worker_id}`);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 glass-card rounded-2xl mb-4 glow-primary">
            <HiShieldCheck className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Welcome Back</h1>
          <p className="text-slate-400 text-sm">Sign in to your DeliverShield account</p>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-6">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="label flex items-center gap-2">
                  <HiPhone className="w-4 h-4 text-primary-400" />
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                    placeholder="9876543210"
                    maxLength={10}
                    className={`input-field pl-14 ${phoneError ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                    autoFocus
                  />
                </div>
                {phoneError && <p className="text-xs text-red-400 mt-1">{phoneError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
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
                  <>Get OTP <HiArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-400 mb-1">OTP sent to</p>
                <p className="font-bold text-white">+91 {phone}</p>
                {demoOtp && (
                  <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                    <p className="text-xs text-amber-400">Demo OTP: <span className="font-mono font-bold text-amber-300 text-lg">{demoOtp}</span></p>
                  </div>
                )}
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <HiLockClosed className="w-4 h-4 text-primary-400" />
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                  placeholder="000000"
                  maxLength={6}
                  className={`input-field text-center text-2xl font-mono tracking-widest letter-spacing-wider ${otpError ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                  autoFocus
                />
                {otpError && <p className="text-xs text-red-400 mt-1">{otpError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  <>Verify & Login <HiShieldCheck className="w-5 h-5" /></>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setOtpError(''); }}
                className="w-full text-sm text-slate-400 hover:text-white flex items-center justify-center gap-1 py-2 transition-colors"
              >
                <HiRefresh className="w-4 h-4" /> Change phone number
              </button>
            </form>
          )}

          <div className="border-t border-slate-700/50 pt-5 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold">
                Register Now
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Protected by DeliverShield AI security. Your data is encrypted.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
