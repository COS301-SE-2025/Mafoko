import React, { useState } from 'react';
import { Book, Bookmark, Download } from 'lucide-react';
import { useDarkMode } from './DarkModeComponent';

interface Glossary {
  name: string;
  description: string;
  termCount: number;
}

interface GlossaryCardProps {
  glossary: Glossary;
  onView?: (glossary: Glossary) => void;
  onExport?: (glossary: Glossary) => void;
  onBookmark?: (glossary: Glossary) => void;
  isBookmarked?: boolean;
}

const GlossaryCard: React.FC<GlossaryCardProps> = ({
  glossary,
  onView,
  onExport,
  onBookmark,
  isBookmarked: isBookmarkedProp = false,
}) => {
  // Use prop for bookmark status instead of local state
  const [isBookmarked, setIsBookmarked] = useState(isBookmarkedProp);

  // Update local state when prop changes
  React.useEffect(() => {
    setIsBookmarked(isBookmarkedProp);
  }, [isBookmarkedProp]);

  // Use the same dark mode hook as the rest of the app
  const { isDarkMode } = useDarkMode();

  return (
    <div
      className="rounded-lg shadow-md hover:shadow-lg transition-shadow border"
      style={{
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--glossary-border-color)',
        color: 'var(--text-theme)',
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <Book
            className="w-6 h-6"
            style={{ color: isDarkMode ? '#fcfcfcff' : '#000000ff' }}
          />
          <span
            className="text-sm px-2 py-1 rounded-full"
            style={{
              color: '#00ceaf',
              backgroundColor: ' #00ceaf1c',
              border: '1.5px solid #00ceaf',
            }}
          >
            {glossary.termCount} terms
          </span>
        </div>
        <h3
          className="text-lg font-semibold mb-0.5"
          style={{ color: 'var(--text-theme)' }}
        >
          {glossary.name}
        </h3>
        <p
          className="mb-1 text-xs line-clamp-1"
          style={{ color: 'var(--no-translation-color)' }}
        >
          {glossary.description}
        </p>
        <div
          className="flex items-center text-xs mb-1"
          style={{ color: 'var(--no-translation-color)' }}
        >
          {/* <span>{glossary.languages && glossary.languages.length > 0 ? glossary.languages.join(', ') : '—'}</span> */}
        </div>

        <div
          className="flex items-center justify-between pt-2"
          style={{ borderTop: '2px solid #00ceaf99' }}
        >
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onExport) onExport(glossary);
              }}
              className="transition-colors"
              style={{
                color: '#ffffffff',
                backgroundColor: '#f00a4fff',
                border: '1.5px solid #f00a4fff',
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f00a4fe8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f00a4fff';
              }}
              title="Export glossary"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsBookmarked((prev) => !prev);
                if (onBookmark) onBookmark(glossary);
              }}
              className="transition-colors"
              style={{
                color: '#ffffffff',
                backgroundColor: '#f2d201ff',
                border: '1.5px solid #f2d201ff',
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f2d201dc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f2d201ff';
              }}
              title="Bookmark glossary"
            >
              <Bookmark
                className="w-4 h-4"
                fill={isBookmarked ? '#fff' : 'none'}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onView) onView(glossary);
            }}
            className="text-sm font-medium transition-colors"
            style={{
              color: isDarkMode ? '#ffffffff' : '#000000',
              backgroundColor: isDarkMode ? '#11131aff' : '#f0f0f0',
              border: isDarkMode
                ? '1.5px solid #11131aff'
                : '1.5px solid #f0f0f0',
              borderRadius: '999px',
              padding: '0.35rem 1.1rem',
              outline: 'none',
              cursor: 'pointer',
              marginLeft: 4,
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode
                ? '#191c27b3'
                : '#f0f0f0aa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode
                ? '#11131aff'
                : '#f0f0f0';
            }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlossaryCard;
