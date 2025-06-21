// In frontend/src/config.ts
const AUTH_SERVICE_URL =
  (import.meta.env.VITE_AUTH_SERVICE_URL as string) || 'http://localhost:8001';
const SEARCH_SERVICE_URL =
  (import.meta.env.VITE_SEARCH_SERVICE_URL as string) ||
  'http://localhost:8002';
const ANALYTICS_SERVICE_URL =
  (import.meta.env.VITE_ANALYTICS_SERVICE_URL as string) ||
  'http://localhost:8003';

export const API_ENDPOINTS = {
  // Auth Service
  login: `${AUTH_SERVICE_URL}/api/v1/auth/login`,
  register: `${AUTH_SERVICE_URL}/api/v1/auth/register`,
  getMe: `${AUTH_SERVICE_URL}/api/v1/auth/me`,

  // Search Service
  search: `${SEARCH_SERVICE_URL}/api/v1/search`,
  suggest: `${SEARCH_SERVICE_URL}/api/v1/suggest`,

  // Analytics Service
  descriptiveAnalytics: `${ANALYTICS_SERVICE_URL}/api/v1/analytics/descriptive`,

  generateSignedUrl: '/api/generate-signed-url',
};
