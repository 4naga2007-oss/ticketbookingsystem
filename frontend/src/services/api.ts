/**
 * Centralized API service layer — all HTTP communication goes through here.
 * Handles JWT, error normalization, and base URL.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';

const BASE_URL = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL ?? 'http://localhost:5000/api';

/** Create the shared Axios instance */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ─── Request interceptor: attach JWT ────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: normalize errors ──────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const status  = error.response?.status;
    const message = error.response?.data?.message
                 || error.response?.data?.error
                 || error.message
                 || 'An unexpected error occurred';

    if (status === 401) {
      // Token expired / invalid — clear local auth state
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Only redirect if not already on auth pages
      const isAuthPage = ['/login', '/register'].includes(window.location.pathname);
      if (!isAuthPage) window.location.href = '/login';
    }

    return Promise.reject(new ApiError(message, status ?? 0, error.response?.data));
  }
);

/** Structured API error with HTTP status */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
