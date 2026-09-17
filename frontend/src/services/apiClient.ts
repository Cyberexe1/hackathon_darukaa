import axios from 'axios';

// Base URL for the future FastAPI backend. Falls back to a relative path
// so the client builds cleanly even without an env var configured yet.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT bearer token (if present) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('darukaa_auth_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized 401 handling: clear the stale token so ProtectedRoute can
// redirect to /signin on the next render.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('darukaa_auth_token');
    }
    return Promise.reject(error);
  },
);
