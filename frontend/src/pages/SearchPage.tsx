import React, { useState, useCallback, useEffect } from 'react';
import SearchBar from '../components/ui/SearchBar';
import DropdownFilter from '../components/ui/DropdownFilter';
import ToggleSwitch from '../components/ui/ToggleSwtich';
import TermCard from '../components/ui/TermCard';
import { Brain, Wand2 } from 'lucide-react';
import '../styles/SearchPage.scss';
import { useNavigate } from 'react-router-dom';
import LeftPane from '../components/dashboard/LeftPane.tsx';

interface Suggestion {
  id: string;
  label: string;
}

interface SearchResponse {
  items: Term[];
  total: number;
}

interface Term {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!term) return;

    const runSearch = async () => {
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
      }
    };

    void runSearch();
  }, [term, language, domain, aiSearch, fuzzySearch, currentPage]);

  const handleSearch = useCallback(
    async (t: string) => {
      setTerm(t);
      setCurrentPage(1);
      try {
        const { items, total } = await fetchSearchResults(
          t,
          language,
          domain,
          aiSearch,
          fuzzySearch,
          1,
        );
        setResults(items);
        setTotalPages(Math.ceil((total || 1) / pageSize));
      } catch (error: unknown) {
        console.error('Search fetch failed:', error);
        setResults([]);
        setTotalPages(1);
      }
    },
    [language, domain, aiSearch, fuzzySearch],
  );

  const handleMenuItemClick = (item: string) => {
    setActiveMenuItem(item);
    if (window.innerWidth <= 768) setIsMobileMenuOpen(false);

    if (item === 'dashboard') {
      void navigate('/dashboard');
    } else if (item === 'search') {
      void navigate('/search');
    } else if (item === 'saved') {
      void navigate('/saved-terms');
    } else if (item === 'analytics') {
      void navigate('/analytics');
    } else if (item === 'help') {
      void navigate('/help');
    }
  };

  useEffect(() => {
    void fetchDomains().then(setDomainOptions);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored) setIsDarkMode(stored === 'false');
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

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

  const fetchSuggestions = async (term: string): Promise<Suggestion[]> => {
    const params = new URLSearchParams({ query: term });
    const response = await fetch(`${BACKEND_URL}/suggest?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch suggestions');
    return (await response.json()) as Suggestion[];
  };

  const BACKEND_URL: string = 'http://localhost:8000/api/v1';

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
    const response = await fetch(`${BACKEND_URL}/search?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch search results');
    return (await response.json()) as SearchResponse;
  };

  const fetchDomains = async (): Promise<string[]> => {
    return Promise.resolve([
      'Construction',
      'Agriculture',
      'Education',
      'Business',
    ]);
  };

  return (
    <div
      className={`fixed-background  ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      <div
        className={`search-page-container ${isMobileMenuOpen ? 'mobile-menu-is-open' : ''} `}
      >
        {isMobileMenuOpen && (
          <div
            className="mobile-menu-overlay"
            onClick={() => {
              setIsMobileMenuOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsMobileMenuOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />
        )}

        <LeftPane
          activeItem={activeMenuItem}
          onItemClick={handleMenuItemClick}
        />

        <div className="search-main-content">
          <div className="top-bar">
            <button
              className="hamburger-icon"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              type="button"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDarkMode((prev) => !prev);
              }}
              className="theme-toggle-btn"
            >
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>

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

            <div className="flex-1 overflow-y-auto p-6 scrollable-content">
              <div className="p-6 w-full">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-2">
                  {results.map((res) => (
                    <TermCard
                      key={res.id}
                      id={res.id}
                      term={res.term}
                      language={res.language}
                      domain={res.domain}
                      upvotes={res.upvotes}
                      downvotes={res.downvotes}
                      definition={res.definition}
                      onView={() => {
                        void navigate(`/term/${res.id}`);
                      }}
                    />
                  ))}
                  {results.length === 0 && term && (
                    <p className="text-theme opacity-60">
                      No results found for "{term}".
                    </p>
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
