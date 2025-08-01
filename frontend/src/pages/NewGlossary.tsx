import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config';
import { Search, Bookmark, Download, FileType } from 'lucide-react';
import GlossaryTermCard from '../components/ui/GlossaryTermCard';
import GlossaryCard from '../components/ui/GlossaryCard';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar.tsx';
import GlossaryHeader from '../components/ui/GlossaryHeader';
import { downloadData } from '../utils/exportUtils';
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
  const [glossarySearch, setGlossarySearch] = useState('');
  const [termSearch, setTermSearch] = useState('');
  const [glossaries, setGlossaries] = useState<Glossary[]>([]);
  const [selectedGlossary, setSelectedGlossary] = useState<Glossary | null>(
    null,
  );
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('glossary');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [bookmarkedCategory, setBookmarkedCategory] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [expandedTermIds, setExpandedTermIds] = useState<Set<number>>(
    new Set(),
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const exportPopupRef = useRef<HTMLDivElement>(null);

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
    const match = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(match.matches);
    const listener = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    match.addEventListener('change', listener);
    return () => {
      match.removeEventListener('change', listener);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    setLoading(true);
    fetch(API_ENDPOINTS.glossaryCategories)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
      })
      .then(async (data: unknown) => {
        if (
          Array.isArray(data) &&
          data.length &&
          typeof data[0] === 'object' &&
          data[0] !== null &&
          'name' in data[0]
        ) {
          setGlossaries(data as Glossary[]);
        } else {
          const categoryStrings = data as string[];
          const glossariesData: Glossary[] = await Promise.all(
            categoryStrings.map(async (cat: string, idx: number) => {
              try {
                const termsRes = await fetch(
                  API_ENDPOINTS.glossaryTermsByCategory(cat),
                );
                if (!termsRes.ok) throw new Error();
                const termsResponse: unknown = await termsRes.json();
                const terms: Term[] = termsResponse as Term[];
                const languages = Array.from(
                  new Set(
                    terms.flatMap((t) => Object.keys(t.translations || {})),
                  ),
                );
                return {
                  id: idx + 1,
                  name: cat,
                  description: '',
                  termCount: terms.length,
                  languages,
                };
              } catch {
                return {
                  id: idx + 1,
                  name: cat,
                  description: '',
                  termCount: 0,
                  languages: [],
                };
              }
            }),
          );
          setGlossaries(glossariesData);
        }
      })
      .catch(() => {
        setGlossaries([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedGlossary) return;
    setLoading(true);
    fetch(API_ENDPOINTS.glossaryTermsByCategory(selectedGlossary.name))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch terms');
        return res.json();
      })
      .then((data: unknown) => {
        const termsData = data as Term[];
        setTerms(
          termsData.map((term: Term) => ({
            ...term,
            translations: term.translations || {},
          })),
        );
      })
      .catch((err: unknown) => {
        console.error('Error fetching terms:', err);
        setTerms([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedGlossary]);

  // Filter terms based on search
  const filteredTerms = terms.filter(
    (term) =>
      term.term.toLowerCase().includes(termSearch.toLowerCase()) ||
      term.definition.toLowerCase().includes(termSearch.toLowerCase()),
  );

  // Filter glossaries based on search
  const filteredGlossaries = glossaries.filter((g) =>
    g.name.toLowerCase().includes(glossarySearch.toLowerCase()),
  );

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
                countText={`${String(filteredTerms.length)} of ${String(selectedGlossary.termCount || terms.length)} terms`}
                onBack={() => {
                  setSelectedGlossary(null);
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
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
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
                            maxWidth: 470,
                            margin: '0 auto',
                            width: '100%',
                          }}
                        >
                          <GlossaryTermCard
                            term={term}
                            isExpanded={isExpanded}
                            onToggleExpand={(id) => {
                              setExpandedTermIds((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(id)) {
                                  newSet.delete(id);
                                } else {
                                  newSet.add(id);
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
                    setBookmarkedCategory((prev) => !prev);
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
                          onBookmark={() => {
                            setBookmarkedCategory((prev) => !prev);
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
                    Download {filteredTerms.length} terms from{' '}
                    {selectedGlossary.name} in your preferred format.
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
                          const termsWithCategory = filteredTerms.map(
                            (term) => ({
                              ...term,
                              id: String(term.id),
                              category: selectedGlossary.name,
                            }),
                          );
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
                          const termsWithCategory = filteredTerms.map(
                            (term) => ({
                              ...term,
                              id: String(term.id),
                              category: selectedGlossary.name,
                            }),
                          );
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
                          const termsWithCategory = filteredTerms.map(
                            (term) => ({
                              ...term,
                              id: String(term.id),
                              category: selectedGlossary.name,
                            }),
                          );
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
                          const termsWithCategory = filteredTerms.map(
                            (term) => ({
                              ...term,
                              id: String(term.id),
                              category: selectedGlossary.name,
                            }),
                          );
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
    </div>
  );
};

export default GlossaryApp;
