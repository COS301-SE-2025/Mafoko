/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { getAndClearPendingVotes } from './utils/indexedDB';

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
interface SyncEvent extends Event {
  readonly lastChance: boolean;
  readonly tag: string;
  waitUntil(f: Promise<void>): void;
}

interface FetchEvent extends Event {
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
self.addEventListener('sync', ((event: Event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === 'sync-votes') {
    console.log('Service Worker: "sync-votes" event received.');
    syncEvent.waitUntil(syncPendingVotes());
  } else if (syncEvent.tag === 'sync-bookmarks') {
    console.log('Service Worker: "sync-bookmarks" event received.');
    syncEvent.waitUntil(syncPendingBookmarks());
  }
}) as EventListener);

async function syncPendingVotes() {
  console.log('Service Worker: Starting to sync pending votes...');
  try {
    const pendingVotes = await getAndClearPendingVotes();
    if (pendingVotes.length === 0) {
      console.log('Service Worker: No pending votes to sync.');
      return;
    }

    for (const vote of pendingVotes) {
      if (!vote.token) {
        console.error(
          `Service Worker: Skipping vote for term ${vote.term_id} as it has no auth token.`,
        );
        continue;
      }

      try {
        const response = await fetch('/api/v1/votes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${vote.token}`,
          },
          body: JSON.stringify({
            term_id: vote.term_id,
            vote: vote.vote,
          }),
        });

        if (response.ok) {
          console.log(
            `Service Worker: Successfully synced vote for term ${vote.term_id}`,
          );
        } else {
          console.error(
            `Service Worker: Failed to sync vote for term ${vote.term_id}. Server responded with:`,
            response.status,
          );
        }
      } catch (error) {
        console.error(
          `Service Worker: Network error while syncing vote for term ${vote.term_id}`,
          error,
        );
      }
    }
    console.log('Service Worker: Vote sync finished.');
  } catch (error) {
    console.error(
      'Service Worker: Failed to get pending votes from IndexedDB.',
      error,
    );
  }
}

async function syncPendingBookmarks() {
  console.log('Service Worker: Starting to sync pending bookmarks...');
  try {
    // Get offline queue from localStorage
    const queueData = localStorage.getItem('mavito-offline-queue');
    if (!queueData) {
      console.log('Service Worker: No pending bookmarks to sync.');
      return;
    }

    // Parse and validate the queue data
    const queue = JSON.parse(queueData) as Array<BookmarkAction>;
    const bookmarkActions = queue;

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
        if (error instanceof Error) {
          console.error(
            'Service Worker: Network error while syncing bookmark action:',
            error.message,
          );
        } else {
          console.error(
            'Service Worker: Unknown error while syncing bookmark action',
            error,
          );
        }
      }
    }
    console.log('Service Worker: Bookmark sync finished.');
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        'Service Worker: Failed to sync pending bookmarks:',
        error.message,
      );
    } else {
      console.error(
        'Service Worker: Unknown error syncing pending bookmarks',
        error,
      );
    }
  }
}

self.addEventListener('message', ((event: Event) => {
  const messageEvent = event as MessageEvent;
  const messageData = messageEvent.data as { type?: string };

  if (messageData.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
}) as EventListener);

// Handle offline fallback
self.addEventListener('fetch', ((event: Event) => {
  const fetchEvent = event as FetchEvent;
  // Only handle navigation requests
  if (fetchEvent.request.mode === 'navigate') {
    fetchEvent.respondWith(
      fetch(fetchEvent.request).catch(async () => {
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
