// In frontend/src/config.ts

// For production
const API_GATEWAY_URL: string = import.meta.env.VITE_API_GATEWAY_URL as string;

// Local development
const AUTH_SERVICE_URL: string =
  (import.meta.env.VITE_AUTH_SERVICE_URL as string) || 'http://localhost:8001';
const SEARCH_SERVICE_URL: string =
  (import.meta.env.VITE_SEARCH_SERVICE_URL as string) ||
  'http://localhost:8002';
const ANALYTICS_SERVICE_URL: string =
  (import.meta.env.VITE_ANALYTICS_SERVICE_URL as string) ||
  'http://localhost:8003';
const LINGUIST_APP_SERVICE_URL: string =
  (import.meta.env.VITE_LINGUIST_APP_SERVICE_URL as string) ||
  'http://localhost:8004';
const VOTE_SERVICE_URL: string =
  (import.meta.env.VITE_VOTE_SERVICE_URL as string) || 'http://localhost:8005';
const GLOSSARY_SERVICE_URL: string =
  (import.meta.env.VITE_GLOSSARY_SERVICE_URL as string) ||
  'http://localhost:8006';

// Smart endpoint generator
const endpoint = (serviceUrl: string, path: string): string =>
  import.meta.env.PROD ? `${API_GATEWAY_URL}${path}` : `${serviceUrl}${path}`;

interface APIEndpoints {
  login: string;
  register: string;
  getMe: string;
  generateSignedUrl: string;
  getAll: string;
  updateUserRole: (userId: string) => string;
  createApplication: string;
  getUserUploads: (userId: string) => string;
  getSignedDownloadUrl: (gcsKey: string) => string;
  getUsersWithUploads: () => string;
  search: string;
  suggest: string;
  descriptiveAnalytics: string;
  submitVote: string;
  glossary: string;
  glossaryCategories: string;
  glossaryTermsByCategory: (category: string) => string;
  glossaryTermTranslations: (termId: string) => string;
  glossarySearch: string;
  glossaryLanguages: string;
  glossaryRandom: string;
}

export const API_ENDPOINTS: APIEndpoints = {
  // --- Auth Service ---
  login: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/login'),
  register: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/register'),
  getMe: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/me'),
  generateSignedUrl: endpoint(
    AUTH_SERVICE_URL,
    '/api/v1/uploads/generate-signed-url',
  ),
  getAll: endpoint(AUTH_SERVICE_URL, '/api/v1/admin/users'),
  updateUserRole: (userId: string) =>
    endpoint(AUTH_SERVICE_URL, `/api/v1/admin/users/${userId}/role`),

  // --- Linguist Application Service ---
  createApplication: endpoint(
    LINGUIST_APP_SERVICE_URL,
    '/api/v1/linguist-applications/',
  ),
  getUserUploads: (userId: string) =>
    endpoint(AUTH_SERVICE_URL, `/api/v1/admin/users/${userId}/uploads`),
  getSignedDownloadUrl: (gcsKey: string) =>
    endpoint(
      AUTH_SERVICE_URL,
      `/api/v1/admin/download-url?gcs_key=${encodeURIComponent(gcsKey)}`,
    ),
  getUsersWithUploads: () =>
    endpoint(AUTH_SERVICE_URL, '/api/v1/admin/users-with-uploads'),

  // --- Search Service ---
  search: endpoint(SEARCH_SERVICE_URL, '/api/v1/search'),
  suggest: endpoint(SEARCH_SERVICE_URL, '/api/v1/suggest'),

  // --- Analytics Service ---
  descriptiveAnalytics: endpoint(
    ANALYTICS_SERVICE_URL,
    '/api/v1/analytics/descriptive',
  ),

  // --- Vote Service ---
  submitVote: endpoint(VOTE_SERVICE_URL, '/api/v1/votes/'),

  // --- Glossary Service ---
  glossary: endpoint(GLOSSARY_SERVICE_URL, '/api/v1/glossary'),
  glossaryCategories: endpoint(
    GLOSSARY_SERVICE_URL,
    '/api/v1/glossary/categories',
  ),
  glossaryTermsByCategory: (category: string) =>
    endpoint(
      GLOSSARY_SERVICE_URL,
      `/api/v1/glossary/categories/${encodeURIComponent(category)}/terms`,
    ),
  glossaryTermTranslations: (termId: string) =>
    endpoint(
      GLOSSARY_SERVICE_URL,
      `/api/v1/glossary/terms/${encodeURIComponent(termId)}/translations`,
    ),
  glossarySearch: endpoint(GLOSSARY_SERVICE_URL, '/api/v1/glossary/search'),
  glossaryLanguages: endpoint(
    GLOSSARY_SERVICE_URL,
    '/api/v1/glossary/languages',
  ),
  glossaryRandom: endpoint(GLOSSARY_SERVICE_URL, '/api/v1/glossary/random'),
};
