/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import {
  addTerm,
  addCommentsForTerm,
  getAndClearPendingVotes,
} from './utils/indexedDB';
import { SW_API_ENDPOINTS } from './sw-config';
import { Comment } from './types/termDetailTypes';
import { Term } from './types/terms/types';

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// KEPT: Your caching strategies remain unchanged.
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

self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-comment-actions') {
    console.log('SW: Sync event for comments received. Notifying client.');
    self.clients
      .matchAll({
        includeUncontrolled: true,
        type: 'window',
      })
      .then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: 'SYNC_REQUEST' }),
        );
      });
  } else if (event.tag === 'sync-votes') {
    console.log('SW: Sync event for term votes received. Handling in SW.');
    event.waitUntil(syncPendingVotes());
  }
});

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

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});
