import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import { Search, Bookmark, Download, FileType, Filter } from 'lucide-react';
import GlossaryTermCard from '../components/ui/GlossaryTermCard';
import GlossaryCard from '../components/ui/GlossaryCard';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar.tsx';
import GlossaryHeader from '../components/ui/GlossaryHeader';
import { downloadData } from '../utils/exportUtils';
import { useDarkMode } from '../components/ui/DarkModeComponent.tsx';
import { LANGUAGES } from '../types/search/types';
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
  const { category } = useParams<{ category?: string }>();
  const [glossarySearch, setGlossarySearch] = useState('');
  const [termSearch, setTermSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
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

  const showSuccess = (message: string) => {
    showNotification(message, 'success');
  };
  const showError = (message: string) => {
    showNotification(message, 'error');
  };
  // const showInfo = (message: string) => { showNotification(message, 'info'); };

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

      // Convert URL-friendly format back to proper case
      // e.g., "agriculture" -> "Agriculture", "general-demographics" -> "General Demographics"
      const categoryVariations = [
        category, // as-is from URL
        category.charAt(0).toUpperCase() + category.slice(1), // Capitalize first letter
        category.replace(/-/g, ' '), // Replace hyphens with spaces
        category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), // Title case
        category.toUpperCase(), // All uppercase
        category.toLowerCase(), // All lowercase
      ];

      // Try to find a matching glossary with any of the variations
      let targetGlossary = null;
      for (const variation of categoryVariations) {
        targetGlossary = glossaries.find(
          (g) => g.name.toLowerCase() === variation.toLowerCase(),
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

    // Use the new categories stats endpoint for faster loading
    fetch(API_ENDPOINTS.glossaryCategoriesStats)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch category stats');
        return res.json();
      })
      .then((data: Record<string, number>) => {
        // Convert the stats object to glossary array
        const glossariesData: Glossary[] = Object.entries(data).map(
          ([name, termCount], idx) => ({
            id: idx + 1,
            name,
            description: '',
            termCount,
            languages: [],
          }),
        );
        setGlossaries(glossariesData);
      })
      .catch(() => {
        // Fallback to original endpoint if stats endpoint fails
        fetch(API_ENDPOINTS.glossaryCategories)
          .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch categories');
            return res.json();
          })
          .then((data: unknown) => {
            if (
              Array.isArray(data) &&
              data.length &&
              typeof data[0] === 'object' &&
              data[0] !== null &&
              'name' in data[0]
            ) {
              setGlossaries(data as Glossary[]);
            } else {
              // Convert category strings to glossary objects quickly without fetching terms
              const categoryStrings = data as string[];
              const glossariesData: Glossary[] = categoryStrings.map(
                (cat: string, idx: number) => ({
                  id: idx + 1,
                  name: cat,
                  description: '',
                  termCount: undefined, // Will be loaded on demand when user clicks on glossary
                  languages: [],
                }),
              );
              setGlossaries(glossariesData);
            }
          })
          .catch(() => {
            setGlossaries([]);
          });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedGlossary) return;
    setLoading(true);

    // Use advanced search endpoint with pagination
    const searchParams = new URLSearchParams({
      domain: selectedGlossary.name,
      page: currentPage.toString(),
      limit: termsPerPage.toString(),
    });

    if (debouncedTermSearch.trim()) {
      searchParams.append('query', debouncedTermSearch.trim());
    }

    if (selectedLanguage && selectedLanguage !== '') {
      searchParams.append('language', selectedLanguage);
    }

    fetch(
      `${API_ENDPOINTS.glossaryAdvancedSearch}?${searchParams.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: selectedGlossary.name,
          query: debouncedTermSearch.trim() || undefined,
          language: selectedLanguage || undefined,
          page: currentPage,
          limit: termsPerPage,
        }),
      },
    )
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch terms');
        return res.json();
      })
      .then(
        (data: {
          results: Term[];
          total: number;
          page: number;
          pages: number;
        }) => {
          setTerms(
            data.results.map((term: Term) => ({
              ...term,
              translations: term.translations || {},
            })),
          );
          setTotalTerms(data.total);
        },
      )
      .catch((err: unknown) => {
        console.error('Error fetching terms:', err);
        // Fallback to original endpoint if advanced search fails
        fetch(API_ENDPOINTS.glossaryTermsByCategory(selectedGlossary.name))
          .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch terms');
            return res.json();
          })
          .then((data: unknown) => {
            const termsData = data as Term[];
            let filteredTerms = termsData.filter(
              (term) =>
                !debouncedTermSearch.trim() ||
                term.term
                  .toLowerCase()
                  .includes(debouncedTermSearch.toLowerCase()) ||
                term.definition
                  .toLowerCase()
                  .includes(debouncedTermSearch.toLowerCase()),
            );

            // Apply language filter if selected
            if (selectedLanguage && selectedLanguage !== '') {
              filteredTerms = filteredTerms.filter(
                (term) => term.language === selectedLanguage,
              );
            }

            const startIndex = (currentPage - 1) * termsPerPage;
            const endIndex = startIndex + termsPerPage;
            const paginatedTerms = filteredTerms.slice(startIndex, endIndex);

            setTerms(
              paginatedTerms.map((term: Term) => ({
                ...term,
                translations: term.translations || {},
              })),
            );
            setTotalTerms(filteredTerms.length);
          })
          .catch(() => {
            setTerms([]);
            setTotalTerms(0);
          });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedGlossary, currentPage, debouncedTermSearch, selectedLanguage]);

  // Reset page when glossary, search, or language filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGlossary, debouncedTermSearch, selectedLanguage]);

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
        // Fetch user's bookmarks to check if this glossary is bookmarked
        const response = await fetch(API_ENDPOINTS.getBookmarks, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const bookmarksData = (await response.json()) as {
            glossaries?: Array<{ domain: string }>;
          };
          const bookmarkedGlossariesData = bookmarksData.glossaries || [];

          // Extract glossary names into a simple array
          const bookmarkedGlossaryNames: string[] =
            bookmarkedGlossariesData.map(
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
        } else {
          setBookmarkedCategory(false);
        }
      } catch (error) {
        console.error('Error checking bookmark status:', error);
        setBookmarkedCategory(false);
      }
    };

    void checkBookmarkStatus();
  }, [selectedGlossary]);

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

    try {
      // Check current bookmark status for this specific glossary
      // Use the bookmarkedGlossaries array to check if this glossary is already bookmarked
      const currentlyBookmarked = bookmarkedGlossaries.includes(glossary.name);
      console.log(
        `🎯 [NUCLEAR DEBUG] Current bookmark state for ${glossary.name}: ${currentlyBookmarked ? 'BOOKMARKED' : 'NOT BOOKMARKED'}`,
      );
      console.log(
        `🎯 [NUCLEAR DEBUG] Bookmarked glossaries list:`,
        bookmarkedGlossaries,
      );

      // Show immediate feedback
      console.log(
        `Starting ${currentlyBookmarked ? 'UNBOOKMARK' : 'BOOKMARK'} operation for: ${glossary.name}`,
      );

      // Update UI optimistically
      if (selectedGlossary?.name === glossary.name) {
        setBookmarkedCategory(!currentlyBookmarked);
      }

      if (currentlyBookmarked) {
        // Unbookmark the glossary
        const unbookmarkUrl = API_ENDPOINTS.unbookmarkGlossary(glossary.name);
        console.log(`🌐 [NUCLEAR DEBUG] UNBOOKMARK URL: ${unbookmarkUrl}`);

        const response = await fetch(unbookmarkUrl, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(
          `📡 [NUCLEAR DEBUG] UNBOOKMARK Response status: ${response.status.toString()}`,
        );
        const responseText = await response.text();
        console.log(
          `📡 [NUCLEAR DEBUG] UNBOOKMARK Response body: ${responseText}`,
        );

        if (!response.ok) {
          throw new Error(
            `Unbookmark failed: ${response.status.toString()} - ${responseText}`,
          );
        }

        console.log(
          `✅ [NUCLEAR DEBUG] Successfully unbookmarked glossary: ${glossary.name}`,
        );
        showSuccess(`Unbookmarked ${glossary.name}!`);

        // Update local bookmarked glossaries state
        setBookmarkedGlossaries((prev) =>
          prev.filter((name) => name !== glossary.name),
        );
      } else {
        // Bookmark the glossary
        const bookmarkUrl = API_ENDPOINTS.bookmarkGlossary;
        console.log(`🌐 [NUCLEAR DEBUG] BOOKMARK URL: ${bookmarkUrl}`);

        const requestBody = {
          domain: glossary.name,
          description: glossary.description,
        };
        console.log(`📤 [NUCLEAR DEBUG] BOOKMARK Request body:`, requestBody);

        const response = await fetch(bookmarkUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        console.log(
          `📡 [NUCLEAR DEBUG] BOOKMARK Response status: ${response.status.toString()}`,
        );
        const responseText = await response.text();
        console.log(
          `📡 [NUCLEAR DEBUG] BOOKMARK Response body: ${responseText}`,
        );

        if (!response.ok) {
          // Handle 409 conflict (already bookmarked) by treating it as success and updating UI
          if (response.status === 409) {
            console.log(
              `ℹ️ [NUCLEAR DEBUG] Glossary ${glossary.name} already bookmarked, updating UI state`,
            );
            showSuccess(`${glossary.name} is already bookmarked!`);

            // Update local state to reflect that it's bookmarked
            setBookmarkedGlossaries((prev) => {
              if (!prev.includes(glossary.name)) {
                return [...prev, glossary.name];
              }
              return prev;
            });

            // Update UI state
            if (selectedGlossary?.name === glossary.name) {
              setBookmarkedCategory(true);
            }
          } else {
            throw new Error(
              `Bookmark failed: ${response.status.toString()} - ${responseText}`,
            );
          }
        } else {
          console.log(
            `✅ [NUCLEAR DEBUG] Successfully bookmarked glossary: ${glossary.name}`,
          );
          showSuccess(`Bookmarked ${glossary.name}!`);

          // Update local bookmarked glossaries state
          setBookmarkedGlossaries((prev) => [...prev, glossary.name]);
        }
      }

      // Set timestamp and trigger events
      const timestamp = Date.now().toString();
      localStorage.setItem('bookmarksChanged', timestamp);
      console.log(
        `💾 [NUCLEAR DEBUG] Set bookmarksChanged flag to: ${timestamp}`,
      );

      window.dispatchEvent(
        new CustomEvent('bookmarkChanged', {
          detail: {
            type: 'glossary',
            action: currentlyBookmarked ? 'unbookmark' : 'bookmark',
            name: glossary.name,
          },
        }),
      );
      console.log(`📢 [NUCLEAR DEBUG] Dispatched bookmarkChanged event`);

      return true;
    } catch (error) {
      console.error(
        '💥 [NUCLEAR DEBUG] CATASTROPHIC ERROR during bookmark operation:',
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showError(`Bookmark operation failed: ${errorMessage}`);

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

      const response = await fetch(
        API_ENDPOINTS.glossaryTermTranslations(termId),
      );
      if (!response.ok) {
        console.warn(
          `Failed to fetch translations for term ${termId}:`,
          response.status,
        );
        return {};
      }

      const data = (await response.json()) as {
        translations?: { [lang: string]: string };
      };
      // Extract the translations object from the API response
      return data.translations ?? {};
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
      if (selectedLanguage && selectedLanguage !== '') {
        exportParams.append('language', selectedLanguage);
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
            language: selectedLanguage || undefined,
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
        if (selectedLanguage && selectedLanguage !== '') {
          return fallbackData.filter(
            (term) => term.language === selectedLanguage,
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

      <div className="main-content">
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
                countText={`${filteredTerms.length.toString()} of ${totalTerms.toString()} terms (Page ${currentPage.toString()} of ${Math.ceil(totalTerms / termsPerPage).toString()})${selectedLanguage ? ` - Filtered by ${selectedLanguage}` : ''}`}
                onBack={() => {
                  setSelectedGlossary(null);
                  setCurrentPage(1);
                  setTermSearch('');
                  setDebouncedTermSearch('');
                  setSelectedLanguage('');
                  setShowLanguageFilter(false);
                }}
              />

              <div
                className="glossary-search"
                style={{
                  marginBottom: '2rem',
                  position: 'relative',
                  width: '100%',
                  maxWidth: '1000px',
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
                  maxWidth: '1000px',
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
                        setSelectedLanguage('');
                      }}
                      className={`language-filter-option ${selectedLanguage === '' ? 'active' : ''}`}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid var(--glossary-border-color)',
                        borderRadius: '1.5rem',
                        background:
                          selectedLanguage === ''
                            ? 'var(--accent-color)'
                            : 'var(--card-background)',
                        color:
                          selectedLanguage === ''
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
                          setSelectedLanguage(language);
                        }}
                        className={`language-filter-option ${selectedLanguage === language ? 'active' : ''}`}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid var(--glossary-border-color)',
                          borderRadius: '1.5rem',
                          background:
                            selectedLanguage === language
                              ? 'var(--accent-color)'
                              : 'var(--card-background)',
                          color:
                            selectedLanguage === language
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
                {selectedLanguage && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      color: 'var(--text-theme)',
                      opacity: 0.8,
                    }}
                  >
                    <span>Active filter:</span>
                    <span
                      style={{
                        background: 'var(--accent-color)',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                      }}
                    >
                      {selectedLanguage}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLanguage('');
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
                  flexDirection: 'row',
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
                  maxWidth: '1000px',
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
                  <div className="glossary-list-message">
                    Loading glossaries...
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
