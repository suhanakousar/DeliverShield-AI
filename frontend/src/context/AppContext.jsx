import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { connectToRealtimeEvents } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [currentWorker, setCurrentWorkerState] = useState(() => {
    try {
      const stored = localStorage.getItem('delivershield_worker');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthTokenState] = useState(() => {
    return localStorage.getItem('delivershield_token') || null;
  });

  const [role, setRoleState] = useState(() => {
    return localStorage.getItem('delivershield_role') || 'guest';
  });

  const [adminUser, setAdminUserState] = useState(() => {
    try {
      const stored = localStorage.getItem('delivershield_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [payoutPopup, setPayoutPopup] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null); // disruption banner state
  const sseRef = useRef(null);

  const setCurrentWorker = (worker) => {
    setCurrentWorkerState((prev) => {
      const next = typeof worker === 'function' ? worker(prev) : worker;
      if (next) localStorage.setItem('delivershield_worker', JSON.stringify(next));
      else localStorage.removeItem('delivershield_worker');
      return next;
    });
  };

  const setAuthToken = (token) => {
    setAuthTokenState(token);
    if (token) localStorage.setItem('delivershield_token', token);
    else localStorage.removeItem('delivershield_token');
  };

  const setRole = (nextRole) => {
    setRoleState(nextRole);
    if (nextRole) localStorage.setItem('delivershield_role', nextRole);
    else localStorage.removeItem('delivershield_role');
  };

  const setAdminUser = (user) => {
    setAdminUserState(user);
    if (user) localStorage.setItem('delivershield_admin_user', JSON.stringify(user));
    else localStorage.removeItem('delivershield_admin_user');
  };

  const login = (authResult) => {
    setAuthToken(authResult.access_token);
    if (authResult.role === 'admin') {
      setRole('admin');
      setAdminUser({ username: authResult.username || 'admin' });
      setCurrentWorker(null);
      return;
    }

    setRole('worker');
    setAdminUser(null);
    setCurrentWorker({
      id: authResult.worker_id,
      worker_id: authResult.worker_id,
      name: authResult.name,
      phone: authResult.phone,
    });
  };

  const logout = () => {
    setCurrentWorker(null);
    setAuthToken(null);
    setAdminUser(null);
    setRole('guest');
  };

  const showPayoutPopup = (amount, disruptionType) => setPayoutPopup({ amount, disruptionType });
  const hidePayoutPopup = () => setPayoutPopup(null);

  const isAuthenticated = !!authToken;
  const isAdmin = role === 'admin';
  const isWorker = role === 'worker';

  // SSE auto-connect: only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const workerId = currentWorker?.id || currentWorker?.worker_id;

    sseRef.current = connectToRealtimeEvents((evt) => {
      setLiveEvents((prev) => [{ ...evt, _t: Date.now() }, ...prev].slice(0, 50));

      // Disruption banner — show for ~25s
      if (evt.type === 'disruption_detected') {
        setActiveAlert({
          event_type: evt.event_type,
          zone: evt.zone,
          severity: evt.severity,
          message: evt.message,
        });
        setTimeout(() => setActiveAlert(null), 25000);
      }

      // Payout popup — only if it's for the logged-in worker
      if (evt.type === 'payout_processed' && workerId && evt.worker_id === workerId) {
        setPayoutPopup({
          amount: evt.amount,
          disruptionType: evt.disruption_type || evt.message || 'Payout',
        });
        setCurrentWorker((prev) => (prev ? { ...prev, wallet_balance: (prev.wallet_balance || 0) + (evt.amount || 0) } : prev));
      }
    });

    return () => {
      try { sseRef.current && sseRef.current.close && sseRef.current.close(); } catch (e) { /* ignore */ }
      sseRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentWorker?.id]);

  return (
    <AppContext.Provider
      value={{
        currentWorker,
        setCurrentWorker,
        authToken,
        setAuthToken,
        role,
        setRole,
        isAdmin,
        isWorker,
        adminUser,
        setAdminUser,
        logout,
        login,
        isAuthenticated,
        payoutPopup,
        showPayoutPopup,
        hidePayoutPopup,
        liveEvents,
        activeAlert,
        setActiveAlert,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export default AppContext;
