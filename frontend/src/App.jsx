import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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

const AppInner = () => {
  const { payoutPopup, hidePayoutPopup } = useApp();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <LiveWeatherBar />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard/:workerId" element={<WorkerDashboard />} />
          <Route path="/policies/:workerId" element={<PoliciesPage />} />
          <Route path="/claims/:workerId" element={<ClaimsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/claims" element={<AdminClaimsPage />} />
          <Route path="/admin/simulate" element={<SimulateDisruptionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Payout Popup */}
      {payoutPopup && (
        <PayoutPopup
          amount={payoutPopup.amount}
          disruptionType={payoutPopup.disruptionType}
          onClose={hidePayoutPopup}
        />
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1E293B',
            color: '#F1F5F9',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#F1F5F9',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#F1F5F9',
            },
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
