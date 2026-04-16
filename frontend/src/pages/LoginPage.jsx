import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineShieldCheck, HiArrowRight } from 'react-icons/hi';
import { useApp } from '../context/AppContext';
import { adminLogin, loginWithPassword } from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useApp();
  const [mode, setMode] = useState('worker');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWorkerLogin = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    if (!password.trim()) {
      toast.error('Enter your password');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithPassword(phone.trim(), password);
      login(result);
      toast.success('Welcome back!');
      navigate(`/dashboard/${result.worker_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await adminLogin(adminUsername.trim(), adminPassword);
      login(result);
      toast.success('Admin access granted');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid admin credentials');
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
          <div className="flex gap-2 mb-6 bg-base-950 p-1 rounded-xl border border-base-800">
            <button
              type="button"
              onClick={() => setMode('worker')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                mode === 'worker' ? 'bg-primary-500 text-base-950' : 'text-base-400'
              }`}
            >
              Worker Login
            </button>
            <button
              type="button"
              onClick={() => setMode('admin')}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                mode === 'admin' ? 'bg-primary-500 text-base-950' : 'text-base-400'
              }`}
            >
              Admin Login
            </button>
          </div>

          {mode === 'worker' ? (
            <form onSubmit={handleWorkerLogin} className="space-y-6">
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

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full gap-2">
                {loading ? 'Signing in...' : 'Login'} <HiArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="label">Admin Username</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="input-field"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Signing in...' : 'Access Admin Panel'}
              </button>
              <p className="text-xs text-base-500">
                This panel is restricted to authorized operations staff only.
              </p>
            </form>
          )}
        </div>

        {mode === 'worker' && (
          <p className="text-center mt-8 text-base-500 text-sm">
            Don&apos;t have an account? <Link to="/register" className="text-primary-500 font-bold hover:underline">Register here</Link>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default LoginPage;
