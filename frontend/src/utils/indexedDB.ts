import { openDB, DBSchema } from 'idb';
import { Term } from '../types/terms/types.ts';

const DB_NAME = 'MaritoGlossaryDB';
const TERMS_STORE_NAME = 'terms';
const PENDING_VOTES_STORE_NAME = 'pending-votes';

export interface PendingVote {
  id: string;
  term_id: string;
  vote: 'upvote' | 'downvote';
  token: string; // The JWT access token to authenticate the request
}

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
  // UPDATED: Incremented DB version to 2 to handle the schema upgrade.
  return openDB<GlossaryDB>(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(TERMS_STORE_NAME)) {
        db.createObjectStore(TERMS_STORE_NAME, { keyPath: 'id' });
      }
      // This check ensures we only create the new store on upgrade
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

/**
 * Adds a vote action to the pending queue in IndexedDB.
 */
export const addPendingVote = async (vote: PendingVote): Promise<void> => {
  const db = await initDB();
  await db.put(PENDING_VOTES_STORE_NAME, vote);
};

/**
 * Retrieves and clears all pending votes from the queue.
 * This will be used by the service worker.
 */
export const getAndClearPendingVotes = async (): Promise<PendingVote[]> => {
  const db = await initDB();
  const tx = db.transaction(PENDING_VOTES_STORE_NAME, 'readwrite');
  const allVotes = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allVotes;
};
