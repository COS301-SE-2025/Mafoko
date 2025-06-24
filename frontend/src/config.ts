// In frontend/src/config.ts

// Base URLs for each microservice
const AUTH_SERVICE_URL =
  (import.meta.env.VITE_AUTH_SERVICE_URL as string) || 'http://localhost:8001';
const SEARCH_SERVICE_URL =
  (import.meta.env.VITE_SEARCH_SERVICE_URL as string) ||
  'http://localhost:8002';
const ANALYTICS_SERVICE_URL =
  (import.meta.env.VITE_ANALYTICS_SERVICE_URL as string) ||
  'http://localhost:8003';
// Add the URL for your new service, pointing to the port defined in docker-compose.yml
const LINGUIST_APP_SERVICE_URL =
  (import.meta.env.VITE_LINGUIST_APP_SERVICE_URL as string) ||
  'http://localhost:8004';

const VOTE_SERVICE_URL =
  (import.meta.env.VITE_VOTE_SERVICE_URL as string) || 'http://localhost:8005';

export const API_ENDPOINTS = {
  // --- Auth Service ---
  login: `${AUTH_SERVICE_URL}/api/v1/auth/login`,
  register: `${AUTH_SERVICE_URL}/api/v1/auth/register`,
  getMe: `${AUTH_SERVICE_URL}/api/v1/auth/me`,
  generateSignedUrl: `${AUTH_SERVICE_URL}/api/v1/uploads/generate-signed-url`,
  getAll: `${AUTH_SERVICE_URL}/api/v1/admin/users`,
  updateUserRole: (userId: string) =>
    `${AUTH_SERVICE_URL}/api/v1/admin/users/${userId}/role`,
  // --- Linguist Application Service --- (NEW SECTION)
  createApplication: `${LINGUIST_APP_SERVICE_URL}/api/v1/applications/`,

  // --- Search Service ---
  search: `${SEARCH_SERVICE_URL}/api/v1/search`,
  suggest: `${SEARCH_SERVICE_URL}/api/v1/suggest`,

  // --- Analytics Service ---
  descriptiveAnalytics: `${ANALYTICS_SERVICE_URL}/api/v1/analytics/descriptive`,

  submitVote: `${VOTE_SERVICE_URL}/api/v1/votes/`,
};
