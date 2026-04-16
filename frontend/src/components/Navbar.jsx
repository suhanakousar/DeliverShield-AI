import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  HiShieldCheck, HiMenu, HiX, HiHome, HiClipboardList, HiCash,
  HiCog, HiLogout, HiUserAdd, HiLogin, HiCurrencyRupee,
} from 'react-icons/hi';

const Navbar = ({ isSidebar = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentWorker, logout, isAuthenticated } = useApp();
  const location = useLocation();

  const workerId = currentWorker?.worker_id || currentWorker?.id;
  const walletBalance = currentWorker?.wallet_balance ?? null;

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  const closeMobile = () => setMobileOpen(false);

  const Logo = () => (
    <Link to="/" className="flex items-center gap-3 group" onClick={closeMobile}>
      <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-base-950 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-primary-500/20">
        <HiShieldCheck className="w-6 h-6" />
      </div>
      <span className="text-xl font-bold font-sans tracking-tight text-base-100">
        Deliver<span className="text-primary-500">Shield</span>
      </span>
    </Link>
  );

  const NavLinks = ({ onClick }) => (
    <div className="flex flex-col md:flex-row gap-2 md:items-center w-full">
      {workerId && isAuthenticated && (
        <>
          <NavLink to={`/dashboard/${workerId}`} icon={HiHome} label="Dashboard" active={isActive(`/dashboard/${workerId}`)} onClick={onClick} />
          <NavLink to={`/policies/${workerId}`} icon={HiClipboardList} label="Policies" active={isActive(`/policies/${workerId}`)} onClick={onClick} />
          <NavLink to={`/claims/${workerId}`} icon={HiCash} label="Claims" active={isActive(`/claims/${workerId}`)} onClick={onClick} />
        </>
      )}

      {location.pathname.startsWith('/admin') && (
        <>
          <NavLink to="/admin" icon={HiHome} label="Admin Overview" active={location.pathname === '/admin'} onClick={onClick} />
          <NavLink to="/admin/claims" icon={HiCash} label="Manage Claims" active={location.pathname === '/admin/claims'} onClick={onClick} />
          <NavLink to="/admin/simulate" icon={HiCog} label="Simulate Event" active={location.pathname === '/admin/simulate'} onClick={onClick} />
        </>
      )}
      
      {!isAuthenticated && !location.pathname.startsWith('/admin') && (
        <>
          <Link to="/login" className="md:ml-auto flex items-center gap-2 px-4 py-2.5 text-base-300 hover:text-white transition-colors font-semibold" onClick={onClick}>
            <HiLogin className="w-5 h-5" /> Login
          </Link>
          <Link to="/register" className="btn-primary" onClick={onClick}>
            Get Started
          </Link>
        </>
      )}
    </div>
  );

  const NavLink = ({ to, icon: Icon, label, active, onClick }) => (
    <Link 
      to={to} 
      onClick={onClick}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 overflow-hidden ${
        active ? 'text-primary-400 bg-primary-500/10' : 'text-base-400 hover:text-base-100 hover:bg-base-800'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="activeTab" 
          className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-md" 
        />
      )}
      <Icon className="w-5 h-5" /> 
      {label}
    </Link>
  );

  if (isSidebar) {
    return (
      <>
        {/* Mobile Header for Sidebar Layout */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-base-900 border-b border-base-800 z-50 px-4 flex items-center justify-between">
          <Logo />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-base-300 hover:text-white p-2">
            {mobileOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {(mobileOpen || window.innerWidth >= 768) && (
            <motion.div 
              initial={{ x: -300 }} 
              animate={{ x: 0 }} 
              exit={{ x: -300 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-base-900 border-r border-base-800 z-40 flex flex-col pt-16 md:pt-0"
            >
              <div className="p-6 hidden md:block">
                <Logo />
              </div>
              
              <div className="flex-1 px-4 py-4 md:py-0 overflow-y-auto space-y-1 flex flex-col">
                <div className="text-xs font-bold text-base-500 uppercase tracking-wider mb-4 px-4 mt-4">Menu</div>
                <NavLinks onClick={closeMobile} />
                
                {(!location.pathname.startsWith('/admin')) && (
                  <div className="mt-8">
                    <div className="text-xs font-bold text-base-500 uppercase tracking-wider mb-4 px-4">System</div>
                    <NavLink to="/admin" icon={HiCog} label="Admin Mode" active={false} onClick={closeMobile} />
                  </div>
                )}
              </div>

              {isAuthenticated && (
                <div className="p-4 border-t border-base-800 bg-base-900/50">
                  {walletBalance !== null && (
                    <div className="flex items-center gap-3 p-3 bg-base-800 rounded-xl mb-3">
                      <div className="w-8 h-8 rounded-lg bg-success-500/20 text-success-400 flex items-center justify-center">
                        <HiCurrencyRupee className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-base-400 font-medium">Wallet Balance</div>
                        <div className="font-bold text-base-100">₹{(walletBalance || 0).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  )}
                  
                  <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base-400 hover:text-danger-400 hover:bg-danger-500/10 font-semibold transition-colors">
                    <HiLogout className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 bg-black/60 z-30" onClick={closeMobile} />
        )}
      </>
    );
  }

  // Topbar for Public Pages
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-base-950/80 backdrop-blur-xl border-b border-base-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          <Logo />
          
          <div className="hidden md:flex items-center gap-2">
            <NavLinks onClick={closeMobile} />
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-base-300 p-2">
            {mobileOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
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
            <div className="p-4 space-y-4 flex flex-col">
              <NavLinks onClick={closeMobile} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
