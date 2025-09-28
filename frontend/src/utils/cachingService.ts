// Caching service for managing API responses and offline functionality
import { offlineStorage } from './offlineStorage';
import { API_ENDPOINTS } from '../config';

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

interface APIResponse<T> {
  data: T;
  fromCache: boolean;
  isOffline: boolean;
}

interface BookmarksResponse {
  glossaries?: Array<{ domain: string }>;
}

interface TermsResponse {
  results: Term[];
  total: number;
  page: number;
  pages: number;
}

class CachingService {
  private isOnline = navigator.onLine;

  constructor() {
    // Listen for network status changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOnlineStatusChange(false);
    });

    // Clean up expired cache periodically
    this.startCacheCleanup();
  }

  // Network status methods
  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  private handleOnlineStatusChange(isOnline: boolean): void {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(
      new CustomEvent('networkStatusChange', {
        detail: { isOnline },
      }),
    );

    if (isOnline) {
      // When coming back online, clean up expired cache
      offlineStorage.clearExpiredCache().catch(console.error);
    }
  }

  // Generic fetch with caching
  private async fetchWithCache<T>(
    url: string,
    options: RequestInit = {},
    cacheKey?: string,
    cacheHours: number = 24,
  ): Promise<APIResponse<T>> {
    const key = cacheKey || url;

    // Try to get from cache first if offline
    if (!this.isOnline) {
      const cached = await offlineStorage.getCachedAPIResponse<T>(key);
      if (cached) {
        return {
          data: cached,
          fromCache: true,
          isOffline: true,
        };
      }
      throw new Error('No cached data available while offline');
    }

    try {
      // Try network request
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(
            options.headers instanceof Headers
              ? options.headers.entries()
              : Array.isArray(options.headers)
                ? options.headers
                : Object.entries(options.headers || {}),
          ),
        },
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status.toString()}: ${response.statusText}`,
        );
      }

      const data = (await response.json()) as T;

      // Cache the successful response
      await offlineStorage.cacheAPIResponse(key, data, cacheHours);

      return {
        data,
        fromCache: false,
        isOffline: false,
      };
    } catch (error) {
      // On network error, try to get cached data
      const cached = await offlineStorage.getCachedAPIResponse<T>(key);
      if (cached) {
        console.warn('Network request failed, using cached data:', error);
        return {
          data: cached,
          fromCache: true,
          isOffline: false,
        };
      }
      throw error;
    }
  }

  // Fetch glossaries with caching
  async getGlossaries(): Promise<APIResponse<Record<string, number>>> {
    try {
      // Try the stats endpoint first
      return await this.fetchWithCache<Record<string, number>>(
        API_ENDPOINTS.glossaryCategoriesStats,
        {},
        'glossary-categories-stats',
        24 * 7, // 7 days
      );
    } catch {
      // Fallback to categories endpoint
      try {
        const response = await this.fetchWithCache<string[] | Glossary[]>(
          API_ENDPOINTS.glossaryCategories,
          {},
          'glossary-categories',
          24 * 7, // 7 days
        );

        // Transform to stats format if we get array of strings
        if (Array.isArray(response.data) && response.data.length > 0) {
          if (typeof response.data[0] === 'string') {
            const statsData = (response.data as string[]).reduce<
              Record<string, number>
            >((acc, cat) => {
              acc[cat] = 0; // Unknown count
              return acc;
            }, {});

            return {
              data: statsData,
              fromCache: response.fromCache,
              isOffline: response.isOffline,
            };
          }
        }

        // If we get here, it means we have Glossary[] format
        const glossariesData = response.data as Glossary[];
        const statsData = glossariesData.reduce<Record<string, number>>(
          (acc, glossary) => {
            acc[glossary.name] = glossary.termCount || 0;
            return acc;
          },
          {},
        );

        return {
          data: statsData,
          fromCache: response.fromCache,
          isOffline: response.isOffline,
        };
      } catch (fallbackError) {
        console.error('Both glossary endpoints failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  // Fetch terms for a glossary with caching
  async getGlossaryTerms(
    glossaryName: string,
    page: number = 1,
    limit: number = 20,
    searchQuery?: string,
    languages?: string[],
  ): Promise<APIResponse<TermsResponse>> {
    const cacheKey = `terms-${glossaryName}-${page.toString()}-${searchQuery || ''}-${(languages || []).sort().join(',')}`;

    try {
      // Try advanced search endpoint
      const searchParams = new URLSearchParams({
        domain: glossaryName,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchQuery?.trim()) {
        searchParams.append('query', searchQuery.trim());
      }

      if (languages && languages.length > 0) {
        languages.forEach((lang) => {
          searchParams.append('language', lang);
        });
      }

      const response = await this.fetchWithCache<TermsResponse>(
        `${API_ENDPOINTS.glossaryAdvancedSearch}?${searchParams.toString()}`,
        {
          method: 'POST',
          body: JSON.stringify({
            domain: glossaryName,
            query: searchQuery?.trim() || undefined,
            languages: languages,
            page: page,
            limit: limit,
          }),
        },
        cacheKey,
        24 * 3, // 3 days
      );

      // Also save to specialized storage
      if (!response.fromCache) {
        await offlineStorage.saveGlossaryTerms(
          glossaryName,
          response.data.results,
          response.data.total,
          response.data.page,
          searchQuery,
          languages,
        );
      }

      return response;
    } catch {
      // Fallback to basic endpoint and try cached data
      try {
        const basicResponse = await this.fetchWithCache<Term[]>(
          API_ENDPOINTS.glossaryTermsByCategory(glossaryName),
          {},
          `basic-terms-${glossaryName}`,
          24 * 3,
        );

        let filteredTerms = basicResponse.data;

        // Apply search filter if provided
        if (searchQuery?.trim()) {
          const query = searchQuery.toLowerCase();
          filteredTerms = filteredTerms.filter(
            (term) =>
              term.term.toLowerCase().includes(query) ||
              term.definition.toLowerCase().includes(query),
          );
        }

        // Apply language filter if provided
        if (languages && languages.length > 0) {
          filteredTerms = filteredTerms.filter(
            (term) => term.language && languages.includes(term.language),
          );
        }

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTerms = filteredTerms.slice(startIndex, endIndex);

        const transformedResponse: TermsResponse = {
          results: paginatedTerms,
          total: filteredTerms.length,
          page: page,
          pages: Math.ceil(filteredTerms.length / limit),
        };

        return {
          data: transformedResponse,
          fromCache: basicResponse.fromCache,
          isOffline: basicResponse.isOffline,
        };
      } catch (fallbackError) {
        // Try to get from specialized storage
        const cachedTerms = await offlineStorage.getGlossaryTerms(
          glossaryName,
          page,
          searchQuery,
          languages,
        );

        if (cachedTerms) {
          return {
            data: {
              results: cachedTerms.terms,
              total: cachedTerms.total,
              page: cachedTerms.page,
              pages: Math.ceil(cachedTerms.total / limit),
            },
            fromCache: true,
            isOffline: !this.isOnline,
          };
        }

        throw fallbackError;
      }
    }
  }

  // Fetch term translations with caching
  async getTermTranslations(
    termId: string,
  ): Promise<APIResponse<{ [lang: string]: string }>> {
    const cacheKey = `translations-${termId}`;

    try {
      const response = await this.fetchWithCache<{
        translations?: { [lang: string]: string };
      }>(
        API_ENDPOINTS.glossaryTermTranslations(termId),
        {},
        cacheKey,
        24 * 7, // 7 days
      );

      const translations = response.data.translations || {};

      // Also save to specialized storage
      if (!response.fromCache) {
        await offlineStorage.saveTermTranslations(termId, translations);
      }

      return {
        data: translations,
        fromCache: response.fromCache,
        isOffline: response.isOffline,
      };
    } catch (error) {
      // Try to get from specialized storage
      const cachedTranslations =
        await offlineStorage.getTermTranslations(termId);

      if (cachedTranslations) {
        return {
          data: cachedTranslations,
          fromCache: true,
          isOffline: !this.isOnline,
        };
      }

      throw error;
    }
  }

  // Fetch user bookmarks with caching
  async getBookmarks(token: string): Promise<APIResponse<BookmarksResponse>> {
    const cacheKey = 'user-bookmarks';

    try {
      const response = await this.fetchWithCache<BookmarksResponse>(
        API_ENDPOINTS.getBookmarks,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        cacheKey,
        24, // 1 day
      );

      // Also save to specialized storage
      if (!response.fromCache) {
        await offlineStorage.saveBookmarks(response.data);
      }

      return response;
    } catch (error) {
      // Try to get from specialized storage
      const cachedBookmarks = await offlineStorage.getBookmarks();

      if (cachedBookmarks) {
        return {
          data: cachedBookmarks as BookmarksResponse,
          fromCache: true,
          isOffline: !this.isOnline,
        };
      }

      throw error;
    }
  }

  // Bookmark/unbookmark operations (these need to be queued when offline)
  async bookmarkGlossary(
    token: string,
    glossaryName: string,
    description?: string,
  ): Promise<boolean> {
    if (!this.isOnline) {
      // Queue the operation for when we're back online
      console.warn('Bookmark operation queued for when online');
      return false;
    }

    try {
      const response = await fetch(API_ENDPOINTS.bookmarkGlossary, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          domain: glossaryName,
          description: description,
        }),
      });

      const success = response.ok || response.status === 409; // 409 = already bookmarked

      if (success) {
        // Invalidate bookmarks cache
        await this.invalidateCache('user-bookmarks');
      }

      return success;
    } catch (error) {
      console.error('Bookmark operation failed:', error);
      return false;
    }
  }

  async unbookmarkGlossary(
    token: string,
    glossaryName: string,
  ): Promise<boolean> {
    if (!this.isOnline) {
      console.warn('Unbookmark operation queued for when online');
      return false;
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.unbookmarkGlossary(glossaryName),
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const success = response.ok;

      if (success) {
        // Invalidate bookmarks cache
        await this.invalidateCache('user-bookmarks');
      }

      return success;
    } catch (error) {
      console.error('Unbookmark operation failed:', error);
      return false;
    }
  }

  // Cache management
  async invalidateCache(key: string): Promise<void> {
    await offlineStorage.cacheAPIResponse(key, null, -1); // Expire immediately
  }

  async clearAllCache(): Promise<void> {
    await offlineStorage.clearAll();
  }

  async getStorageInfo(): Promise<{ used: number; available: number }> {
    return await offlineStorage.getStorageInfo();
  }

  // Start periodic cache cleanup
  private startCacheCleanup(): void {
    // Clean up expired cache every hour
    setInterval(
      () => {
        offlineStorage.clearExpiredCache().catch(console.error);
      },
      60 * 60 * 1000,
    );
  }
}

// Create and export singleton instance
export const cachingService = new CachingService();
export default cachingService;
