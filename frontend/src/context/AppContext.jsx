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

  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return localStorage.getItem('delivershield_admin') === 'true';
    } catch {
      return false;
    }
  });

  const setCurrentWorker = (worker) => {
    setCurrentWorkerState(worker);
    if (worker) {
      localStorage.setItem('delivershield_worker', JSON.stringify(worker));
    } else {
      localStorage.removeItem('delivershield_worker');
    }
  };

  const toggleAdmin = () => {
    const newVal = !isAdmin;
    setIsAdmin(newVal);
    localStorage.setItem('delivershield_admin', String(newVal));
  };

  const logout = () => {
    setCurrentWorker(null);
    setIsAdmin(false);
    localStorage.removeItem('delivershield_admin');
  };

  return (
    <AppContext.Provider
      value={{
        currentWorker,
        setCurrentWorker,
        isAdmin,
        setIsAdmin,
        toggleAdmin,
        logout,
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
