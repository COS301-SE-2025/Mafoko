import { Search, Bookmark, Download } from 'lucide-react';
import GlossaryHeader from './GlossaryHeader';

interface Term {
  id: number;
  term: string;
  definition: string;
  language?: string;
  translations?: { [lang: string]: string };
}

interface Glossary {
  id: number;
  name: string;
  description?: string;
}

interface Props {
  glossary: Glossary;
  terms: Term[];
  termSearch: string;
  setTermSearch: (v: string) => void;
  loading: boolean;
  onBack: () => void;
  onBookmark: () => void;
  bookmarked: boolean;
}

export default function GlossaryTermsPage({
  glossary,
  terms,
  termSearch,
  setTermSearch,
  loading,
  onBack,
  onBookmark,
  bookmarked,
}: Props) {
  const filteredTerms = terms.filter((t) =>
    t.term.toLowerCase().includes(termSearch.toLowerCase()),
  );

  return (
    <div className="terms-list-container">
      <GlossaryHeader
        title={glossary.name}
        description={glossary.description}
        countText={`${filteredTerms.length} terms`}
        onBack={onBack}
      />

      <div className="relative w-full mb-6">
        <Search
          className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          value={termSearch}
          onChange={(e) => setTermSearch(e.target.value)}
          placeholder="Search terms..."
          className="w-full border rounded-md pl-7 pr-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-6">Loading terms...</div>
      ) : filteredTerms.length === 0 ? (
        <div className="text-center py-6">No terms found.</div>
      ) : (
        <div className="space-y-4">
          {filteredTerms.map((t) => (
            <div
              key={t.id}
              className="border rounded-lg p-4 bg-[var(--card-background)]"
            >
              <div className="font-semibold text-lg mb-1">{t.term}</div>
              <div className="text-sm text-[var(--text-theme)] mb-1">
                {t.definition}
              </div>
              {t.language && (
                <div className="text-xs opacity-70">{t.language}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={onBookmark}
          title={bookmarked ? 'Bookmarked' : 'Bookmark'}
          className="bg-yellow-400 rounded-full w-14 h-14 flex items-center justify-center shadow-md"
        >
          <Bookmark
            size={28}
            strokeWidth={2.5}
            color="#fff"
            fill={bookmarked ? '#fff' : 'none'}
          />
        </button>
        <button
          type="button"
          title="Export"
          className="bg-pink-600 rounded-full w-14 h-14 flex items-center justify-center shadow-md"
        >
          <Download size={24} color="#fff" />
        </button>
      </div>
    </div>
  );
}
