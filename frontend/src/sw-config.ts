// src/sw-config.ts

let voteServiceUrl: string;
let commentServiceUrl: string;
let searchServiceUrl: string;
let authServiceUrl: string;
let feedbackServiceUrl: string;
let workspaceServiceUrl: string;

if (import.meta.env.PROD) {
  const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL as string;
  voteServiceUrl = gatewayUrl;
  commentServiceUrl = gatewayUrl;
  searchServiceUrl = gatewayUrl;
  authServiceUrl = gatewayUrl;
  feedbackServiceUrl = gatewayUrl;
  workspaceServiceUrl = gatewayUrl;
} else {
  voteServiceUrl = 'http://localhost:8005';
  commentServiceUrl = 'http://localhost:8008';
  searchServiceUrl = 'http://localhost:8002';
  authServiceUrl = 'http://localhost:8001';
  feedbackServiceUrl = 'http://localhost:8010';
  workspaceServiceUrl = 'http://localhost:8007';
}

export const SW_API_ENDPOINTS = {
  VOTES: `${voteServiceUrl}/api/v1/votes/terms/`,
  COMMENTS: `${commentServiceUrl}/api/v1/comments`,
  VOTE_ON_COMMENT: `${voteServiceUrl}/api/v1/votes/comments`,
  MANAGE_COMMENT: (commentId: string) =>
    `${commentServiceUrl}/api/v1/comments/${commentId}`,
  SEARCH_ALL_TERMS: `${searchServiceUrl}/api/v1/terms/all-for-offline`,
  PROFILE_PICTURE_UPLOAD_URL: `${authServiceUrl}/api/v1/auth/profile-picture/upload-url`,
  PROFILE_PICTURE_UPDATE: `${authServiceUrl}/api/v1/auth/me/profile-picture`,
  FEEDBACK: `${feedbackServiceUrl}/api/v1/feedback/`,
  // Workspace endpoints
  UPDATE_BOOKMARK_NOTE: `${workspaceServiceUrl}/api/v1/workspace/notes/bookmark-note`,
  CREATE_GROUP: `${workspaceServiceUrl}/api/v1/workspace/groups`,
  UPDATE_GROUP: `${workspaceServiceUrl}/api/v1/workspace/groups/`,
  DELETE_GROUP: `${workspaceServiceUrl}/api/v1/workspace/groups/`,
  // Settings endpoints
  UPDATE_USER_PREFERENCES: `${authServiceUrl}/api/v1/settings/preferences`,
};
