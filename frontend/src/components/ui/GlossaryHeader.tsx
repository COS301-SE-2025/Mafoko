import React from 'react';
import { X } from 'lucide-react';

interface GlossaryHeaderProps {
  title: string;
  description?: string;
  countText?: string;
  onBack: () => void;
}

const GlossaryHeader: React.FC<GlossaryHeaderProps> = ({
  title,
  description,
  onBack,
}) => (
  <div
    className="w-full bg-[var(--bg-first)] text-[var(--header-text)] py-4 md:py-5"
    style={{
      borderBottom: '1px solid var(--glossary-border-color)',
      boxSizing: 'border-box',
    }}
  >
    {/* Top Row: Back Button + Title + Count */}
    <div
      className="flex items-center justify-between w-full px-4 md:px-6 h-[20vh]"
      style={{
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      {/* Placeholder div on the left for symmetry */}
      <div style={{ width: '36px', height: '36px' }} />

      {/* Title and Count inline */}
      <div
        className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-center text-center"
        style={{
          minWidth: 0,
        }}
      >
        <h1
          className="font-bold truncate text-lg"
          style={{
            padding: '20px',
            color: 'var(--header-text)',
          }}
        >
          {title}
        </h1>
      </div>

      {/* Exit Button - On the right */}
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--return-button-bg)',
          border: '1px solid var(--glossary-border-color)',
          borderRadius: '50%', // Make it circular
          padding: '8px',
          minWidth: '36px',
          minHeight: '36px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.backgroundColor = 'rgba(255, 82, 82, 0.1)'; // Subtle red on hover
          e.currentTarget.style.borderColor = 'rgba(255, 82, 82, 0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.backgroundColor = 'var(--return-button-bg)';
          e.currentTarget.style.borderColor = 'var(--glossary-border-color)';
        }}
      >
        <X
          style={{
            width: '22px',
            height: '22px',
            strokeWidth: 2.5,
            color: 'var(--return-button-icon)',
          }}
        />
      </button>
    </div>

    {/* Description below */}
    {description && (
      <p
        className="mt-2 text-center text-sm md:text-base px-6"
        style={{
          color: 'var(--header-text)',
          opacity: 0.8,
        }}
      >
        {description}
      </p>
    )}
  </div>
);

export default GlossaryHeader;
