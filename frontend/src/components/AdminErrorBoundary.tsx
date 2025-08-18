import React from 'react';

interface AdminErrorBoundaryProps {
  authError: string;
}

export const AdminErrorBoundary: React.FC<AdminErrorBoundaryProps> = ({
  authError,
}) => {
  return (
    <div
      className="error-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <h1 style={{ color: '#dc3545' }}>{authError}</h1>
      <button
        type="button"
        onClick={() => (window.location.href = '/Marito/dashboard')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Go to Dashboard
      </button>
    </div>
  );
};
