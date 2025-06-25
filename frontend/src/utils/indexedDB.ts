import { openDB, DBSchema } from 'idb';
import { Term } from '../pages/SearchPage';
const DB_NAME = 'MaritoGlossaryDB';
const TERMS_STORE_NAME = 'terms';
const PENDING_VOTES_STORE_NAME = 'pending-votes';

export interface PendingVote {
  id: string; // A unique ID for the queue item, e.g., a timestamp or UUID
  term_id: string;
  vote: 'upvote' | 'downvote';
}

// Define the IndexedDB schema using idb's typing support
interface GlossaryDB extends DBSchema {
  [TERMS_STORE_NAME]: {
    key: string;
    value: Term;
  };
  [PENDING_VOTES_STORE_NAME]: {
    key: string;
    value: PendingVote;
  };
}

/**
 * Initializes the IndexedDB database and object store.
 * Creates the store if it doesn't exist.
 */
export const initDB = async () => {
  return openDB<GlossaryDB>(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(TERMS_STORE_NAME)) {
        db.createObjectStore(TERMS_STORE_NAME, { keyPath: 'id' });
      }
      // Create the new store if it doesn't exist
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(PENDING_VOTES_STORE_NAME)) {
          db.createObjectStore(PENDING_VOTES_STORE_NAME, { keyPath: 'id' });
        }
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
  const tx = db.transaction(TERMS_STORE_NAME, 'readwrite');
  const store = tx.objectStore(TERMS_STORE_NAME);
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
  return db.getAll(TERMS_STORE_NAME);
};

export const addPendingVote = async (vote: PendingVote): Promise<void> => {
  const db = await initDB();
  await db.put(PENDING_VOTES_STORE_NAME, vote);
};

export const getAndClearPendingVotes = async (): Promise<PendingVote[]> => {
  const db = await initDB();
  const tx = db.transaction(PENDING_VOTES_STORE_NAME, 'readwrite');
  const allVotes = await tx.store.getAll();
  await tx.store.clear(); // Clear the store after getting the votes
  await tx.done;
  return allVotes;
};
