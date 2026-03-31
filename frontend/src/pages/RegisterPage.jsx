import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiShieldCheck, HiUser, HiPhone, HiMail, HiIdentification, HiLocationMarker, HiCurrencyRupee, HiClipboardList } from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { registerWorker } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ZONES = [
  'Kukatpally', 'Banjara Hills', 'LB Nagar', 'Jubilee Hills', 'Old City',
  'Gachibowli', 'Secunderabad', 'Madhapur', 'Ameerpet', 'Dilsukhnagar',
];

const PLATFORMS = ['Swiggy', 'Zomato'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setCurrentWorker } = useApp();
  const [loading, setLoading] = useState(false);
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
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email';
    if (!formData.platform) newErrors.platform = 'Select a platform';
    if (!formData.partner_id.trim()) newErrors.partner_id = 'Partner ID is required';
    if (!formData.zone) newErrors.zone = 'Select your delivery zone';
    if (formData.avg_daily_earnings < 100 || formData.avg_daily_earnings > 5000) newErrors.avg_daily_earnings = 'Enter amount between \u20B9100-\u20B95,000';
    if (formData.avg_orders_per_day < 1 || formData.avg_orders_per_day > 100) newErrors.avg_orders_per_day = 'Enter between 1-100 orders';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = {
        name: formData.name,
        phone: formData.phone.trim(),
        email: formData.email || undefined,
        platform: formData.platform,
        partner_id: formData.partner_id,
        delivery_zone: formData.zone,
        avg_daily_earnings: Number(formData.avg_daily_earnings),
        avg_orders_per_day: Number(formData.avg_orders_per_day),
      };

      const result = await registerWorker(data);
      const worker = result.worker || result;
      const workerId = worker.worker_id || worker.id;

      setCurrentWorker(worker);
      toast.success(`Welcome to DeliverShield, ${formData.name}!`);
      navigate(`/dashboard/${workerId}`);
    } catch (error) {
      console.error('Registration error:', error);
      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail)
        ? detail.map(e => e.msg || JSON.stringify(e)).join(', ')
        : (typeof detail === 'string' ? detail : error.response?.data?.message || 'Registration failed. Please try again.');

      // Fallback: create a demo worker if backend is down
      if (!error.response) {
        const demoWorker = {
          worker_id: `WKR-${Date.now().toString(36).toUpperCase()}`,
          id: `WKR-${Date.now().toString(36).toUpperCase()}`,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          platform: formData.platform,
          partner_id: formData.partner_id,
          zone: formData.zone,
          avg_daily_earnings: Number(formData.avg_daily_earnings),
          avg_orders_per_day: Number(formData.avg_orders_per_day),
          trust_score: 85,
          created_at: new Date().toISOString(),
        };
        setCurrentWorker(demoWorker);
        toast.success(`Welcome, ${formData.name}! (Demo mode — backend offline)`);
        navigate(`/dashboard/${demoWorker.worker_id}`);
        return;
      }

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/15 rounded-2xl mb-4">
            <HiShieldCheck className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Join DeliverShield</h1>
          <p className="text-slate-400">Register in 2 minutes. Start protecting your income today.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-5">
          <InputField
            icon={HiUser}
            label="Full Name"
            name="name"
            placeholder="Enter your full name"
          />

          <InputField
            icon={HiPhone}
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="9876543210"
            maxLength={10}
          />

          <InputField
            icon={HiMail}
            label="Email (optional)"
            name="email"
            type="email"
            placeholder="your@email.com"
          />

          {/* Platform */}
          <div>
            <label htmlFor="platform" className="label flex items-center gap-1.5">
              <HiClipboardList className="w-4 h-4 text-slate-500" />
              Platform
            </label>
            <select
              id="platform"
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              className={`select-field ${errors.platform ? 'ring-2 ring-red-500 border-red-500' : ''}`}
            >
              <option value="">Select platform</option>
              {PLATFORMS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.platform && <p className="text-xs text-red-400 mt-1">{errors.platform}</p>}
          </div>

          <InputField
            icon={HiIdentification}
            label="Partner ID"
            name="partner_id"
            placeholder="Your Swiggy/Zomato partner ID"
          />

          {/* Zone */}
          <div>
            <label htmlFor="zone" className="label flex items-center gap-1.5">
              <HiLocationMarker className="w-4 h-4 text-slate-500" />
              Delivery Zone
            </label>
            <select
              id="zone"
              name="zone"
              value={formData.zone}
              onChange={handleChange}
              className={`select-field ${errors.zone ? 'ring-2 ring-red-500 border-red-500' : ''}`}
            >
              <option value="">Select your zone</option>
              {ZONES.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            {errors.zone && <p className="text-xs text-red-400 mt-1">{errors.zone}</p>}
          </div>

          {/* Earnings & Orders row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="avg_daily_earnings" className="label flex items-center gap-1.5">
                <HiCurrencyRupee className="w-4 h-4 text-slate-500" />
                Daily Earnings ({`\u20B9`})
              </label>
              <input
                id="avg_daily_earnings"
                name="avg_daily_earnings"
                type="number"
                value={formData.avg_daily_earnings}
                onChange={handleChange}
                className={`input-field ${errors.avg_daily_earnings ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                min={100}
                max={5000}
              />
              {errors.avg_daily_earnings && <p className="text-xs text-red-400 mt-1">{errors.avg_daily_earnings}</p>}
            </div>

            <div>
              <label htmlFor="avg_orders_per_day" className="label flex items-center gap-1.5">
                Orders/Day
              </label>
              <input
                id="avg_orders_per_day"
                name="avg_orders_per_day"
                type="number"
                value={formData.avg_orders_per_day}
                onChange={handleChange}
                className={`input-field ${errors.avg_orders_per_day ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                min={1}
                max={100}
              />
              {errors.avg_orders_per_day && <p className="text-xs text-red-400 mt-1">{errors.avg_orders_per_day}</p>}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-3"
          >
            {loading ? (
              <LoadingSpinner size="sm" text="" />
            ) : (
              <>
                <HiShieldCheck className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 text-center">
            By registering, you agree to DeliverShield AI terms and conditions.
            Your data is encrypted and secure.
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
