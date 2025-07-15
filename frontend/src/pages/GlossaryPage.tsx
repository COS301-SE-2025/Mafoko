import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Book,
  Globe,
  Search,
  Download,
  FileType,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LeftNav from '../components/ui/LeftNav.tsx';
import Navbar from '../components/ui/Navbar.tsx';

import '../styles/GlossaryPage.scss';
import { useDarkMode } from '../components/ui/DarkModeComponent.tsx';

import { API_ENDPOINTS } from '../config';
import { Term, TermTranslations, SearchResponse } from '../types/glossaryTypes';
import { downloadData } from '../utils/exportUtils';

// API client with strongly typed responses

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
        throw new Error('Failed to fetch terms for category: ' + category);
      }
      return (await response.json()) as Term[];
    } catch (error) {
      console.error(
        'Error fetching terms for category ' + category + ':',
        error,
      );
      return [];
    }
  },

  getTranslations: async (termId: string): Promise<TermTranslations> => {
    try {
      const response = await fetch(
        API_ENDPOINTS.glossaryTermTranslations(termId),
      );
      if (!response.ok) {
        throw new Error('Failed to fetch translations for term: ' + termId);
      }
      return (await response.json()) as TermTranslations;
    } catch (error) {
      console.error(
        'Error fetching translations for term ' + termId + ':',
        error,
      );
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
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();

  // Set activeMenuItem to 'glossary' for consistency with AnalyticsPage
  const [activeMenuItem, setActiveMenuItem] = useState('glossary');

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle mobile menu function
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  // Apply theme to document based on isDarkMode state
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('theme-dark');
      html.classList.remove('theme-light');
    } else {
      html.classList.add('theme-light');
      html.classList.remove('theme-dark');
    }
  }, [isDarkMode]);

  // Determines if the side nav or top nav should be used.
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [showTranslations, setShowTranslations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryTerms, setCategoryTerms] = useState<Term[]>([]);
  // Cache to store translations for each term
  const [termsTranslations, setTermsTranslations] = useState<
    Record<string, TermTranslations | null>
  >({});
  const [translations, setTranslations] = useState<TermTranslations | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableLanguages, setAvailableLanguages] = useState<
    Record<string, string>
  >({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);
  const exportPopupRef = useRef<HTMLDivElement>(null);

  // Load initial data on component mount
  useEffect(() => {
    void loadInitialData();
  }, []);

  // Add glossary-page class to body for specific mobile styles
  useEffect(() => {
    document.body.classList.add('glossary-page');
    return () => {
      document.body.classList.remove('glossary-page');
    };
  }, []);

  // Determines if the side nav or top nav should be used.
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle clicks outside the export popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportPopupRef.current &&
        !exportPopupRef.current.contains(event.target as Node)
      ) {
        setShowExportPopup(false);
      }
    };

    // Handle escape key press
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowExportPopup(false);
      }
    };

    if (showExportPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [exportPopupRef, showExportPopup]);

  // Handle scroll events to detect when we're near the bottom of the page
  // Effect to clean up on unmount
  useEffect(() => {
    return () => {
      // Reset state on unmount to prevent issues on next mount
      setShowExportPopup(false);
    };
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

  const handleCategorySelect = useCallback(
    async (category: string): Promise<void> => {
      setSelectedCategory(category);
      setSelectedTerm(null);
      setShowTranslations(false);
      setTranslations(null);
      setError(null);
      setLoading(true);
      // Clear search term when selecting a category
      setSearchTerm('');

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
    [setSearchTerm],
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
      // Check if we already have translations for this term in cache
      if (termsTranslations[selectedTerm.id]) {
        setTranslations(termsTranslations[selectedTerm.id]);
      } else {
        const termTranslations = await dictionaryAPI.getTranslations(
          selectedTerm.id,
        );
        // Update both the current translations and the cache
        setTranslations(termTranslations);
        setTermsTranslations((prev) => ({
          ...prev,
          [selectedTerm.id]: termTranslations,
        }));
      }
    } catch (error) {
      console.error('Error loading translations:', error);
      setError('Failed to load translations. Please try again.');
      setTranslations(null);
      // Also mark in cache that we failed to get translations for this term
      setTermsTranslations((prev) => ({
        ...prev,
        [selectedTerm.id]: null,
      }));
    } finally {
      setLoading(false);
    }
  }, [selectedTerm, termsTranslations]);

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
          // First fetch all terms for the category
          const allTermsInCategory =
            await dictionaryAPI.getTermsByCategory(selectedCategory);

          // Then filter those terms based on the search query
          searchResults = allTermsInCategory.filter(
            (term) =>
              term.term.toLowerCase().includes(query.toLowerCase()) ||
              term.definition.toLowerCase().includes(query.toLowerCase()),
          );
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
        // Always trigger search when there's a search term, regardless of category selection
        void handleSearch(searchTerm);
      } else if (selectedCategory) {
        // Only load category terms when there's no search term
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
      className={`dashboard-container ${isMobileMenuOpen ? 'mobile-menu-is-open' : ''} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={toggleMobileMenu}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              toggleMobileMenu();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      )}

      <div className="main-content">
        {!isMobile && (
          <div className="top-bar glossary-top-bar">
            <button
              className="hamburger-icon"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              type="button"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        )}

        <div className={`glossary-content ${isMobile ? 'pt-16' : ''}`}>
          {/* Main Content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Main Content Container */}
            <div
              style={{
                flex: 1,
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 0.5rem',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
                minHeight: 0,
                marginRight: '0.75rem',
                marginLeft: '-0.5rem',
              }}
            >
              {/* Error Display */}
              {error && (
                <div
                  style={{
                    background: '#553c2c',
                    border: `1px solid #d69e2e`,
                    color: '#fbb6ce',
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
                style={{
                  textAlign: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h1 className="glossary-title">
                  <Book size={40} />
                  {t('glossaryPage.title')}
                </h1>
                <p className="glossary-subtitle">
                  {t('glossaryPage.subtitle')}
                </p>
                {Object.keys(availableLanguages).length > 0 && (
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#a0aec0',
                      marginTop: '0.5rem',
                    }}
                  >
                    {/* Available in {Object.keys(availableLanguages).length} languages */}
                  </p>
                )}
              </div>

              <div className="glossary-grid">
                {/* Categories Panel */}
                <div className="glossary-panel">
                  <h2 className="glossary-panel-title">
                    <Book size={20} />
                    {t('glossaryPage.categories')}
                  </h2>
                  {loading && !categories.length ? (
                    <div className="animate-pulse">
                      <div
                        className="glossary-loading-skeleton"
                        style={{ marginBottom: '12px' }}
                      ></div>
                      <div
                        className="glossary-loading-skeleton"
                        style={{ marginBottom: '12px' }}
                      ></div>
                      <div className="glossary-loading-skeleton"></div>
                    </div>
                  ) : (
                    <div className="glossary-categories-list">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            // If the category is already selected, deselect it and load random terms
                            if (selectedCategory === category) {
                              setSelectedCategory(null);
                              setSelectedTerm(null);
                              setShowTranslations(false);
                              setTranslations(null);
                              setSearchTerm('');
                              setError(null);
                              setShowExportPopup(false); // Close export popup if open
                              setLoading(true);

                              // Load random terms
                              void (async () => {
                                try {
                                  const randomTerms =
                                    await dictionaryAPI.getRandomTerm(10);
                                  setCategoryTerms(randomTerms);
                                } catch (error) {
                                  console.error(
                                    'Error loading random terms:',
                                    error,
                                  );
                                  setError(
                                    'Failed to load random terms. Please try again.',
                                  );
                                  setCategoryTerms([]);
                                } finally {
                                  setLoading(false);
                                }
                              })();
                            } else {
                              // If selecting a new category, use the normal handler
                              void handleCategorySelect(category);
                            }
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
                      ? t('glossaryPage.termsInCategory', {
                          category: selectedCategory,
                        })
                      : categoryTerms.length > 0
                        ? t('glossaryPage.randomTerms')
                        : t('glossaryPage.selectCategory')}
                  </h2>
                  <div className="glossary-search">
                    <Search className="glossary-search-icon" size={16} />
                    <input
                      type="text"
                      placeholder={
                        selectedCategory
                          ? t('glossaryPage.searchTermsInCategory', {
                              category: selectedCategory,
                            })
                          : t('glossaryPage.searchAllTerms')
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
                      <div
                        className="glossary-loading-skeleton"
                        style={{ height: '80px' }}
                      ></div>
                      <div
                        className="glossary-loading-skeleton"
                        style={{ height: '80px' }}
                      ></div>
                      <div
                        className="glossary-loading-skeleton"
                        style={{ height: '80px' }}
                      ></div>
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
                          {' '}
                          <div className="glossary-term-title">{term.term}</div>
                          <div className="glossary-term-def">
                            {term.definition}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {filteredTerms.length === 0 && !loading && (
                    <div className="glossary-empty">
                      {searchTerm && selectedCategory
                        ? `No terms found matching "${searchTerm}" in ${selectedCategory} category.`
                        : searchTerm
                          ? `No terms found matching "${searchTerm}" across all categories.`
                          : selectedCategory
                            ? `No terms available in ${selectedCategory} category.`
                            : `No terms available.`}
                    </div>
                  )}
                </div>
                {/* Details Panel */}
                <div className="glossary-panel">
                  <h2 className="glossary-panel-title">
                    <Book size={20} />
                    {t('glossaryPage.termDetails')}
                  </h2>
                  <div className="glossary-details">
                    {selectedTerm ? (
                      <div>
                        <h3 className="glossary-details-title">
                          {selectedTerm.term}
                        </h3>
                        <p className="glossary-details-def">
                          {selectedTerm.definition}
                        </p>
                        <div style={{ marginTop: '1rem' }}>
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
                              ? t('glossaryPage.loading')
                              : t('glossaryPage.showTranslations')}
                          </button>
                        </div>
                        {showTranslations && (
                          <div className="glossary-translation-list">
                            <h4 className="glossary-translations-header">
                              {t('glossaryPage.translationsHeader')}
                            </h4>
                            {loading ? (
                              <div className="animate-pulse space-y-2">
                                <div className="glossary-loading-skeleton"></div>
                                <div className="glossary-loading-skeleton"></div>
                                <div className="glossary-loading-skeleton"></div>
                              </div>
                            ) : translations &&
                              Object.keys(translations.translations).length >
                                0 ? (
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
                                {t('glossaryPage.noTranslations')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="glossary-empty"
                        style={{
                          maxHeight: 'calc(100vh - 250px)',
                          overflowY: 'auto',
                        }}
                      >
                        {t('glossaryPage.selectTerm')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Floating Export Data Button */}
              {selectedCategory && !showExportPopup && (
                <div
                  className="glossary-floating-export-button"
                  style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    zIndex: 900,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportPopup(true);
                    }}
                    className="glossary-export-button"
                    style={{
                      backgroundColor: '#f00a50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(240, 10, 80, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow =
                        '0 6px 16px rgba(240, 10, 80, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow =
                        '0 4px 12px rgba(240, 10, 80, 0.3)';
                    }}
                    title={t('glossaryPage.exportData')}
                  >
                    <Download size={24} />
                  </button>
                </div>
              )}
            </div>

            {/* Export Data Popup Modal */}
            {showExportPopup && selectedCategory && (
              <div
                className="glossary-export-overlay"
                style={{
                  paddingLeft: window.innerWidth > 767 ? '220px' : '0', // Account for sidebar on desktop only
                }}
                onClick={() => {
                  setShowExportPopup(false);
                }}
              >
                <div
                  ref={exportPopupRef}
                  className="glossary-export-popup"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportPopup(false);
                    }}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: window.innerWidth > 767 ? '1.5rem' : '1.75rem',
                      cursor: 'pointer',
                      color: 'var(--text-theme)',
                      width: window.innerWidth > 767 ? '32px' : '44px',
                      height: window.innerWidth > 767 ? '32px' : '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        'var(--glossary-border-color)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    ×
                  </button>

                  {/* Header */}
                  <div style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        margin: '0 0 0.5rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                      className="glossary-export-title"
                    >
                      <Download size={20} />
                      {t('glossaryPage.exportData')} - {selectedCategory}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        lineHeight: '1.4',
                      }}
                      className="glossary-export-subtitle"
                    >
                      {t('glossaryPage.downloadTerms', {
                        category: selectedCategory,
                        searchTerm: searchTerm
                          ? ' matching "' + searchTerm + '"'
                          : '',
                        count: filteredTerms.length,
                      })}
                    </p>
                  </div>

                  {/* Format Options */}
                  <div
                    className="glossary-format-options"
                    style={{ display: 'grid', gap: '0.75rem' }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportPopup(false);
                        const handleDownload = async () => {
                          try {
                            await downloadData(
                              filteredTerms,
                              'csv',
                              termsTranslations,
                              selectedCategory,
                            );
                          } catch (error) {
                            console.error('CSV download failed:', error);
                            setError(
                              'Failed to download CSV. Please try again.',
                            );
                            setTimeout(() => {
                              setError(null);
                            }, 5000);
                          }
                        };
                        void handleDownload();
                      }}
                      className="glossary-format-menu-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        width: '100%',
                        textAlign: 'left',
                        border: '1px solid var(--glossary-border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        backgroundColor: 'transparent',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'var(--glossary-border-color)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ width: '20px', color: '#1e40af' }}>
                        <FileType size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {t('glossaryPage.csvFormat')}
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                          {t('glossaryPage.spreadsheetCompatible')}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowExportPopup(false);
                        const handleDownload = async () => {
                          try {
                            await downloadData(
                              filteredTerms,
                              'json',
                              termsTranslations,
                              selectedCategory,
                            );
                          } catch (error) {
                            console.error('JSON download failed:', error);
                            setError(
                              'Failed to download JSON. Please try again.',
                            );
                            setTimeout(() => {
                              setError(null);
                            }, 5000);
                          }
                        };
                        void handleDownload();
                      }}
                      className="glossary-format-menu-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        width: '100%',
                        textAlign: 'left',
                        border: '1px solid var(--glossary-border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        backgroundColor: 'transparent',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'var(--glossary-border-color)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ width: '20px', color: '#10b981' }}>
                        <FileType size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {t('glossaryPage.jsonFormat')}
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                          {t('glossaryPage.developerFriendly')}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowExportPopup(false);
                        const handleDownload = async () => {
                          try {
                            await downloadData(
                              filteredTerms,
                              'html',
                              termsTranslations,
                              selectedCategory,
                            );
                          } catch (error) {
                            console.error('HTML download failed:', error);
                            setError(
                              'Failed to download HTML. Please try again.',
                            );
                            setTimeout(() => {
                              setError(null);
                            }, 5000);
                          }
                        };
                        void handleDownload();
                      }}
                      className="glossary-format-menu-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        width: '100%',
                        textAlign: 'left',
                        border: '1px solid var(--glossary-border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        backgroundColor: 'transparent',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'var(--glossary-border-color)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ width: '20px', color: '#047857' }}>
                        <FileType size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {t('glossaryPage.htmlTable')}
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                          {t('glossaryPage.webFriendly')}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowExportPopup(false);
                        const handlePdfDownload = async () => {
                          try {
                            setError(null);
                            setIsDownloading(true);

                            // First, show a message to the user
                            setError(`Preparing terms for PDF export...`);

                            // Always fetch ALL terms for the selected category to ensure complete exports
                            let termsToExport = [...filteredTerms];

                            // If we're in a category, always ensure we get all terms regardless of search
                            if (selectedCategory) {
                              setError(
                                `Loading all terms in ${selectedCategory} for export...`,
                              );
                              try {
                                // Get all terms for this category directly from the API
                                const allCategoryTerms =
                                  await dictionaryAPI.getTermsByCategory(
                                    selectedCategory,
                                  );
                                if (allCategoryTerms.length > 0) {
                                  termsToExport = allCategoryTerms;

                                  // Show warning for very large exports
                                  if (allCategoryTerms.length > 200) {
                                    setError(
                                      `Preparing ${String(termsToExport.length)} terms from ${selectedCategory} for export. This may take a while...`,
                                    );
                                  } else {
                                    setError(
                                      `Exporting ${String(termsToExport.length)} terms from ${selectedCategory}...`,
                                    );
                                  }
                                }
                              } catch (err) {
                                console.error(
                                  'Failed to load all category terms:',
                                  err,
                                );
                                // Continue with filtered terms as fallback
                                setError(
                                  `Using ${String(filteredTerms.length)} filtered terms as fallback...`,
                                );
                              }
                            } else {
                              // If no category selected, use all filtered terms
                              setError(
                                `Exporting ${String(filteredTerms.length)} terms...`,
                              );
                            }

                            // For very large datasets, we'll show an extra warning
                            if (termsToExport.length > 300) {
                              console.log(
                                `Large export: ${String(termsToExport.length)} terms to PDF`,
                              );
                              // Add a slight delay to ensure the user sees the warning
                              await new Promise((resolve) =>
                                setTimeout(resolve, 800),
                              );
                            }

                            console.log(
                              `Exporting ${String(termsToExport.length)} terms to PDF`,
                            );

                            // Start the export process
                            await downloadData(
                              termsToExport,
                              'pdf',
                              termsTranslations,
                              selectedCategory,
                            );
                            setError(null);
                          } catch (error) {
                            console.error('PDF download failed:', error);
                            const errorMessage =
                              error instanceof Error
                                ? error.message
                                : 'PDF generation failed. Please try HTML or CSV format instead.';
                            setError(errorMessage);
                            setTimeout(() => {
                              setError(null);
                            }, 10000);
                          } finally {
                            setIsDownloading(false);
                          }
                        };
                        void handlePdfDownload();
                      }}
                      disabled={isDownloading}
                      className="glossary-format-menu-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        width: '100%',
                        textAlign: 'left',
                        border: '1px solid var(--glossary-border-color)',
                        borderRadius: '8px',
                        cursor: isDownloading ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        backgroundColor: 'transparent',
                        transition: 'all 0.2s ease',
                        opacity: isDownloading ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isDownloading) {
                          e.currentTarget.style.backgroundColor =
                            'var(--glossary-border-color)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDownloading) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <div style={{ width: '20px', color: '#dc2626' }}>
                        <FileType size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {isDownloading
                            ? 'Generating PDF...'
                            : t('glossaryPage.pdfFormat')}
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                          {t('glossaryPage.printFriendly')}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlossaryPage;
