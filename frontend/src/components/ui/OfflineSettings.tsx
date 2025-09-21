// src/components/ui/OfflineSettings.tsx

import React, { useState, useEffect } from 'react';

export const OfflineSettings: React.FC = () => {
  const [status, setStatus] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CACHE_STATUS') {
        setStatus(event.data.message);
        // Only stop downloading on final success or error
        if (event.data.status === 'success' || event.data.status === 'error') {
          setIsDownloading(false);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    };
  }, []);

  const handleDownload = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      setIsDownloading(true);
      setStatus('Starting download...');
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_ALL_TERMS',
      });
    } else {
      setStatus('Could not connect to the service worker.');
    }
  };

  return (
    <div className="flex items-center gap-4 mt-2">
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={isDownloading}
        className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDownloading ? 'Downloading...' : 'Download Glossary Offline'}
      </button>
      {status && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{status}</p>
      )}
    </div>
  );
};
