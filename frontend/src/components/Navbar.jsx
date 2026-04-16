import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  HiShieldCheck, HiMenu, HiX, HiHome, HiClipboardList, HiCash,
  HiCog, HiLogout, HiLogin, HiCurrencyRupee, HiChartBar, HiBeaker,
} from 'react-icons/hi';

const NavItem = ({ to, icon: Icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group ${
      active
        ? 'bg-primary-500/15 text-primary-400'
        : 'text-base-400 hover:text-base-100 hover:bg-base-800'
    }`}
  >
    {active && (
      <motion.div
        layoutId="sidebar-active"
        className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-500 rounded-r-full"
        transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
      />
    )}
    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-400' : 'text-base-500 group-hover:text-base-300'}`} />
    <span className="truncate">{label}</span>
  </Link>
);

const Logo = ({ onClick }) => (
  <Link to="/" className="flex items-center gap-3 group" onClick={onClick}>
    <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
      <HiShieldCheck className="w-5 h-5 text-base-950" />
    </div>
    <span className="text-lg font-bold tracking-tight text-base-100 font-sans">
      Deliver<span className="text-primary-500">Shield</span>
    </span>
  </Link>
);

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentWorker, logout, isAuthenticated, isAdmin } = useApp();
  const location = useLocation();

  const workerId = currentWorker?.worker_id || currentWorker?.id;
  const walletBalance = currentWorker?.wallet_balance ?? null;
  const isAdminArea = location.pathname.startsWith('/admin');

  const isActive = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path) && path !== '/';

  const closeMobile = () => setMobileOpen(false);

  const workerLinks = workerId && isAuthenticated && !isAdminArea ? [
    { to: `/dashboard/${workerId}`, icon: HiHome, label: 'Dashboard' },
    { to: `/policies/${workerId}`, icon: HiShieldCheck, label: 'Policies' },
    { to: `/claims/${workerId}`, icon: HiCash, label: 'Claims' },
  ] : [];

  const adminLinks = isAdminArea ? [
    { to: '/admin', icon: HiChartBar, label: 'Overview' },
    { to: '/admin/claims', icon: HiClipboardList, label: 'Manage Claims' },
    { to: '/admin/simulate', icon: HiBeaker, label: 'Simulate Event' },
  ] : [];

  const links = isAdminArea ? adminLinks : workerLinks;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-base-800">
        <Logo onClick={closeMobile} />
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[11px] font-bold text-base-600 uppercase tracking-widest px-4 mb-3">
          {isAdminArea ? 'Admin' : 'Menu'}
        </p>
        {links.map((link) => (
          <NavItem
            key={link.to}
            to={link.to}
            icon={link.icon}
            label={link.label}
            active={isActive(link.to)}
            onClick={closeMobile}
          />
        ))}

        {isAdminArea && (
          <div className="pt-4 mt-4 border-t border-base-800">
            {isAdmin ? (
              <NavItem to="/" icon={HiHome} label="Back to App" active={false} onClick={closeMobile} />
            ) : null}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-base-800">
        {isAuthenticated && walletBalance !== null && (
          <div className="flex items-center gap-3 px-3 py-2.5 bg-base-800 rounded-xl mb-3">
            <div className="w-8 h-8 rounded-lg bg-success-500/20 flex items-center justify-center flex-shrink-0">
              <HiCurrencyRupee className="w-4 h-4 text-success-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-base-500 font-medium">Wallet</p>
              <p className="text-sm font-bold text-base-100 truncate">
                ₹{(walletBalance || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}
        {isAuthenticated && (
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-base-400 hover:text-danger-400 hover:bg-danger-500/10 font-semibold text-sm transition-colors"
          >
            <HiLogout className="w-4 h-4 flex-shrink-0" />
            Sign Out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-base-900 border-b border-base-800 z-50 px-4 flex items-center justify-between">
        <Logo onClick={closeMobile} />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-base-300 hover:text-white p-2 rounded-lg hover:bg-base-800 transition-colors"
        >
          {mobileOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-60 bg-base-900 border-r border-base-800 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
              onClick={closeMobile}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="md:hidden fixed top-16 left-0 bottom-0 w-72 bg-base-900 border-r border-base-800 z-50"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const Topbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useApp();
  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-base-950/90 backdrop-blur-xl border-b border-base-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          <Logo onClick={closeMobile} />

          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2.5 text-base-300 hover:text-white font-semibold text-sm transition-colors rounded-lg hover:bg-base-800"
            >
              <HiLogin className="w-4 h-4" /> Login
            </Link>
            <Link to="/register" className="btn-primary text-sm py-2.5 px-5">
              Get Started
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-base-300 hover:text-white p-2 rounded-lg hover:bg-base-800 transition-colors"
          >
            {mobileOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-base-800 bg-base-900 overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={closeMobile}
                className="flex items-center gap-2 px-4 py-3 text-base-300 hover:text-white font-semibold rounded-xl hover:bg-base-800 transition-colors"
              >
                <HiLogin className="w-4 h-4" /> Login
              </Link>
              <Link to="/register" onClick={closeMobile} className="btn-primary w-full text-sm">
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Navbar = ({ isSidebar = false }) => {
  return isSidebar ? <Sidebar /> : <Topbar />;
};

export default Navbar;
