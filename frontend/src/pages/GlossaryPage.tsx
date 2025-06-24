import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Book, Globe, Search } from 'lucide-react';
import LeftNav from '../components/ui/LeftNav.tsx';
import LanguageSwitcher from '../components/LanguageSwitcher.tsx';
import '../styles/GlossaryPage.scss';

import { API_ENDPOINTS } from '../config';

// Define types for terms and translations based on API response
interface Term {
  id: string;
  term: string;
  definition: string;
  category: string;
  language?: string;
}

interface TermTranslations {
  term: string;
  definition: string;
  translations: Record<string, string>;
}

interface SearchResponse {
  results: Term[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface UserData {
  uuid: string;
  firstName: string;
  lastName: string;
}

// API client with strongly typed responses
const dictionaryAPI = {
  getCategories: async (): Promise<string[]> => {
    try {
      const response = await fetch(API_ENDPOINTS.glossaryCategories);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return (await response.json()) as string[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },
  getTermsByCategory: async (category: string): Promise<Term[]> => {
    try {
      const response = await fetch(
        API_ENDPOINTS.glossaryTermsByCategory(category),
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch terms for category: ${category}`);
      }
      return (await response.json()) as Term[];
    } catch (error) {
      console.error(`Error fetching terms for category ${category}:`, error);
      return [];
    }
  },

  getTranslations: async (termId: string): Promise<TermTranslations> => {
    try {
      const response = await fetch(
        API_ENDPOINTS.glossaryTermTranslations(termId),
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch translations for term: ${termId}`);
      }
      return (await response.json()) as TermTranslations;
    } catch (error) {
      console.error(`Error fetching translations for term ${termId}:`, error);
      throw error;
    }
  },

  searchTerms: async (query: string): Promise<Term[]> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.glossarySearch}?query=${encodeURIComponent(query)}`,
      );
      if (!response.ok) {
        throw new Error('Failed to search terms');
      }
      return (await response.json()) as Term[];
    } catch (error) {
      console.error('Error searching terms:', error);
      return [];
    }
  },

  getLanguages: async (): Promise<Record<string, string>> => {
    try {
      const response = await fetch(API_ENDPOINTS.glossaryLanguages);
      if (!response.ok) {
        throw new Error('Failed to fetch languages');
      }
      return (await response.json()) as Record<string, string>;
    } catch (error) {
      console.error('Error fetching languages:', error);
      return {};
    }
  },
  advancedSearch: async (params: {
    query?: string;
    domain?: string;
    language?: string;
    page?: number;
    limit?: number;
  }): Promise<SearchResponse> => {
    try {
      // For POST request with JSON body
      const response = await fetch(API_ENDPOINTS.glossarySearch, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to perform advanced search');
      }
      return (await response.json()) as SearchResponse;
    } catch (error) {
      console.error('Error performing advanced search:', error);
      return {
        results: [],
        total: 0,
        page: params.page || 1,
        limit: params.limit || 10,
        pages: 0,
      };
    }
  },

  getRandomTerm: async (count: number = 1): Promise<Term[]> => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.glossaryRandom}?count=${count.toString()}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch random terms');
      }
      return (await response.json()) as Term[];
    } catch (error) {
      console.error('Error fetching random terms:', error);
      return [];
    }
  },
};

const GlossaryPage = () => {
  // State management
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [showTranslations, setShowTranslations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryTerms, setCategoryTerms] = useState<Term[]>([]);
  const [translations, setTranslations] = useState<TermTranslations | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState('search');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [avatarInitials, setAvatarInitials] = useState<string>('U');
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [availableLanguages, setAvailableLanguages] = useState<
    Record<string, string>
  >({});

  // Load initial data on component mount
  useEffect(() => {
    void loadInitialData();
    loadUserData();
  }, []);

  const loadInitialData = async (): Promise<void> => {
    setLoading(true);
    try {
      // Load categories, languages, and some random terms concurrently
      const [categoriesData, languagesData, randomTerms] = await Promise.all([
        dictionaryAPI.getCategories(),
        dictionaryAPI.getLanguages(),
        dictionaryAPI.getRandomTerm(10), // Get 10 random terms for initial display
      ]);

      setCategories(categoriesData);
      setAvailableLanguages(languagesData);

      // Set initial terms if we got random terms back
      if (randomTerms.length > 0) {
        setCategoryTerms(randomTerms);
      }

      setError(null);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load initial data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = (): void => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoadingUserData(false);
      return;
    }

    setIsLoadingUserData(true);
    const storedUserDataString = localStorage.getItem('userData');
    if (storedUserDataString) {
      try {
        const parsedData = JSON.parse(storedUserDataString) as UserData;
        setUserData(parsedData);
        if (parsedData.firstName && parsedData.lastName) {
          setAvatarInitials(
            `${parsedData.firstName.charAt(0)}${parsedData.lastName.charAt(0)}`.toUpperCase(),
          );
        } else if (parsedData.firstName) {
          setAvatarInitials(parsedData.firstName.charAt(0).toUpperCase());
        }
      } catch {
        localStorage.removeItem('userData');
      }
    }
    setIsLoadingUserData(false);
  };

  const handleCategorySelect = useCallback(
    async (category: string): Promise<void> => {
      setSelectedCategory(category);
      setSelectedTerm(null);
      setShowTranslations(false);
      setTranslations(null);
      setError(null);
      setLoading(true);

      try {
        const terms = await dictionaryAPI.getTermsByCategory(category);
        setCategoryTerms(terms);
      } catch (error) {
        console.error('Error loading terms:', error);
        setError(`Failed to load terms for ${category}. Please try again.`);
        setCategoryTerms([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleTermSelect = useCallback((term: Term): void => {
    setSelectedTerm(term);
    setShowTranslations(false);
    setTranslations(null);
    setError(null);
  }, []);

  const handleShowTranslations = useCallback(async (): Promise<void> => {
    if (!selectedTerm) return;

    setLoading(true);
    setShowTranslations(true);
    setError(null);

    try {
      const termTranslations = await dictionaryAPI.getTranslations(
        selectedTerm.id,
      );
      setTranslations(termTranslations);
    } catch (error) {
      console.error('Error loading translations:', error);
      setError('Failed to load translations. Please try again.');
      setTranslations(null);
    } finally {
      setLoading(false);
    }
  }, [selectedTerm]);

  // Enhanced search functionality with useCallback
  const handleSearch = useCallback(
    async (query: string): Promise<void> => {
      if (!query.trim()) {
        // If search is empty and we have a selected category, show category terms
        if (selectedCategory) {
          await handleCategorySelect(selectedCategory);
        } else {
          // If no category is selected and search is empty, load random terms
          try {
            setLoading(true);
            const randomTerms = await dictionaryAPI.getRandomTerm(10);
            setCategoryTerms(randomTerms);
            setSelectedTerm(null);
            setShowTranslations(false);
            setTranslations(null);
          } catch (err) {
            console.error('Failed to load random terms:', err);
          } finally {
            setLoading(false);
          }
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let searchResults: Term[];

        if (selectedCategory) {
          // Search within selected category using advanced search
          const response = await dictionaryAPI.advancedSearch({
            query: query,
            domain: selectedCategory,
            limit: 50, // Adjust as needed
          });
          searchResults = response.results;
        } else {
          // Global search across all terms
          searchResults = await dictionaryAPI.searchTerms(query);
        }

        setCategoryTerms(searchResults);

        // If we have exactly one result, auto-select it for convenience
        if (searchResults.length === 1) {
          handleTermSelect(searchResults[0]);
        } else {
          // Clear term selection if we have multiple/no results
          setSelectedTerm(null);
          setShowTranslations(false);
          setTranslations(null);
        }
      } catch (error) {
        console.error('Error searching terms:', error);
        setError('Failed to search terms. Please try again.');
        setCategoryTerms([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, handleCategorySelect, handleTermSelect],
  );

  // Debounced search effect with proper dependencies
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        void handleSearch(searchTerm);
      } else if (selectedCategory) {
        void handleCategorySelect(selectedCategory);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm, selectedCategory, handleSearch, handleCategorySelect]);

  // Filter terms locally for immediate feedback
  const filteredTerms = categoryTerms.filter(
    (term) =>
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (term.definition &&
        term.definition.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div
      className="glossary-root"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}
    >
      {/* Left Navigation */}
      <div className="glossary-leftnav" style={{ minWidth: 220 }}>
        <LeftNav activeItem={activeNav} setActiveItem={setActiveNav} />
      </div>

      {/* Main Content with Profile at Top Right */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Profile Section absolutely positioned top right of main content */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            padding: '1.5rem 2.5rem 0 2.5rem',
            zIndex: 2,
          }}
        >
          {isLoadingUserData ? (
            <div className="profile-section">Loading profile...</div>
          ) : userData ? (
            <div
              className="profile-section"
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <div
                className="profile-info"
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div className="profile-avatar">{avatarInitials}</div>
                <div className="profile-details">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <LanguageSwitcher />
                    <h3 style={{ margin: 0 }}>
                      {userData.firstName} {userData.lastName}
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                    User ID: {userData.uuid}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Main Centered Content */}
        <div style={{ width: '100%', maxWidth: 900, marginTop: '5.5rem' }}>
          {/* Error Display */}
          {error && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '1rem',
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          {/* Multilingual Dictionary section */}
          <div
            className="glossary-header"
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            <h1 className="glossary-title">
              <Book className="text-blue-600" size={40} />
              Multilingual Dictionary
            </h1>
            <p className="glossary-subtitle">
              Browse categories, explore terms, and discover translations
            </p>
            {Object.keys(availableLanguages).length > 0 && (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  marginTop: '0.5rem',
                }}
              >
                Available in {Object.keys(availableLanguages).length} languages
              </p>
            )}
          </div>

          <div className="glossary-grid">
            {/* Categories Panel */}
            <div className="glossary-panel">
              <h2 className="glossary-panel-title">
                <Book size={20} />
                Categories
              </h2>
              {loading && !categories.length ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <div className="glossary-categories-list">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        void handleCategorySelect(category);
                      }}
                      className={`glossary-category-btn${
                        selectedCategory === category ? ' selected' : ''
                      }`}
                    >
                      <span>{category}</span>
                      {selectedCategory === category ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>{' '}
            {/* Terms Panel */}
            <div className="glossary-panel">
              <h2 className="glossary-panel-title">
                {selectedCategory
                  ? `Terms in ${selectedCategory}`
                  : categoryTerms.length > 0
                    ? 'Random Terms'
                    : 'Select a Category'}
              </h2>
              <div className="glossary-search">
                <Search className="glossary-search-icon" size={16} />
                <input
                  type="text"
                  placeholder={
                    selectedCategory
                      ? `Search terms in ${selectedCategory}...`
                      : 'Search all terms...'
                  }
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  className="glossary-search-input"
                />
              </div>
              {loading && selectedCategory ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <div className="glossary-terms-list">
                  {filteredTerms.map((term) => (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => {
                        handleTermSelect(term);
                      }}
                      className={`glossary-term-btn${
                        selectedTerm?.id === term.id ? ' selected' : ''
                      }`}
                    >
                      <div className="glossary-term-title">{term.term}</div>
                      <div className="glossary-term-def">{term.definition}</div>
                      {term.language && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#666',
                            marginTop: '4px',
                            fontStyle: 'italic',
                          }}
                        >
                          Language: {term.language}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedCategory && filteredTerms.length === 0 && !loading && (
                <div className="glossary-empty">
                  {searchTerm
                    ? `No terms found matching "${searchTerm}" in ${selectedCategory}.`
                    : `No terms available in ${selectedCategory}.`}
                </div>
              )}
            </div>
            {/* Details Panel */}
            <div className="glossary-panel">
              <h2 className="glossary-panel-title">
                <Globe size={20} />
                Term Details
              </h2>
              {selectedTerm ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="glossary-details-title">
                      {selectedTerm.term}
                    </h3>
                    <p className="glossary-details-def">
                      {selectedTerm.definition}
                    </p>
                    {selectedTerm.language && (
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: '#666',
                          marginTop: '8px',
                          fontStyle: 'italic',
                        }}
                      >
                        Language: {selectedTerm.language}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        void handleShowTranslations();
                      }}
                      className="glossary-translate-btn"
                      disabled={loading}
                    >
                      <Globe size={16} />
                      {loading && showTranslations
                        ? 'Loading...'
                        : 'Show Translations'}
                    </button>
                  </div>
                  {showTranslations && (
                    <div className="glossary-translation-list">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Translations
                      </h4>
                      {loading ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      ) : translations &&
                        Object.keys(translations.translations).length > 0 ? (
                        Object.entries(translations.translations).map(
                          ([language, translation]) => (
                            <div
                              key={language}
                              className="glossary-translation-item"
                            >
                              <div className="glossary-translation-lang">
                                {language}
                              </div>
                              <div className="glossary-translation-text">
                                {String(translation)}
                              </div>
                            </div>
                          ),
                        )
                      ) : (
                        <div className="glossary-empty">
                          No translations available for this term
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="glossary-empty">
                  Select a term to view details and translations
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlossaryPage;
