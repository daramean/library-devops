import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// ── Axios Instance ────────────────────────────────────
const BASE_API_URL = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  return envUrl ? envUrl.replace(/\/+$/, '') : '/api/v1';
})();

const refreshClient = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
});

export const api = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
});

export const normalizeCoverUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('blob:')) return url;

  const trimmed = url.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/\\s+/g, '');
  const lower = normalized.toLowerCase();
  if (['n/a', 'null'].includes(lower)) return null;

  const uploadsIndex = normalized.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return normalized.slice(uploadsIndex);
  }
  if (normalized.startsWith('uploads/')) {
    return `/${normalized}`;
  }

  return normalized;
};

export { BASE_API_URL };

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  config.headers = config.headers || {};

  if (config.data instanceof FormData) {
    // Let axios set the multipart boundary for FormData uploads.
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    // Don't try to refresh token if we're in the login/register endpoint or already retried
    const isAuthEndpoint = original.url?.includes('/auth/login') || original.url?.includes('/auth/register');
    
    if (err.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refreshToken');
        const { data } = await refreshClient.post('/auth/refresh', { refreshToken: refresh });
        localStorage.setItem('accessToken',  data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth Context ──────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = data.data;
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.clear();
    setUser(null);
    toast.success('Logged out');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
