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

const COMMENT_SERVICE_URL =
  (import.meta.env.VITE_COMMENT_SERVICE_URL as string) ||
  'http://localhost:8008';
const WORKSPACE_SERVICE_URL =
  (import.meta.env.VITE_WORKSPACE_SERVICE_URL as string) ||
  'http://localhost:8009';
const FEEDBACK_SERVICE_URL =
  (import.meta.env.VITE_FEEDBACK_SERVICE_URL as string) ||
  'http://localhost:8010';

const TERM_ADDITION_SERVICE_URL =
  (import.meta.env.VITE_TERM_ADDITION_SERVICE_URL as string) ||
  'http://localhost:8011';

const LEARNING_SERVICE_URL =
  (import.meta.env.VITE_LEARNING_SERVICE_URL as string) ||
  'http://localhost:8012';

const GAMIFICATION_SERVICE_URL =
  (import.meta.env.VITE_GAMIFICATION_SERVICE_URL as string) ||
  'http://localhost:8013';

// Smart endpoint generator
const endpoint = (serviceUrl: string, path: string): string =>
  import.meta.env.PROD ? `${API_GATEWAY_URL}${path}` : `${serviceUrl}${path}`;

interface APIEndpoints {
  login: string;
  register: string;
  loginWithGoogle: string;
  getMe: string;
  updateMe: string;
  updateProfile: string;
  updateProfilePicture: string;
  generateSignedUrl: string;
  generateProfilePictureUploadUrl: string;
  getMyProfilePictureUrl: string;
  forgotPassword: string;
  resetPassword: string;
  // Settings endpoints
  getUserPreferences: string;
  updateUserPreferences: string;
  resetUserPreferences: string;
  getAll: string;
  updateUserRole: (userId: string) => string;
  ApproveApplicationStatus: (applicationId: string) => string;
  RejectApplicationStatus: (applicationId: string) => string;
  createApplication: string;
  getAllApplications: string;
  getLinguistApplication: string;
  getUserUploads: (userId: string) => string;
  getSignedDownloadUrl: (gcsKey: string) => string;
  getUsersWithUploads: () => string;
  search: string;
  suggest: string;
  getAllTermsForOffline: string;
  descriptiveAnalytics: string;
  categoryFrequency: (language?: string) => string;
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
  // Term Addition Service
  submitTerm: string;
  submitTermWithTranslations: string;
  getMySubmittedTerms: string;
  getEditableTerms: string;
  getPendingVerificationTerms: string;
  voteForTerm: (termId: string) => string;
  getAllTermApplications: string;
  getTermReviews: (termId: string) => string;
  getAttributes: string;
  getTerm: (termId: string) => string;
  getTermsByIds: string;
  deleteTermApplication: (applicationId: string) => string;
  // Linguist Endpoints
  getLinguistReviewSubmissions: string;
  linguistVerifyApplication: (applicationId: string) => string;
  linguistRejectApplication: (applicationId: string) => string;
  getAllAdminVerifiedTerms: string;
  // Admin Endpoints
  getAdminApplicationsForApproval: string;
  adminApproveApplication: (applicationId: string) => string;
  adminRejectApplication: (applicationId: string) => string;

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
  // --- Feedback Service ---
  submitFeedback: string;
  getMyFeedback: string;
  getFeedback: (feedbackId: string) => string;
  getAllFeedback: string;
  updateFeedback: (feedbackId: string) => string;
  deleteFeedback: (feedbackId: string) => string;
  getFeedbackStats: string;
  searchFeedback: string;
  // --- Gamification Service ---
  addXP: string;
  getUserXPRecords: (userId: string) => string;
  getUserLoginStreak: (userId: string) => string;
  getUserLevel: (userId: string) => string;
  recalculateUserLevel: (userId: string) => string;
  getAllAchievements: string;
  getUserAchievements: (userId: string) => string;
  checkUserAchievements: (userId: string) => string;

  //-- LEARNING PATH SERVICE ---
  getLearningDashboard: string;
  updateLearningProgress: string;
  getGlossaryProgress: (languageCode: string) => string;
  getStudySessionWords: (languageCode: string, glossaryName: string) => string;
  learningPaths: string;
  learningPathDetail: (pathId: string) => string;
  getRandomTerms: (languageCode: string) => string;
  getWordCounts: string;
  updateSessionProgress: string;
}

export const API_ENDPOINTS: APIEndpoints = {
  // --- Auth Service ---
  register: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/register'),
  login: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/login'),
  loginWithGoogle: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/google-login'),
  getMe: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/me'),
  updateMe: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/me'),
  updateProfile: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/me'),
  updateProfilePicture: endpoint(
    AUTH_SERVICE_URL,
    '/api/v1/auth/me/profile-picture',
  ),
  generateSignedUrl: endpoint(
    AUTH_SERVICE_URL,
    '/api/v1/uploads/generate-signed-url',
  ),
  generateProfilePictureUploadUrl: endpoint(
    AUTH_SERVICE_URL,
    '/api/v1/auth/profile-picture/upload-url',
  ),
  getMyProfilePictureUrl: endpoint(
    AUTH_SERVICE_URL,
    '/api/v1/auth/me/profile-picture',
  ),

  forgotPassword: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/forgot-password'),
  resetPassword: endpoint(AUTH_SERVICE_URL, '/api/v1/auth/reset-password'),

  // Settings endpoints
  getUserPreferences: endpoint(
    AUTH_SERVICE_URL,
    '/api/v1/settings/preferences',
  ),
  updateUserPreferences: endpoint(
    AUTH_SERVICE_URL,
    '/api/v1/settings/preferences',
  ),
  resetUserPreferences: endpoint(
    AUTH_SERVICE_URL,
    '/api/v1/settings/preferences/reset',
  ),

  getAll: endpoint(AUTH_SERVICE_URL, '/api/v1/admin/users'),
  updateUserRole: (userId: string) =>
    endpoint(AUTH_SERVICE_URL, `/api/v1/admin/users/${userId}/role`),

  // --- Linguist Application Service ---
  getAllApplications: endpoint(
    LINGUIST_APP_SERVICE_URL,
    '/api/v1/linguist-applications/all',
  ),
  createApplication: endpoint(
    LINGUIST_APP_SERVICE_URL,
    '/api/v1/linguist-applications',
  ),
  getLinguistApplication: endpoint(
    LINGUIST_APP_SERVICE_URL,
    '/api/v1/linguist-applications/me_application',
  ),

  ApproveApplicationStatus(applicationId) {
    return endpoint(
      LINGUIST_APP_SERVICE_URL,
      `/api/v1/linguist-applications/${applicationId}/approve`,
    );
  },
  RejectApplicationStatus(applicationId) {
    return endpoint(
      LINGUIST_APP_SERVICE_URL,
      `/api/v1/linguist-applications/${applicationId}/reject`,
    );
  },
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
  getAllTermsForOffline: endpoint(
    SEARCH_SERVICE_URL,
    '/api/v1/terms/all-for-offline',
  ),
  // --- Analytics Service ---
  descriptiveAnalytics: endpoint(
    ANALYTICS_SERVICE_URL,
    '/api/v1/analytics/descriptive',
  ),
  categoryFrequency: (language?: string) => {
    const params = new URLSearchParams();
    if (language) params.append('language', language);
    const queryString = params.toString();
    return endpoint(
      ANALYTICS_SERVICE_URL,
      `/api/v1/analytics/descriptive/category-frequency${queryString ? `?${queryString}` : ''}`,
    );
  },
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

  submitTerm: endpoint(TERM_ADDITION_SERVICE_URL, '/api/v1/terms/submit'),
  submitTermWithTranslations: endpoint(
    TERM_ADDITION_SERVICE_URL,
    '/api/v1/terms/submit-with-translations',
  ),
  getMySubmittedTerms: endpoint(
    TERM_ADDITION_SERVICE_URL,
    '/api/v1/terms/my-submitted',
  ),
  getEditableTerms: endpoint(
    TERM_ADDITION_SERVICE_URL,
    '/api/v1/terms/editable',
  ),
  getPendingVerificationTerms: endpoint(
    TERM_ADDITION_SERVICE_URL,
    '/api/v1/term-applications/pending-verification',
  ),
  getAllTermApplications: endpoint(
    TERM_ADDITION_SERVICE_URL,
    '/api/v1/term-applications/all',
  ),
  getTermReviews: (termId: string) =>
    endpoint(TERM_ADDITION_SERVICE_URL, `/api/v1/terms/${termId}/reviews`),
  voteForTerm: (termId: string) =>
    endpoint(
      TERM_ADDITION_SERVICE_URL,
      `/api/v1/term-applications/${termId}/vote`,
    ),
  getAttributes: endpoint(
    TERM_ADDITION_SERVICE_URL,
    `/api/v1/terms/attributes`,
  ),
  getAllAdminVerifiedTerms: endpoint(
    TERM_ADDITION_SERVICE_URL,
    `/api/v1/terms/admin-verified`,
  ),
  getTerm: (termId: string) =>
    endpoint(TERM_ADDITION_SERVICE_URL, `/api/v1/terms/${termId}`),
  getTermsByIds: endpoint(
    TERM_ADDITION_SERVICE_URL,
    `/api/v1/terms/terms-by-ids`,
  ),
  deleteTermApplication: (applicationId: string) =>
    endpoint(
      TERM_ADDITION_SERVICE_URL,
      `/api/v1/term-applications/${applicationId}`,
    ),

  // Linguist Endpoints
  getLinguistReviewSubmissions: endpoint(
    TERM_ADDITION_SERVICE_URL,
    '/api/v1/linguist/terms/applications-for-review',
  ),
  linguistVerifyApplication: (applicationId: string) =>
    endpoint(
      TERM_ADDITION_SERVICE_URL,
      `/api/v1/linguist/terms/${applicationId}/verify`,
    ),
  linguistRejectApplication: (applicationId: string) =>
    endpoint(
      TERM_ADDITION_SERVICE_URL,
      `/api/v1/linguist/terms/${applicationId}/reject`,
    ),

  // Admin Endpoints
  getAdminApplicationsForApproval: endpoint(
    TERM_ADDITION_SERVICE_URL,
    '/api/v1/admin/terms/applications-for-approval',
  ),
  adminApproveApplication: (applicationId: string) =>
    endpoint(
      TERM_ADDITION_SERVICE_URL,
      `/api/v1/admin/terms/${applicationId}/approve`,
    ),
  adminRejectApplication: (applicationId: string) =>
    endpoint(
      TERM_ADDITION_SERVICE_URL,
      `/api/v1/admin/terms/${applicationId}/reject`,
    ),
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

  // --- Feedback Service ---
  submitFeedback: endpoint(FEEDBACK_SERVICE_URL, '/api/v1/feedback/'),
  getMyFeedback: endpoint(FEEDBACK_SERVICE_URL, '/api/v1/feedback/my-feedback'),
  getFeedback: (feedbackId: string) =>
    endpoint(FEEDBACK_SERVICE_URL, `/api/v1/feedback/${feedbackId}`),
  getAllFeedback: endpoint(FEEDBACK_SERVICE_URL, '/api/v1/feedback/'),
  updateFeedback: (feedbackId: string) =>
    endpoint(FEEDBACK_SERVICE_URL, `/api/v1/feedback/${feedbackId}`),
  deleteFeedback: (feedbackId: string) =>
    endpoint(FEEDBACK_SERVICE_URL, `/api/v1/feedback/${feedbackId}`),
  getFeedbackStats: endpoint(
    FEEDBACK_SERVICE_URL,
    '/api/v1/feedback/admin/stats',
  ),
  searchFeedback: endpoint(FEEDBACK_SERVICE_URL, '/api/v1/feedback/search/'),
  // --- Gamification Service ---
  addXP: endpoint(GAMIFICATION_SERVICE_URL, '/api/v1/xp/add-xp'),
  getUserXPRecords: (userId: string) =>
    endpoint(
      GAMIFICATION_SERVICE_URL,
      `/api/v1/xp/user/${encodeURIComponent(userId)}/xp-records`,
    ),
  getUserLoginStreak: (userId: string) =>
    endpoint(
      GAMIFICATION_SERVICE_URL,
      `/api/v1/xp/user/${encodeURIComponent(userId)}/login-streak`,
    ),
  getUserLevel: (userId: string) =>
    endpoint(
      GAMIFICATION_SERVICE_URL,
      `/api/v1/levels/user/${encodeURIComponent(userId)}/level`,
    ),
  recalculateUserLevel: (userId: string) =>
    endpoint(
      GAMIFICATION_SERVICE_URL,
      `/api/v1/levels/user/${encodeURIComponent(userId)}/recalculate-level`,
    ),
  getAllAchievements: endpoint(
    GAMIFICATION_SERVICE_URL,
    '/api/v1/achievements/',
  ),
  getUserAchievements: (userId: string) =>
    endpoint(
      GAMIFICATION_SERVICE_URL,
      `/api/v1/achievements/user/${encodeURIComponent(userId)}`,
    ),
  checkUserAchievements: (userId: string) =>
    endpoint(
      GAMIFICATION_SERVICE_URL,
      `/api/v1/achievements/user/${encodeURIComponent(userId)}/check`,
    ),

  // --- Learning Service ---
  getLearningDashboard: endpoint(
    LEARNING_SERVICE_URL,
    '/api/v1/learning/dashboard',
  ),
  updateLearningProgress: endpoint(
    LEARNING_SERVICE_URL,
    '/api/v1/learning/progress',
  ),
  learningPaths: endpoint(LEARNING_SERVICE_URL, '/api/v1/learning/paths'),
  // UPDATE and DELETE a specific learning path
  learningPathDetail: (pathId: string) =>
    endpoint(LEARNING_SERVICE_URL, `/api/v1/learning/paths/${pathId}`),
  // Kept for the "Create Path" modal
  getGlossaryProgress: (languageCode: string) =>
    endpoint(
      LEARNING_SERVICE_URL,
      `/api/v1/learning/languages/${languageCode}/glossaries`,
    ),
  // Kept for study sessions
  getStudySessionWords: (languageCode: string, glossaryName: string) =>
    endpoint(
      LEARNING_SERVICE_URL,
      `/api/v1/learning/languages/${encodeURIComponent(languageCode)}/glossaries/${encodeURIComponent(glossaryName)}/words`,
    ),
  getRandomTerms: (languageCode: string) =>
    endpoint(
      LEARNING_SERVICE_URL,
      `/api/v1/learning/languages/${encodeURIComponent(languageCode)}/random-terms`,
    ),
  getWordCounts: endpoint(
    LEARNING_SERVICE_URL,
    '/api/v1/learning/glossaries/word-counts',
  ),
  updateSessionProgress: endpoint(
    LEARNING_SERVICE_URL,
    '/api/v1/learning/session-progress',
  ),
};
