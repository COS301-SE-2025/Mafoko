// Custom hook for network status detection and offline functionality
import { useState, useEffect, useCallback } from 'react';
import { cachingService } from '../utils/cachingService';

interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  hasEverBeenOffline: boolean;
}

interface OfflineInfo {
  storageUsed: number;
  storageAvailable: number;
  cacheCount: number;
  lastSyncTime: number | null;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    hasEverBeenOffline: false,
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus((prev) => ({
        ...prev,
        isOnline: true,
        isOffline: false,
      }));
    };

    const handleOffline = () => {
      setNetworkStatus((prev) => ({
        ...prev,
        isOnline: false,
        isOffline: true,
        hasEverBeenOffline: true,
      }));
    };

    const handleNetworkStatusChange = (
      event: CustomEvent<{ isOnline: boolean }>,
    ) => {
      const { isOnline } = event.detail;
      setNetworkStatus((prev) => ({
        ...prev,
        isOnline,
        isOffline: !isOnline,
        hasEverBeenOffline: prev.hasEverBeenOffline || !isOnline,
      }));
    };

    // Listen for browser network events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for custom network status changes from caching service
    window.addEventListener(
      'networkStatusChange',
      handleNetworkStatusChange as EventListener,
    );

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(
        'networkStatusChange',
        handleNetworkStatusChange as EventListener,
      );
    };
  }, []);

  return networkStatus;
};

export const useOfflineInfo = () => {
  const [offlineInfo, setOfflineInfo] = useState<OfflineInfo>({
    storageUsed: 0,
    storageAvailable: 0,
    cacheCount: 0,
    lastSyncTime: null,
  });

  useEffect(() => {
    const updateOfflineInfo = async () => {
      try {
        const storageInfo = await cachingService.getStorageInfo();
        const lastSync = localStorage.getItem('lastSyncTime');

        setOfflineInfo({
          storageUsed: storageInfo.used,
          storageAvailable: storageInfo.available,
          cacheCount: 0, // We could extend this if needed
          lastSyncTime: lastSync ? parseInt(lastSync, 10) : null,
        });
      } catch (error) {
        console.error('Failed to get offline info:', error);
      }
    };

    void updateOfflineInfo();

    // Update info when network status changes
    const handleNetworkChange = () => {
      void updateOfflineInfo();
    };

    window.addEventListener('networkStatusChange', handleNetworkChange);

    return () => {
      window.removeEventListener('networkStatusChange', handleNetworkChange);
    };
  }, []);

  return offlineInfo;
};

// Hook for managing offline-first data fetching
export const useOfflineData = <T>(
  fetchFunction: () => Promise<{
    data: T;
    fromCache: boolean;
    isOffline: boolean;
  }>,
  dependencies: unknown[] = [],
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const networkStatus = useNetworkStatus();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchFunction();

      setData(result.data);
      setFromCache(result.fromCache);
      setIsOffline(result.isOffline);

      // Update last sync time if data is fresh
      if (!result.fromCache) {
        localStorage.setItem('lastSyncTime', Date.now().toString());
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);

      // If we're offline and have no cached data, that's expected
      if (networkStatus.isOffline && errorMessage.includes('No cached data')) {
        setError(
          'No offline data available. Connect to internet to fetch data.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, networkStatus.isOffline]);

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // Retry when coming back online
  useEffect(() => {
    if (networkStatus.isOnline && networkStatus.hasEverBeenOffline) {
      void fetchData();
    }
  }, [networkStatus.isOnline, networkStatus.hasEverBeenOffline, fetchData]);

  return {
    data,
    loading,
    error,
    fromCache,
    isOffline,
    refetch: fetchData,
  };
};
