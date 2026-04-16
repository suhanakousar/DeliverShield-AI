import React, { createContext, useContext, useState, useEffect } from 'react';

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

  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return localStorage.getItem('delivershield_admin') === 'true';
    } catch {
      return false;
    }
  });

  const [payoutPopup, setPayoutPopup] = useState(null); // { amount, disruptionType }

  const setCurrentWorker = (worker) => {
    setCurrentWorkerState(worker);
    if (worker) {
      localStorage.setItem('delivershield_worker', JSON.stringify(worker));
    } else {
      localStorage.removeItem('delivershield_worker');
    }
  };

  const setAuthToken = (token) => {
    setAuthTokenState(token);
    if (token) {
      localStorage.setItem('delivershield_token', token);
    } else {
      localStorage.removeItem('delivershield_token');
    }
  };

  const login = (authResult) => {
    setAuthToken(authResult.access_token);
    setCurrentWorker({
      id: authResult.worker_id,
      worker_id: authResult.worker_id,
      name: authResult.name,
      phone: authResult.phone,
    });
  };

  const toggleAdmin = () => {
    const newVal = !isAdmin;
    setIsAdmin(newVal);
    localStorage.setItem('delivershield_admin', String(newVal));
  };

  const logout = () => {
    setCurrentWorker(null);
    setAuthToken(null);
    setIsAdmin(false);
    localStorage.removeItem('delivershield_admin');
  };

  const showPayoutPopup = (amount, disruptionType) => {
    setPayoutPopup({ amount, disruptionType });
  };

  const hidePayoutPopup = () => {
    setPayoutPopup(null);
  };

  const isAuthenticated = !!(currentWorker && (authToken || currentWorker.worker_id || currentWorker.id));

  return (
    <AppContext.Provider
      value={{
        currentWorker,
        setCurrentWorker,
        authToken,
        setAuthToken,
        isAdmin,
        setIsAdmin,
        toggleAdmin,
        logout,
        login,
        isAuthenticated,
        payoutPopup,
        showPayoutPopup,
        hidePayoutPopup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
