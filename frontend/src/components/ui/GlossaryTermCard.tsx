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
import cachingService from '../../utils/cachingService';
import { useTranslation } from 'react-i18next';

interface GlossaryTermCardProps {
  term: {
    id: string;
    term: string;
    definition: string;
    language?: string;
  };
}

const GlossaryTermCard: React.FC<GlossaryTermCardProps> = ({ term }) => {
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<string>(''); // pending selection
  // @ts-ignore
  const [activeLang, setActiveLang] = useState<string>(''); // confirmed translation language
  const [translation, setTranslation] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLangs, setFetchingLangs] = useState(false);

  // Fetch available languages
  const handleOpenSelect = async () => {
    if (languages.length > 0) return;
    setFetchingLangs(true);
    try {
      const { data } = await cachingService.getTermTranslations(term.id);
      setLanguages(Object.keys(data));
    } catch (err) {
      console.error('Error fetching translation languages:', err);
    } finally {
      setFetchingLangs(false);
    }
  };

  // Only update translation + activeLang after fetch completes
  const handleTranslate = async () => {
    if (!selectedLang) return;
    setLoading(true);
    try {
      const { data } = await cachingService.getTermTranslations(term.id);
      const result = data[selectedLang] ?? null;
      setTranslation(result);
      setActiveLang(selectedLang); // ✅ only update active language when translation is fetched
    } catch (err) {
      console.error('Error fetching translation:', err);
      setTranslation(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ padding: '15px' }}
      className="my-4 p-6 rounded-2xl border-t-4 border-[#00ceaf99] !bg-[var(--bg-tir)] text-[var(--text-theme)] shadow-md transition hover:shadow-lg w-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <h3 className="text-xl sm:text-2xl font-semibold truncate text-left">
          {term.term}
        </h3>
        <span
          style={{
            display: 'inline-block',
            background: '#f2d20119',
            color: '#f2d001',
            fontWeight: 600,
            fontSize: '0.95rem',
            padding: '0.25em 1em',
            borderRadius: '999px',
            margin: '0.25rem 0',
            boxShadow: '0 1px 4px #f2d2018a',
            border: '1px solid #f2d001',
          }}
        >
          {term.language || 'Unknown'}
        </span>
      </div>

      {/* Definition */}
      <p
        className="text-base leading-relaxed text-[var(--text-theme)] mb-5 text-left"
        style={{ padding: '10px', paddingTop: '20px' }}
      >
        {term.definition || ''}
      </p>

      {/* Translation Controls */}
      <div
        className="flex flex-row items-start justify-between gap-3 mt-4"
        style={{ marginBottom: '30px', marginTop: '30px' }}
      >
        <div className="w-full">
          <Select
            onValueChange={setSelectedLang}
            onOpenChange={(open) => {
              if (open) void handleOpenSelect();
            }}
          >
            <SelectTrigger className="w-full border border-[var(--glossary-border-color)] !bg-[var(--bg-tir)] text-[var(--text-theme)]">
              <SelectValue
                placeholder={
                  fetchingLangs
                    ? t('glossaryPage2.loading')
                    : t('glossaryPage2.langSelect')
                }
              />
            </SelectTrigger>
            <SelectContent
              style={{ padding: '8px' }}
              className="bg-[var(--bg-tir)] text-theme"
            >
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang} style={{ padding: '5px' }}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={handleTranslate}
          disabled={!selectedLang || loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ff0a4d',
            color: 'white',
            borderRadius: '999px',
            padding: '10px 16px',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            cursor: !selectedLang || loading ? 'not-allowed' : 'pointer',
            opacity: !selectedLang || loading ? 0.6 : 1,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(255, 10, 77, 0.4)',
          }}
          onMouseOver={(e) => {
            if (!loading && selectedLang)
              e.currentTarget.style.backgroundColor = '#e00040';
          }}
          onMouseOut={(e) => {
            if (!loading && selectedLang)
              e.currentTarget.style.backgroundColor = '#ff0a4d';
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('glossaryPage2.translating')}...
            </>
          ) : (
            <>
              <Languages className="w-5 h-5" />
              {t('glossaryPage2.translate')}
            </>
          )}
        </button>
      </div>

      {/* Translation Result */}
      {translation !== null && (
        <div className="mt-5 p-4 rounded-lg border border-[var(--glossary-border-color)] bg-[var(--bg-tir)]">
          <div className="text-[var(--text-theme)] text-base">
            {translation || t('glossaryPage2.Notranslate')}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlossaryTermCard;
