import { API_ENDPOINTS } from '../config';
import {
  cacheGlossaries,
  getCachedGlossaries,
  cacheTermsForGlossary,
  getCachedTermsForGlossary,
  cacheTermTranslations,
  getCachedTermTranslations,
  searchCachedTerms,
  CachedGlossary,
  CachedTerm,
} from './glossaryCache';
import { isOnline, addToOfflineQueue } from './offlineManager';

// Interfaces matching the existing component
interface Term {
  id: number;
  term: string;
  definition: string;
  language?: string;
  category?: string;
  translations?: { [lang: string]: string };
}

interface Glossary {
  id: number;
  name: string;
  description?: string;
  termCount?: number;
  languages?: string[];
}

export interface SearchResponse {
  results: Term[];
  total: number;
  page: number;
  pages: number;
}

// Mapping functions
function mapGlossaryToCached(glossary: Glossary): CachedGlossary {
  return {
    id: glossary.id,
    name: glossary.name,
    description: glossary.description,
    termCount: glossary.termCount,
    languages: glossary.languages,
    lastUpdated: Date.now(),
  };
}

function mapCachedToGlossary(cached: CachedGlossary): Glossary {
  return {
    id: cached.id,
    name: cached.name,
    description: cached.description,
    termCount: cached.termCount,
    languages: cached.languages,
  };
}

function mapTermToCached(term: Term, category: string): CachedTerm {
  return {
    id: term.id,
    term: term.term,
    definition: term.definition,
    language: term.language,
    category,
    translations: term.translations,
    lastUpdated: Date.now(),
  };
}

function mapCachedToTerm(cached: CachedTerm): Term {
  return {
    id: cached.id,
    term: cached.term,
    definition: cached.definition,
    language: cached.language,
    category: cached.category,
    translations: cached.translations,
  };
}

/**
 * Enhanced glossary service with caching and offline support
 */
export const GlossaryService = {
  /**
   * Fetch glossaries with caching support
   */
  async getGlossaries(forceRefresh = false): Promise<Glossary[]> {
    // Try cache first if online and not forcing refresh
    if (!forceRefresh && isOnline()) {
      const cached = await getCachedGlossaries();
      if (cached) {
        console.log('Using cached glossaries');
        return cached.map(mapCachedToGlossary);
      }
    }

    // If offline, use cache or fallback
    if (!isOnline()) {
      const cached = await getCachedGlossaries();
      if (cached) {
        console.log('Using cached glossaries (offline)');
        return cached.map(mapCachedToGlossary);
      }
      throw new Error('No cached data available offline');
    }

    try {
      // Try stats endpoint first for faster loading
      const statsResponse = await fetch(API_ENDPOINTS.glossaryCategoriesStats);
      if (statsResponse.ok) {
        const data = (await statsResponse.json()) as Record<string, number>;
        const glossaries: Glossary[] = Object.entries(data).map(
          ([name, termCount], idx) => ({
            id: idx + 1,
            name,
            description: '',
            termCount,
            languages: [],
          }),
        );

        // Cache the results
        const cachedGlossaries = glossaries.map(mapGlossaryToCached);
        await cacheGlossaries(cachedGlossaries);

        return glossaries;
      }
    } catch (error) {
      console.error('Stats endpoint failed, trying fallback:', error);
    }

    // Fallback to categories endpoint
    try {
      const response = await fetch(API_ENDPOINTS.glossaryCategories);
      if (!response.ok) throw new Error('Failed to fetch categories');

      const data: unknown = await response.json();
      let glossaries: Glossary[];

      if (
        Array.isArray(data) &&
        data.length &&
        typeof data[0] === 'object' &&
        data[0] !== null &&
        'name' in data[0]
      ) {
        glossaries = data as Glossary[];
      } else {
        const categoryStrings = data as string[];
        glossaries = categoryStrings.map((cat: string, idx: number) => ({
          id: idx + 1,
          name: cat,
          description: '',
          termCount: undefined,
          languages: [],
        }));
      }

      // Cache the results
      const cachedGlossaries = glossaries.map(mapGlossaryToCached);
      await cacheGlossaries(cachedGlossaries);

      return glossaries;
    } catch (error) {
      console.error('Failed to fetch glossaries:', error);

      // Try cache as last resort
      const cached = await getCachedGlossaries();
      if (cached) {
        console.log('Using cached glossaries as fallback');
        return cached.map(mapCachedToGlossary);
      }

      throw error;
    }
  },

  /**
   * Fetch terms for a glossary with caching support
   */
  async getTermsForGlossary(
    glossary: Glossary,
    page = 1,
    limit = 20,
    searchQuery = '',
    languages: string[] = [],
    forceRefresh = false,
  ): Promise<SearchResponse> {
    // Try cache first if online and not forcing refresh
    if (!forceRefresh && isOnline() && !searchQuery && languages.length === 0) {
      const cached = await getCachedTermsForGlossary(glossary.name);
      if (cached) {
        console.log('Using cached terms for', glossary.name);
        const mapped = cached.map(mapCachedToTerm);

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTerms = mapped.slice(startIndex, endIndex);

        return {
          results: paginatedTerms,
          total: mapped.length,
          page,
          pages: Math.ceil(mapped.length / limit),
        };
      }
    }

    // If offline, use cache or search cached data
    if (!isOnline()) {
      const cached = await getCachedTermsForGlossary(glossary.name);
      if (cached) {
        console.log('Using cached terms for search (offline)');
        const searchResults = await searchCachedTerms(
          glossary.name,
          searchQuery,
          languages,
        );
        const mapped = searchResults.map(mapCachedToTerm);

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTerms = mapped.slice(startIndex, endIndex);

        return {
          results: paginatedTerms,
          total: mapped.length,
          page,
          pages: Math.ceil(mapped.length / limit),
        };
      }
      throw new Error('No cached data available offline');
    }

    try {
      // Try advanced search endpoint first
      const searchParams = new URLSearchParams({
        domain: glossary.name,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchQuery.trim()) {
        searchParams.append('query', searchQuery.trim());
      }

      if (languages.length > 0) {
        languages.forEach((lang) => {
          searchParams.append('language', lang);
        });
      }

      const response = await fetch(
        `${API_ENDPOINTS.glossaryAdvancedSearch}?${searchParams.toString()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: glossary.name,
            query: searchQuery.trim() || undefined,
            languages,
            page,
            limit,
          }),
        },
      );

      if (response.ok) {
        const data = (await response.json()) as SearchResponse;

        // Cache the results if this is a full fetch (no search/filter)
        if (!searchQuery && languages.length === 0 && page === 1) {
          const cachedTerms = data.results.map((term) =>
            mapTermToCached(term, glossary.name),
          );
          await cacheTermsForGlossary(glossary.name, cachedTerms);
        }

        return data;
      }
    } catch (error) {
      console.error('Advanced search failed, trying fallback:', error);
    }

    // Fallback to original endpoint
    try {
      const response = await fetch(
        API_ENDPOINTS.glossaryTermsByCategory(glossary.name),
      );
      if (!response.ok) throw new Error('Failed to fetch terms');

      const data = (await response.json()) as Term[];
      let filteredTerms = data;

      // Apply search filter
      if (searchQuery.trim()) {
        const searchTerm = searchQuery.toLowerCase();
        filteredTerms = filteredTerms.filter(
          (term) =>
            term.term.toLowerCase().includes(searchTerm) ||
            term.definition.toLowerCase().includes(searchTerm),
        );
      }

      // Apply language filter
      if (languages.length > 0) {
        filteredTerms = filteredTerms.filter(
          (term) => term.language && languages.includes(term.language),
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTerms = filteredTerms.slice(startIndex, endIndex);

      const result: SearchResponse = {
        results: paginatedTerms,
        total: filteredTerms.length,
        page,
        pages: Math.ceil(filteredTerms.length / limit),
      };

      // Cache the full dataset if this is a complete fetch
      if (!searchQuery && languages.length === 0) {
        const cachedTerms = data.map((term) =>
          mapTermToCached(term, glossary.name),
        );
        await cacheTermsForGlossary(glossary.name, cachedTerms);
      }

      return result;
    } catch (error) {
      console.error('Failed to fetch terms:', error);

      // Try cache as last resort
      const cached = await getCachedTermsForGlossary(glossary.name);
      if (cached) {
        console.log('Using cached terms as fallback');
        const searchResults = await searchCachedTerms(
          glossary.name,
          searchQuery,
          languages,
        );
        const mapped = searchResults.map(mapCachedToTerm);

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTerms = mapped.slice(startIndex, endIndex);

        return {
          results: paginatedTerms,
          total: mapped.length,
          page,
          pages: Math.ceil(mapped.length / limit),
        };
      }

      throw error;
    }
  },

  /**
   * Fetch translations for a term with caching support
   */
  async getTermTranslations(
    termId: string,
    forceRefresh = false,
  ): Promise<{ [lang: string]: string }> {
    // Try cache first if online and not forcing refresh
    if (!forceRefresh) {
      const cached = await getCachedTermTranslations(termId);
      if (cached) {
        console.log('Using cached translations for term', termId);
        return cached;
      }
    }

    // If offline, use cache only
    if (!isOnline()) {
      const cached = await getCachedTermTranslations(termId);
      if (cached) {
        console.log('Using cached translations (offline) for term', termId);
        return cached;
      }

      // Queue the translation fetch for when back online
      const token = localStorage.getItem('accessToken');
      if (token) {
        addToOfflineQueue({
          type: 'translation',
          data: {
            termId,
            endpoint: API_ENDPOINTS.glossaryTermTranslations(termId),
            token,
          },
        });
      }

      return {}; // Return empty translations if offline and not cached
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.glossaryTermTranslations(termId),
      );
      if (!response.ok) {
        console.warn(
          `Failed to fetch translations for term ${termId}:`,
          response.status,
        );
        return {};
      }

      const data = (await response.json()) as {
        translations?: { [lang: string]: string };
      };
      const translations = data.translations ?? {};

      // Cache the translations
      await cacheTermTranslations(termId, translations);

      return translations;
    } catch (error) {
      console.error(`Error fetching translations for term ${termId}:`, error);

      // Try cache as fallback
      const cached = await getCachedTermTranslations(termId);
      if (cached) {
        console.log('Using cached translations as fallback for term', termId);
        return cached;
      }

      return {};
    }
  },

  /**
   * Get all terms for export (with caching support)
   */
  async getAllTermsForExport(
    glossary: Glossary,
    languages: string[] = [],
  ): Promise<Term[]> {
    try {
      // If we have cached data, use it for export
      const cached = await getCachedTermsForGlossary(glossary.name);
      if (cached) {
        let terms = cached.map(mapCachedToTerm);

        // Apply language filter if specified
        if (languages.length > 0) {
          terms = terms.filter(
            (term: Term) => term.language && languages.includes(term.language),
          );
        }

        return terms;
      }

      // If not cached or online, fetch from API
      if (isOnline()) {
        // Try advanced search for all terms
        const exportParams = new URLSearchParams({
          domain: glossary.name,
          page: '1',
          limit: '10000',
        });

        if (languages.length > 0) {
          languages.forEach((lang) => {
            exportParams.append('language', lang);
          });
        }

        const response = await fetch(
          `${API_ENDPOINTS.glossaryAdvancedSearch}?${exportParams.toString()}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              domain: glossary.name,
              languages,
              page: 1,
              limit: 10000,
            }),
          },
        );

        if (response.ok) {
          const data = (await response.json()) as { results: Term[] };
          return data.results;
        }

        // Fallback to original endpoint
        const fallbackResponse = await fetch(
          API_ENDPOINTS.glossaryTermsByCategory(glossary.name),
        );
        if (fallbackResponse.ok) {
          const fallbackData = (await fallbackResponse.json()) as Term[];

          if (languages.length > 0) {
            return fallbackData.filter(
              (term: Term) =>
                term.language && languages.includes(term.language),
            );
          }

          return fallbackData;
        }
      }

      // If offline and no cache, return empty array
      return [];
    } catch (error) {
      console.error('Failed to fetch all terms for export:', error);
      return [];
    }
  },
};
