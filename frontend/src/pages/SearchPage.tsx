import React, { useState, useCallback, useEffect } from 'react';
import Navbar from '../components/ui/Navbar';
import SearchBar from '../components/ui/SearchBar';
import DropdownFilter from '../components/ui/DropdownFilter';
import ToggleSwitch from '../components/ui/ToggleSwtich';
import TermCard from '../components/ui/TermCard';
import { Brain, Wand2 } from 'lucide-react';
import '../styles/SearchPage.scss';
import { API_ENDPOINTS } from '../config';

/**
 * Represents a single suggestion for the search bar autocomplete.
 */
interface Suggestion {
  id: string;
  label: string;
}

interface SearchResponse {
  items: Term[];
  total: number;
}

/**
 * Represents a lexicon term returned from the backend.
 */
interface Term {
  id: string;
  term: string;
  part_of_speech: string;
  domain: string;
  definition: string;
  upvotes: number;
  downvotes: number;
}

/**
 * The main search interface of the application.
 * Includes filters, toggles, and dynamic search result rendering.
 */
const SearchPage: React.FC = () => {
  const [term, setTerm] = useState('');
  const [language, setLanguage] = useState('English');
  const [domain, setDomain] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [domainOptions, setDomainOptions] = useState<string[]>([]);
  const [partOfSpeechOptions, setPartOfSpeechOptions] = useState<string[]>([]);
  const [aiSearch, setAiSearch] = useState(false);
  const [fuzzySearch, setFuzzySearch] = useState(false);
  const [results, setResults] = useState<Term[]>([]);

  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!term) return;

    const runSearch = async () => {
      try {
        const { items, total } = await fetchSearchResults(
          term,
          language,
          domain,
          partOfSpeech,
          aiSearch,
          fuzzySearch,
          currentPage,
        );
        setResults(items);
        if (typeof total === 'number') {
          setTotalPages(Math.ceil(total / pageSize));
        } else {
          setTotalPages(1);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Search fetch failed:', error.message);
        } else {
          console.error('Unknown error during search:', error);
        }
        setResults([]);
        setTotalPages(1);
      }
    };

    void runSearch();
  }, [
    term,
    language,
    domain,
    partOfSpeech,
    aiSearch,
    fuzzySearch,
    currentPage,
  ]);

  const handleSearch = useCallback(
    async (t: string) => {
      setTerm(t);
      setCurrentPage(1);
      try {
        const { items, total } = await fetchSearchResults(
          t,
          language,
          domain,
          partOfSpeech,
          aiSearch,
          fuzzySearch,
          1,
        );
        setResults(items);
        if (typeof total === 'number') {
          setTotalPages(Math.ceil(total / pageSize));
        } else {
          setTotalPages(1);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Search fetch failed:', error.message);
        } else {
          console.error('Unknown error during search:', error);
        }
        setResults([]);
        setTotalPages(1);
      }
    },
    [language, domain, partOfSpeech, aiSearch, fuzzySearch],
  );

  const navigate = (path: string) => {
    console.log('Mock navigate to:', path);
  };

  useEffect(() => {
    void fetchDomains().then(setDomainOptions);
    void fetchPOS().then(setPartOfSpeechOptions);
  }, []);

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
    const response = await fetch(
      `${API_ENDPOINTS.suggest}?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch suggestions');
    }

    const data = (await response.json()) as Suggestion[];
    return data;
  };

  /**
   * Mock fetcher for search results.
   *
   * @param query - The search term
   * @param _language - Selected language
   * @param _domain - Selected domain filter
   * @param _partOfSpeech - Selected part of speech filter
   * @param _ai - Whether AI Search is enabled
   * @param _fuzzy - Whether Fuzzy Search is enabled
   * @param page - The current page number
   * @returns Promise resolving to a list of terms
   */

  const fetchSearchResults = async (
    query: string,
    language: string,
    domain: string,
    partOfSpeech: string,
    _ai: boolean,
    _fuzzy: boolean,
    page: number,
  ): Promise<SearchResponse> => {
    const params = new URLSearchParams({
      query,
      language,
      domain,
      part_of_speech: partOfSpeech,
      sort_by: 'name',
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    const response = await fetch(
      `${API_ENDPOINTS.search}?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }

    const data: SearchResponse = (await response.json()) as SearchResponse;
    return data;
  };

  /**
   * Fetches domain options from the backend.
   * @returns Promise resolving to an array of domain strings
   */
  const fetchDomains = async (): Promise<string[]> => {
    return Promise.resolve([
      'Construction',
      'Agriculture',
      'Education',
      'Business',
    ]);
  };

  /**
   * Fetches part-of-speech options from the backend.
   * @returns Promise resolving to an array of part-of-speech strings
   */
  const fetchPOS = async (): Promise<string[]> => {
    return Promise.resolve(['Noun', 'Adjective', 'Verb']);
  };

  return (
    <div>
      <div className="fixed-background">
        {/* This just holds the background visuals/colors */}
      </div>

      <div className="felx felx-col h-screen">
        <Navbar />
        {/* Search Bar and Filters */}
        <div className="min-h-screen search-page pt-16">
          <div className="search-conent">
            <section className="p-6 space-y-4 w-full max-w-4xl mx-auto">
              <SearchBar
                onSearch={handleSearch}
                fetchSuggestions={fetchSuggestions}
              />
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
                <DropdownFilter
                  label="Part of Speech"
                  options={partOfSpeechOptions}
                  selected={partOfSpeech}
                  onSelect={setPartOfSpeech}
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
            </section>
          </div>{' '}
          {/* End Search-content div */}
          <div className="flex-1 overflow-y-auto p-6 scrollable-content">
            <div className="p-6 w-full">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-2">
                {results.map((res) => (
                  <TermCard
                    key={res.id}
                    id={res.id}
                    term={res.term}
                    part_of_speech={
                      res.part_of_speech.toLowerCase() as
                        | 'noun'
                        | 'verb'
                        | 'adjective'
                        | 'adverb'
                    }
                    domain={res.domain}
                    upvotes={res.upvotes}
                    downvotes={res.downvotes}
                    definition={res.definition}
                    onView={() => {
                      navigate(`/term/${res.id}`);
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
  );
};

export default SearchPage;
