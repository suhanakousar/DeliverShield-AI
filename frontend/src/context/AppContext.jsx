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

  const setRole = (nextRole) => {
    setRoleState(nextRole);
    if (nextRole) {
      localStorage.setItem('delivershield_role', nextRole);
    } else {
      localStorage.removeItem('delivershield_role');
    }
  };

  const setAdminUser = (user) => {
    setAdminUserState(user);
    if (user) {
      localStorage.setItem('delivershield_admin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('delivershield_admin_user');
    }
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

  const showPayoutPopup = (amount, disruptionType) => {
    setPayoutPopup({ amount, disruptionType });
  };

  const hidePayoutPopup = () => {
    setPayoutPopup(null);
  };

  const isAuthenticated = !!authToken;
  const isAdmin = role === 'admin';
  const isWorker = role === 'worker';

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
