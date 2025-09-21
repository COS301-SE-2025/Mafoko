import React from 'react';
import { Wifi, WifiOff, Download, RefreshCw } from 'lucide-react';
import { UseOfflineResult } from '../../hooks/useOffline';

interface OfflineIndicatorProps {
  offlineState: UseOfflineResult;
  onRetry?: () => void;
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  offlineState,
  onRetry,
  className = '',
}) => {
  const { isOnline, showOfflineIndicator, offlineQueue, processQueue } =
    offlineState;

  if (isOnline && !showOfflineIndicator) {
    return null;
  }

  return (
    <div
      className={`offline-indicator ${className}`}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        backgroundColor: isOnline ? '#10b981' : '#ef4444',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: '300px',
        transition: 'all 0.3s ease',
        animation: 'slideInRight 0.3s ease',
      }}
    >
      {isOnline ? (
        <>
          <Wifi size={16} />
          <span>Back Online</span>
          {offlineQueue.length > 0 && (
            <button
              type="button"
              onClick={() => void processQueue()}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title={`Sync ${offlineQueue.length} pending actions`}
            >
              <RefreshCw size={12} />
              Sync ({offlineQueue.length})
            </button>
          )}
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span>You're offline</span>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>
              Using cached data
              {offlineQueue.length > 0 &&
                ` • ${offlineQueue.length} actions queued`}
            </span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Retry connection"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
};

// Offline badge for actions
export const OfflineActionBadge: React.FC<{
  show: boolean;
  children: React.ReactNode;
}> = ({ show, children }) => {
  if (!show) return <>{children}</>;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <div
        style={{
          position: 'absolute',
          top: -4,
          right: -4,
          backgroundColor: '#f59e0b',
          color: 'white',
          borderRadius: '50%',
          width: 16,
          height: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
        }}
        title="Action will be performed when back online"
      >
        <Download size={8} />
      </div>
    </div>
  );
};

// CSS for animations (you can add this to your global CSS or component styles)
const offlineIndicatorStyles = `
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.offline-indicator {
  animation: slideInRight 0.3s ease;
}

.offline-indicator:hover {
  transform: scale(1.02);
}
`;

// Component to inject styles
export const OfflineIndicatorStyles: React.FC = () => (
  <style>{offlineIndicatorStyles}</style>
);

export default OfflineIndicator;
