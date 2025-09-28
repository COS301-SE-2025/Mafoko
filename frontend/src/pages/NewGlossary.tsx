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
  Database,
} from 'lucide-react';
import GlossaryTermCard from '../components/ui/GlossaryTermCard';
import GlossaryCard from '../components/ui/GlossaryCard';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar.tsx';
import GlossaryHeader from '../components/ui/GlossaryHeader';
import { downloadData } from '../utils/exportUtils';
import { useDarkMode } from '../components/ui/DarkModeComponent.tsx';
import { LANGUAGES } from '../types/search/types';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { cachingService } from '../utils/cachingService';
import '../styles/NewGlossary.scss';

// --- FULL WORKING LOGIC RESTORED ---
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
  const [expandedTermIds, setExpandedTermIds] = useState<Set<number>>(
    new Set(),
  );
  const [termTranslations, setTermTranslations] = useState<
    Record<string, { [lang: string]: string }>
  >({});
  const [loadingTranslations, setLoadingTranslations] = useState<Set<string>>(
    new Set(),
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTerms, setTotalTerms] = useState(0);
  const [debouncedTermSearch, setDebouncedTermSearch] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const termsPerPage = 20;
  const exportPopupRef = useRef<HTMLDivElement>(null);

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
      console.log(
        'NAVIGATION STATE - Looking for glossary:',
        state.selectedGlossaryName,
      );
      const targetGlossary = glossaries.find(
        (g) => g.name === state.selectedGlossaryName,
      );
      if (targetGlossary) {
        console.log(
          'NAVIGATION STATE - Found glossary, selecting:',
          targetGlossary,
        );
        setSelectedGlossary(targetGlossary);
        // Clear the navigation state to prevent re-selection on subsequent renders
        window.history.replaceState(null, '', location.pathname);
      }
    }
  }, [location.state, location.pathname, glossaries]);

  // Handle URL parameter for direct category navigation
  useEffect(() => {
    if (category && glossaries.length > 0) {
      console.log('URL PARAMETER - Looking for glossary:', category);

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
        console.log(
          'URL PARAMETER - Found glossary, selecting:',
          targetGlossary,
        );
        setSelectedGlossary(targetGlossary);
      } else {
        console.log(
          'URL PARAMETER - No matching glossary found for:',
          category,
        );
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
        console.log(
          `Glossary ${selectedGlossary.name} bookmark status: ${isCurrentGlossaryBookmarked.toString()}`,
        );
        console.log(`All bookmarked glossaries:`, bookmarkedGlossaryNames);
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
    console.log('🚀 [NUCLEAR DEBUG] BOOKMARK HANDLER CALLED!');
    console.log('🚀 [NUCLEAR DEBUG] Glossary to bookmark:', glossary);

    if (!glossary) {
      console.log('❌ [NUCLEAR DEBUG] No glossary provided!');
      showError('No glossary selected!');
      return false;
    }

    const token = localStorage.getItem('accessToken');
    console.log('🔑 [NUCLEAR DEBUG] Token exists:', !!token);

    if (!token) {
      console.log('❌ [NUCLEAR DEBUG] No token found!');
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
      console.log(
        `🎯 [NUCLEAR DEBUG] Current bookmark state for ${glossary.name}: ${currentlyBookmarked ? 'BOOKMARKED' : 'NOT BOOKMARKED'}`,
      );

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
        showError('Bookmark operation failed');
      }

      return success;
    } catch (error) {
      console.error('Error during bookmark operation:', error);
      showError('Bookmark operation failed');

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

  // Filter terms based on search (now handled by API, but kept for fallback)
  const filteredTerms = terms;

  // Filter glossaries based on search
  const filteredGlossaries = glossaries.filter((g) =>
    g.name.toLowerCase().includes(glossarySearch.toLowerCase()),
  );

  // Helper function to fetch translations for a specific term
  const fetchTranslationsForTerm = async (
    termId: string,
  ): Promise<{ [lang: string]: string }> => {
    try {
      setLoadingTranslations((prev) => new Set(prev).add(termId));

      const response = await cachingService.getTermTranslations(termId);
      return response.data;
    } catch (error) {
      console.error(`Error fetching translations for term ${termId}:`, error);
      return {};
    } finally {
      setLoadingTranslations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(termId);
        return newSet;
      });
    }
  };

  // Helper function to get all terms for export
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
    } catch (error) {
      console.error('Advanced search failed, trying fallback:', error);
    }

    // Fallback to original endpoint to get all terms
    try {
      const fallbackResponse = await fetch(
        API_ENDPOINTS.glossaryTermsByCategory(selectedGlossary.name),
      );
      if (fallbackResponse.ok) {
        const fallbackData = (await fallbackResponse.json()) as Term[];

        // Apply language filter if selected
        if (selectedLanguages.length > 0) {
          return fallbackData.filter(
            (term) =>
              term.language && selectedLanguages.includes(term.language),
          );
        }

        return fallbackData;
      }
    } catch (error) {
      console.error('Failed to fetch all terms for export:', error);
    }

    // Last resort: return current page data
    return filteredTerms;
  };

  return (
    <div
      className={`dashboard-container${isMobileMenuOpen ? ' mobile-menu-is-open' : ''} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
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
          <span>You're offline - showing cached data</span>
        </div>
      )}

      {/* Cache Status Indicator */}
      {fromCache && networkStatus.isOnline && (
        <div
          style={{
            position: 'fixed',
            top: networkStatus.isOffline ? '48px' : '0',
            left: 0,
            right: 0,
            background: '#3b82f6',
            color: 'white',
            padding: '0.5rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <Database size={14} />
          <span>Data loaded from cache</span>
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
        className="main-content"
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
        <div className="glossary-content">
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
                  // Navigate back to main glossary page and update URL
                  void navigate('/glossary');
                }}
              />

              <div
                className="glossary-search"
                style={{
                  marginBottom: '2rem',
                  position: 'relative',
                  width: '100%',
                  margin: '1.5rem auto 2.5rem auto',
                }}
              >
                <Search
                  className="glossary-search-icon"
                  style={{
                    position: 'absolute',
                    left: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-theme)',
                    opacity: 0.6,
                    width: 16,
                    height: 16,
                  }}
                />
                <input
                  className="glossary-search-input"
                  type="text"
                  placeholder="Search terms..."
                  value={termSearch}
                  onChange={(e) => {
                    setTermSearch(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.7rem 0.75rem 1.7rem',
                    border: '1px solid var(--glossary-border-color)',
                    borderRadius: '0.5rem',
                    outline: 'none',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease-in-out',
                    background: 'var(--bg-tir)',
                    color: 'var(--text-theme)',
                  }}
                  autoComplete="off"
                />
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
                    Filter by Language
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
                    {showLanguageFilter ? 'Hide' : 'Show'}
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
                      All Languages
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
                    <span>Active filter:</span>
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
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div className="terms-list">
                {loading ? (
                  <div className="terms-list-message">Loading terms...</div>
                ) : terms.length === 0 ? (
                  <div className="terms-list-message">
                    No terms found for this glossary.
                  </div>
                ) : filteredTerms.length === 0 ? (
                  <div className="terms-list-message">
                    No terms match your search.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem',
                    }}
                  >
                    {filteredTerms.map((term) => {
                      const isExpanded = expandedTermIds.has(term.id);
                      return (
                        <div
                          key={term.id}
                          style={{
                            display: 'flex',
                            maxWidth: 900,
                            margin: '0 auto',
                            width: '100%',
                          }}
                        >
                          <GlossaryTermCard
                            term={{
                              ...term,
                              translations:
                                termTranslations[term.id.toString()] ?? {},
                            }}
                            isExpanded={isExpanded}
                            isLoadingTranslations={loadingTranslations.has(
                              term.id.toString(),
                            )}
                            onToggleExpand={(id) => {
                              const termIdStr = id.toString();
                              setExpandedTermIds((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(id)) {
                                  newSet.delete(id);
                                } else {
                                  newSet.add(id);
                                  // Fetch translations when expanding if not already cached
                                  if (!(termIdStr in termTranslations)) {
                                    void fetchTranslationsForTerm(
                                      termIdStr,
                                    ).then((translations) => {
                                      setTermTranslations((prev) => ({
                                        ...prev,
                                        [termIdStr]: translations,
                                      }));
                                    });
                                  }
                                }
                                return newSet;
                              });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalTerms > termsPerPage && (
                <div className="pagination-controls flex justify-center space-x-4 p-4">
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
                    className="px-4 py-2 bg-theme rounded disabled:opacity-50"
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid var(--glossary-border-color)',
                      borderRadius: '0.375rem',
                      backgroundColor:
                        currentPage === 1
                          ? 'var(--glossary-border-color)'
                          : 'var(--bg-tir)',
                      color: 'var(--text-theme)',
                      cursor:
                        currentPage === 1 || loading
                          ? 'not-allowed'
                          : 'pointer',
                      opacity: currentPage === 1 || loading ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ color: 'var(--text-theme)' }}>
                    Page {currentPage} of {Math.ceil(totalTerms / termsPerPage)}
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
                    className="px-4 py-2 bg-theme rounded disabled:opacity-50"
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid var(--glossary-border-color)',
                      borderRadius: '0.375rem',
                      backgroundColor:
                        currentPage >= Math.ceil(totalTerms / termsPerPage)
                          ? 'var(--glossary-border-color)'
                          : 'var(--bg-tir)',
                      color: 'var(--text-theme)',
                      cursor:
                        currentPage >= Math.ceil(totalTerms / termsPerPage) ||
                        loading
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        currentPage >= Math.ceil(totalTerms / termsPerPage) ||
                        loading
                          ? 0.5
                          : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Next
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
            // Glossary List View
            <div className="glossary-list-container">
              <div
                className="glossary-search"
                style={{
                  marginBottom: '2rem',
                  position: 'relative',
                  width: '100%',
                  margin: '1.5rem auto 2.5rem auto',
                }}
              >
                <Search
                  className="glossary-search-icon"
                  style={{
                    position: 'absolute',
                    left: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-theme)',
                    opacity: 0.6,
                    width: 16,
                    height: 16,
                  }}
                />
                <input
                  className="glossary-search-input"
                  type="text"
                  placeholder="Search glossaries..."
                  value={glossarySearch}
                  onChange={(e) => {
                    setGlossarySearch(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.7rem 0.75rem 1.7rem',
                    border: '1px solid var(--glossary-border-color)',
                    borderRadius: '0.5rem',
                    outline: 'none',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease-in-out',
                    background: 'var(--bg-tir)',
                    color: 'var(--text-theme)',
                  }}
                  autoComplete="off"
                />
              </div>
              <div className="glossary-list">
                {loading ? (
                  <div
                    className="glossary-list-spinner"
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '180px',
                    }}
                  >
                    <span
                      className="spinner"
                      style={{ width: 48, height: 48, display: 'inline-block' }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: 48,
                          height: 48,
                          border: '6px solid #f2d001',
                          borderTop: '6px solid #e5e7eb',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                    </span>
                  </div>
                ) : glossaries.length === 0 ? (
                  <div className="glossary-list-message">
                    No glossaries found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredGlossaries.map((g) => (
                      <div key={g.id}>
                        <GlossaryCard
                          glossary={{
                            name: g.name,
                            description: g.description || '',
                            termCount: g.termCount ?? 0,
                          }}
                          isBookmarked={bookmarkedGlossaries.includes(g.name)}
                          onBookmark={() => {
                            void handleBookmarkGlossary(g);
                          }}
                          onExport={() => {
                            setSelectedGlossary(g);
                            setShowExportPopup(true);
                          }}
                          onView={() => {
                            setSelectedGlossary(g);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Data Popup Modal */}
          {showExportPopup && selectedGlossary && (
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
                    Export Data - {selectedGlossary.name}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                    }}
                    className="glossary-export-subtitle"
                  >
                    Download all terms from {selectedGlossary.name} in your
                    preferred format.
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
                      <div style={{ fontWeight: 600 }}>CSV Format</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        Spreadsheet compatible
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
                      <div style={{ fontWeight: 600 }}>JSON Format</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        Developer friendly
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
                      <div style={{ fontWeight: 600 }}>HTML Table</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        Web friendly
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
                        {isDownloading ? 'Generating PDF...' : 'PDF Format'}
                      </div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        Print friendly
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
