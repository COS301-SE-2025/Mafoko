import React, { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import '../../styles/SearchPage.scss';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './select';

interface GlossaryTermCardProps {
  term: {
    id: number;
    term: string;
    definition: string;
    language?: string;
    translations?: { [lang: string]: string };
  };
}

const GlossaryTermCard: React.FC<GlossaryTermCardProps> = ({ term }) => {
  const [selectedLang, setSelectedLang] = useState<string>("");
  const [translation, setTranslation] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLangs, setFetchingLangs] = useState(false);

  console.log(term)

  // Fetch all translations once when user opens dropdown
  const handleOpenSelect = async () => {
    if (languages.length > 0) return; // already fetched

    setFetchingLangs(true);
    try {
      const res = await fetch(
        `http://localhost:8006/api/v1/glossary/terms/${term.id}/translations`
      );

      if (!res.ok) throw new Error("Failed to fetch translations");
      const data = await res.json();

      // API should return an object like { en: "word", af: "woord", ... }
      setLanguages(Object.keys(data));
    } catch (err) {
      console.error("Error fetching translation languages:", err);
    } finally {
      setFetchingLangs(false);
    }
  };

  const handleTranslate = async () => {
    if (!selectedLang) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8006/api/v1/glossary/terms/${term.id}/translations`
      );
      if (!res.ok) throw new Error("Failed to fetch translation");
      const data = await res.json();

      const result = data[selectedLang] ?? null;
      setTranslation(result);
    } catch (err) {
      console.error("Error fetching translation:", err);
      setTranslation(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ padding: '15px' }}
      className="my-4 p-6 rounded-2xl border-t-4 border-[#00ceaf99] bg-[var(--card-background)] text-[var(--text-theme)] shadow-md transition hover:shadow-lg w-full !bg-[var(--bg-tri)]"
    >
      <div className="flex flex-col flex-row items-center justify-between gap-3 mb-4">
        {' '}
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold truncate text-left">
            {term.term}
          </h3>
        </div>{' '}
        <div>
          <span
            className="px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/30 bg-teal-200 border-teal"
            style={{
              paddingLeft: '10px',
              paddingRight: '10px',
              paddingTop: '6px',
              paddingBottom: '6px',
            }}
          >
            {' '}
            {term.language || 'Unknown'}{' '}
          </span>
        </div>{' '}
      </div>

      <p className="text-base leading-relaxed text-[var(--text-theme)] mb-5">
        {term.definition || ''}
      </p>

      <div
        className="flex flex-col sm:flex-row items-start justify-between gap-3 mt-4"
        style={{ paddingTop: '10px' }}
      >
        <div className="w-full sm:w-48">
          <Select onValueChange={setSelectedLang}>
            <SelectTrigger className="w-full border border-[var(--glossary-border-color)] bg-[var(--bg-tir)] text-[var(--text-theme)]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="" style={{ padding: '8px' }}>
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={handleTranslate}
          disabled={!selectedLang || loading}
          className="flex items-center gap-2 bg-[#F00A50] text-white rounded-full px-5 py-2 font-semibold text-sm hover:bg-[#e00a48] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Languages className="w-4 h-4" />
              Translate
            </>
          )}
        </button>
      </div>

      {/* Translation Result */}
      {translation !== null && (
        <div className="mt-5 p-4 rounded-lg border border-[var(--glossary-border-color)] bg-[var(--bg-tir)]">
          <div className="text-sm text-primary font-medium mb-1">
            {selectedLang}
          </div>
          <div className="text-[var(--text-theme)] text-base">
            {translation || 'No translation available for this language.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlossaryTermCard;
