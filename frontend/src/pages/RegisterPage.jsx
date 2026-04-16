import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineShieldCheck, HiArrowRight, HiCheck } from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { sendOtp, registerWithOtp } from '../services/api';

const ZONES = ['Kukatpally', 'Banjara Hills', 'LB Nagar', 'Jubilee Hills', 'Old City', 'Gachibowli', 'Madhapur'];
const PLATFORMS = ['Swiggy', 'Zomato'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    name: '', phone: '', platform: '', partner_id: '', zone: '', avg_daily_earnings: 800,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.platform || !formData.zone || !formData.partner_id) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const result = await sendOtp(formData.phone.trim(), formData.name);
      setDemoOtp(result.demo_otp);
      setStep(1);
      toast.success('OTP sent!');
    } catch (err) {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegister = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const result = await registerWithOtp({
        ...formData,
        phone: formData.phone.trim(),
        otp: otp.trim(),
        delivery_zone: formData.zone,
        avg_daily_earnings: Number(formData.avg_daily_earnings),
        avg_orders_per_day: 20
      });
      login(result);
      toast.success('Account created successfully!');
      navigate(`/dashboard/${result.worker_id}`);
    } catch (err) {
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold font-sans tracking-tighter text-base-100 mb-2">Join DeliverShield</h1>
          <p className="text-base-400">Protect your delivery income in minutes.</p>
        </div>

        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-2 rounded-full bg-primary-500" />
          <div className={`flex-1 h-2 rounded-full transition-colors duration-500 ${step === 1 ? 'bg-primary-500' : 'bg-base-800'}`} />
        </div>

        <div className="card bg-base-900 border-base-800 p-8 shadow-2xl">
          {step === 0 ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Full Name</label>
                  <input name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" className="input-field" required />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210" maxLength={10} className="input-field" required />
                </div>
                <div>
                  <label className="label">Platform</label>
                  <select name="platform" value={formData.platform} onChange={handleChange} className="select-field" required>
                    <option value="">Select Platform</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Partner ID</label>
                  <input name="partner_id" value={formData.partner_id} onChange={handleChange} placeholder="SWG12345" className="input-field" required />
                </div>
                <div>
                  <label className="label">Delivery Zone</label>
                  <select name="zone" value={formData.zone} onChange={handleChange} className="select-field" required>
                    <option value="">Select Zone</option>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Avg Daily Earnings (₹)</label>
                  <input name="avg_daily_earnings" type="number" value={formData.avg_daily_earnings} onChange={handleChange} min={100} max={5000} className="input-field" required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                {loading ? 'Processing...' : 'Continue'} <HiArrowRight className="w-5 h-5 ml-2" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyRegister} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-sm font-bold text-base-500 mb-2">OTP sent to +91 {formData.phone}</p>
                {demoOtp && <p className="text-xs font-mono text-primary-400">Demo OTP: {demoOtp}</p>}
              </div>

              <div>
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
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>

              <button type="button" onClick={() => setStep(0)} className="w-full text-sm font-bold text-base-500 hover:text-base-300">
                Back to Details
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-8 text-base-500 text-sm">
          Already have an account? <Link to="/login" className="text-primary-500 font-bold hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
