import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import LiveWeatherBar from './components/LiveWeatherBar';
import PayoutPopup from './components/PayoutPopup';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkerDashboard from './pages/WorkerDashboard';
import PoliciesPage from './pages/PoliciesPage';
import ClaimsPage from './pages/ClaimsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminClaimsPage from './pages/AdminClaimsPage';
import SimulateDisruptionPage from './pages/SimulateDisruptionPage';

const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

const AppInner = () => {
  const { payoutPopup, hidePayoutPopup, isAuthenticated } = useApp();
  const location = useLocation();

  // Layout check
  const isAuthRoute = location.pathname.includes('/dashboard') || 
                      location.pathname.includes('/policies') || 
                      location.pathname.includes('/claims') || 
                      location.pathname.includes('/admin');

  return (
    <div className="min-h-[100dvh] bg-base-950 text-base-100 flex flex-col md:flex-row font-body">
      {isAuthRoute ? (
        <Navbar isSidebar />
      ) : (
        <Navbar />
      )}
      
      <div className={`flex-1 flex flex-col min-w-0 ${isAuthRoute ? 'pt-16 md:pt-0 md:ml-60' : 'pt-20'}`}>
        {isAuthRoute && <LiveWeatherBar />}
        
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
              <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
              <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
              
              <Route path="/dashboard/:workerId" element={<PageWrapper><WorkerDashboard /></PageWrapper>} />
              <Route path="/policies/:workerId" element={<PageWrapper><PoliciesPage /></PageWrapper>} />
              <Route path="/claims/:workerId" element={<PageWrapper><ClaimsPage /></PageWrapper>} />
              
              <Route path="/admin" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
              <Route path="/admin/claims" element={<PageWrapper><AdminClaimsPage /></PageWrapper>} />
              <Route path="/admin/simulate" element={<PageWrapper><SimulateDisruptionPage /></PageWrapper>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Payout Popup */}
      <AnimatePresence>
        {payoutPopup && (
          <PayoutPopup
            amount={payoutPopup.amount}
            disruptionType={payoutPopup.disruptionType}
            onClose={hidePayoutPopup}
          />
        )}
      </AnimatePresence>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#141A26',
            color: '#E4E8F1',
            border: '1px solid #202836',
            borderRadius: '1rem',
            padding: '16px',
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#141A26' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#141A26' },
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
