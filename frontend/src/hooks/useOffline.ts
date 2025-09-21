import { useState, useEffect, useCallback } from 'react';
import {
  isOnline,
  getNetworkStatus,
  setupNetworkMonitoring,
  processOfflineQueue,
  getOfflineQueue,
  addToOfflineQueue,
  NetworkStatus,
  OfflineQueueItem,
} from '../utils/offlineManager';

export interface UseOfflineResult {
  isOnline: boolean;
  isOffline: boolean;
  networkStatus: NetworkStatus;
  offlineQueue: OfflineQueueItem[];
  queueAction: (
    action: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>,
  ) => void;
  processQueue: () => Promise<void>;
  showOfflineIndicator: boolean;
}

/**
 * Custom hook for managing offline functionality
 */
export const useOffline = (): UseOfflineResult => {
  const [online, setOnline] = useState(isOnline());
  const [networkStatus, setNetworkStatus] =
    useState<NetworkStatus>(getNetworkStatus());
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);

  // Update queue state
  const updateQueue = useCallback(() => {
    setOfflineQueue(getOfflineQueue());
  }, []);

  // Queue an action for offline processing
  const queueAction = useCallback(
    (action: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>) => {
      addToOfflineQueue(action);
      updateQueue();
    },
    [updateQueue],
  );

  // Process offline queue
  const processQueue = useCallback(async () => {
    if (online) {
      await processOfflineQueue();
      updateQueue();
    }
  }, [online, updateQueue]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setNetworkStatus(getNetworkStatus());
      setShowOfflineIndicator(false);

      // Auto-process queue when back online
      setTimeout(() => {
        void processQueue();
      }, 1000);
    };

    const handleOffline = () => {
      setOnline(false);
      setNetworkStatus(getNetworkStatus());
      setShowOfflineIndicator(true);
    };

    // Setup network monitoring
    const cleanup = setupNetworkMonitoring(handleOnline, handleOffline);

    // Initial queue load
    updateQueue();

    // Cleanup on unmount
    return cleanup;
  }, [processQueue, updateQueue]);

  // Hide offline indicator after a delay when back online
  useEffect(() => {
    if (online && showOfflineIndicator) {
      const timer = setTimeout(() => {
        setShowOfflineIndicator(false);
      }, 3000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [online, showOfflineIndicator]);

  return {
    isOnline: online,
    isOffline: !online,
    networkStatus,
    offlineQueue,
    queueAction,
    processQueue,
    showOfflineIndicator,
  };
};
