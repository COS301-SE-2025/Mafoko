import React from 'react';
import { ArrowLeft } from 'lucide-react';

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
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--return-button-bg)',
          border: '1px solid var(--glossary-border-color)',
          borderRadius: '8px',
          padding: '8px',
          minWidth: '36px',
          minHeight: '36px',
          cursor: 'pointer',
          transition: 'opacity 0.2s ease',
        }}
      >
        <ArrowLeft
          style={{
            width: '22px',
            height: '22px',
            color: 'var(--return-button-icon)',
          }}
        />
      </button>

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

      <div style={{ width: '36px', height: '36px' }} />
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
