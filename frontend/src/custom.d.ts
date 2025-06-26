// In src/custom.d.ts

// This teaches TypeScript about the 'SyncManager' which is responsible for registering sync events.
// This will fix the error in TermCard.tsx.
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface SyncEvent extends Event {
  readonly lastChance: boolean;
  readonly tag: string;
  waitUntil(f: Promise<void>): void;
}

interface ServiceWorkerRegistration {
  readonly sync: SyncManager;
}

interface ServiceWorkerGlobalScopeEventMap {
  sync: SyncEvent;
}
