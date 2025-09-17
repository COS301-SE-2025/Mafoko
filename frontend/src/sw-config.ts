// src/sw-config.ts

let voteServiceUrl: string;
let commentServiceUrl: string;
let searchServiceUrl: string;

if (import.meta.env.PROD) {
  const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL as string;
  voteServiceUrl = gatewayUrl;
  commentServiceUrl = gatewayUrl;
  searchServiceUrl = gatewayUrl;
} else {
  voteServiceUrl = 'http://localhost:8005';
  commentServiceUrl = 'http://localhost:8008';
  searchServiceUrl = 'http://localhost:8002';
}

export const SW_API_ENDPOINTS = {
  VOTES: `${voteServiceUrl}/api/v1/votes/`,
  COMMENTS: `${commentServiceUrl}/api/v1/comments`,
  VOTE_ON_COMMENT: `${voteServiceUrl}/api/v1/votes/comments`,
  MANAGE_COMMENT: (commentId: string) =>
    `${commentServiceUrl}/api/v1/comments/${commentId}`,
  SEARCH_ALL_TERMS: `${searchServiceUrl}/api/v1/terms/all-for-offline`,
};
