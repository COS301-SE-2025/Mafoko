// Offline storage utilities using IndexedDB
// This provides a layer for storing and retrieving data when offline

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

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CachedTermsData {
  terms: Term[];
  total: number;
  page: number;
  searchQuery?: string;
  languages?: string[];
}

class OfflineStorage {
  private dbName = 'MavitoOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  // Initialize the database
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for glossaries list
        if (!db.objectStoreNames.contains('glossaries')) {
          db.createObjectStore('glossaries', { keyPath: 'id' });
        }

        // Store for terms by glossary
        if (!db.objectStoreNames.contains('glossaryTerms')) {
          const termsStore = db.createObjectStore('glossaryTerms', {
            keyPath: 'key',
          });
          termsStore.createIndex('glossaryName', 'glossaryName', {
            unique: false,
          });
        }

        // Store for term translations
        if (!db.objectStoreNames.contains('translations')) {
          db.createObjectStore('translations', { keyPath: 'termId' });
        }

        // Store for cached API responses
        if (!db.objectStoreNames.contains('apiCache')) {
          db.createObjectStore('apiCache', { keyPath: 'url' });
        }

        // Store for user bookmarks
        if (!db.objectStoreNames.contains('bookmarks')) {
          db.createObjectStore('bookmarks', { keyPath: 'id' });
        }
      };
    });
  }

  // Helper method to ensure database is initialized
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  // Generic method to save data to a store
  private async saveToStore(storeName: string, data: unknown): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(new Error(`Failed to save to ${storeName}`));
      };
    });
  }

  // Generic method to get data from a store
  private async getFromStore<T>(
    storeName: string,
    key: string | number,
  ): Promise<T | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        resolve((request.result as T) || null);
      };
      request.onerror = () => {
        reject(new Error(`Failed to get from ${storeName}`));
      };
    });
  }

  // Save glossaries list
  async saveGlossaries(glossaries: Glossary[]): Promise<void> {
    const cachedData: CachedData<Glossary[]> = {
      data: glossaries,
      timestamp: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    await this.saveToStore('apiCache', { url: 'glossaries', ...cachedData });
  }

  // Get glossaries list
  async getGlossaries(): Promise<Glossary[] | null> {
    const cachedData = await this.getFromStore<CachedData<Glossary[]>>(
      'apiCache',
      'glossaries',
    );

    if (!cachedData || Date.now() > cachedData.expiresAt) {
      return null;
    }

    return cachedData.data;
  }

  // Save terms for a specific glossary
  async saveGlossaryTerms(
    glossaryName: string,
    terms: Term[],
    total: number,
    page: number,
    searchQuery?: string,
    languages?: string[],
  ): Promise<void> {
    const key = this.getTermsCacheKey(
      glossaryName,
      page,
      searchQuery,
      languages,
    );
    const cachedData: CachedData<CachedTermsData> = {
      data: { terms, total, page, searchQuery, languages },
      timestamp: Date.now(),
      expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
    };

    await this.saveToStore('glossaryTerms', {
      key,
      glossaryName,
      ...cachedData,
    });
  }

  // Get terms for a specific glossary
  async getGlossaryTerms(
    glossaryName: string,
    page: number,
    searchQuery?: string,
    languages?: string[],
  ): Promise<CachedTermsData | null> {
    const key = this.getTermsCacheKey(
      glossaryName,
      page,
      searchQuery,
      languages,
    );
    const cachedData = await this.getFromStore<
      CachedData<CachedTermsData> & { key: string; glossaryName: string }
    >('glossaryTerms', key);

    if (!cachedData || Date.now() > cachedData.expiresAt) {
      return null;
    }

    return cachedData.data;
  }

  // Save term translations
  async saveTermTranslations(
    termId: string,
    translations: { [lang: string]: string },
  ): Promise<void> {
    const cachedData: CachedData<{ [lang: string]: string }> = {
      data: translations,
      timestamp: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    await this.saveToStore('translations', { termId, ...cachedData });
  }

  // Get term translations
  async getTermTranslations(
    termId: string,
  ): Promise<{ [lang: string]: string } | null> {
    const cachedData = await this.getFromStore<
      CachedData<{ [lang: string]: string }> & { termId: string }
    >('translations', termId);

    if (!cachedData || Date.now() > cachedData.expiresAt) {
      return null;
    }

    return cachedData.data;
  }

  // Save user bookmarks
  async saveBookmarks(bookmarks: unknown): Promise<void> {
    const cachedData: CachedData<unknown> = {
      data: bookmarks,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 1 day
    };

    await this.saveToStore('bookmarks', {
      id: 'user-bookmarks',
      ...cachedData,
    });
  }

  // Get user bookmarks
  async getBookmarks(): Promise<Record<string, unknown> | null> {
    const cachedData = await this.getFromStore<
      CachedData<Record<string, unknown>> & { id: string }
    >('bookmarks', 'user-bookmarks');

    if (!cachedData || Date.now() > cachedData.expiresAt) {
      return null;
    }

    return cachedData.data;
  }

  // Cache any API response
  async cacheAPIResponse(
    url: string,
    data: unknown,
    expirationHours: number = 24,
  ): Promise<void> {
    const cachedData: CachedData<unknown> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + expirationHours * 60 * 60 * 1000,
    };

    await this.saveToStore('apiCache', { url, ...cachedData });
  }

  // Get cached API response
  async getCachedAPIResponse<T>(url: string): Promise<T | null> {
    const cachedData = await this.getFromStore<CachedData<T> & { url: string }>(
      'apiCache',
      url,
    );

    if (!cachedData || Date.now() > cachedData.expiresAt) {
      return null;
    }

    return cachedData.data;
  }

  // Clear expired cache entries
  async clearExpiredCache(): Promise<void> {
    const db = await this.ensureDB();
    const stores = ['apiCache', 'glossaryTerms', 'translations', 'bookmarks'];

    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const allData = await new Promise<
        Array<{
          expiresAt?: number;
          url?: string;
          key?: string;
          termId?: string;
          id?: string;
        }>
      >((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(
            request.result as Array<{
              expiresAt?: number;
              url?: string;
              key?: string;
              termId?: string;
              id?: string;
            }>,
          );
        };
        request.onerror = () => {
          reject(new Error(`Failed to get all from ${storeName}`));
        };
      });

      const now = Date.now();
      for (const item of allData) {
        if (item.expiresAt && now > item.expiresAt) {
          const deleteKey = item.url || item.key || item.termId || item.id;
          if (deleteKey) {
            store.delete(deleteKey);
          }
        }
      }
    }
  }

  // Get storage usage info
  async getStorageInfo(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
      };
    }
    return { used: 0, available: 0 };
  }

  // Helper method to generate cache keys for terms
  private getTermsCacheKey(
    glossaryName: string,
    page: number,
    searchQuery?: string,
    languages?: string[],
  ): string {
    const query = searchQuery || '';
    const langs = languages?.sort().join(',') || '';
    return `${glossaryName}:${page.toString()}:${query}:${langs}`;
  }

  // Clear all data
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    const storeNames = [
      'glossaries',
      'glossaryTerms',
      'translations',
      'apiCache',
      'bookmarks',
    ];

    for (const storeName of storeNames) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          reject(new Error(`Failed to clear ${storeName}`));
        };
      });
    }
  }
}

// Create and export a singleton instance
export const offlineStorage = new OfflineStorage();

// Initialize on module load
offlineStorage.init().catch(console.error);

export default offlineStorage;
