// ── Centralized API Client ────────────────────────────────────────────────────
// Injects x-user-id header from session. Never exposes internal errors to UI.

import axios, { AxiosInstance, AxiosError } from 'axios';

const SESSION_KEY = 'campus_demo_user_id';

export function getCurrentUserId(): string {
  return sessionStorage.getItem(SESSION_KEY) || 'usr-student-001';
}

export function setCurrentUserId(id: string): void {
  sessionStorage.setItem(SESSION_KEY, id);
}

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: '/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Inject demo user identity header on every request
  instance.interceptors.request.use((config) => {
    const userId = getCurrentUserId();
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
    return config;
  });

  // Normalize errors — never expose raw stack traces or internal details
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; error?: string | { message?: string } }>) => {
      const status = error.response?.status;
      const serverError = error.response?.data?.error;
      const serverMessage =
        error.response?.data?.message ||
        (typeof serverError === 'string' ? serverError : serverError?.message);

      let userMessage = 'Something went wrong. Please try again.';

      if (status === 401) {
        userMessage = 'You need to be signed in to do that.';
      } else if (status === 403) {
        userMessage = serverMessage || 'You do not have permission to perform this action.';
      } else if (status === 404) {
        userMessage = serverMessage || 'The requested resource was not found.';
      } else if (status === 400) {
        userMessage = serverMessage || 'Invalid request. Please check your input.';
      } else if (status === 429) {
        userMessage = 'Too many requests. Please slow down.';
      } else if (status && status >= 500) {
        userMessage = 'Server error. Please try again later.';
      } else if (!status) {
        userMessage = 'Network error. Check your connection.';
      } else if (serverMessage) {
        userMessage = serverMessage;
      }

      // Return normalized error without leaking internals
      const normalized = new Error(userMessage) as Error & { status?: number };
      normalized.status = status;
      return Promise.reject(normalized);
    }
  );

  return instance;
}

export const api = createApiClient();
