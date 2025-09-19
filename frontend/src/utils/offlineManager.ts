/**
 * Utility for detecting and managing offline/online state
 */

// Type definitions for network connection API
interface NetworkConnection {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
  mozConnection?: NetworkConnection;
  webkitConnection?: NetworkConnection;
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export interface OfflineQueueItem {
  id: string;
  type: 'bookmark' | 'export' | 'translation';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

const OFFLINE_QUEUE_KEY = 'mavito-offline-queue';
const NETWORK_STATUS_KEY = 'mavito-network-status';
const MAX_RETRIES = 3;

/**
 * Get current network status
 */
export const getNetworkStatus = (): NetworkStatus => {
  const isOnline = navigator.onLine;

  // Try to get connection info if available
  const nav = navigator as NavigatorWithConnection;
  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;

  const status: NetworkStatus = {
    isOnline,
  };

  if (connection) {
    status.connectionType = connection.type;
    status.effectiveType = connection.effectiveType;
    status.downlink = connection.downlink;
    status.rtt = connection.rtt;
  }

  return status;
};

/**
 * Check if device is currently online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Check if device is currently offline
 */
export const isOffline = (): boolean => {
  return !navigator.onLine;
};

/**
 * Add item to offline queue
 */
export const addToOfflineQueue = (
  item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>,
): void => {
  const queue = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    ...item,
    id: `${item.type}-${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
    retries: 0,
  };

  queue.push(newItem);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

  console.log('Added to offline queue:', newItem);
};

/**
 * Get offline queue
 */
export const getOfflineQueue = (): OfflineQueueItem[] => {
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? (JSON.parse(queue) as OfflineQueueItem[]) : [];
  } catch (error) {
    console.error('Error reading offline queue:', error);
    return [];
  }
};

/**
 * Remove item from offline queue
 */
export const removeFromOfflineQueue = (id: string): void => {
  const queue = getOfflineQueue();
  const updatedQueue = queue.filter((item) => item.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
};

/**
 * Clear offline queue
 */
export const clearOfflineQueue = (): void => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

/**
 * Process offline queue when back online
 */
export const processOfflineQueue = async (): Promise<void> => {
  if (isOffline()) {
    console.log('Still offline, skipping queue processing');
    return;
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return;
  }

  console.log(`Processing ${queue.length.toString()} items from offline queue`);

  for (const item of queue) {
    try {
      let success = false;

      switch (item.type) {
        case 'bookmark':
          success = await processBookmarkAction(item.data);
          break;
        case 'export':
          success = await processExportAction(item.data);
          break;
        case 'translation':
          success = await processTranslationAction(item.data);
          break;
        default:
          console.warn('Unknown offline queue item type:', item.type);
      }

      if (success) {
        removeFromOfflineQueue(item.id);
        console.log('Successfully processed offline queue item:', item.id);
      } else {
        // Increment retry count
        item.retries++;
        if (item.retries >= MAX_RETRIES) {
          removeFromOfflineQueue(item.id);
          console.error('Max retries reached for offline queue item:', item.id);
        } else {
          // Update the item in queue with new retry count
          const queue = getOfflineQueue();
          const updatedQueue = queue.map((queueItem) =>
            queueItem.id === item.id ? item : queueItem,
          );
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
        }
      }
    } catch (error) {
      console.error('Error processing offline queue item:', item.id, error);
      item.retries++;
      if (item.retries >= MAX_RETRIES) {
        removeFromOfflineQueue(item.id);
      }
    }
  }
};

/**
 * Process bookmark action from offline queue
 */
const processBookmarkAction = async (
  data: Record<string, unknown>,
): Promise<boolean> => {
  try {
    const { action, glossaryName, description, token } = data;
    const actionStr = String(action);
    const glossaryNameStr = String(glossaryName);
    const tokenStr = String(token);

    const endpoint =
      actionStr === 'bookmark'
        ? '/api/v1/bookmark-glossary'
        : `/api/v1/unbookmark-glossary/${encodeURIComponent(glossaryNameStr)}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${tokenStr}`,
    };

    if (actionStr === 'bookmark') {
      headers['Content-Type'] = 'application/json';
    }

    const options: RequestInit = {
      method: actionStr === 'bookmark' ? 'POST' : 'DELETE',
      headers,
    };

    if (actionStr === 'bookmark') {
      options.body = JSON.stringify({
        domain: glossaryNameStr,
        description: String(description) || '',
      });
    }

    const response = await fetch(endpoint, options);
    return response.ok || response.status === 409; // 409 means already bookmarked
  } catch (error) {
    console.error('Error processing bookmark action:', error);
    return false;
  }
};

/**
 * Process export action from offline queue
 */
const processExportAction = (
  data: Record<string, unknown>,
): Promise<boolean> => {
  // For export actions, we might want to re-fetch latest data
  // or use cached data depending on the use case
  console.log('Export action processed (using cached data):', data);
  return Promise.resolve(true); // Exports work with cached data
};

/**
 * Process translation action from offline queue
 */
const processTranslationAction = async (
  data: Record<string, unknown>,
): Promise<boolean> => {
  try {
    const { termId, endpoint, token } = data;
    const termIdStr = String(termId);
    const endpointStr = String(endpoint);
    const tokenStr = String(token);

    const response = await fetch(endpointStr, {
      headers: {
        Authorization: `Bearer ${tokenStr}`,
      },
    });

    if (response.ok) {
      const translationData = (await response.json()) as {
        translations?: Record<string, string>;
      };
      // Cache the translations
      const { offlineStorage } = (await import('./offlineStorage')) as {
        offlineStorage: {
          saveTermTranslations: (
            termId: string,
            translations: Record<string, string>,
          ) => Promise<void>;
        };
      };
      await offlineStorage.saveTermTranslations(
        termIdStr,
        translationData.translations || {},
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error processing translation action:', error);
    return false;
  }
};

/**
 * Save network status to localStorage
 */
export const saveNetworkStatus = (status: NetworkStatus): void => {
  localStorage.setItem(NETWORK_STATUS_KEY, JSON.stringify(status));
};

/**
 * Get saved network status
 */
export const getSavedNetworkStatus = (): NetworkStatus | null => {
  try {
    const saved = localStorage.getItem(NETWORK_STATUS_KEY);
    return saved ? (JSON.parse(saved) as NetworkStatus) : null;
  } catch (error) {
    console.error('Error reading saved network status:', error);
    return null;
  }
};

/**
 * Setup network status monitoring
 */
export const setupNetworkMonitoring = (
  onOnline?: () => void,
  onOffline?: () => void,
): (() => void) => {
  const handleOnline = () => {
    console.log('Network: Back online');
    saveNetworkStatus(getNetworkStatus());
    if (onOnline) onOnline();

    // Process offline queue when back online
    setTimeout(() => {
      void processOfflineQueue();
    }, 1000); // Small delay to ensure connection is stable
  };

  const handleOffline = () => {
    console.log('Network: Gone offline');
    saveNetworkStatus(getNetworkStatus());
    if (onOffline) onOffline();
  };

  // Listen for network events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initial status save
  saveNetworkStatus(getNetworkStatus());

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Show offline notification
 */
export const showOfflineNotification = (): void => {
  // This can be customized based on your notification system
  console.warn('Application is offline. Some features may be limited.');
};

/**
 * Show online notification
 */
export const showOnlineNotification = (): void => {
  console.log('Application is back online. Syncing data...');
};
