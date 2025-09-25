/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import {
  getAndClearPendingVotes,
  addTerm,
  addCommentsForTerm,
  getAndClearPendingProfilePictureUploads,
} from './utils/indexedDB';
import { SW_API_ENDPOINTS } from './sw-config';
import { Comment } from './types/termDetailTypes';
import { Term } from './types/terms/types';

import type { PrecacheEntry } from 'workbox-precaching';

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<string | PrecacheEntry>;
    skipWaiting(): Promise<void>;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
    ): void;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Event type definitions
interface SyncEvent extends ExtendableEvent {
  readonly lastChance: boolean;
  readonly tag: string;
  waitUntil(f: Promise<void>): void;
}

interface FetchEvent extends ExtendableEvent {
  readonly request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

// Types for offline queue
interface BookmarkAction {
  type: 'bookmark';
  id: string;
  data: {
    action: 'bookmark' | 'unbookmark';
    glossaryName: string;
    description?: string;
    token: string;
  };
}

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses with different strategies
registerRoute(
  // Match GET requests for workspace endpoints and glossary stats
  ({ url, request }) =>
    request.method === 'GET' &&
    (url.pathname.startsWith('/api/v1/workspace') ||
      url.pathname === '/api/v1/glossary/categories/stats'),
  new NetworkFirst({
    cacheName: 'workspace-api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  }),
);

registerRoute(
  ({ url }: { url: URL }) =>
    url.pathname.includes('/api/v1/glossary-categories'),
  new NetworkFirst({
    cacheName: 'glossary-categories',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  }),
);

registerRoute(
  ({ url }: { url: URL }) => url.pathname.includes('/api/v1/glossary-terms'),
  new NetworkFirst({
    cacheName: 'glossary-terms',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 3,
      }),
    ],
  }),
);

// Caching for search results
registerRoute(
  ({ url }) => url.pathname.includes('/api/v1/search'),
  new StaleWhileRevalidate({
    cacheName: 'api-search-cache',
    plugins: [
      {
        fetchDidSucceed: async ({ response }) => {
          const clonedResponse = response.clone();
          try {
            const data = await clonedResponse.json();
            const terms: Term[] = data.items || [];
            for (const term of terms) {
              await addTerm(term);
            }
          } catch (e) {
            console.error(
              'SW: Failed to parse search response for IndexedDB caching.',
              e,
            );
          }
          return response;
        },
      },
    ],
  }),
);

// Caching for comments
registerRoute(
  ({ url }) => url.pathname.includes('/api/v1/comments/by_term/'),
  new StaleWhileRevalidate({
    cacheName: 'api-comments-cache',
    plugins: [
      {
        fetchDidSucceed: async ({ response, request }) => {
          const clonedResponse = response.clone();
          try {
            const comments: Comment[] = await clonedResponse.json();
            const urlParts = request.url.split('/');
            const termId = urlParts[urlParts.length - 1];
            if (termId && comments) {
              await addCommentsForTerm(termId, comments);
            }
          } catch (e) {
            console.error(
              'SW: Failed to parse comments response for IndexedDB caching.',
              e,
            );
          }
          return response;
        },
      },
    ],
  }),
);

registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    (url.pathname === '/api/v1/glossary/random' ||
      url.pathname === '/api/v1/auth/me/profile-picture'),
  new NetworkFirst({
    cacheName: 'api-misc',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  }),
);

registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    (url.pathname.startsWith('/api/v1/term-applications') ||
      url.pathname.startsWith('/api/v1/terms') ||
      url.pathname.startsWith('/api/v1/linguist') ||
      url.pathname.startsWith('/api/v1/admin')),
  new StaleWhileRevalidate({
    cacheName: 'api-term-actions-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  }),
);

registerRoute(
  ({ url }: { url: URL }) =>
    url.pathname.includes('/api/v1/glossary-term-translations'),
  new NetworkFirst({
    cacheName: 'glossary-translations',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
    ],
  }),
);

registerRoute(
  ({ url, request }) =>
    url.pathname === '/api/v1/terms/terms-by-ids' && request.method === 'POST',
  new StaleWhileRevalidate({
    cacheName: 'api-term-actions-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  }),
);

// Cache static assets
registerRoute(
  ({ request }: { request: Request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
);

// Listen for the 'sync' event tag
self.addEventListener('sync', ((event: SyncEvent) => {
  if (event.tag === 'sync-votes') {
    console.log('Service Worker: "sync-votes" event received.');
    event.waitUntil(syncPendingVotes());
  } else if (event.tag === 'sync-bookmarks') {
    console.log('Service Worker: "sync-bookmarks" event received.');
    event.waitUntil(syncPendingBookmarks());
  } else if (event.tag === 'sync-profile-pictures') {
    console.log('Service Worker: "sync-profile-pictures" event received.');
    event.waitUntil(syncPendingProfilePictures());
  } else if (event.tag === 'sync-comment-actions') {
    console.log('SW: Sync event for comments received. Notifying client.');
    self.clients
      .matchAll({ includeUncontrolled: true, type: 'window' })
      .then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: 'SYNC_REQUEST' }),
        );
      });
  } else if (event.tag === 'sync-term-actions') {
    console.log('SW: Sync event for term actions received. Notifying client.');
    self.clients
      .matchAll({ includeUncontrolled: true, type: 'window' })
      .then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: 'TERM_SYNC_REQUEST' }),
        );
      });
  }
}) as EventListener);

// This is for term votes (like on the search page), not comment votes.
async function syncPendingVotes() {
  try {
    const pendingVotes = await getAndClearPendingVotes();
    for (const vote of pendingVotes) {
      const response = await fetch(SW_API_ENDPOINTS.VOTES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vote.token}`,
        },
        body: JSON.stringify({ term_id: vote.term_id, vote: vote.vote }),
      });
      if (!response.ok) {
        console.error(
          `SW Sync Failed for vote on term ${vote.term_id}. Status: ${response.status}`,
        );
      }
    }
  } catch (error) {
    console.error('SW Error: syncPendingVotes failed.', error);
  }
}

async function syncPendingBookmarks() {
  console.log('Service Worker: Starting to sync pending bookmarks...');
  try {
    // Get offline queue from localStorage (for workspace actions only)
    const queueData = localStorage.getItem('mavito-offline-queue');
    if (!queueData) {
      console.log('Service Worker: No pending bookmarks to sync.');
      return;
    }

    const queue = JSON.parse(queueData) as Array<BookmarkAction>;
    const bookmarkActions = queue.filter(
      (action) => action.type === 'bookmark',
    );

    if (bookmarkActions.length === 0) {
      console.log('Service Worker: No bookmark actions to sync.');
      return;
    }

    for (const action of bookmarkActions) {
      try {
        const { data } = action;
        const { action: actionType, glossaryName, description, token } = data;

        const endpoint =
          actionType === 'bookmark'
            ? '/api/v1/bookmark-glossary'
            : `/api/v1/unbookmark-glossary/${encodeURIComponent(glossaryName)}`;

        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
        };

        if (actionType === 'bookmark') {
          headers['Content-Type'] = 'application/json';
        }

        const options: RequestInit = {
          method: actionType === 'bookmark' ? 'POST' : 'DELETE',
          headers,
        };

        if (actionType === 'bookmark') {
          options.body = JSON.stringify({
            domain: glossaryName,
            description: description || '',
          });
        }

        const response = await fetch(endpoint, options);

        if (response.ok || response.status === 409) {
          console.log(
            `Service Worker: Successfully synced ${actionType} for glossary ${glossaryName}`,
          );

          // Remove this action from the queue
          const updatedQueue = queue.filter((item) => item.id !== action.id);
          localStorage.setItem(
            'mavito-offline-queue',
            JSON.stringify(updatedQueue),
          );
        } else {
          console.error(
            `Service Worker: Failed to sync ${actionType} for glossary ${glossaryName}. Server responded with:`,
            response.status,
          );
        }
      } catch (error) {
        console.error(
          'Service Worker: Network error while syncing bookmark action:',
          error,
        );
      }
    }
    console.log('Service Worker: Bookmark sync finished.');
  } catch (error) {
    console.error('Service Worker: Failed to sync pending bookmarks:', error);
  }
}

async function syncPendingProfilePictures() {
  console.log('Service Worker: Starting to sync pending profile pictures...');
  try {
    const pendingUploads = await getAndClearPendingProfilePictureUploads();
    if (pendingUploads.length === 0) {
      console.log(
        'Service Worker: No pending profile picture uploads to sync.',
      );
      return;
    }

    for (const upload of pendingUploads) {
      try {
        const uploadUrlResponse = await fetch(
          SW_API_ENDPOINTS.PROFILE_PICTURE_UPLOAD_URL,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${upload.token}`,
            },
            body: JSON.stringify({
              filename: upload.fileName,
              content_type: upload.contentType,
            }),
          },
        );

        if (!uploadUrlResponse.ok) {
          console.error(
            `SW: Failed to get upload URL for user ${upload.userId}. Status: ${uploadUrlResponse.status}`,
          );
          continue;
        }

        const uploadData = (await uploadUrlResponse.json()) as {
          upload_url: string;
          gcs_key: string;
        };

        const uploadResponse = await fetch(uploadData.upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': upload.contentType,
          },
          body: upload.file,
        });

        if (!uploadResponse.ok) {
          console.error(
            `SW: Failed to upload profile picture to GCS for user ${upload.userId}. Status: ${uploadResponse.status}`,
          );
          continue;
        }

        const profileUpdateResponse = await fetch(
          SW_API_ENDPOINTS.PROFILE_PICTURE_UPDATE,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${upload.token}`,
            },
            body: JSON.stringify({
              profile_pic_url: uploadData.gcs_key,
            }),
          },
        );

        if (profileUpdateResponse.ok) {
          console.log(
            `Service Worker: Successfully synced profile picture upload for user ${upload.userId}`,
          );

          self.clients
            .matchAll({ includeUncontrolled: true, type: 'window' })
            .then((clients) => {
              clients.forEach((client) =>
                client.postMessage({
                  type: 'PROFILE_PICTURE_SYNCED',
                  userId: upload.userId,
                }),
              );
            });
        } else {
          console.error(
            `SW: Failed to update profile picture for user ${upload.userId}. Status: ${profileUpdateResponse.status}`,
          );
        }
      } catch (error) {
        console.error(
          `Service Worker: Network error while syncing profile picture for user ${upload.userId}:`,
          error,
        );
      }
    }
    console.log('Service Worker: Profile picture sync finished.');
  } catch (error) {
    console.error(
      'Service Worker: Failed to sync pending profile pictures:',
      error,
    );
  }
}

self.addEventListener('message', ((event: ExtendableMessageEvent) => {
  const messageData = event.data as { type?: string; payload?: any };

  if (messageData.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }

  if (messageData.type === 'UPDATE_CACHE') {
    const { cacheName, url, data } = messageData.payload;
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });

    event.waitUntil(
      caches.open(cacheName).then((cache) => cache.put(url, response)),
    );
  }
}) as EventListener);

// Handle offline fallback
self.addEventListener('fetch', ((event: FetchEvent) => {
  // Only handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        // Return cached page or a custom offline page
        const cachedResponse = await caches.match('/');
        return (
          cachedResponse ||
          new Response('Offline - Please check your connection', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          })
        );
      }),
    );
  }
}) as EventListener);
