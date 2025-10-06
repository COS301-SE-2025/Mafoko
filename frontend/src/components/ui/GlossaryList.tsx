import { Search } from 'lucide-react';
import GlossaryCard from './GlossaryCard';
import { Dispatch, SetStateAction } from 'react';

interface Glossary {
  id: number;
  name: string;
  description?: string;
  termCount?: number;
}

interface GlossaryListPageProps {
  glossaries: Glossary[];
  glossarySearch: string;
  setGlossarySearch: (v: string) => void;
  bookmarkedGlossaries: string[];
  handleBookmarkGlossary: (g: Glossary) => void;
  setSelected:  Dispatch<SetStateAction<Glossary | null>>
  onView: (g: Glossary) => void;
  loading: boolean;
}

export function GlossaryList({
  glossaries,
  glossarySearch,
  setGlossarySearch,
  bookmarkedGlossaries,
  setSelected,
  handleBookmarkGlossary,
  onView,
  loading,
}: GlossaryListPageProps) {
  const filteredGlossaries = glossaries.filter((g) =>
    g.name.toLowerCase().includes(glossarySearch.toLowerCase()),
  );

  return (
    <div className="glossary-list-container">
      <div
        className="glossary-search"
        style={{
          paddingTop: '30px',
          marginBottom: '2rem',
          position: 'relative',
          width: '100%',
          margin: '1.5rem auto 2.5rem auto',
        }}
      >
        <Search
          className="glossary-search-icon"
          style={{
            position: 'absolute',
            left: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-theme)',
            opacity: 0.6,
            width: 16,
            height: 16,
          }}
        />
        <input
          className="glossary-search-input"
          type="text"
          placeholder="Search glossaries..."
          value={glossarySearch}
          onChange={(e) => setGlossarySearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 0.7rem 0.75rem 1.7rem',
            border: '1px solid var(--glossary-border-color)',
            borderRadius: '0.5rem',
            outline: 'none',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease-in-out',
            background: 'var(--bg-tir)',
            color: 'var(--text-theme)',
          }}
          autoComplete="off"
        />
      </div>

      <div className="glossary-list">
        {loading ? (
          <div className="glossary-list-message">Loading glossaries...</div>
        ) : filteredGlossaries.length === 0 ? (
          <div className="glossary-list-message">No glossaries found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredGlossaries.map((g) => (
              <div key={g.id}>
                <GlossaryCard
                  glossary={{
                    name: g.name,
                    description: g.description || '',
                    termCount: g.termCount ?? 0,
                  }}
                  isBookmarked={bookmarkedGlossaries.includes(g.name)}
                  onBookmark={() => {
                    handleBookmarkGlossary(g)
                  }}
                  onView={() => onView(g)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
