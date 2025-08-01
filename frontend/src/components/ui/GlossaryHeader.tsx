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
      }}
    >
      {/* Back Button (absolute left) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <button onClick={onBack} className="back-btn">
          <ArrowLeft />
        </button>
      </div>
      {/* Centered Title/Description */}
      <div style={{ textAlign: 'center', flex: 1 }}>
        <h1 className="header-title" style={{ margin: 0 }}>
          {title}
        </h1>
        {description && <p className="header-desc">{description}</p>}
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
        }}
      >
        {countText && (
          <div className="header-count" style={{ marginRight: '1.5rem' }}>
            {countText}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default GlossaryHeader;
