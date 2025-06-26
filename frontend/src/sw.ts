/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { getAndClearPendingVotes } from './utils/indexedDB';

declare const self: ServiceWorkerGlobalScope;

// This teaches TypeScript what a SyncEvent looks like.
interface SyncEvent extends Event {
  readonly lastChance: boolean;
  readonly tag: string;
  waitUntil(f: Promise<void>): void;
}

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Listen for the 'sync' event tag
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-votes') {
    console.log('Service Worker: "sync-votes" event received.');
    event.waitUntil(syncPendingVotes());
  }
});

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

self.addEventListener('message', (event) => {
  const messageData = event.data as { type?: string };

  if (messageData.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});
