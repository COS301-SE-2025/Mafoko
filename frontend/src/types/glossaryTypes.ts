// Define types for terms and translations based on API response
export interface Term {
  id: string;
  term: string;
  definition: string;
  category: string;
  language?: string;
}

export interface TermTranslations {
  term: string;
  definition: string;
  translations: Record<string, string>;
}

export interface SearchResponse {
  results: Term[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UserData {
  uuid: string;
  firstName: string;
  lastName: string;
}
