import React from 'react';
import { FileText } from 'lucide-react';

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
}

const GlossaryTermCard: React.FC<GlossaryTermCardProps> = ({
  term,
  isExpanded,
  onToggleExpand,
}) => (
  <div
    className="term-card"
    style={{
      maxWidth: 700,
      margin: '0.7rem auto',
      padding: '0.7rem 1rem',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      background: '#fff',
      fontSize: '0.97rem',
      minHeight: '60px',
      minWidth: '200px',
    }}
  >
    <div className="card-content" style={{ padding: 0 }}>
      <div className="term-header">
        <h3 className="term-title">{term.term}</h3>
        <span className="term-language-badge">
          {term.language ? term.language : 'None'}
        </span>
      </div>
      <div className="term-definition">
        <FileText className="icon" />
        <p>{term.definition}</p>
      </div>
      <button
        className="show-translations-btn"
        style={{
          background: isExpanded ? '#9a0a35ff' : '#f00a50',
          color: '#ffffffff',
          border: '1px solid #f00a50',
          borderRadius: '9999px',
          padding: '0.25em 1em',
          fontWeight: 600,
          marginBottom: '0.5rem',
          cursor: 'pointer',
          fontSize: '0.85rem',
          transition: 'background 0.2s',
        }}
        onClick={() => {
          onToggleExpand(term.id);
        }}
      >
        {isExpanded ? 'Hide Translations' : 'Show Translations'}
      </button>
      {isExpanded && (
        <div className="translations-section">
          <div className="translations-list">
            {term.translations && Object.keys(term.translations).length > 0 ? (
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
      )}
    </div>
  </div>
);

export default GlossaryTermCard;
