import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import {
  Search,
  Bookmark,
  Download,
  FileType,
  Filter,
  WifiOff,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import GlossaryTermCard from '../components/ui/GlossaryTermCard';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar.tsx';
import GlossaryHeader from '../components/ui/GlossaryHeader';
import { downloadData } from '../utils/exportUtils';
import { useDarkMode } from '../components/ui/DarkModeComponent.tsx';
import { LANGUAGES } from '../types/search/types';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { cachingService } from '../utils/cachingService';
import '../styles/NewGlossary.scss';
import { GlossaryList } from '../components/ui/GlossaryList.tsx';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Term {
  id: number;
  term: string;
  definition: string;
  language?: string;
  category?: string;
  translations?: { [lang: string]: string };
}

interface Glossary {
  id: number;
  name: string;
  description?: string;
  termCount?: number;
  languages?: string[];
}

const GlossaryApp = () => {
  const { isDarkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const { category } = useParams<{ category?: string }>();
  const networkStatus = useNetworkStatus();

  const [glossarySearch, setGlossarySearch] = useState('');
  const [termSearch, setTermSearch] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showLanguageFilter, setShowLanguageFilter] = useState(false);
  const [glossaries, setGlossaries] = useState<Glossary[]>([]);
  const [selectedGlossary, setSelectedGlossary] = useState<Glossary | null>(
    null,
  );
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('glossary');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [bookmarkedCategory, setBookmarkedCategory] = useState(false);
  const [bookmarkedGlossaries, setBookmarkedGlossaries] = useState<string[]>(
    [],
  );
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTerms, setTotalTerms] = useState(0);
  const [debouncedTermSearch, setDebouncedTermSearch] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const termsPerPage = 20;
  const exportPopupRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Notification state for user feedback
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({
    message: '',
    type: 'info',
    visible: false,
  });

  // Helper functions for user notifications
  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
  ) => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  const showSuccess = useCallback((message: string) => {
    showNotification(message, 'success');
  }, []);
  const showError = useCallback((message: string) => {
    showNotification(message, 'error');
  }, []);
  const showInfo = useCallback((message: string) => {
    showNotification(message, 'info');
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTermSearch(termSearch);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [termSearch]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle navigation state from workspace page
  useEffect(() => {
    const state = location.state as { selectedGlossaryName?: string } | null;
    if (state?.selectedGlossaryName && glossaries.length > 0) {
      const targetGlossary = glossaries.find(
        (g) => g.name === state.selectedGlossaryName,
      );
      if (targetGlossary) {
        setSelectedGlossary(targetGlossary);
        // Clear the navigation state to prevent re-selection on subsequent renders
        window.history.replaceState(null, '', location.pathname);
      }
    }
  }, [location.state, location.pathname, glossaries]);

  // Handle URL parameter for direct category navigation
  useEffect(() => {
    if (category && glossaries.length > 0) {
      // Clean and normalize the category from URL
      const cleanCategory = category
        .replace(/-+/g, ' ') // Replace hyphens with spaces
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim(); // Remove leading/trailing spaces

      // Convert URL-friendly format back to proper case
      const categoryVariations = [
        category, // as-is from URL
        cleanCategory, // cleaned version
        cleanCategory.charAt(0).toUpperCase() + cleanCategory.slice(1), // Capitalize first letter
        cleanCategory.replace(/\b\w/g, (l) => l.toUpperCase()), // Title case
        category.charAt(0).toUpperCase() + category.slice(1), // Capitalize first letter of original
        category.replace(/-/g, ' '), // Replace hyphens with spaces
        category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), // Title case
        category.toUpperCase(), // All uppercase
        category.toLowerCase(), // All lowercase
      ];

      // Try to find a matching glossary with any of the variations
      let targetGlossary = null;
      for (const variation of categoryVariations) {
        targetGlossary = glossaries.find(
          (g) =>
            g.name.toLowerCase().replace(/\s+/g, '-') ===
              variation.toLowerCase().replace(/\s+/g, '-') ||
            g.name.toLowerCase() === variation.toLowerCase(),
        );
        if (targetGlossary) break;
      }

      if (targetGlossary) {
        setSelectedGlossary(targetGlossary);
      }
    }
  }, [category, glossaries]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    setLoading(true);

    // Use caching service to fetch glossaries
    const fetchGlossaries = async () => {
      try {
        const response = await cachingService.getGlossaries();

        // Convert the stats object to glossary array
        const glossariesData: Glossary[] = Object.entries(response.data).map(
          ([name, termCount], idx) => ({
            id: idx + 1,
            name,
            description: '',
            termCount,
            languages: [],
          }),
        );

        setGlossaries(glossariesData);
        setFromCache(response.fromCache);

        // Show notification if data is from cache
        if (response.fromCache) {
          showInfo('Data loaded from offline cache');
        }
      } catch (error) {
        console.error('Failed to fetch glossaries:', error);
        setGlossaries([]);
        showError('Failed to load glossaries. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    void fetchGlossaries();
  }, [showError, showInfo]);

  useEffect(() => {
    if (!selectedGlossary) return;
    setLoading(true);

    // Use caching service to fetch terms
    const fetchTerms = async () => {
      try {
        const response = await cachingService.getGlossaryTerms(
          selectedGlossary.name,
          currentPage,
          termsPerPage,
          debouncedTermSearch.trim() || undefined,
          selectedLanguages.length > 0 ? selectedLanguages : undefined,
        );

        setTerms(
          response.data.results.map((term: Term) => ({
            ...term,
            translations: term.translations || {},
          })),
        );
        setTotalTerms(response.data.total);
        setFromCache(response.fromCache);

        // Show notification if data is from cache
        if (response.fromCache) {
          showInfo('Terms loaded from offline cache');
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
        setTerms([]);
        setTotalTerms(0);

        if (networkStatus.isOffline) {
          showError('No offline data available for this glossary');
        } else {
          showError('Failed to load terms. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchTerms();
  }, [
    selectedGlossary,
    currentPage,
    debouncedTermSearch,
    selectedLanguages,
    networkStatus.isOffline,
    showError,
    showInfo,
  ]);

  // Reset page when glossary, search, or language filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGlossary, debouncedTermSearch, selectedLanguages]);

  // Check if selected glossary is bookmarked when it changes
  useEffect(() => {
    if (!selectedGlossary) {
      setBookmarkedCategory(false);
      return;
    }

    const checkBookmarkStatus = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setBookmarkedCategory(false);
        return;
      }

      try {
        // Use caching service to fetch user's bookmarks
        const response = await cachingService.getBookmarks(token);
        const bookmarksData = response.data as {
          glossaries?: Array<{ domain: string }>;
        };

        const bookmarkedGlossariesData = bookmarksData.glossaries || [];

        // Extract glossary names into a simple array
        const bookmarkedGlossaryNames: string[] = bookmarkedGlossariesData.map(
          (bookmark: { domain: string }) => bookmark.domain,
        );
        setBookmarkedGlossaries(bookmarkedGlossaryNames);

        // Check if current glossary is in the bookmarked glossaries
        const isCurrentGlossaryBookmarked = bookmarkedGlossaryNames.includes(
          selectedGlossary.name,
        );

        setBookmarkedCategory(isCurrentGlossaryBookmarked);
      } catch (error) {
        console.error('Error checking bookmark status:', error);
        setBookmarkedCategory(false);

        if (networkStatus.isOffline) {
          showInfo('Bookmark status not available offline');
        }
      }
    };

    void checkBookmarkStatus();
  }, [selectedGlossary, networkStatus.isOffline, showInfo]);

  // Reusable bookmark handler that both buttons can use
  const handleBookmarkGlossary = async (
    glossary: Glossary | null = selectedGlossary,
  ) => {
    if (!glossary) {
      showError('No glossary selected!');
      return false;
    }

    const token = localStorage.getItem('accessToken');

    if (!token) {
      showError('Please log in to bookmark glossaries.');
      return false;
    }

    // Check if offline
    if (networkStatus.isOffline) {
      showError('Bookmark operations require internet connection');
      return false;
    }

    try {
      // Check current bookmark status for this specific glossary
      const currentlyBookmarked = bookmarkedGlossaries.includes(glossary.name);

      // Update UI optimistically
      if (selectedGlossary?.name === glossary.name) {
        setBookmarkedCategory(!currentlyBookmarked);
      }

      let success = false;
      if (currentlyBookmarked) {
        // Unbookmark the glossary
        success = await cachingService.unbookmarkGlossary(token, glossary.name);
        if (success) {
          showSuccess(`Unbookmarked ${glossary.name}!`);
          setBookmarkedGlossaries((prev) =>
            prev.filter((name) => name !== glossary.name),
          );
        }
      } else {
        // Bookmark the glossary
        success = await cachingService.bookmarkGlossary(
          token,
          glossary.name,
          glossary.description,
        );
        if (success) {
          showSuccess(`Bookmarked ${glossary.name}!`);
          setBookmarkedGlossaries((prev) => [...prev, glossary.name]);
        }
      }

      if (success) {
        // Set timestamp and trigger events
        const timestamp = Date.now().toString();
        localStorage.setItem('bookmarksChanged', timestamp);

        window.dispatchEvent(
          new CustomEvent('bookmarkChanged', {
            detail: {
              type: 'glossary',
              action: currentlyBookmarked ? 'unbookmark' : 'bookmark',
              name: glossary.name,
            },
          }),
        );
      } else {
        // Revert optimistic update on failure
        if (selectedGlossary?.name === glossary.name) {
          setBookmarkedCategory(currentlyBookmarked);
        }
      }

      return success;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      toast('Failed to bookmark', {
        description: '',
      });

      // Revert optimistic update on failure
      if (selectedGlossary?.name === glossary.name) {
        setBookmarkedCategory(bookmarkedCategory);
      }
      return false;
    }
  };

  // Scroll to top when a glossary is selected
  useEffect(() => {
    if (selectedGlossary) {
      // Use setTimeout to ensure the component has rendered first
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth',
        });
        // Fallback for browsers that don't support smooth scroll
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
    }
  }, [selectedGlossary]);

  const filteredTerms = terms;

  const getAllTermsForExport = async (): Promise<Term[]> => {
    if (!selectedGlossary) {
      return filteredTerms;
    }

    try {
      // First, try to get all terms without search filter using advanced search
      const exportParams = new URLSearchParams({
        domain: selectedGlossary.name,
        page: '1',
        limit: '10000', // Set a high limit to get all terms
      });

      // Include language filter if selected, but not search query for export
      if (selectedLanguages.length > 0) {
        selectedLanguages.forEach((lang) => {
          exportParams.append('language', lang);
        });
      }

      const response = await fetch(
        `${API_ENDPOINTS.glossaryAdvancedSearch}?${exportParams.toString()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: selectedGlossary.name,
            languages: selectedLanguages,
            page: 1,
            limit: 10000,
          }),
        },
      );

      if (response.ok) {
        const data = (await response.json()) as { results: Term[] };
        return data.results;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      {
        /* */
      }
    }

    // Fallback to original endpoint to get all terms
    try {
      const fallbackResponse = await fetch(
        API_ENDPOINTS.glossaryTermsByCategory(selectedGlossary.name),
      );
      if (fallbackResponse.ok) {
        const fallbackData = (await fallbackResponse.json()) as Term[];

        if (selectedLanguages.length > 0) {
          return fallbackData.filter(
            (term) =>
              term.language && selectedLanguages.includes(term.language),
          );
        }

        return fallbackData;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast('Export Failed', {
        description: 'Failed to fetch all terms for export.',
      });
    }

    // Last resort: return current page data
    return filteredTerms;
  };

  return (
    <div
      className={`dashboard-container !bg-[var(--bg-first)] ${isMobileMenuOpen ? ' mobile-menu-is-open' : ''} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      {/* Offline Status Indicator */}
      {networkStatus.isOffline && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#f59e0b',
            color: 'white',
            padding: '0.5rem',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: 600,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <WifiOff size={16} />
          <span>{t('glossaryPage2.offlineMessage')}</span>
        </div>
      )}

      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={toggleMobileMenu}
          onKeyDown={(e) => {
            if (e.key === 'Enter') toggleMobileMenu();
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

      <div
        className="main-content !bg-[var(--bg-first)]"
        style={{
          paddingTop: networkStatus.isOffline
            ? fromCache
              ? '96px'
              : '48px'
            : fromCache
              ? '48px'
              : '0',
          transition: 'padding-top 0.3s ease',
        }}
      >
        <div className="glossary-content !bg-[var(--bg-first)]">
          {selectedGlossary ? (
            // Terms List View
            <div
              className="terms-list-container"
              style={{ position: 'relative', minHeight: '100vh' }}
            >
              <GlossaryHeader
                title={selectedGlossary.name}
                description={selectedGlossary.description}
                countText={`${filteredTerms.length.toString()} of ${totalTerms.toString()} terms (Page ${currentPage.toString()} of ${Math.ceil(totalTerms / termsPerPage).toString()})${fromCache ? ' - Cached' : ''}`}
                onBack={() => {
                  setSelectedGlossary(null);
                  setCurrentPage(1);
                  setTermSearch('');
                  setDebouncedTermSearch('');
                  setSelectedLanguages([]);
                  setShowLanguageFilter(false);
                  setFromCache(false);

                  void navigate('/glossary');
                }}
              />

              <div
                className="w-full flex justify-center py-6"
                style={{ padding: '6px' }}
              >
                <div
                  className="flex w-full max-w-xl items-center gap-2 rounded-lg px-3 py-2 shadow-sm transition"
                  style={{
                    padding: '0.75rem 1rem',
                    border: isDarkMode
                      ? '1px solid #4b5563'
                      : '1px solid rgba(0, 206, 175, 0.3)',
                    backgroundColor: isDarkMode
                      ? 'rgba(71, 85, 105, 0.5)'
                      : 'white',
                    borderRadius: '0.5rem',
                  }}
                >
                  <Search
                    className="shrink-0"
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      color: '#9ca3af',
                    }}
                  />
                  <input
                    type="text"
                    placeholder={t('glossaryPage2.searchPlaceholder')}
                    value={termSearch}
                    onChange={(e) => {
                      setTermSearch(e.target.value);
                    }}
                    className="flex-1 bg-transparent focus:outline-none"
                    autoComplete="off"
                    style={{
                      color: isDarkMode ? 'white' : '#111827',
                      fontSize: '1rem',
                      border: 'none',
                      outline: 'none',
                    }}
                  />
                  <style>{`
                    input::placeholder {
                      color: ${isDarkMode ? '#9ca3af' : '#6b7280'};
                      opacity: 1;
                    }
                  `}</style>
                </div>
              </div>

              {/* Language Filter */}
              <div
                className="language-filter-container"
                style={{
                  width: '100%',
                  margin: '0 auto 2rem auto',
                  position: 'relative',
                }}
              >
                <div
                  className="language-filter-header"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <Filter
                    size={16}
                    style={{ color: 'var(--text-theme)', opacity: 0.7 }}
                  />
                  <span
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      color: 'var(--text-theme)',
                      opacity: 0.7,
                    }}
                  >
                    {t('glossaryPage2.filterByLanguage')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLanguageFilter(!showLanguageFilter);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-color)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      textDecoration: 'underline',
                    }}
                  >
                    {showLanguageFilter
                      ? t('glossaryPage2.hide')
                      : t('glossaryPage2.show')}
                  </button>
                </div>

                {showLanguageFilter && (
                  <div
                    className="language-filter-options"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      padding: '1rem',
                      background: 'var(--card-background)',
                      border: '1px solid var(--glossary-border-color)',
                      borderRadius: '0.5rem',
                      boxShadow: '0 2px 4px var(--card-shadow)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLanguages([]);
                      }}
                      className={`language-filter-option ${selectedLanguages.length === 0 ? 'active' : ''}`}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid var(--glossary-border-color)',
                        borderRadius: '1.5rem',
                        background:
                          selectedLanguages.length === 0
                            ? 'var(--accent-color)'
                            : 'var(--card-background)',
                        color:
                          selectedLanguages.length === 0
                            ? 'white'
                            : 'var(--text-theme)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {t('glossaryPage2.allLanguages')}
                    </button>
                    {LANGUAGES.map((language) => (
                      <button
                        key={language}
                        type="button"
                        onClick={() => {
                          setSelectedLanguages((prev) =>
                            prev.includes(language)
                              ? prev.filter((l) => l !== language)
                              : [...prev, language],
                          );
                        }}
                        className={`language-filter-option ${selectedLanguages.includes(language) ? 'active' : ''}`}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid var(--glossary-border-color)',
                          borderRadius: '1.5rem',
                          background: selectedLanguages.includes(language)
                            ? 'var(--accent-color)'
                            : 'var(--card-background)',
                          color: selectedLanguages.includes(language)
                            ? 'white'
                            : 'var(--text-theme)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active filter indicator */}
                {selectedLanguages.length > 0 && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      color: 'var(--text-theme)',
                      opacity: 0.8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{t('glossaryPage2.activeFilter')}:</span>
                    {selectedLanguages.map((lang) => (
                      <span
                        key={lang}
                        style={{
                          background: 'var(--accent-color)',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                        }}
                      >
                        {lang}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLanguages([]);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-color)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        textDecoration: 'underline',
                      }}
                    >
                      {t('glossaryPage2.clear')}
                    </button>
                  </div>
                )}
              </div>

              <div className="terms-list">
                {loading ? (
                  <div className="terms-list-message">
                    {t('glossaryPage2.loadingTerms')}...
                  </div>
                ) : terms.length === 0 ? (
                  <div className="terms-list-message">
                    {t('glossaryPage2.noTermsFound')}
                  </div>
                ) : filteredTerms.length === 0 ? (
                  <div className="terms-list-message">
                    {t('glossaryPage2.noTermsMatch')}
                  </div>
                ) : (
                  <div
                    className="grid lg:grid-cols-2 md:grid-cols-1 gap-20"
                    style={{
                      paddingLeft: '10px',
                      paddingRight: '10px',
                    }}
                  >
                    {filteredTerms
                      .slice()
                      .sort((a, b) =>
                        (a.language || '').localeCompare(
                          b.language || '',
                          undefined,
                          {
                            sensitivity: 'base',
                          },
                        ),
                      )
                      .map((term) => (
                        <div
                          key={term.id}
                          style={{
                            width: '100%',
                            maxWidth: '600px',
                            margin: '0 auto',
                          }}
                        >
                          <GlossaryTermCard
                            term={{
                              id: term.id.toString(),
                              term: term.term,
                              definition: term.definition,
                              language: term.language,
                            }}
                          />
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {totalTerms > termsPerPage && (
                <div
                  className="flex items-center justify-center gap-6 py-6 hover:!text-teal-500"
                  style={{ paddingBottom: '30px', paddingTop: '30px' }}
                >
                  {/* Previous Button */}
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(currentPage - 1);
                      setTimeout(() => {
                        const glossaryList = document.querySelector(
                          '.glossary-list, .terms-list',
                        );
                        if (glossaryList) {
                          glossaryList.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }, 0);
                    }}
                    className={`flex items-center justify-center border-0 px-3 py-2 transition
        ${
          currentPage === 1 || loading
            ? 'cursor-not-allowed opacity-40 border-[var(--glossary-border-color)]'
            : 'hover:bg-[var(--bg-tir)] border-[var(--glossary-border-color)]'
        }
      `}
                  >
                    <ChevronLeft className="w-5 h-5 text-[var(--text-theme)]" />
                  </button>

                  <span className="text-sm sm:text-base text-[var(--text-theme)] select-none">
                    {t('glossaryPage2.page')} {currentPage}{' '}
                    {t('glossaryPage2.of')}{' '}
                    {Math.ceil(totalTerms / termsPerPage)}
                  </span>

                  <button
                    type="button"
                    disabled={
                      currentPage === Math.ceil(totalTerms / termsPerPage)
                    }
                    onClick={() => {
                      setCurrentPage(currentPage + 1);
                      setTimeout(() => {
                        const glossaryList = document.querySelector(
                          '.glossary-list, .terms-list',
                        );
                        if (glossaryList) {
                          glossaryList.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }, 0);
                    }}
                    className={`flex items-center justify-center border-0 px-3 py-2 transition
        ${
          currentPage === Math.ceil(totalTerms / termsPerPage) || loading
            ? 'cursor-not-allowed opacity-40 border-0'
            : 'hover:bg-[var(--bg-tir)] border-0'
        }
      `}
                  >
                    <ChevronRight className="w-5 h-5 text-[var(--text-theme)]" />
                  </button>
                </div>
              )}
              {/* Floating Export and Bookmark Buttons */}
              <div
                style={{
                  position: 'fixed',
                  bottom: 32,
                  right: 32,
                  display: 'flex',
                  flexDirection: window.innerWidth <= 500 ? 'column' : 'row',
                  gap: '1.2rem',
                  zIndex: 1000,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    void handleBookmarkGlossary();
                  }}
                  style={{
                    backgroundColor: '#f2d001',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(242, 208, 1, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                  title={
                    bookmarkedCategory ? 'Bookmarked!' : 'Bookmark Category'
                  }
                >
                  <Bookmark
                    size={28}
                    strokeWidth={2.5}
                    color="#fff"
                    fill={bookmarkedCategory ? '#fff' : 'none'}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportPopup(true);
                  }}
                  style={{
                    backgroundColor: '#f00a50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(240, 10, 80, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                  title="Export Data"
                >
                  <Download size={24} />
                </button>
              </div>
            </div>
          ) : (
            <GlossaryList
              glossaries={glossaries}
              glossarySearch={glossarySearch}
              setGlossarySearch={setGlossarySearch}
              bookmarkedGlossaries={bookmarkedGlossaries}
              handleBookmarkGlossary={(glossary) =>
                void handleBookmarkGlossary(glossary)
              }
              setSelected={setSelectedGlossary}
              onView={(g) => {
                setSelectedGlossary(g);
              }}
              loading={loading}
            />
          )}

          {/* Export Data Popup Modal */}
          {showExportPopup && selectedGlossary && (
            <div
              className="glossary-export-overlay"
              style={{
                paddingLeft: window.innerWidth > 767 ? '220px' : '0',
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
                <div
                  className=""
                  style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}
                >
                  <div className="flex justify-center items-center gap-8">
                    <div>
                      <h3
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          margin: '0 0 0.5rem 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                        className="glossary-export-title flex  text-theme justify-center items-center gap-8"
                      >
                        {t('glossaryPage2.exportData')} -{' '}
                        {selectedGlossary.name}
                      </h3>
                    </div>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                    }}
                    className="glossary-export-subtitle text-left"
                  >
                    {t('glossaryPage2.exportMessage')} {selectedGlossary.name}{' '}
                    {t('glossaryPage2.exportMessage2')}
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
                          const allTerms = await getAllTermsForExport();
                          const termsWithCategory = allTerms.map((term) => ({
                            ...term,
                            id: String(term.id),
                            category: selectedGlossary.name,
                          }));
                          await downloadData(
                            termsWithCategory,
                            'csv',
                            {},
                            selectedGlossary.name,
                          );
                        } catch (error) {
                          console.error('CSV download failed:', error);
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
                        CSV {t('glossaryPage2.format')}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowExportPopup(false);
                      const handleDownload = async () => {
                        try {
                          const allTerms = await getAllTermsForExport();
                          const termsWithCategory = allTerms.map((term) => ({
                            ...term,
                            id: String(term.id),
                            category: selectedGlossary.name,
                          }));
                          await downloadData(
                            termsWithCategory,
                            'json',
                            {},
                            selectedGlossary.name,
                          );
                        } catch (error) {
                          console.error('JSON download failed:', error);
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
                        JSON {t('glossaryPage2.format')}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowExportPopup(false);
                      const handleDownload = async () => {
                        try {
                          const allTerms = await getAllTermsForExport();
                          const termsWithCategory = allTerms.map((term) => ({
                            ...term,
                            id: String(term.id),
                            category: selectedGlossary.name,
                          }));
                          await downloadData(
                            termsWithCategory,
                            'html',
                            {},
                            selectedGlossary.name,
                          );
                        } catch (error) {
                          console.error('HTML download failed:', error);
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
                        HTML {t('glossaryPage2.format')}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowExportPopup(false);
                      const handlePdfDownload = async () => {
                        try {
                          setIsDownloading(true);
                          const allTerms = await getAllTermsForExport();
                          const termsWithCategory = allTerms.map((term) => ({
                            ...term,
                            id: String(term.id),
                            category: selectedGlossary.name,
                          }));
                          await downloadData(
                            termsWithCategory,
                            'pdf',
                            {},
                            selectedGlossary.name,
                          );
                        } catch (error) {
                          console.error('PDF download failed:', error);
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
                          : `PDF ${t('glossaryPage2.format')}`}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Display */}
      {notification.visible && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default GlossaryApp;
