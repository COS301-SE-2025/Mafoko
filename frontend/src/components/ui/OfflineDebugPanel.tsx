import React, { useState, useEffect } from 'react';
import { useOffline } from '../../hooks/useOffline';
import { getCacheStats, clearGlossaryCache } from '../../utils/glossaryCache';

interface CacheStats {
  glossaries: number;
  terms: number;
  translations: number;
  metadata: number;
  totalSize: number;
}

const OfflineDebugPanel: React.FC = () => {
  const offlineState = useOffline();
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const refreshStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear all cached data?')) {
      try {
        await clearGlossaryCache();
        await refreshStats();
        alert('Cache cleared successfully!');
      } catch (error) {
        console.error('Failed to clear cache:', error);
        alert('Failed to clear cache');
      }
    }
  };

  useEffect(() => {
    if (showPanel) {
      void refreshStats();
    }
  }, [showPanel]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          position: 'fixed',
          bottom: 100,
          left: 16,
          zIndex: 9998,
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '12px',
          cursor: 'pointer',
        }}
      >
        {showPanel ? 'Hide' : 'Debug'} Cache
      </button>

      {showPanel && (
        <div
          style={{
            position: 'fixed',
            bottom: 140,
            left: 16,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '12px',
            minWidth: '300px',
            maxWidth: '400px',
          }}
        >
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
            Offline Debug Panel
          </h4>

          <div style={{ marginBottom: '12px' }}>
            <strong>Network Status:</strong>
            <br />
            Online: {offlineState.isOnline ? '✅' : '❌'}
            <br />
            Queue: {offlineState.offlineQueue.length} items
            <br />
            Connection: {offlineState.networkStatus.connectionType || 'unknown'}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <strong>Cache Stats:</strong>
            <br />
            {cacheStats ? (
              <>
                Glossaries: {cacheStats.glossaries}
                <br />
                Terms: {cacheStats.terms}
                <br />
                Translations: {cacheStats.translations}
                <br />
                Metadata: {cacheStats.metadata}
                <br />
                Total Entries: {cacheStats.totalSize}
              </>
            ) : (
              'Loading...'
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => void refreshStats()}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
            <button
              onClick={() => void offlineState.processQueue()}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Sync Queue
            </button>
            <button
              onClick={() => void handleClearCache()}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Clear Cache
            </button>
          </div>

          <div style={{ marginTop: '12px', fontSize: '11px', opacity: 0.8 }}>
            <strong>Test Offline:</strong>
            <br />
            Open DevTools → Network → Check "Offline"
          </div>
        </div>
      )}
    </>
  );
};

export default OfflineDebugPanel;
