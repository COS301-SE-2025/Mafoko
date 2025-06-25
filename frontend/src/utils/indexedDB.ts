import { openDB, DBSchema } from 'idb';
import { Term } from '../pages/SearchPage';
const DB_NAME = 'MaritoGlossaryDB';
const STORE_NAME = 'terms';

// Define the IndexedDB schema using idb's typing support
interface GlossaryDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: Term;
  };
}

/**
 * Initializes the IndexedDB database and object store.
 * Creates the store if it doesn't exist.
 */
export const initDB = async () => {
  return openDB<GlossaryDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

/**
 * Stores an array of Term objects in the IndexedDB store.
 * Each term is inserted using its `id` as the key.
 */
export const storeTerms = async (terms: Term[]): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (const term of terms) {
    await store.put(term);
  }
  await tx.done;
};

/**
 * Retrieves all Term objects currently stored in IndexedDB.
 */
export const getAllTerms = async (): Promise<Term[]> => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};
