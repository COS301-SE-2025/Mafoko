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

const TERM_SERVICE_URL =
  (import.meta.env.VITE_TERM_SERVICE_URL as string) || 'http://localhost:8007';
const COMMENT_SERVICE_URL =
  (import.meta.env.VITE_COMMENT_SERVICE_URL as string) ||
  'http://localhost:8008'; // Changed to 8008
const WORKSPACE_SERVICE_URL =
  (import.meta.env.VITE_WORKSPACE_SERVICE_URL as string) ||
  'http://localhost:8009';

// Smart endpoint generator
const endpoint = (serviceUrl: string, path: string): string =>
  import.meta.env.PROD ? `${API_GATEWAY_URL}${path}` : `${serviceUrl}${path}`;

interface APIEndpoints {
  login: string;
  register: string;
  loginWithGoogle: string;
  forgotPassword: string;
  resetPassword: string;
  verifyEmail: string;
  resendVerification: string;
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
  categoryFrequency: string;
  languageCoverage: string;
  popularTerms: (limit?: number, domain?: string, language?: string) => string;
  totalStatistics: string;
  uniqueTerms: string;
  submitVote: string;
  voteOnTerm: string;
  voteOnComment: string;
  glossary: string;
  glossaryCategories: string;
  glossaryCategoriesStats: string;
  glossaryTermsByCategory: (category: string) => string;
  glossaryTermTranslations: (termId: string) => string;
  glossarySearch: string;
  glossaryAdvancedSearch: string;
  glossaryLanguages: string;
  glossaryRandom: string;
  getTermDetail: (termId: string) => string;
  getTermTranslations: (termId: string) => string;
  getComments: (termId: string) => string;
  postComment: string;
  editComment: (commentId: string) => string;
  deleteComment: (commentId: string) => string;
  // --- Workspace Service ---
  getBookmarks: string;
  bookmarkTerm: string;
  unbookmarkTerm: (termId: string) => string;
  bookmarkGlossary: string;
  unbookmarkGlossary: (domain: string) => string;
  searchBookmarks: string;
  createGroup: string;
  getUserGroups: string;
  getGroupWithTerms: (groupId: string) => string;
  updateGroup: (groupId: string) => string;
  deleteGroup: (groupId: string) => string;
  addTermsToGroup: (groupId: string) => string;
  removeTermFromGroup: (groupId: string, termId: string) => string;
  bulkDeleteGroups: string;
  createNote: string;
  getUserNotes: string;
  getNote: (noteId: string) => string;
  updateNote: (noteId: string) => string;
  deleteNote: (noteId: string) => string;
  getNoteByTerm: (termId: string) => string;
  updateBookmarkNote: string;
}

export const API_ENDPOINTS: APIEndpoints = {
  // --- Auth Service ---
  register: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/register'),
  login: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/login'),
  loginWithGoogle: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/google-login'),
  forgotPassword: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/forgot-password'),
  resetPassword: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/reset-password'),
  verifyEmail: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/verify-email'),
  resendVerification: endpoint(
    AUTH_SERVICE_URL,
    '/api/v1/auth/resend-verification',
  ),
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
    '/api/v1/linguist-applications',
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
  categoryFrequency: endpoint(
    ANALYTICS_SERVICE_URL,
    '/api/v1/analytics/descriptive/category-frequency',
  ),
  languageCoverage: endpoint(
    ANALYTICS_SERVICE_URL,
    '/api/v1/analytics/descriptive/language-coverage',
  ),
  popularTerms: (limit?: number, domain?: string, language?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (domain) params.append('domain', domain);
    if (language) params.append('language', language);
    const queryString = params.toString();
    return endpoint(
      ANALYTICS_SERVICE_URL,
      `/api/v1/analytics/descriptive/popular-terms${queryString ? `?${queryString}` : ''}`,
    );
  },
  totalStatistics: endpoint(
    ANALYTICS_SERVICE_URL,
    '/api/v1/analytics/descriptive/total-statistics',
  ),
  uniqueTerms: endpoint(
    ANALYTICS_SERVICE_URL,
    '/api/v1/analytics/descriptive/unique-terms',
  ),

  // --- Vote Service ---
  submitVote: endpoint(VOTE_SERVICE_URL, '/api/v1/votes/'),
  voteOnTerm: endpoint(VOTE_SERVICE_URL, '/api/v1/votes/terms'),
  voteOnComment: endpoint(VOTE_SERVICE_URL, '/api/v1/votes/comments'),

  // --- Glossary Service ---
  glossary: endpoint(GLOSSARY_SERVICE_URL, '/api/v1/glossary'),
  glossaryCategories: endpoint(
    GLOSSARY_SERVICE_URL,
    '/api/v1/glossary/categories',
  ),
  glossaryCategoriesStats: endpoint(
    GLOSSARY_SERVICE_URL,
    '/api/v1/glossary/categories/stats',
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
  glossaryAdvancedSearch: endpoint(
    GLOSSARY_SERVICE_URL,
    '/api/v1/glossary/search',
  ),
  glossaryLanguages: endpoint(
    GLOSSARY_SERVICE_URL,
    '/api/v1/glossary/languages',
  ),
  glossaryRandom: endpoint(GLOSSARY_SERVICE_URL, '/api/v1/glossary/random'),

  // --- Term Service ---
  getTermDetail: (termId: string) =>
    endpoint(TERM_SERVICE_URL, `/api/v1/terms/${termId}`),
  getTermTranslations: (termId: string) =>
    endpoint(TERM_SERVICE_URL, `/api/v1/terms/${termId}/translations`),

  // --- Comment Service ---
  getComments: (termId: string) =>
    endpoint(
      COMMENT_SERVICE_URL,
      `/api/v1/comments/by_term/${encodeURIComponent(termId)}`,
    ),
  postComment: endpoint(COMMENT_SERVICE_URL, '/api/v1/comments'),
  editComment: (commentId: string) =>
    endpoint(
      COMMENT_SERVICE_URL,
      `/api/v1/comments/${encodeURIComponent(commentId)}`,
    ),
  deleteComment: (commentId: string) =>
    endpoint(
      COMMENT_SERVICE_URL,
      `/api/v1/comments/${encodeURIComponent(commentId)}`,
    ),

  // --- Workspace Service ---
  getBookmarks: endpoint(WORKSPACE_SERVICE_URL, '/api/v1/workspace/bookmarks'),
  bookmarkTerm: endpoint(
    WORKSPACE_SERVICE_URL,
    '/api/v1/workspace/bookmarks/terms',
  ),
  unbookmarkTerm: (termId: string) =>
    endpoint(
      WORKSPACE_SERVICE_URL,
      `/api/v1/workspace/bookmarks/terms/${encodeURIComponent(termId)}`,
    ),
  bookmarkGlossary: endpoint(
    WORKSPACE_SERVICE_URL,
    '/api/v1/workspace/bookmarks/glossaries',
  ),
  unbookmarkGlossary: (domain: string) =>
    endpoint(
      WORKSPACE_SERVICE_URL,
      `/api/v1/workspace/bookmarks/glossaries/${encodeURIComponent(domain)}`,
    ),
  searchBookmarks: endpoint(
    WORKSPACE_SERVICE_URL,
    '/api/v1/workspace/bookmarks/search',
  ),
  createGroup: endpoint(WORKSPACE_SERVICE_URL, '/api/v1/workspace/groups'),
  getUserGroups: endpoint(WORKSPACE_SERVICE_URL, '/api/v1/workspace/groups'),
  getGroupWithTerms: (groupId: string) =>
    endpoint(
      WORKSPACE_SERVICE_URL,
      `/api/v1/workspace/groups/${encodeURIComponent(groupId)}`,
    ),
  updateGroup: (groupId: string) =>
    endpoint(
      WORKSPACE_SERVICE_URL,
      `/api/v1/workspace/groups/${encodeURIComponent(groupId)}`,
    ),
  deleteGroup: (groupId: string) =>
    endpoint(
      WORKSPACE_SERVICE_URL,
      `/api/v1/workspace/groups/${encodeURIComponent(groupId)}`,
    ),
  addTermsToGroup: (groupId: string) =>
    endpoint(
      WORKSPACE_SERVICE_URL,
      `/api/v1/workspace/groups/${encodeURIComponent(groupId)}/terms`,
    ),
  removeTermFromGroup: (groupId: string, termId: string) =>
    endpoint(
      WORKSPACE_SERVICE_URL,
      `/api/v1/workspace/groups/${encodeURIComponent(groupId)}/terms/${encodeURIComponent(termId)}`,
    ),
  bulkDeleteGroups: endpoint(
    WORKSPACE_SERVICE_URL,
    '/api/v1/workspace/groups/bulk-delete',
  ),
  createNote: endpoint(WORKSPACE_SERVICE_URL, '/api/v1/workspace/notes'),
  getUserNotes: endpoint(WORKSPACE_SERVICE_URL, '/api/v1/workspace/notes'),
  getNote: (noteId: string) =>
    endpoint(
      WORKSPACE_SERVICE_URL,
      `/api/v1/workspace/notes/${encodeURIComponent(noteId)}`,
    ),
  updateNote: (noteId: string) =>
    endpoint(
      WORKSPACE_SERVICE_URL,
      `/api/v1/workspace/notes/${encodeURIComponent(noteId)}`,
    ),
  deleteNote: (noteId: string) =>
    endpoint(
      WORKSPACE_SERVICE_URL,
      `/api/v1/workspace/notes/${encodeURIComponent(noteId)}`,
    ),
  getNoteByTerm: (termId: string) =>
    endpoint(
      WORKSPACE_SERVICE_URL,
      `/api/v1/workspace/notes/term/${encodeURIComponent(termId)}`,
    ),
  updateBookmarkNote: endpoint(
    WORKSPACE_SERVICE_URL,
    '/api/v1/workspace/notes/bookmark-note',
  ),
};
