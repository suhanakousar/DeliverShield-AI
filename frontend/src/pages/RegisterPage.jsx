import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiArrowRight, HiLocationMarker, HiRefresh, HiCheckCircle } from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { sendOtp, registerWithOtp } from '../services/api';

const ZONE_CENTERS = [
  { key: 'kukatpally',    label: 'Kukatpally',    lat: 17.4947, lon: 78.3996 },
  { key: 'banjara_hills', label: 'Banjara Hills', lat: 17.4156, lon: 78.4347 },
  { key: 'lb_nagar',      label: 'LB Nagar',      lat: 17.3457, lon: 78.5522 },
  { key: 'jubilee_hills', label: 'Jubilee Hills', lat: 17.4325, lon: 78.4070 },
  { key: 'old_city',      label: 'Old City',      lat: 17.3616, lon: 78.4747 },
  { key: 'gachibowli',    label: 'Gachibowli',    lat: 17.4401, lon: 78.3489 },
  { key: 'secunderabad',  label: 'Secunderabad',  lat: 17.4399, lon: 78.4983 },
  { key: 'madhapur',      label: 'Madhapur',      lat: 17.4484, lon: 78.3908 },
  { key: 'ameerpet',      label: 'Ameerpet',      lat: 17.4374, lon: 78.4482 },
  { key: 'dilsukhnagar',  label: 'Dilsukhnagar',  lat: 17.3687, lon: 78.5247 },
];

const PLATFORMS = ['Swiggy', 'Zomato'];

function findNearestZone(lat, lng) {
  let nearest = ZONE_CENTERS[0];
  let minDist = Infinity;
  for (const zone of ZONE_CENTERS) {
    const dist = Math.hypot(lat - zone.lat, lng - zone.lon);
    if (dist < minDist) { minDist = dist; nearest = zone; }
  }
  return nearest;
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  const [locationState, setLocationState] = useState({
    detecting: false,
    detected: false,
    address: '',
    coords: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    platform: '',
    partner_id: '',
    zone: '',
    avg_daily_earnings: 800,
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocationState(prev => ({ ...prev, detecting: true, detected: false, address: '' }));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=14`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const parts = [
            addr.neighbourhood || addr.suburb || addr.city_district || addr.town,
            addr.city || addr.state_district,
            addr.state,
          ].filter(Boolean);
          const readableAddress = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',');

          const nearest = findNearestZone(latitude, longitude);
          setFormData(prev => ({ ...prev, zone: nearest.key }));
          setLocationState({
            detecting: false,
            detected: true,
            address: readableAddress,
            coords: { lat: latitude, lng: longitude },
          });
          toast.success(`Location detected — mapped to ${nearest.label}`);
        } catch {
          const nearest = findNearestZone(latitude, longitude);
          setFormData(prev => ({ ...prev, zone: nearest.key }));
          setLocationState({
            detecting: false,
            detected: true,
            address: `Near ${nearest.label}`,
            coords: { lat: latitude, lng: longitude },
          });
          toast.success(`Location detected — mapped to ${nearest.label}`);
        }
      },
      (err) => {
        setLocationState(prev => ({ ...prev, detecting: false }));
        const msg = err.code === 1 ? 'Location permission denied. Please allow access.' : 'Could not detect location. Select zone manually.';
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.platform || !formData.zone || !formData.partner_id) {
      toast.error('Please fill all required fields');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const result = await sendOtp(formData.phone.trim(), formData.name);
      setDemoOtp(result.demo_otp || '');
      setStep(1);
      toast.success('OTP generated in the app');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegister = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const result = await registerWithOtp({
        ...formData,
        phone: formData.phone.trim(),
        otp: otp.trim(),
        password: formData.password,
        delivery_zone: formData.zone,
        avg_daily_earnings: Number(formData.avg_daily_earnings),
        avg_orders_per_day: 20,
      });
      login(result);
      toast.success('Account created successfully!');
      navigate(`/dashboard/${result.worker_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedZone = ZONE_CENTERS.find(z => z.key === formData.zone);

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

                {/* Location detection — spans full width */}
                <div className="md:col-span-2">
                  <label className="label">Delivery Zone</label>

                  {/* Detect button */}
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locationState.detecting}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-base-700 bg-base-950 hover:border-primary-500/60 hover:bg-primary-500/5 transition-all duration-200 text-left group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${locationState.detected ? 'bg-success-500/20 border border-success-500/30' : 'bg-base-800 group-hover:bg-primary-500/20'}`}>
                      {locationState.detecting ? (
                        <HiRefresh className="w-5 h-5 text-primary-400 animate-spin" />
                      ) : locationState.detected ? (
                        <HiCheckCircle className="w-5 h-5 text-success-400" />
                      ) : (
                        <HiLocationMarker className="w-5 h-5 text-base-400 group-hover:text-primary-400 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {locationState.detecting ? (
                        <span className="text-sm text-primary-400 font-medium">Detecting your location…</span>
                      ) : locationState.detected ? (
                        <>
                          <p className="text-sm font-semibold text-base-100 truncate">{locationState.address}</p>
                          <p className="text-xs text-success-400 font-medium mt-0.5">
                            Mapped to coverage zone: {selectedZone?.label}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-base-300">Use current location</p>
                          <p className="text-xs text-base-500 mt-0.5">Tap to auto-detect like Ola / Rapido</p>
                        </>
                      )}
                    </div>
                    {!locationState.detecting && !locationState.detected && (
                      <span className="text-xs font-bold text-primary-500 shrink-0">Detect</span>
                    )}
                    {locationState.detected && (
                      <span className="text-xs font-bold text-base-500 shrink-0 hover:text-primary-400">Change</span>
                    )}
                  </button>

                  {/* Manual zone override */}
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2"
                    >
                      <select
                        name="zone"
                        value={formData.zone}
                        onChange={(e) => {
                          handleChange(e);
                          setLocationState(prev => ({ ...prev, detected: false, address: '' }));
                        }}
                        className="select-field text-sm"
                      >
                        <option value="">Or select zone manually…</option>
                        {ZONE_CENTERS.map(z => (
                          <option key={z.key} value={z.key}>{z.label}</option>
                        ))}
                      </select>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div>
                  <label className="label">Avg Daily Earnings (₹)</label>
                  <input name="avg_daily_earnings" type="number" value={formData.avg_daily_earnings} onChange={handleChange} min={100} max={5000} className="input-field" required />
                </div>
                <div>
                  <label className="label">Set Password</label>
                  <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Minimum 6 characters" className="input-field" required />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className="input-field" required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                {loading ? 'Processing...' : 'Continue'} <HiArrowRight className="w-5 h-5 ml-2" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyRegister} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-sm font-bold text-base-500 mb-2">OTP generated for +91 {formData.phone}</p>
                {demoOtp && <p className="text-xs font-mono text-primary-400">OTP: {demoOtp}</p>}
                <p className="text-xs text-base-500">Use this OTP inside the app to finish registration.</p>
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
