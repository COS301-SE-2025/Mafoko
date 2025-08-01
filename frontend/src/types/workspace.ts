// frontend/src/types/workspace.ts

export interface BookmarkedTerm {
  id: string;
  user_id: string;
  term_id: string;
  notes?: string;
  bookmarked_at: string;
  created_at: string;
  // Term details (included when fetched with term data) - now as direct properties
  term?: string;
  definition?: string;
  domain?: string;
  language?: string;
  example?: string;
}

export interface BookmarkedGlossary {
  id: string;
  user_id: string;
  domain: string;
  notes?: string;
  bookmarked_at: string;
  created_at: string;
}

export interface WorkspaceGroup {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  group_type: GroupType;
  color?: string;
  created_at: string;
  updated_at: string;
  items: WorkspaceGroupItem[];
}

export interface WorkspaceGroupItem {
  id: string;
  group_id: string;
  item_type: ItemType;
  term_id?: string;
  domain?: string;
  added_at: string;
  created_at: string;
}

export const GroupType = {
  TERMS: 'terms',
  GLOSSARIES: 'glossaries',
  MIXED: 'mixed',
} as const;

export const ItemType = {
  TERM: 'term',
  GLOSSARY: 'glossary',
} as const;

export type GroupType = (typeof GroupType)[keyof typeof GroupType];
export type ItemType = (typeof ItemType)[keyof typeof ItemType];

// Request/Response interfaces
export interface BookmarkedTermCreate {
  term_id: string;
  notes?: string;
}

export interface BookmarkedGlossaryCreate {
  domain: string;
  notes?: string;
}

export interface WorkspaceGroupCreate {
  name: string;
  description?: string;
  group_type: GroupType;
  color?: string;
}

export interface WorkspaceGroupUpdate {
  name?: string;
  description?: string;
  color?: string;
}

export interface WorkspaceGroupItemCreate {
  item_type: ItemType;
  term_id?: string;
  domain?: string;
}

export interface WorkspaceGroupItemBulkCreate {
  term_ids: string[];
}

export interface SearchTermsRequest {
  query?: string;
  domain?: string;
  language?: string;
  page?: number;
  limit?: number;
}

export interface SearchTermsResponse {
  terms: Array<{
    id: string;
    term: string;
    definition: string;
    domain: string;
    language: string;
    bookmarked_at: string;
    notes?: string;
  }>;
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface BulkDeleteRequest {
  bookmark_ids?: string[];
  group_ids?: string[];
}

export interface WorkspaceOverview {
  total_bookmarked_terms: number;
  total_bookmarked_glossaries: number;
  total_groups: number;
  recent_terms: Array<{
    id: string;
    term: string;
    definition: string;
    domain: string;
    language: string;
    bookmarked_at: string;
  }>;
}

// UI State interfaces
export interface WorkspaceFilters {
  searchQuery: string;
  selectedDomain: string;
  selectedLanguage: string;
  sortBy: 'date_desc' | 'date_asc' | 'alphabetical';
}

export interface WorkspaceState {
  bookmarkedTerms: BookmarkedTerm[];
  bookmarkedGlossaries: BookmarkedGlossary[];
  groups: WorkspaceGroup[];
  overview: WorkspaceOverview | null;
  filters: WorkspaceFilters;
  selectedItems: string[];
  isLoading: boolean;
  error: string | null;
}
