import { openDB, DBSchema } from 'idb';

const DB_NAME = 'MaritoGlossaryCache';
const DB_VERSION = 1;

// Cache stores
const GLOSSARIES_STORE = 'glossaries';
const TERMS_STORE = 'terms';
const TRANSLATIONS_STORE = 'translations';
const METADATA_STORE = 'metadata';

export interface CachedGlossary {
  id: number;
  name: string;
  description?: string;
  termCount?: number;
  languages?: string[];
  lastUpdated: number;
}

export interface CachedTerm {
  id: number;
  term: string;
  definition: string;
  language?: string;
  category: string;
  translations?: { [lang: string]: string };
  lastUpdated: number;
}

export interface CachedTranslation {
  termId: string;
  translations: { [lang: string]: string };
  lastUpdated: number;
}

export interface CacheMetadata {
  key: string;
  lastUpdated: number;
  expiresAt?: number;
  version: string;
}

interface GlossaryCacheDB extends DBSchema {
  [GLOSSARIES_STORE]: {
    key: string;
    value: CachedGlossary;
    indexes: { 'by-name': string };
  };
  [TERMS_STORE]: {
    key: string;
    value: CachedTerm;
    indexes: { 'by-category': string; 'by-term': string };
  };
  [TRANSLATIONS_STORE]: {
    key: string;
    value: CachedTranslation;
    indexes: { 'by-term-id': string };
  };
  [METADATA_STORE]: {
    key: string;
    value: CacheMetadata;
  };
}

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  GLOSSARIES: 24 * 60 * 60 * 1000, // 24 hours
  TERMS: 12 * 60 * 60 * 1000, // 12 hours
  TRANSLATIONS: 6 * 60 * 60 * 1000, // 6 hours
};

/**
 * Initialize the glossary cache database
 */
export const initGlossaryCache = async () => {
  return openDB<GlossaryCacheDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Glossaries store
      if (!db.objectStoreNames.contains(GLOSSARIES_STORE)) {
        const glossariesStore = db.createObjectStore(GLOSSARIES_STORE, {
          keyPath: 'name',
        });
        glossariesStore.createIndex('by-name', 'name');
      }

      // Terms store
      if (!db.objectStoreNames.contains(TERMS_STORE)) {
        const termsStore = db.createObjectStore(TERMS_STORE, {
          keyPath: 'id',
        });
        termsStore.createIndex('by-category', 'category');
        termsStore.createIndex('by-term', 'term');
      }

      // Translations store
      if (!db.objectStoreNames.contains(TRANSLATIONS_STORE)) {
        const translationsStore = db.createObjectStore(TRANSLATIONS_STORE, {
          keyPath: 'termId',
        });
        translationsStore.createIndex('by-term-id', 'termId');
      }

      // Metadata store
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, {
          keyPath: 'key',
        });
      }
    },
  });
};

/**
 * Cache glossaries list
 */
export const cacheGlossaries = async (
  glossaries: CachedGlossary[],
): Promise<void> => {
  const db = await initGlossaryCache();
  const tx = db.transaction([GLOSSARIES_STORE, METADATA_STORE], 'readwrite');

  const now = Date.now();

  // Cache each glossary
  for (const glossary of glossaries) {
    await tx.objectStore(GLOSSARIES_STORE).put({
      ...glossary,
      lastUpdated: now,
    });
  }

  // Update metadata
  await tx.objectStore(METADATA_STORE).put({
    key: 'glossaries-list',
    lastUpdated: now,
    expiresAt: now + CACHE_EXPIRY.GLOSSARIES,
    version: '1.0',
  });

  await tx.done;
};

/**
 * Get cached glossaries
 */
export const getCachedGlossaries = async (): Promise<
  CachedGlossary[] | null
> => {
  const db = await initGlossaryCache();

  // Check if cache is valid
  const metadata = await db.get(METADATA_STORE, 'glossaries-list');
  if (!metadata || !metadata.expiresAt || Date.now() > metadata.expiresAt) {
    return null;
  }

  return db.getAll(GLOSSARIES_STORE);
};

/**
 * Cache terms for a specific glossary
 */
export const cacheTermsForGlossary = async (
  category: string,
  terms: CachedTerm[],
): Promise<void> => {
  const db = await initGlossaryCache();
  const tx = db.transaction([TERMS_STORE, METADATA_STORE], 'readwrite');

  const now = Date.now();

  // Remove old terms for this category
  const existingTerms = await tx
    .objectStore(TERMS_STORE)
    .index('by-category')
    .getAll(category);
  for (const term of existingTerms) {
    await tx.objectStore(TERMS_STORE).delete(String(term.id));
  }

  // Cache new terms
  for (const term of terms) {
    await tx.objectStore(TERMS_STORE).put({
      ...term,
      category,
      lastUpdated: now,
    });
  }

  // Update metadata
  await tx.objectStore(METADATA_STORE).put({
    key: `terms-${category}`,
    lastUpdated: now,
    expiresAt: now + CACHE_EXPIRY.TERMS,
    version: '1.0',
  });

  await tx.done;
};

/**
 * Get cached terms for a specific glossary
 */
export const getCachedTermsForGlossary = async (
  category: string,
): Promise<CachedTerm[] | null> => {
  const db = await initGlossaryCache();

  // Check if cache is valid
  const metadata = await db.get(METADATA_STORE, `terms-${category}`);
  if (!metadata || !metadata.expiresAt || Date.now() > metadata.expiresAt) {
    return null;
  }

  return db.getAllFromIndex(TERMS_STORE, 'by-category', category);
};

/**
 * Cache translations for a term
 */
export const cacheTermTranslations = async (
  termId: string,
  translations: { [lang: string]: string },
): Promise<void> => {
  const db = await initGlossaryCache();
  const now = Date.now();

  await db.put(TRANSLATIONS_STORE, {
    termId,
    translations,
    lastUpdated: now,
  });

  // Update metadata
  await db.put(METADATA_STORE, {
    key: `translations-${termId}`,
    lastUpdated: now,
    expiresAt: now + CACHE_EXPIRY.TRANSLATIONS,
    version: '1.0',
  });
};

/**
 * Get cached translations for a term
 */
export const getCachedTermTranslations = async (
  termId: string,
): Promise<{ [lang: string]: string } | null> => {
  const db = await initGlossaryCache();

  // Check if cache is valid
  const metadata = await db.get(METADATA_STORE, `translations-${termId}`);
  if (!metadata || !metadata.expiresAt || Date.now() > metadata.expiresAt) {
    return null;
  }

  const cached = await db.get(TRANSLATIONS_STORE, termId);
  return cached?.translations || null;
};

/**
 * Search cached terms
 */
export const searchCachedTerms = async (
  category: string,
  query: string,
  languages?: string[],
): Promise<CachedTerm[]> => {
  const db = await initGlossaryCache();
  const allTerms = await db.getAllFromIndex(
    TERMS_STORE,
    'by-category',
    category,
  );

  let filteredTerms = allTerms;

  // Apply search filter
  if (query.trim()) {
    const searchTerm = query.toLowerCase();
    filteredTerms = filteredTerms.filter(
      (term) =>
        term.term.toLowerCase().includes(searchTerm) ||
        term.definition.toLowerCase().includes(searchTerm),
    );
  }

  // Apply language filter
  if (languages && languages.length > 0) {
    filteredTerms = filteredTerms.filter(
      (term) => term.language && languages.includes(term.language),
    );
  }

  return filteredTerms;
};

/**
 * Clear all cached data
 */
export const clearGlossaryCache = async (): Promise<void> => {
  const db = await initGlossaryCache();
  const tx = db.transaction(
    [GLOSSARIES_STORE, TERMS_STORE, TRANSLATIONS_STORE, METADATA_STORE],
    'readwrite',
  );

  await tx.objectStore(GLOSSARIES_STORE).clear();
  await tx.objectStore(TERMS_STORE).clear();
  await tx.objectStore(TRANSLATIONS_STORE).clear();
  await tx.objectStore(METADATA_STORE).clear();

  await tx.done;
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  const db = await initGlossaryCache();

  const [glossariesCount, termsCount, translationsCount, metadataCount] =
    await Promise.all([
      db.count(GLOSSARIES_STORE),
      db.count(TERMS_STORE),
      db.count(TRANSLATIONS_STORE),
      db.count(METADATA_STORE),
    ]);

  return {
    glossaries: glossariesCount,
    terms: termsCount,
    translations: translationsCount,
    metadata: metadataCount,
    totalSize: glossariesCount + termsCount + translationsCount + metadataCount,
  };
};

/**
 * Check if a specific cache entry is valid
 */
export const isCacheValid = async (key: string): Promise<boolean> => {
  const db = await initGlossaryCache();
  const metadata = await db.get(METADATA_STORE, key);

  if (!metadata || !metadata.expiresAt) {
    return false;
  }

  return Date.now() <= metadata.expiresAt;
};
