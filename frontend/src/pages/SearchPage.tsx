import React, { useState, useCallback, useEffect, useRef } from 'react';
import SearchBar from '../components/ui/SearchBar';
import DropdownFilter from '../components/ui/DropdownFilter';
import ToggleSwitch from '../components/ui/ToggleSwtich';
import TermCard from '../components/ui/TermCard';
import { Brain, Wand2 } from 'lucide-react';
import '../styles/SearchPage.scss';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/ui/Navbar.tsx';
import LeftNav from '../components/ui/LeftNav.tsx';
import { API_ENDPOINTS } from '../config';
import { storeTerms, getAllTerms } from '../utils/indexedDB';

const languages = [
  'Afrikaans',
  'English',
  'isiNdebele',
  'isiXhosa',
  'isiZulu',
  'Sesotho',
  'Setswana',
  'siSwati',
  'Tshivenda',
  'Xitsonga',
  'Sepedi',
];

interface Suggestion {
  id: string;
  label: string;
}

interface SearchResponse {
  items: Term[];
  total: number;
}

export interface Term {
  id: string;
  term: string;
  language: string;
  domain: string;
  definition: string;
  upvotes: number;
  downvotes: number;
}

const SearchPage: React.FC = () => {
  const [term, setTerm] = useState('');
  const [language, setLanguage] = useState('English');
  const [domain, setDomain] = useState('');
  const [domainOptions, setDomainOptions] = useState<string[]>([]);
  const [aiSearch, setAiSearch] = useState(false);
  const [fuzzySearch, setFuzzySearch] = useState(false);
  const [results, setResults] = useState<Term[]>([]);
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('search');
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    void preloadGlossary();
    void fetchDomains().then(setDomainOptions);
    const stored = localStorage.getItem('darkMode');
    if (stored) setIsDarkMode(stored === 'false');
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!term) return;

    const runSearch = async () => {
      setIsLoading(true);
      try {
        const { items, total } = await fetchSearchResults(
            term,
            language,
            domain,
            aiSearch,
            fuzzySearch,
            currentPage,
        );
        setResults(items);
        setTotalPages(Math.ceil((total || 1) / pageSize));
      } catch (error: unknown) {
        console.error('Search fetch failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void runSearch();
  }, [term, language, domain, aiSearch, fuzzySearch, currentPage]);

  const preloadGlossary = async (): Promise<void> => {
    try {
      const response = await fetch(`API_ENDPOINTS.search/api/v1/search/`);
      if (!response.ok) throw new Error('Failed to preload glossary');
      const terms = (await response.json()) as Term[];
      await storeTerms(terms);
      console.log(`Cached ${String(terms.length)} terms for offline use`);
    } catch (err) {
      console.warn('Could not preload glossary:', err);
    }
  };

  const handleSearch = useCallback(
      async (t: string) => {
        setTerm(t);
        setCurrentPage(1);
        setIsLoading(true);
        try {
          const { items, total } = await fetchSearchResults(
              t,
              language,
              domain,
              aiSearch,
              fuzzySearch,
              1,
          );
          // Store results locally for offline use
          await storeTerms(items);
          setResults(items);
          setTotalPages(Math.ceil((total || 1) / pageSize));
        } catch (error: unknown) {
          console.error('Falling back to cached data', error);
          const cachedTerms = await getAllTerms();
          const filtered = cachedTerms.filter((term) =>
              term.term.toLowerCase().includes(t.toLowerCase()),
          );
          setResults(filtered);
          setTotalPages(Math.ceil(filtered.length / pageSize));
        } finally {
          setIsLoading(false);
        }
      },
      [language, domain, aiSearch, fuzzySearch],
  );

  const fetchSuggestions = async (term: string): Promise<Suggestion[]> => {
    const params = new URLSearchParams({ query: term });
    const response = await fetch(
        `${API_ENDPOINTS.suggest}?${params.toString()}`,
    );

    if (!response.ok) throw new Error('Failed to fetch suggestions');
    return (await response.json()) as Suggestion[];
  };

  const fetchSearchResults = async (
      query: string,
      language: string,
      domain: string,
      _ai: boolean,
      _fuzzy: boolean,
      page: number,
  ): Promise<SearchResponse> => {
    const params = new URLSearchParams({
      query,
      language,
      domain,
      sort_by: 'name',
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    const response = await fetch(
        `${API_ENDPOINTS.search}?${params.toString()}`,
    );
    if (!response.ok) throw new Error('Failed to fetch search results');
    return (await response.json()) as SearchResponse;
  };

  const fetchDomains = async (): Promise<string[]> => {
    try {
      const terms = await getAllTerms();
      const domainSet = new Set<string>();
      for (const term of terms) {
        if (term.domain) domainSet.add(term.domain);
      }
      const dynamicDomains = Array.from(domainSet).sort();
      return dynamicDomains.length ? dynamicDomains : ['General'];
    } catch {
      return ['General'];
    }
  };


  const groupedTerms = results.reduce<Record<string, Term[]>>((acc, term) => {
    const firstLetter = term.term[0].toUpperCase();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(term);
    return acc;
  }, {});

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const availableLetters = new Set(Object.keys(groupedTerms));
  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({});



  return (


      <div
          className={`search-page-fixed-background  ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
      >
        <div className={`search-page-container`}>
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
                <section className="p-6 space-y-4 w-full max-w-4xl mx-auto">
                  <SearchBar
                      onSearch={handleSearch}
                      fetchSuggestions={fetchSuggestions}
                  />
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex flex-wrap gap-4">
                      <DropdownFilter
                          label="Language"
                          options={languages}
                          selected={language}
                          onSelect={setLanguage}
                      />
                      <DropdownFilter
                          label="Domain"
                          options={domainOptions}
                          selected={domain}
                          onSelect={setDomain}
                      />
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      <ToggleSwitch
                          label="AI Search"
                          icon={<Brain size={16} />}
                          checked={aiSearch}
                          onChange={setAiSearch}
                      />
                      <ToggleSwitch
                          label="Fuzzy Search"
                          icon={<Wand2 size={16} />}
                          checked={fuzzySearch}
                          onChange={setFuzzySearch}
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex-1 overflow-y-auto p-6 search-scrollable-content">
                <div className="p-6 w-full">

                  <nav className="alphabetical-index">
                    {alphabet.map((letter) => {
                      const isAvailable = availableLetters.has(letter);
                      return (
                        <button
                          key={letter}
                          disabled={!isAvailable}
                          className={`index-letter ${isAvailable ? '' : 'disabled'}`}
                          onClick={() => {
                            const section = letterRefs.current[letter];
                            if (section) {
                              section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          aria-label={`Jump to terms starting with ${letter}`}
                          type="button"
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </nav>

                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-2">
                    {isLoading ? (
                      <p className="text-theme opacity-80 text-center w-full">Loading...</p>
                    ) : results.length > 0 ? (
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
                                {groupedTerms[letter].map((term) => (
                                  <TermCard
                                    key={term.id}
                                    id={term.id}
                                    term={term.term}
                                    language={term.language}
                                    domain={term.domain}
                                    upvotes={term.upvotes}
                                    downvotes={term.downvotes}
                                    definition={term.definition}
                                    onView={() => {
                                      void navigate(`/term/${term.id}`);
                                    }}
                                  />
                                ))}
                              </div>
                            </section>
                          ))}
                      </div>
                    ) : (
                      term && (
                        <p className="text-theme opacity-60">
                          No results found for "{term}".
                        </p>
                      )
                    )}
                </div>
                </div>

                <div className="pagination-controls flex justify-center space-x-4 p-4">
                  <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage(currentPage - 1);
                      }}
                      className="px-4 py-2 bg-theme rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span>
                  Page {currentPage} of {totalPages}
                </span>
                  <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage(currentPage + 1);
                      }}
                      className="px-4 py-2 bg-theme rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default SearchPage;
