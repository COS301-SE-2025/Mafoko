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
  countText,
  onBack,
}) => (
  <div
    className="terms-list-header"
    style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'var(--header-background)',
      color: 'var(--header-text)',
      padding: '1rem 0',
      boxSizing: 'border-box',
    }}
  >
    <div
      className="header-content"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexWrap: 'wrap',
        minHeight: '56px',
        padding: '0 1rem',
      }}
    >
      {/* Back Button (absolute left) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
        }}
      >
        <button
          onClick={onBack}
          className="back-btn"
          style={{
            background: 'var(--return-button-bg)',
            border: '1px solid var(--glossary-border-color)',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            minWidth: 36,
            minHeight: 36,
          }}
        >
          <ArrowLeft
            style={{
              color: 'var(--return-button-icon)',
              width: 22,
              height: 22,
            }}
          />
        </button>
      </div>
      {/* Centered Title/Description */}
      <div
        style={{
          textAlign: 'center',
          flex: 1,
          minWidth: 0,
          padding: '0 0.5rem',
        }}
      >
        <h1
          className="header-title"
          style={{
            margin: 0,
            fontSize: '1.35rem',
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100vw',
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            className="header-desc"
            style={{
              fontSize: '0.98rem',
              margin: '0.2rem 0 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100vw',
            }}
          >
            {description}
          </p>
        )}
      </div>
      {/* Actions (absolute right) */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          zIndex: 2,
        }}
      >
        {countText && (
          <div
            className="header-count"
            style={{
              marginRight: '1.5rem',
              fontSize: '0.98rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '40vw',
            }}
          >
            {countText}
          </div>
        )}
      </div>
      {/* Mobile responsive tweaks */}
      <style>{`
    @media (max-width: 600px) {
      .terms-list-header {
        padding: 0.5rem 0 !important;
      }
      .header-content {
        padding: 0 0.2rem !important;
        min-height: 44px !important;
      }
      .header-title {
        font-size: 1.05rem !important;
      }
      .header-desc {
        font-size: 0.85rem !important;
      }
      .header-count {
        font-size: 0.85rem !important;
        margin-right: 0.5rem !important;
      }
      .back-btn {
        min-width: 28px !important;
        min-height: 28px !important;
        padding: 0.25rem !important;
      }
    }
  `}</style>
    </div>
  </div>
);

export default GlossaryHeader;
