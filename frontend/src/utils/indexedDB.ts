import { openDB, DBSchema } from 'idb';
import { Term } from '../types/terms/types';
import { Comment } from '../types/termDetailTypes';
import { TermApplicationCreate } from '../types/term';
export interface PendingTermSubmission {
  id: string; // A temporary UUID for the submission itself
  body: TermApplicationCreate; // The data for the new term or edit
  token: string;
}

export interface PendingTermVote {
  id: string; // A temporary UUID
  applicationId: string;
  token: string;
}

export interface PendingTermDelete {
  id: string; // A temporary UUID
  applicationId: string;
  token: string;
}

export interface PendingTermApproval {
  id: string; // A temporary UUID
  applicationId: string;
  role: 'linguist' | 'admin';
  token: string;
}

export interface PendingTermRejection {
  id: string; // A temporary UUID
  applicationId: string;
  role: 'linguist' | 'admin';
  body: { review: string };
  token: string;
}

export interface PendingVote {
  id: string;
  term_id: string;
  vote: 'upvote' | 'downvote';
  token: string;
}

export interface PendingComment {
  id: string;
  term_id: string;
  text: string;
  parentId: string | null;
  token: string;
}

export interface PendingCommentVote {
  id: string;
  comment_id: string;
  vote: 'upvote' | 'downvote';
  token: string;
}

export interface PendingCommentEdit {
  id: string;
  comment_id: string;
  content: string;
  token: string;
}

export interface PendingCommentDelete {
  id: string;
  comment_id: string;
  token: string;
}

export interface PendingProfilePictureUpload {
  id: string;
  userId: string;
  file: File;
  fileName: string;
  contentType: string;
  token: string;
  timestamp: number;
}

export interface PendingXPAward {
  id: string;
  user_id: string;
  xp_amount: number;
  xp_source: string;
  source_reference_id: string;
  description?: string;
  token: string;
  timestamp: number;
}

export interface PendingFeedback {
  id: string;
  type: string;
  message: string;
  name?: string | null;
  email?: string | null;
  priority?: string;
  token?: string;
  timestamp: number;
}

export interface PendingFeedbackUpdate {
  id: string;
  feedbackId: string;
  updates: {
    status?: string;
    priority?: string;
    admin_response?: string | null;
  };
  token: string;
  timestamp: number;
}

// Home page data interfaces
export interface RandomTermsCache {
  id: string;
  terms: Array<{
    id: string;
    term: string;
    definition: string;
    language: string;
    category: string;
  }>;
  timestamp: number;
}

export interface UserProfileCache {
  id: string;
  userData: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    profile_pic_url?: string;
    role?: string;
  };
  timestamp: number;
}

// Workspace page data interfaces
export interface BookmarksCache {
  id: string;
  bookmarkedTerms: Array<{
    id: string;
    term_id: string;
    term: string;
    definition: string;
    language: string;
    domain: string;
    bookmarked_at: string;
    notes?: string;
  }>;
  bookmarkedGlossaries: Array<{
    id: string;
    domain: string;
    term_count: number;
    bookmarked_at: string;
    description?: string;
    notes?: string;
  }>;
  timestamp: number;
}

export interface WorkspaceGroupsCache {
  id: string;
  groups: Array<{
    id: string;
    name: string;
    description?: string;
    created_at: string;
    items?: Array<{
      term_id: string;
      added_at: string;
      item_type?: string;
    }>;
  }>;
  timestamp: number;
}

export interface GlossaryStatsCache {
  id: string;
  stats: {
    [domain: string]: {
      term_count: number;
      language_count?: number;
    };
  };
  timestamp: number;
}

// Settings page data interfaces
export interface UserPreferencesCache {
  id: string;
  preferences: {
    textSize: number;
    textSpacing: number;
    highContrastMode: boolean;
    darkMode: boolean;
    selectedLanguage: string;
  };
  timestamp: number;
}

export interface PendingWorkspaceUpdate {
  id: string;
  type: 'bookmark_note' | 'group_create' | 'group_update' | 'group_delete';
  data: Record<string, unknown>;
  token: string;
  timestamp: number;
}

export interface PendingSettingsUpdate {
  id: string;
  preferences: {
    textSize?: number;
    textSpacing?: number;
    highContrastMode?: boolean;
    darkMode?: boolean;
    selectedLanguage?: string;
  };
  token: string;
  timestamp: number;
}

interface MyDB extends DBSchema {
  terms: {
    key: string;
    value: Term;
  };
  comments: {
    key: string;
    value: { termId: string; comments: Comment[] };
  };
  'pending-votes': {
    key: string;
    value: PendingVote;
  };
  'pending-comments': {
    key: string;
    value: PendingComment;
  };
  'pending-comment-votes': {
    key: string;
    value: PendingCommentVote;
  };
  'pending-comment-edits': {
    key: string;
    value: PendingCommentEdit;
  };
  'pending-comment-deletes': {
    key: string;
    value: PendingCommentDelete;
  };
  'pending-term-submissions': { key: string; value: PendingTermSubmission };
  'pending-term-votes': { key: string; value: PendingTermVote };
  'pending-term-deletes': { key: string; value: PendingTermDelete };
  'pending-term-approvals': { key: string; value: PendingTermApproval };
  'pending-term-rejections': { key: string; value: PendingTermRejection };
  'pending-profile-pictures': {
    key: string;
    value: PendingProfilePictureUpload;
  };
  'pending-xp-awards': {
    key: string;
    value: PendingXPAward;
  };
  'pending-feedback': {
    key: string;
    value: PendingFeedback;
  };
  'pending-feedback-updates': {
    key: string;
    value: PendingFeedbackUpdate;
  };
  // Home page caches
  'random-terms-cache': {
    key: string;
    value: RandomTermsCache;
  };
  'user-profile-cache': {
    key: string;
    value: UserProfileCache;
  };
  // Workspace page caches
  'bookmarks-cache': {
    key: string;
    value: BookmarksCache;
  };
  'workspace-groups-cache': {
    key: string;
    value: WorkspaceGroupsCache;
  };
  'glossary-stats-cache': {
    key: string;
    value: GlossaryStatsCache;
  };
  // Settings page cache
  'user-preferences-cache': {
    key: string;
    value: UserPreferencesCache;
  };
  // Pending updates for offline functionality
  'pending-workspace-updates': {
    key: string;
    value: PendingWorkspaceUpdate;
  };
  'pending-settings-updates': {
    key: string;
    value: PendingSettingsUpdate;
  };
}

const dbPromise = openDB<MyDB>('marito-db', 9, {
  upgrade(db, oldVersion) {
    if (oldVersion < 3) {
      if (!db.objectStoreNames.contains('terms')) {
        db.createObjectStore('terms', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('comments')) {
        db.createObjectStore('comments', { keyPath: 'termId' });
      }
      if (!db.objectStoreNames.contains('pending-votes')) {
        db.createObjectStore('pending-votes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-comments')) {
        db.createObjectStore('pending-comments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-comment-votes')) {
        db.createObjectStore('pending-comment-votes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-comment-edits')) {
        db.createObjectStore('pending-comment-edits', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-comment-deletes')) {
        db.createObjectStore('pending-comment-deletes', { keyPath: 'id' });
      }
    }
    if (oldVersion < 4) {
      // Add the new stores in the new version
      if (!db.objectStoreNames.contains('pending-term-submissions')) {
        db.createObjectStore('pending-term-submissions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-term-votes')) {
        db.createObjectStore('pending-term-votes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-term-deletes')) {
        db.createObjectStore('pending-term-deletes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-term-approvals')) {
        db.createObjectStore('pending-term-approvals', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-term-rejections')) {
        db.createObjectStore('pending-term-rejections', { keyPath: 'id' });
      }
    }
    if (oldVersion < 5) {
      // Add profile picture uploads store
      if (!db.objectStoreNames.contains('pending-profile-pictures')) {
        db.createObjectStore('pending-profile-pictures', { keyPath: 'id' });
      }
    }
    if (oldVersion < 6) {
      // Add XP awards store
      if (!db.objectStoreNames.contains('pending-xp-awards')) {
        db.createObjectStore('pending-xp-awards', { keyPath: 'id' });
      }
    }
    if (oldVersion < 7) {
      // Add feedback store
      if (!db.objectStoreNames.contains('pending-feedback')) {
        db.createObjectStore('pending-feedback', { keyPath: 'id' });
      }
    }
    if (oldVersion < 8) {
      // Add feedback updates store
      if (!db.objectStoreNames.contains('pending-feedback-updates')) {
        db.createObjectStore('pending-feedback-updates', { keyPath: 'id' });
      }
    }
    if (oldVersion < 9) {
      // Add offline caches for home, workspace, and settings
      if (!db.objectStoreNames.contains('random-terms-cache')) {
        db.createObjectStore('random-terms-cache', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('user-profile-cache')) {
        db.createObjectStore('user-profile-cache', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('bookmarks-cache')) {
        db.createObjectStore('bookmarks-cache', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('workspace-groups-cache')) {
        db.createObjectStore('workspace-groups-cache', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('glossary-stats-cache')) {
        db.createObjectStore('glossary-stats-cache', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('user-preferences-cache')) {
        db.createObjectStore('user-preferences-cache', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-workspace-updates')) {
        db.createObjectStore('pending-workspace-updates', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-settings-updates')) {
        db.createObjectStore('pending-settings-updates', { keyPath: 'id' });
      }
    }
  },
});

export async function addTerm(term: Term) {
  const db = await dbPromise;
  await db.put('terms', term);
}

export async function getAllTerms(): Promise<Term[]> {
  const db = await dbPromise;
  return db.getAll('terms');
}

export async function clearAllTerms() {
  const db = await dbPromise;
  await db.clear('terms');
}

export async function addCommentsForTerm(termId: string, comments: Comment[]) {
  const db = await dbPromise;
  await db.put('comments', { termId, comments });
}

export async function getCommentsForTerm(termId: string): Promise<Comment[]> {
  const db = await dbPromise;
  const result = await db.get('comments', termId);
  return result ? result.comments : [];
}

export async function addPendingVote(vote: PendingVote) {
  const db = await dbPromise;
  await db.put('pending-votes', vote);
}

export async function getAndClearPendingVotes(): Promise<PendingVote[]> {
  const db = await dbPromise;
  const tx = db.transaction('pending-votes', 'readwrite');
  const allVotes = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allVotes;
}

export async function addPendingComment(comment: PendingComment) {
  const db = await dbPromise;
  await db.put('pending-comments', comment);
}

export async function getAndClearPendingComments(): Promise<PendingComment[]> {
  const db = await dbPromise;
  const tx = db.transaction('pending-comments', 'readwrite');
  const allComments = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allComments;
}

export async function addPendingCommentVote(vote: PendingCommentVote) {
  const db = await dbPromise;
  await db.put('pending-comment-votes', vote);
}

export async function getAndClearPendingCommentVotes(): Promise<
  PendingCommentVote[]
> {
  const db = await dbPromise;
  const tx = db.transaction('pending-comment-votes', 'readwrite');
  const allVotes = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allVotes;
}

export async function addPendingCommentEdit(edit: PendingCommentEdit) {
  const db = await dbPromise;
  await db.put('pending-comment-edits', edit);
}

export async function getAndClearPendingCommentEdits(): Promise<
  PendingCommentEdit[]
> {
  const db = await dbPromise;
  const tx = db.transaction('pending-comment-edits', 'readwrite');
  const allEdits = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allEdits;
}

export async function addPendingCommentDelete(del: PendingCommentDelete) {
  const db = await dbPromise;
  await db.put('pending-comment-deletes', del);
}

export async function getAndClearPendingCommentDeletes(): Promise<
  PendingCommentDelete[]
> {
  const db = await dbPromise;
  const tx = db.transaction('pending-comment-deletes', 'readwrite');
  const allDeletes = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allDeletes;
}

export async function storeTermsFromArray(terms: Term[]) {
  const db = await dbPromise;
  const tx = db.transaction('terms', 'readwrite');
  await Promise.all(terms.map((term) => tx.store.put(term)));
  await tx.done;
}
export async function getTerm(termId: string): Promise<Term | undefined> {
  const db = await dbPromise;
  return db.get('terms', termId);
}

interface QueryFilters {
  term?: string;
  language?: string;
  domain?: string;
  letter?: string | null;
  fuzzy?: boolean; // Add fuzzy flag
}

// Replace the existing queryTerms function in src/utils/indexedDB.ts

export async function queryTerms(filters: QueryFilters): Promise<Term[]> {
  const db = await dbPromise;
  const allTerms = await db.getAll('terms');

  // Sort the entire list alphabetically first.
  allTerms.sort((a, b) => a.term.localeCompare(b.term));

  const { term, language, domain, letter, fuzzy } = filters;

  return allTerms.filter((t) => {
    if (!t.term) return false;
    if (language && t.language !== language) return false;
    if (domain && t.domain !== domain) return false;

    let queryMatch = true;
    if (letter) {
      queryMatch = t.term.toLowerCase().startsWith(letter.toLowerCase());
    } else if (term) {
      if (fuzzy) {
        const searchWords = term
          .toLowerCase()
          .split(' ')
          .filter((w) => w);
        queryMatch = searchWords.every((word) =>
          t.term.toLowerCase().includes(word),
        );
      } else {
        queryMatch = t.term.toLowerCase().includes(term.toLowerCase());
      }
    }

    if (!queryMatch) return false;

    return true;
  });
}
export async function replaceAllTerms(terms: Term[]) {
  const db = await dbPromise;
  const tx = db.transaction('terms', 'readwrite');
  await tx.store.clear();
  await Promise.all(terms.map((term) => tx.store.put(term)));
  await tx.done;
}

export const addPendingTermSubmission = async (
  submission: PendingTermSubmission,
) => (await dbPromise).put('pending-term-submissions', submission);

export async function getAndClearPendingTermSubmissions(): Promise<
  PendingTermSubmission[]
> {
  const db = await dbPromise;
  const tx = db.transaction('pending-term-submissions', 'readwrite');
  const allSubmissions = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allSubmissions;
}

export const addPendingTermVote = async (vote: PendingTermVote) =>
  (await dbPromise).put('pending-term-votes', vote);

export async function getAndClearPendingTermVotes(): Promise<
  PendingTermVote[]
> {
  const db = await dbPromise;
  const tx = db.transaction('pending-term-votes', 'readwrite');
  const allVotes = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allVotes;
}

export const addPendingTermDelete = async (del: PendingTermDelete) =>
  (await dbPromise).put('pending-term-deletes', del);

export async function getAndClearPendingTermDeletes(): Promise<
  PendingTermDelete[]
> {
  const db = await dbPromise;
  const tx = db.transaction('pending-term-deletes', 'readwrite');
  const allDeletes = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allDeletes;
}

export const addPendingTermApproval = async (approval: PendingTermApproval) =>
  (await dbPromise).put('pending-term-approvals', approval);

export async function getAndClearPendingTermApprovals(): Promise<
  PendingTermApproval[]
> {
  const db = await dbPromise;
  const tx = db.transaction('pending-term-approvals', 'readwrite');
  const allApprovals = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allApprovals;
}

export const addPendingTermRejection = async (
  rejection: PendingTermRejection,
) => (await dbPromise).put('pending-term-rejections', rejection);

export async function getAndClearPendingTermRejections(): Promise<
  PendingTermRejection[]
> {
  const db = await dbPromise;
  const tx = db.transaction('pending-term-rejections', 'readwrite');
  const allRejections = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allRejections;
}

export async function getTermsByIdsFromDB(termIds: string[]): Promise<Term[]> {
  const db = await dbPromise;
  const tx = db.transaction('terms', 'readonly');
  const store = tx.store;
  const terms: Term[] = [];

  for (const id of termIds) {
    const term = await store.get(id);
    if (term) {
      terms.push(term);
    }
  }
  await tx.done;
  return terms;
}

export async function addPendingProfilePictureUpload(
  upload: PendingProfilePictureUpload,
) {
  const db = await dbPromise;
  await db.put('pending-profile-pictures', upload);
}

export async function getAndClearPendingProfilePictureUploads(): Promise<
  PendingProfilePictureUpload[]
> {
  const db = await dbPromise;
  const tx = db.transaction('pending-profile-pictures', 'readwrite');
  const allUploads = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allUploads;
}

export async function getPendingProfilePictureUploadCount(): Promise<number> {
  const db = await dbPromise;
  const allUploads = await db.getAll('pending-profile-pictures');
  return allUploads.length;
}

export async function addPendingXPAward(award: PendingXPAward) {
  const db = await dbPromise;
  await db.put('pending-xp-awards', award);
}

export async function getAndClearPendingXPAwards(): Promise<PendingXPAward[]> {
  const db = await dbPromise;
  const tx = db.transaction('pending-xp-awards', 'readwrite');
  const allAwards = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allAwards;
}

export async function getPendingXPAwardCount(): Promise<number> {
  const db = await dbPromise;
  const allAwards = await db.getAll('pending-xp-awards');
  return allAwards.length;
}

export async function addPendingFeedback(feedback: PendingFeedback) {
  const db = await dbPromise;
  await db.put('pending-feedback', feedback);
}

export async function getAndClearPendingFeedback(): Promise<PendingFeedback[]> {
  const db = await dbPromise;
  const tx = db.transaction('pending-feedback', 'readwrite');
  const allFeedback = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allFeedback;
}

export async function getPendingFeedbackCount(): Promise<number> {
  const db = await dbPromise;
  const allFeedback = await db.getAll('pending-feedback');
  return allFeedback.length;
}

export async function addPendingFeedbackUpdate(update: PendingFeedbackUpdate) {
  const db = await dbPromise;
  await db.put('pending-feedback-updates', update);
}

export async function getAndClearPendingFeedbackUpdates(): Promise<
  PendingFeedbackUpdate[]
> {
  const db = await dbPromise;
  const tx = db.transaction('pending-feedback-updates', 'readwrite');
  const allUpdates = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allUpdates;
}

export async function getPendingFeedbackUpdateCount(): Promise<number> {
  const db = await dbPromise;
  const allUpdates = await db.getAll('pending-feedback-updates');
  return allUpdates.length;
}

// Home page offline functions
export async function cacheRandomTerms(terms: RandomTermsCache) {
  const db = await dbPromise;
  await db.put('random-terms-cache', terms);
}

export async function getCachedRandomTerms(): Promise<RandomTermsCache | null> {
  const db = await dbPromise;
  const cached = await db.get('random-terms-cache', 'latest');
  // Check if cache is still valid (24 hours)
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    return cached;
  }
  return null;
}

export async function cacheUserProfile(profile: UserProfileCache) {
  const db = await dbPromise;
  await db.put('user-profile-cache', profile);
}

export async function getCachedUserProfile(): Promise<UserProfileCache | null> {
  const db = await dbPromise;
  const cached = await db.get('user-profile-cache', 'latest');
  // Check if cache is still valid (1 hour)
  if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
    return cached;
  }
  return null;
}

// Workspace page offline functions
export async function cacheBookmarks(bookmarks: BookmarksCache) {
  const db = await dbPromise;
  await db.put('bookmarks-cache', bookmarks);
}

export async function getCachedBookmarks(): Promise<BookmarksCache | null> {
  const db = await dbPromise;
  const cached = await db.get('bookmarks-cache', 'latest');
  // Check if cache is still valid (30 minutes)
  if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
    return cached;
  }
  return null;
}

export async function cacheWorkspaceGroups(groups: WorkspaceGroupsCache) {
  const db = await dbPromise;
  await db.put('workspace-groups-cache', groups);
}

export async function getCachedWorkspaceGroups(): Promise<WorkspaceGroupsCache | null> {
  const db = await dbPromise;
  const cached = await db.get('workspace-groups-cache', 'latest');
  // Check if cache is still valid (30 minutes)
  if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
    return cached;
  }
  return null;
}

export async function cacheGlossaryStats(stats: GlossaryStatsCache) {
  const db = await dbPromise;
  await db.put('glossary-stats-cache', stats);
}

export async function getCachedGlossaryStats(): Promise<GlossaryStatsCache | null> {
  const db = await dbPromise;
  const cached = await db.get('glossary-stats-cache', 'latest');
  // Check if cache is still valid (1 hour)
  if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
    return cached;
  }
  return null;
}

export async function addPendingWorkspaceUpdate(update: PendingWorkspaceUpdate) {
  const db = await dbPromise;
  await db.put('pending-workspace-updates', update);
}

export async function getAndClearPendingWorkspaceUpdates(): Promise<PendingWorkspaceUpdate[]> {
  const db = await dbPromise;
  const tx = db.transaction('pending-workspace-updates', 'readwrite');
  const allUpdates = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allUpdates;
}

// Settings page offline functions
export async function cacheUserPreferences(preferences: UserPreferencesCache) {
  const db = await dbPromise;
  await db.put('user-preferences-cache', preferences);
}

export async function getCachedUserPreferences(): Promise<UserPreferencesCache | null> {
  const db = await dbPromise;
  const cached = await db.get('user-preferences-cache', 'latest');
  // Check if cache is still valid (24 hours)
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    return cached;
  }
  return null;
}

export async function addPendingSettingsUpdate(update: PendingSettingsUpdate) {
  const db = await dbPromise;
  await db.put('pending-settings-updates', update);
}

export async function getAndClearPendingSettingsUpdates(): Promise<PendingSettingsUpdate[]> {
  const db = await dbPromise;
  const tx = db.transaction('pending-settings-updates', 'readwrite');
  const allUpdates = await tx.store.getAll();
  await tx.store.clear();
  await tx.done;
  return allUpdates;
}
