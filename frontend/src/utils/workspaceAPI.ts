// frontend/src/utils/workspaceAPI.ts

import { API_ENDPOINTS } from '../config';
import type {
  BookmarkedTerm,
  BookmarkedGlossary,
  WorkspaceGroup,
  WorkspaceGroupItem,
  BookmarkedTermCreate,
  BookmarkedGlossaryCreate,
  WorkspaceGroupCreate,
  WorkspaceGroupUpdate,
  WorkspaceGroupItemCreate,
  SearchTermsRequest,
  SearchTermsResponse,
  BulkDeleteRequest,
  WorkspaceOverview
} from '../types/workspace';

// Helper function to get user ID from localStorage or token
const getUserId = (): string => {
  // TODO: Replace with actual user ID retrieval logic
  // This might come from your auth context or JWT token
  const userData = localStorage.getItem('user');
  if (userData) {
    const user = JSON.parse(userData) as { id?: string; user_id?: string };
    return user.id || user.user_id || '872aafc3-e9e4-46ea-a9e4-f44148f1dd24';
  }
  
  // For testing purposes, use the existing user ID from database
  return '872aafc3-e9e4-46ea-a9e4-f44148f1dd24';
};

// Helper function for API requests with user ID
const apiRequest = async (
  url: string,
  options: RequestInit = {},
  includeUserId: boolean = true
): Promise<Response> => {
  const userId = includeUserId ? getUserId() : null;
  
  // Add user_id as query parameter if needed
  const finalUrl = includeUserId && userId 
    ? `${url}${url.includes('?') ? '&' : '?'}user_id=${userId}`
    : url;

  // Build headers object safely
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add additional headers if they exist and are a plain object
  let finalHeaders = baseHeaders;
  if (options.headers) {
    if (options.headers instanceof Headers) {
      // Convert Headers object to plain object
      options.headers.forEach((value, key) => {
        finalHeaders[key] = value;
      });
    } else if (typeof options.headers === 'object' && !Array.isArray(options.headers)) {
      // Spread plain object headers
      finalHeaders = { ...baseHeaders, ...options.headers };
    }
  }

  const response = await fetch(finalUrl, {
    headers: finalHeaders,
    method: options.method || 'GET',
    body: options.body,
    mode: options.mode,
    credentials: options.credentials,
    cache: options.cache,
    redirect: options.redirect,
    referrer: options.referrer,
    referrerPolicy: options.referrerPolicy,
    integrity: options.integrity,
    keepalive: options.keepalive,
    signal: options.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { detail?: string };
    throw new Error(errorData.detail || `HTTP ${response.status.toString()}: ${response.statusText}`);
  }

  return response;
};

// Bookmark Terms API
export const bookmarkTermAPI = {
  create: async (data: BookmarkedTermCreate): Promise<BookmarkedTerm> => {
    const response = await apiRequest(API_ENDPOINTS.bookmarkTerm, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<BookmarkedTerm>;
  },

  getAll: async (skip: number = 0, limit: number = 100): Promise<BookmarkedTerm[]> => {
    const url = `${API_ENDPOINTS.bookmarkTerm}?skip=${skip.toString()}&limit=${limit.toString()}`;
    const response = await apiRequest(url, { method: 'GET' });
    return response.json() as Promise<BookmarkedTerm[]>;
  },

  delete: async (termId: string): Promise<void> => {
    await apiRequest(API_ENDPOINTS.unbookmarkTerm(termId), {
      method: 'DELETE',
    });
  },
};

// Bookmark Glossaries API
export const bookmarkGlossaryAPI = {
  create: async (data: BookmarkedGlossaryCreate): Promise<BookmarkedGlossary> => {
    const response = await apiRequest(API_ENDPOINTS.bookmarkGlossary, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<BookmarkedGlossary>;
  },

  getAll: async (skip: number = 0, limit: number = 100): Promise<BookmarkedGlossary[]> => {
    const url = `${API_ENDPOINTS.bookmarkGlossary}?skip=${skip.toString()}&limit=${limit.toString()}`;
    const response = await apiRequest(url, { method: 'GET' });
    return response.json() as Promise<BookmarkedGlossary[]>;
  },

  delete: async (domain: string): Promise<void> => {
    await apiRequest(API_ENDPOINTS.unbookmarkGlossary(domain), {
      method: 'DELETE',
    });
  },
};

// Workspace Groups API
export const workspaceGroupAPI = {
  create: async (data: WorkspaceGroupCreate): Promise<WorkspaceGroup> => {
    const response = await apiRequest(API_ENDPOINTS.createGroup, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<WorkspaceGroup>;
  },

  getAll: async (): Promise<WorkspaceGroup[]> => {
    const response = await apiRequest(API_ENDPOINTS.getGroups, { method: 'GET' });
    return response.json() as Promise<WorkspaceGroup[]>;
  },

  update: async (groupId: string, data: WorkspaceGroupUpdate): Promise<WorkspaceGroup> => {
    const url = `${API_ENDPOINTS.getGroups}/${groupId}`;
    const response = await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<WorkspaceGroup>;
  },

  delete: async (groupId: string): Promise<void> => {
    const url = `${API_ENDPOINTS.getGroups}/${groupId}`;
    await apiRequest(url, { method: 'DELETE' });
  },

  addItem: async (groupId: string, data: WorkspaceGroupItemCreate): Promise<WorkspaceGroupItem> => {
    const response = await apiRequest(API_ENDPOINTS.addItemToGroup(groupId), {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<WorkspaceGroupItem>;
  },

  removeItem: async (itemId: string): Promise<void> => {
    const url = `${API_ENDPOINTS.getGroups}/items/${itemId}`;
    await apiRequest(url, { method: 'DELETE' });
  },
};

// Search API
export const workspaceSearchAPI = {
  searchTerms: async (params: SearchTermsRequest): Promise<SearchTermsResponse> => {
    const response = await apiRequest(API_ENDPOINTS.searchWorkspace, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json() as Promise<SearchTermsResponse>;
  },
};

// Bulk Operations API
export const workspaceBulkAPI = {
  bulkDelete: async (data: BulkDeleteRequest): Promise<{ message: string }> => {
    const response = await apiRequest(API_ENDPOINTS.bulkDelete, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
    return response.json() as Promise<{ message: string }>;
  },
};

// Overview API
export const workspaceOverviewAPI = {
  getOverview: async (): Promise<WorkspaceOverview> => {
    const response = await apiRequest(API_ENDPOINTS.workspaceOverview, { method: 'GET' });
    return response.json() as Promise<WorkspaceOverview>;
  },
};

// Combined API for easier imports
export const workspaceAPI = {
  bookmarks: {
    terms: bookmarkTermAPI,
    glossaries: bookmarkGlossaryAPI,
  },
  groups: workspaceGroupAPI,
  search: workspaceSearchAPI,
  bulk: workspaceBulkAPI,
  overview: workspaceOverviewAPI,
};

// Utility functions for common operations
export const workspaceUtils = {
  // Check if a term is bookmarked
  isTermBookmarked: (termId: string, bookmarkedTerms: BookmarkedTerm[]): boolean => {
    return bookmarkedTerms.some(bookmark => bookmark.term_id === termId);
  },

  // Check if a glossary is bookmarked
  isGlossaryBookmarked: (domain: string, bookmarkedGlossaries: BookmarkedGlossary[]): boolean => {
    return bookmarkedGlossaries.some(bookmark => bookmark.domain === domain);
  },

  // Get unique domains from bookmarked terms
  getBookmarkedDomains: (bookmarkedTerms: BookmarkedTerm[]): string[] => {
    const domains = bookmarkedTerms
      .map(bookmark => bookmark.domain)
      .filter((domain): domain is string => Boolean(domain));
    return Array.from(new Set(domains));
  },

  // Get unique languages from bookmarked terms
  getBookmarkedLanguages: (bookmarkedTerms: BookmarkedTerm[]): string[] => {
    const languages = bookmarkedTerms
      .map(bookmark => bookmark.language)
      .filter((language): language is string => Boolean(language));
    return Array.from(new Set(languages));
  },

  // Filter bookmarked terms by search query
  filterTermsByQuery: (terms: BookmarkedTerm[], query: string): BookmarkedTerm[] => {
    if (!query.trim()) return terms;
    
    const lowerQuery = query.toLowerCase();
    return terms.filter(bookmark => 
      bookmark.term?.toLowerCase().includes(lowerQuery) ||
      bookmark.definition?.toLowerCase().includes(lowerQuery) ||
      bookmark.notes?.toLowerCase().includes(lowerQuery)
    );
  },

  // Sort bookmarked terms
  sortTerms: (terms: BookmarkedTerm[], sortBy: 'date_desc' | 'date_asc' | 'alphabetical'): BookmarkedTerm[] => {
    return [...terms].sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime();
        case 'date_asc':
          return new Date(a.bookmarked_at).getTime() - new Date(b.bookmarked_at).getTime();
        case 'alphabetical':
          return (a.term || '').localeCompare(b.term || '');
        default:
          return 0;
      }
    });
  },
};
