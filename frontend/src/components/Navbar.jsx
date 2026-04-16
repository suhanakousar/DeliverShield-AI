import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  HiShieldCheck, HiMenu, HiX, HiHome, HiClipboardList, HiCash,
  HiCog, HiLogout, HiUserAdd, HiLogin, HiCurrencyRupee,
} from 'react-icons/hi';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentWorker, isAdmin, logout, isAuthenticated } = useApp();
  const location = useLocation();

  const workerId = currentWorker?.worker_id || currentWorker?.id;
  const walletBalance = currentWorker?.wallet_balance ?? null;

  const isActive = (path) => location.pathname === path;
  const navLinkClasses = (path) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? 'bg-primary-600/20 text-primary-400'
        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
    }`;
  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" onClick={closeMobile}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/50 transition-shadow">
              <HiShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">
              <span className="text-white">Deliver</span>
              <span className="text-primary-400">Shield</span>
              <span className="text-accent-400 text-xs ml-1 font-semibold">AI</span>
            </span>
            <span className="hidden sm:flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {workerId && isAuthenticated && (
              <>
                <Link to={`/dashboard/${workerId}`} className={navLinkClasses(`/dashboard/${workerId}`)}>
                  <HiHome className="w-4 h-4" /> Dashboard
                </Link>
                <Link to={`/policies/${workerId}`} className={navLinkClasses(`/policies/${workerId}`)}>
                  <HiClipboardList className="w-4 h-4" /> Policies
                </Link>
                <Link to={`/claims/${workerId}`} className={navLinkClasses(`/claims/${workerId}`)}>
                  <HiCash className="w-4 h-4" /> Claims
                </Link>
              </>
            )}

            {!isAuthenticated && (
              <>
                <Link to="/login" className={navLinkClasses('/login')}>
                  <HiLogin className="w-4 h-4" /> Login
                </Link>
                <Link to="/register" className="btn-primary text-sm flex items-center gap-1.5 py-2 px-4">
                  <HiUserAdd className="w-4 h-4" /> Get Started
                </Link>
              </>
            )}

            <div className="w-px h-6 bg-slate-700 mx-2" />

            <Link to="/admin" className={navLinkClasses('/admin')}>
              <HiCog className="w-4 h-4" /> Admin
            </Link>

            {isAuthenticated && (
              <>
                {walletBalance !== null && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <HiCurrencyRupee className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold text-sm">
                      ₹{(walletBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <HiLogout className="w-4 h-4" /> Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            {mobileOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {isAuthenticated && workerId && (
              <>
                <Link to={`/dashboard/${workerId}`} className={navLinkClasses(`/dashboard/${workerId}`)} onClick={closeMobile}>
                  <HiHome className="w-4 h-4" /> Dashboard
                </Link>
                <Link to={`/policies/${workerId}`} className={navLinkClasses(`/policies/${workerId}`)} onClick={closeMobile}>
                  <HiClipboardList className="w-4 h-4" /> Policies
                </Link>
                <Link to={`/claims/${workerId}`} className={navLinkClasses(`/claims/${workerId}`)} onClick={closeMobile}>
                  <HiCash className="w-4 h-4" /> Claims
                </Link>
              </>
            )}

            {!isAuthenticated && (
              <>
                <Link to="/login" className={navLinkClasses('/login')} onClick={closeMobile}>
                  <HiLogin className="w-4 h-4" /> Login
                </Link>
                <Link to="/register" className={navLinkClasses('/register')} onClick={closeMobile}>
                  <HiUserAdd className="w-4 h-4" /> Register
                </Link>
              </>
            )}

            <div className="border-t border-slate-700/50 my-2" />

            <Link to="/admin" className={navLinkClasses('/admin')} onClick={closeMobile}>
              <HiCog className="w-4 h-4" /> Admin Dashboard
            </Link>

            {isAuthenticated && (
              <>
                {walletBalance !== null && (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <HiCurrencyRupee className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">
                      Wallet: ₹{(walletBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-700/50 my-2" />
                <button
                  onClick={() => { logout(); closeMobile(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <HiLogout className="w-4 h-4" /> Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
