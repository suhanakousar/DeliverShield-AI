import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL !== undefined ? process.env.REACT_APP_API_URL : '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('delivershield_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// ── Auth endpoints ──────────────────────────────
export const sendOtp = async (phone, name) => {
  const response = await api.post('/api/auth/send-otp', { phone, name });
  return response.data;
};

export const registerWithOtp = async (data) => {
  const response = await api.post('/api/auth/register', data);
  return response.data;
};

export const loginWithOtp = async (phone, otp) => {
  const response = await api.post('/api/auth/login', { phone, otp });
  return response.data;
};

export const adminLogin = async (username, password) => {
  const response = await api.post('/api/auth/admin-login', { username, password });
  return response.data;
};

export const getAuthMe = async (token) => {
  const response = await api.get(`/api/auth/me?token=${token}`);
  return response.data;
};

// ── Worker endpoints ────────────────────────────
export const registerWorker = async (data) => {
  const response = await api.post('/api/workers/register', data);
  return response.data;
};

export const getWorker = async (workerId) => {
  const response = await api.get(`/api/workers/${workerId}`);
  return response.data;
};

export const getWorkerDashboard = async (workerId) => {
  const response = await api.get(`/api/workers/${workerId}/dashboard`);
  return response.data;
};

// ── Policy endpoints ────────────────────────────
export const subscribePlan = async (data) => {
  const response = await api.post('/api/policies/subscribe', data);
  return response.data;
};

export const getActivePlan = async (workerId) => {
  const response = await api.get(`/api/policies/${workerId}/active`);
  return response.data;
};

export const getPlans = async () => {
  const response = await api.get('/api/policies/plans');
  return response.data;
};

// ── Claims endpoints ────────────────────────────
export const getClaims = async (workerId) => {
  const response = await api.get(`/api/claims/${workerId}`);
  return response.data;
};

// ── Payouts endpoints ───────────────────────────
export const getPayouts = async (workerId) => {
  const response = await api.get(`/api/payouts/${workerId}`);
  return response.data;
};

// ── Weather endpoints ───────────────────────────
export const getWeather = async (zone) => {
  const response = await api.get(`/api/weather/${zone}`);
  return response.data;
};

export const getWeatherForecast = async (zone) => {
  const response = await api.get(`/api/weather/${zone}/forecast`);
  return response.data;
};

export const getZoneRisk = async (zone) => {
  const response = await api.get(`/api/weather/${zone}/risk`);
  return response.data;
};

// ── Admin endpoints ─────────────────────────────
export const getAdminDashboard = async () => {
  const response = await api.get('/api/admin/dashboard');
  return response.data;
};

export const getAdminClaims = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const response = await api.get(`/api/admin/claims?${params.toString()}`);
  return response.data;
};

export const getAdminEvents = async () => {
  const response = await api.get('/api/admin/events');
  return response.data;
};

export const getAdminAnalytics = async () => {
  const response = await api.get('/api/admin/analytics');
  return response.data;
};

export const simulateDisruption = async (data) => {
  const response = await api.post('/api/admin/simulate-disruption', data);
  return response.data;
};

export const reviewAdminClaim = async (claimId, action) => {
  const response = await api.post(`/api/admin/claims/${claimId}/decision?action=${action}`);
  return response.data;
};

export const processManualAdminPayout = async (claimId) => {
  const response = await api.post(`/api/admin/claims/${claimId}/manual-payout`);
  return response.data;
};

// ── Trigger endpoints ───────────────────────────
export const checkTriggers = async () => {
  const response = await api.post('/api/triggers/check');
  return response.data;
};

export const getActiveTriggers = async () => {
  const response = await api.get('/api/triggers/active');
  return response.data;
};

// ── Real-time endpoints ─────────────────────────
export const getNotifications = async (limit = 50) => {
  const response = await api.get(`/api/realtime/notifications?limit=${limit}`);
  return response.data;
};

export const getMonitorStatus = async () => {
  const response = await api.get('/api/realtime/status');
  return response.data;
};

export const startMonitor = async () => {
  const response = await api.post('/api/realtime/start');
  return response.data;
};

export const stopMonitor = async () => {
  const response = await api.post('/api/realtime/stop');
  return response.data;
};

export const getAdminForecast = async () => {
  const response = await api.get('/api/admin/forecast');
  return response.data;
};

// ── SSE real-time events ────────────────────────
export const connectToRealtimeEvents = (onEvent, onError) => {
  const eventSource = new EventSource(`${API_BASE_URL || ''}/api/realtime/events`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);
    } catch (e) {
      console.error('SSE parse error:', e);
    }
  };

  eventSource.addEventListener('weather_update', (event) => {
    onEvent({ ...JSON.parse(event.data), type: 'weather_update' });
  });

  eventSource.addEventListener('disruption_detected', (event) => {
    onEvent({ ...JSON.parse(event.data), type: 'disruption_detected' });
  });

  eventSource.addEventListener('claims_created', (event) => {
    onEvent({ ...JSON.parse(event.data), type: 'claims_created' });
  });

  eventSource.addEventListener('payout_processed', (event) => {
    onEvent({ ...JSON.parse(event.data), type: 'payout_processed' });
  });

  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    if (onError) onError(error);
  };

  return eventSource;
};

export default api;
