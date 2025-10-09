import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowBigLeft, ArrowBigRight, Wand2 } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import LeftNav from '../components/ui/LeftNav';
import SearchBar from '../components/ui/SearchBar';
import DropdownFilter from '../components/ui/DropdownFilter';
import ToggleSwitch from '../components/ui/ToggleSwtich';
import TermCard from '../components/ui/TermCard';
import { getAllTerms, queryTerms, replaceAllTerms } from '../utils/indexedDB';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import {
  LANGUAGES,
  SearchResponse,
  Suggestion,
} from '../types/search/types.ts';
import { Term } from '../types/terms/types.ts';
import { useDebounce } from '../hooks/useDebounce';
import { API_ENDPOINTS } from '../config';

const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  const [term, setTerm] = useState('');
  const [language, setLanguage] = useState('');
  const [domain, setDomain] = useState('');
  const [domainOptions, setDomainOptions] = useState<string[]>([]);
  const [fuzzySearch, setFuzzySearch] = useState(false);
  const [results, setResults] = useState<Term[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 48;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeMenuItem, setActiveMenuItem] = useState('search');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const debouncedTerm = useDebounce(term, 500);
  const debouncedLanguage = useDebounce(language, 300);
  const debouncedDomain = useDebounce(domain, 300);
  const debouncedFuzzy = useDebounce(fuzzySearch, 300);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);

      if (!isOffline) {
        const lastFetch = localStorage.getItem('lastGlossaryFetch');
        const oneDay = 24 * 60 * 60 * 1000;
        if (!lastFetch || Date.now() - parseInt(lastFetch, 10) > oneDay) {
          try {
            const response = await fetch(API_ENDPOINTS.getAllTermsForOffline);
            if (response.ok) {
              const data: SearchResponse = await response.json();
              // Create a new array with unique terms based on their 'id'
              const uniqueTerms = Array.from(
                new Map(data.items.map((item) => [item.id, item])).values(),
              );
              await replaceAllTerms(uniqueTerms); //
              localStorage.setItem('lastGlossaryFetch', Date.now().toString());
            }
          } catch (error) {
            console.error('Failed to warm up cache:', error);
          }
        }
      }

      const allLocalTerms = await getAllTerms(); //
      const uniqueDomains = Array.from(
        new Set(allLocalTerms.map((t) => t.domain).filter(Boolean)),
      ).sort();
      setDomainOptions(uniqueDomains);
      setResults(allLocalTerms);
      setTotalPages(Math.ceil(allLocalTerms.length / pageSize));
      setIsLoading(false);
      setInitialLoadComplete(true);
    };
    void initialLoad();
  }, [isOffline]);

  useEffect(() => {
    if (!initialLoadComplete) return;

    const runFilterQuery = async () => {
      const filters = {
        term: debouncedTerm,
        language: debouncedLanguage,
        domain: debouncedDomain,
        letter: activeLetter,
        fuzzy: debouncedFuzzy,
      };
      const filteredResults = await queryTerms(filters);
      setResults(filteredResults);
      setTotalPages(Math.ceil(filteredResults.length / pageSize));
    };

    void runFilterQuery();
  }, [
    debouncedTerm,
    debouncedLanguage,
    debouncedDomain,
    debouncedFuzzy,
    activeLetter,
    initialLoadComplete,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedTerm,
    debouncedLanguage,
    debouncedDomain,
    debouncedFuzzy,
    activeLetter,
  ]);

  const handleLetterClick = (letter: string) => {
    setTerm('');
    setActiveLetter(letter === activeLetter ? null : letter);
  };

  const handleSearchInput = (value: string) => {
    setActiveLetter(null);
    setTerm(value);
  };

  const fetchSuggestions = async (query: string): Promise<Suggestion[]> => {
    if (isOffline || !query) return [];
    try {
      const params = new URLSearchParams({ query });
      const response = await fetch(
        `${API_ENDPOINTS.suggest}?${params.toString()}`,
      );
      if (!response.ok) return [];

      const data: Suggestion[] = await response.json();
      if (!Array.isArray(data)) return [];

      // De-duplicate suggestions by their unique 'id' before returning them
      const uniqueSuggestions = Array.from(
        new Map(data.map((item) => [item.id, item])).values(),
      );
      return uniqueSuggestions;
    } catch {
      return [];
    }
  };
  const paginatedResults = results.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const groupedTerms = paginatedResults.reduce<Record<string, Term[]>>(
    (acc, currentTerm) => {
      if (currentTerm.term) {
        const firstLetter = currentTerm.term[0].toUpperCase();

        // If it starts with A–Z, use that letter; otherwise use "#"
        const key = /^[A-Z]/.test(firstLetter) ? firstLetter : '#';

        if (!acc[key]) acc[key] = [];
        acc[key].push(currentTerm);
      }
      return acc;
    },
    {},
  );

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div
      className={`search-page-fixed-background ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      <div className="search-page-container">
        {isMobile ? (
          <Navbar />
        ) : (
          <LeftNav
            activeItem={activeMenuItem}
            setActiveItem={setActiveMenuItem}
          />
        )}
        <div className="search-main-content">
          <div className="min-h-screen search-page pt-16">
            <div className="search-conent">
              <section className="p-6 space-y-4 w-full max-w-4xl mx-auto flex flex-col gap-5">
                <SearchBar
                  onSearch={handleSearchInput}
                  fetchSuggestions={fetchSuggestions}
                />
                <div className="">
                  <div className="flex flex-wrap gap-4 items-center justify-between mt-3">
                    <div className="flex flex-wrap gap-4 items-center z-100">
                      <DropdownFilter
                        label={t('searchPage.language')}
                        options={LANGUAGES}
                        selected={language}
                        onSelect={setLanguage}
                      />
                      <DropdownFilter
                        label={t('searchPage.domain')}
                        options={domainOptions}
                        selected={domain}
                        onSelect={setDomain}
                      />
                    </div>
                    <div className="mt-3">
                      <ToggleSwitch
                        label={t('searchPage.fuzzySearch')}
                        icon={<Wand2 size={16} />}
                        checked={fuzzySearch}
                        onChange={setFuzzySearch}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex-1 overflow-y-auto p-6 search-scrollable-content">
              <nav className="alphabetical-index">
                {alphabet.map((letter) => (
                  <button
                    key={letter}
                    className={`index-letter ${activeLetter === letter ? 'active' : ''}`}
                    onClick={() => handleLetterClick(letter)}
                    type="button"
                  >
                    {letter}
                  </button>
                ))}
              </nav>

              {isLoading ? (
                <p className="text-theme opacity-80 text-center w-full">
                  {t('searchPage.loading')}
                </p>
              ) : results.length > 0 ? (
                <>
                  <div className="dictionary-view">
                    {Object.keys(groupedTerms)
                      .sort()
                      .map((letter) => (
                        <section key={letter} className="letter-group">
                          <h2 className="letter-header">
                            {letter}
                            <span className="line" />
                          </h2>
                          <div className="terms-list">
                            {groupedTerms[letter].map((t) => (
                              <TermCard
                                key={t.id}
                                id={t.id}
                                term={t.term}
                                language={t.language}
                                domain={t.domain}
                                upvotes={t.upvotes}
                                downvotes={t.downvotes}
                                definition={t.definition}
                                onView={() =>
                                  navigate(
                                    `/term/${encodeURIComponent(t.language)}/${encodeURIComponent(t.term)}/${t.id}`,
                                  )
                                }
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                  </div>
                  {totalPages > 1 && (
                    <div className=" flex justify-center items-center gap-6 p-4">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((c) => c - 1)}
                        className="flex items-center gap-2 text-theme disabled:opacity-50"
                      >
                        <ArrowBigLeft size={18} />
                        <span className="sr-only">
                          {t('searchPage.pagination.previous')}
                        </span>
                      </button>
                      <span>
                        {t('searchPage.pagination.pageInfo', {
                          current: currentPage,
                          total: totalPages,
                        })}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((c) => c + 1)}
                        className="flex items-center gap-2 text-theme disabled:opacity-50"
                      >
                        <ArrowBigRight size={18} />
                        <span className="sr-only">
                          {t('searchPage.pagination.next')}
                        </span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-theme opacity-60 text-center w-full">
                  {t('searchPage.noResults', { term: term || activeLetter })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
