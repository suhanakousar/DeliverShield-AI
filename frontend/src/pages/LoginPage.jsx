import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineShieldCheck, HiArrowRight } from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { sendOtp, loginWithOtp } from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [step, setStep] = useState('phone'); 
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const result = await sendOtp(phone.trim());
      setDemoOtp(result.demo_otp);
      setStep('otp');
      toast.success('OTP sent successfully');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const result = await loginWithOtp(phone.trim(), otp.trim());
      login(result);
      toast.success(`Welcome back!`);
      navigate(`/dashboard/${result.worker_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-center text-primary-500 mx-auto mb-6">
            <HiOutlineShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold font-sans tracking-tighter text-base-100 mb-2">Welcome Back</h1>
          <p className="text-base-400">Sign in to manage your coverage</p>
        </div>

        <div className="card bg-base-900 border-base-800 p-8 shadow-2xl">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="label">Phone Number</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-base-500 font-bold border-r border-base-700 pr-3">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={10}
                    className="input-field pl-16 font-bold tracking-wide"
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full gap-2">
                {loading ? 'Sending...' : 'Continue'} <HiArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="bg-base-950 rounded-xl p-4 border border-base-800 text-center">
                <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-1">Code sent to</p>
                <p className="font-bold text-base-100">+91 {phone}</p>
                {demoOtp && (
                  <p className="text-xs text-primary-400 mt-2 font-mono">Demo OTP: {demoOtp}</p>
                )}
              </div>

              <div>
                <label className="label">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  className="input-field text-center text-3xl font-bold tracking-[0.5em]"
                  autoFocus
                />
              </div>

              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button type="button" onClick={() => setStep('phone')} className="w-full text-sm font-bold text-base-500 hover:text-base-300 transition-colors">
                Change phone number
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-8 text-base-500 text-sm">
          Don't have an account? <Link to="/register" className="text-primary-500 font-bold hover:underline">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
