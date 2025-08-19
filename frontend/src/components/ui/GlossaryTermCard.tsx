import React from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface GlossaryTermCardProps {
  term: {
    id: number;
    term: string;
    definition: string;
    language?: string;
    translations?: { [lang: string]: string };
  };
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
  isLoadingTranslations?: boolean;
}

const GlossaryTermCard: React.FC<GlossaryTermCardProps> = ({
  term,
  isExpanded,
  onToggleExpand,
  isLoadingTranslations = false,
}) => {
  return (
    <div
      className="term-card"
      style={{
        maxWidth: 900,
        margin: '1rem auto',
        padding: '1.5rem 2rem',
        borderRadius: '16px',
        boxShadow: '0 2px 8px var(--card-shadow)',
        background: 'var(--card-background)',
        color: 'var(--text-theme)',
        fontSize: '1.1rem',
        minHeight: '80px',
        minWidth: '300px',
        borderTop: '2px solid #00ceaf99',
      }}
    >
      <div className="card-content" style={{ padding: 0 }}>
        <div className="term-header">
          <h3
            className="term-title"
            style={{
              fontSize: '1.55rem',
              fontWeight: 500,
              marginTop: '0.7rem',
              marginBottom: '0.5rem',
            }}
          >
            {term.term}
          </h3>
          <span className="term-language-badge">
            {term.language ? term.language : 'None'}
          </span>
        </div>
        <div className="term-definition">
          <FileText className="icon" />
          <p>{term.definition}</p>
        </div>
        <div
          style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
        >
          <button
            type="button"
            className="show-translations-btn"
            style={{
              background: '#f00a50',
              color: '#ffffff',
              border: '1px solid #f00a50',
              borderRadius: '9999px',
              padding: '0.25em 1em',
              fontWeight: 600,
              marginBottom: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f00a4fe0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f00a4fff';
            }}
            onClick={() => {
              onToggleExpand(term.id);
            }}
          >
            <span
              style={{
                color: '#ffffff !important',
                WebkitTextFillColor: '#ffffff',
                fontWeight: 600,
                letterSpacing: 0.1,
                fontSize: '0.95rem',
                lineHeight: 1,
                display: 'inline-block',
              }}
            >
              {isExpanded ? 'Hide Translations' : 'Show Translations'}
            </span>
            <span
              style={{
                color: '#ffffff !important',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {isExpanded ? (
                <ChevronUp
                  size={18}
                  style={{
                    marginLeft: 4,
                    color: '#ffffff !important',
                    stroke: '#ffffff',
                  }}
                />
              ) : (
                <ChevronDown
                  size={18}
                  style={{
                    marginLeft: 4,
                    color: '#ffffff !important',
                    stroke: '#ffffff',
                  }}
                />
              )}
            </span>
          </button>
        </div>
        {isExpanded && (
          <div className="translations-section">
            <div className="translation-bank-container">
              <div className="translations-list">
                {isLoadingTranslations ? (
                  <div className="loading-translations">
                    Loading translations...
                  </div>
                ) : term.translations &&
                  Object.keys(term.translations).length > 0 ? (
                  Object.entries(term.translations).map(
                    ([language, translation]) => (
                      <div key={language} className="translation-item">
                        <div className="lang">{language}</div>
                        <div className="translation">{String(translation)}</div>
                      </div>
                    ),
                  )
                ) : (
                  <div className="no-translations">
                    No translations found for this term.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlossaryTermCard;
