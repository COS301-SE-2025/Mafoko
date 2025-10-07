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
  setSelected: Dispatch<SetStateAction<Glossary | null>>;
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
        className="w-full mx-auto flex items-center justify-center"
        style={{
          margin: '1.5rem auto 2.5rem auto',
          paddingTop: '30px',
          marginBottom: '2rem',
          maxWidth: '700px',
        }}
      >
        <div
          className="flex items-center w-full"
          style={{
            background: 'var(--bg-tir)',
            borderRadius: '8px',
            padding: '10px 14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Search
            className="shrink-0"
            style={{
              color: 'var(--text-theme)',
              opacity: 0.6,
              width: '18px',
              height: '18px',
              marginRight: '10px',
            }}
          />
          <input
            type="text"
            placeholder="Search glossaries..."
            value={glossarySearch}
            onChange={(e) => setGlossarySearch(e.target.value)}
            autoComplete="off"
            className="flex-1"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.95rem',
              color: 'var(--text-theme)',
              width: '100%',
            }}
          />
        </div>
      </div>

      <div className="glossary-list">
        {loading ? (
          <div className="glossary-list-message">Loading glossaries...</div>
        ) : filteredGlossaries.length === 0 ? (
          <div className="glossary-list-message">No glossaries found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-1 gap-[35px]">
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
                    handleBookmarkGlossary(g);
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
