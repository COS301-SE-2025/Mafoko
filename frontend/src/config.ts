// In frontend/src/config.ts

const AUTH_SERVICE_URL: string =
  import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8001';
const SEARCH_SERVICE_URL: string =
  import.meta.env.VITE_SEARCH_SERVICE_URL || 'http://localhost:8002';
const ANALYTICS_SERVICE_URL: string =
  import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:8003';
const LINGUIST_APP_SERVICE_URL: string =
  import.meta.env.VITE_LINGUIST_APP_SERVICE_URL || 'http://localhost:8004';
const VOTE_SERVICE_URL: string =
  import.meta.env.VITE_VOTE_SERVICE_URL || 'http://localhost:8005';
const GLOSSARY_SERVICE_URL: string =
  import.meta.env.VITE_GLOSSARY_SERVICE_URL || 'http://localhost:8006';
const WORKSPACE_SERVICE_URL: string =
  import.meta.env.VITE_WORKSPACE_SERVICE_URL || 'http://localhost:8007';
const TERM_SERVICE_URL: string =
  String(import.meta.env.VITE_TERM_SERVICE_URL || 'http://localhost:8008');
const COMMENT_SERVICE_URL: string =
  String(import.meta.env.VITE_COMMENT_SERVICE_URL || 'http://localhost:8009');

export const API_ENDPOINTS = {
  // --- Auth Service ---
  login: `${AUTH_SERVICE_URL}/api/v1/auth/login`,
  register: `${AUTH_SERVICE_URL}/api/v1/auth/register`,
  getMe: `${AUTH_SERVICE_URL}/api/v1/auth/me`,
  generateSignedUrl: `${AUTH_SERVICE_URL}/api/v1/uploads/generate-signed-url`,
  getAll: `${AUTH_SERVICE_URL}/api/v1/admin/users`,
  updateUserRole: (userId: string) =>
    `${AUTH_SERVICE_URL}/api/v1/admin/users/${userId}/role`,

  // --- Linguist Application Service ---
  createApplication: `${LINGUIST_APP_SERVICE_URL}/api/v1/linguist-applications/`,
  getUserUploads: (userId: string) =>
    `${AUTH_SERVICE_URL}/api/v1/admin/users/${userId}/uploads`,
  getSignedDownloadUrl: (gcsKey: string) =>
    `${AUTH_SERVICE_URL}/api/v1/admin/download-url?gcs_key=${encodeURIComponent(gcsKey)}`,
  getUsersWithUploads: () =>
    `${AUTH_SERVICE_URL}/api/v1/admin/users-with-uploads`,

  // --- Search Service ---
  search: `${SEARCH_SERVICE_URL}/api/v1/search`,
  suggest: `${SEARCH_SERVICE_URL}/api/v1/suggest`,

  // --- Analytics Service ---
  descriptiveAnalytics: `${ANALYTICS_SERVICE_URL}/api/v1/analytics/descriptive`,
  categoryFrequency: `${ANALYTICS_SERVICE_URL}/api/v1/analytics/descriptive/category-frequency`,
  languageCoverage: `${ANALYTICS_SERVICE_URL}/api/v1/analytics/descriptive/language-coverage`,
  popularTerms: (limit?: number, domain?: string, language?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (domain) params.append('domain', domain);
    if (language) params.append('language', language);
    const queryString = params.toString();
    return `${ANALYTICS_SERVICE_URL}/api/v1/analytics/descriptive/popular-terms${queryString ? `?${queryString}` : ''}`;
  },
  totalStatistics: `${ANALYTICS_SERVICE_URL}/api/v1/analytics/descriptive/total-statistics`,
  uniqueTerms: `${ANALYTICS_SERVICE_URL}/api/v1/analytics/descriptive/unique-terms`,

  submitVote: `${VOTE_SERVICE_URL}/api/v1/votes/`,

  // --- Glossary Service ---
  glossary: `${GLOSSARY_SERVICE_URL}/api/v1/glossary`,
  glossaryCategories: `${GLOSSARY_SERVICE_URL}/api/v1/glossary/categories`,
  glossaryTermsByCategory: (category: string) =>
    `${GLOSSARY_SERVICE_URL}/api/v1/glossary/categories/${encodeURIComponent(category)}/terms`,
  glossaryTermTranslations: (termId: string) =>
    `${GLOSSARY_SERVICE_URL}/api/v1/glossary/terms/${encodeURIComponent(termId)}/translations`,
  glossarySearch: `${GLOSSARY_SERVICE_URL}/api/v1/glossary/search`,
  glossaryLanguages: `${GLOSSARY_SERVICE_URL}/api/v1/glossary/languages`,
  glossaryRandom: `${GLOSSARY_SERVICE_URL}/api/v1/glossary/random`,

  // --- Workspace Service ---
  bookmarkTerm: `${WORKSPACE_SERVICE_URL}/api/v1/workspace/bookmarks/terms`,
  unbookmarkTerm: (termId: string) =>
    `${WORKSPACE_SERVICE_URL}/api/v1/workspace/bookmarks/terms/${termId}`,
  bookmarkGlossary: `${WORKSPACE_SERVICE_URL}/api/v1/workspace/bookmarks/glossaries`,
  unbookmarkGlossary: (domain: string) =>
    `${WORKSPACE_SERVICE_URL}/api/v1/workspace/bookmarks/glossaries/${encodeURIComponent(domain)}`,
  createGroup: `${WORKSPACE_SERVICE_URL}/api/v1/workspace/groups`,
  getGroups: `${WORKSPACE_SERVICE_URL}/api/v1/workspace/groups`,
  addItemToGroup: (groupId: string) =>
    `${WORKSPACE_SERVICE_URL}/api/v1/workspace/groups/${groupId}/items`,
  searchWorkspace: `${WORKSPACE_SERVICE_URL}/api/v1/workspace/search`,
  workspaceOverview: `${WORKSPACE_SERVICE_URL}/api/v1/workspace/overview`,
  bulkDelete: `${WORKSPACE_SERVICE_URL}/api/v1/workspace/bulk`,

  // --- Term Service ---
  getTermDetail: (termId: string) =>
    `${TERM_SERVICE_URL}/api/v1/terms/${termId}`,
  getTermTranslations: (termId: string) =>
    `${TERM_SERVICE_URL}/api/v1/terms/${termId}/translations`,

  // --- Comment Service ---
  getComments: (termId: string) =>
    `${COMMENT_SERVICE_URL}/api/v1/comments?term_id=${termId}`,
  postComment: `${COMMENT_SERVICE_URL}/api/v1/comments`,
  deleteComment: (commentId: string) =>
    `${COMMENT_SERVICE_URL}/api/v1/comments/${commentId}`,

  // --- Vote Service ---
  voteOnTerm: `${VOTE_SERVICE_URL}/api/v1/votes/terms`,
  voteOnComment: `${VOTE_SERVICE_URL}/api/v1/votes/comments`,
};