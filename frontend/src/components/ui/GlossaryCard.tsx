import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, Loader2, Download, FileType, X } from 'lucide-react';
import { useDarkMode } from './DarkModeComponent';
import { useGlossaryMap } from './glossaryMock';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { cachingService } from '../../utils/cachingService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { canBookmark } from '../../utils/userUtils';
import { useUser } from '../../hooks/useUser';
import { downloadData } from '../../utils/exportUtils';

interface Glossary {
  name: string;
  description: string;
  termCount: number;
}

interface GlossaryCardProps {
  glossary: Glossary;
  onView?: (glossary: Glossary) => void;
  onBookmark?: (glossary: Glossary, isBookmarked: boolean) => void;
  isBookmarked?: boolean;
}

// Define keyframe animations for smooth transitions
const fadeInKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const scaleInKeyframes = `
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

// Additional styles for portal container
const portalStyles = `
  #glossary-export-portal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
  }
  
  #glossary-export-portal .glossary-export-container {
    pointer-events: auto;
    isolation: isolate;
  }
`;

export default function GlossaryCard({
  glossary,
  onView,
  onBookmark,
  isBookmarked: initialBookmarked = false,
}: GlossaryCardProps) {
  const { t } = useTranslation();
  const glossaryMap = useGlossaryMap();
  // @ts-ignore
  const { icon: Icon, description } = glossaryMap[glossary.name] ?? {
    icon: null,
    description: glossary.description,
  };

  // Add keyframe animations and portal styles to document
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = fadeInKeyframes + scaleInKeyframes + portalStyles;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Create and manage portal container
  useEffect(() => {
    // Create portal container if it doesn't exist
    let container = document.getElementById('glossary-export-portal');

    if (!container) {
      container = document.createElement('div');
      container.id = 'glossary-export-portal';
      document.body.appendChild(container);
      setPortalNode(container);
    } else {
      setPortalNode(container);
    }

    return () => {
      // Don't remove the container on component unmount
      // as it might be used by other glossary cards
    };
  }, []);

  const { isDarkMode } = useDarkMode();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);
  const exportPopupRef = useRef<HTMLDivElement>(null);
  const networkStatus = useNetworkStatus();
  const { user } = useUser();

  // DOM node for portal rendering
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  // Close export popup when clicking outside or on escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportPopupRef.current &&
        !exportPopupRef.current.contains(event.target as Node)
      ) {
        setShowExportPopup(false);
      }
    }

    function handleEscKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowExportPopup(false);
      }
    }

    if (showExportPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showExportPopup]);

  // Control body scroll when export popup is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;

    if (showExportPopup) {
      // Prevent scrolling of the background when popup is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      // Restore original scrolling behavior when component unmounts or popup closes
      document.body.style.overflow = originalStyle;
    };
  }, [showExportPopup]);

  const handleBookmarkToggle = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();

    if (loading) return; // 🔒 Prevent concurrent toggles

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast(t('glossaryPage2.bookmarkError'), {
        description: t('glossaryPage2.loginError'),
      });
      return;
    }

    // Check if user can bookmark (not a guest)
    if (!canBookmark(user)) {
      toast('Bookmark not allowed', {
        description:
          'Please register to bookmark glossaries. Guests cannot save bookmarks.',
      });
      return;
    }

    if (networkStatus.isOffline) {
      toast(t('glossaryPage2.bookmarkError'), {
        description: t('glossaryPage2.connectionError'),
      });
      return;
    }

    setLoading(true);

    try {
      const currentlyBookmarked = isBookmarked;
      const action = currentlyBookmarked ? 'unbookmark' : 'bookmark';

      let success = false;
      if (currentlyBookmarked) {
        success = await cachingService.unbookmarkGlossary(token, glossary.name);
      } else {
        success = await cachingService.bookmarkGlossary(
          token,
          glossary.name,
          glossary.description,
        );
      }

      if (success) {
        setIsBookmarked(!currentlyBookmarked);

        // sync cross-tab
        localStorage.setItem('bookmarksChanged', Date.now().toString());
        window.dispatchEvent(
          new CustomEvent('bookmarkChanged', {
            detail: {
              type: 'glossary',
              action,
              name: glossary.name,
            },
          }),
        );

        onBookmark?.(glossary, !currentlyBookmarked);
      } else {
        toast(t('glossaryPage2.bookmarkError'), {
          description: t('glossaryPage2.bookmarkErrorDetails'),
        });
      }
    } catch (error) {
      console.error('Bookmark toggle failed:', error);
      toast(t('glossaryPage2.bookmarkError'), {
        description: t('glossaryPage2.bookmarkErrorDetails'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent card click when clicking export button
    setShowExportPopup(true);
  };

  const getAllTermsForExport = async () => {
    try {
      // Fetch all terms for this glossary
      const response = await cachingService.getGlossaryTerms(
        glossary.name,
        1,
        10000,
      );

      if (response && response.data && response.data.results) {
        const termsWithCategory = response.data.results.map((term: any) => ({
          ...term,
          id: String(term.id),
          category: glossary.name,
        }));
        return termsWithCategory;
      }

      // Return empty array if no terms found
      return [];
    } catch (error) {
      console.error('Failed to get terms for export:', error);
      toast.error(
        t('glossaryPage2.exportFailed', { defaultValue: 'Export failed' }),
        {
          description: t('glossaryPage2.termsRetrievalError', {
            defaultValue: 'Could not retrieve terms for this glossary',
          }),
        },
      );
      throw error; // Rethrow to be caught by the export handler
    }
  };

  return (
    <div
      className="relative cursor-pointer transition-transform duration-300 hover:-translate-y-1 group !bg-[var(--bg-tri)]"
      onClick={() => onView?.(glossary)}
    >
      <div
        className={`
          absolute -top-4 left-0 right-0 bottom-0 rounded-2xl
          transition-colors duration-300
          ${
            isDarkMode
              ? 'bg-teal-900/40 group-hover:bg-teal-800/60'
              : 'bg-teal-100 group-hover:bg-teal-200'
          }
          z-0
        `}
      />

      <div
        className={`
          relative z-10 rounded-2xl border shadow-md transition-all duration-300
          p-5 flex flex-col justify-between h-[220px]
          ${
            isDarkMode
              ? 'bg-[#212532FF] border-gray-800 group-hover:border-teal-300'
              : 'bg-white border-gray-200 group-hover:border-teal-300'
          }
        `}
        style={{ padding: '15px' }}
      >
        <div className="flex items-start justify-between mb-2 text-left">
          <div>
            <h3
              className={`text-lg font-semibold ${
                isDarkMode ? 'text-gray-50' : 'text-gray-900'
              }`}
            >
              {glossary.name}
            </h3>
            <p className="text-xs font-medium text-zinc-500">
              {glossary.termCount} {t('glossaryPage2.terms')}
            </p>
            <p className="text-xs font-medium text-zinc-500">
              {description || glossary.description}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              style={{
                backgroundColor: '#f00a50',
                width: '54px',
                height: '54px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: isExporting ? 'not-allowed' : 'pointer',
                opacity: isExporting ? 0.7 : 1,
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => {
                if (!isExporting)
                  e.currentTarget.style.backgroundColor = '#e00948';
              }}
              onMouseOut={(e) => {
                if (!isExporting)
                  e.currentTarget.style.backgroundColor = '#f00a50';
              }}
              title="Export glossary terms"
            >
              {isExporting ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              ) : (
                <Download className="text-white" size={48} strokeWidth={2.8} />
              )}
            </button>

            {/* Only show bookmark button for authenticated users (not guests) */}
            {canBookmark(user) && (
              <button
                onClick={handleBookmarkToggle}
                disabled={loading}
                style={{
                  backgroundColor: '#f2d001',
                  width: '54px',
                  height: '54px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => {
                  if (!loading)
                    e.currentTarget.style.backgroundColor = '#d9bb01';
                }}
                onMouseOut={(e) => {
                  if (!loading)
                    e.currentTarget.style.backgroundColor = '#f2d001';
                }}
                title={
                  isBookmarked ? 'Unbookmark glossary' : 'Bookmark glossary'
                }
              >
                {loading ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : (
                  <Bookmark
                    className="text-white"
                    size={48}
                    fill={isBookmarked ? '#fff' : 'none'}
                    strokeWidth={2.8}
                  />
                )}
              </button>
            )}
          </div>
        </div>

        <p
          className={`text-sm line-clamp-3 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          {glossary.description}
        </p>
      </div>

      {/* Export Data Popup Modal with fixed portal root for stability */}
      {/* Export Data Popup Modal - Using React Portal */}
      {showExportPopup &&
        portalNode &&
        createPortal(
          <div
            className="glossary-export-container"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999999, // Extremely high z-index
              pointerEvents: 'auto',
              isolation: 'isolate', // Creates a new stacking context
            }}
          >
            <div
              className="glossary-export-overlay"
              onClick={() => setShowExportPopup(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(2px)',
                zIndex: 1, // Higher than page content but lower than the modal
                animation: 'fadeIn 0.2s ease-out',
              }}
            />

            <div
              ref={exportPopupRef}
              className="glossary-export-popup"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                maxWidth: '28rem',
                width: '95%',
                margin: '0 auto',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                animation: 'scaleIn 0.3s ease-out',
                zIndex: 10, // Higher than the overlay
                isolation: 'isolate', // Creates a new stacking context
              }}
            >
              {/* Close button - Fixed position with consistent styling */}
              <button
                type="button"
                onClick={() => setShowExportPopup(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: isDarkMode ? '#94a3b8' : '#64748b',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'background-color 0.2s ease',
                  zIndex: 2,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(100, 116, 139, 0.2)'
                    : 'rgba(226, 232, 240, 0.8)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Close"
              >
                <X size={24} />
              </button>

              {/* Header - Fixed width and text alignment */}
              <div
                style={{
                  marginBottom: '1.5rem',
                  paddingRight: '2rem',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    margin: '0 0 0.5rem 0',
                    textAlign: 'center',
                    color: isDarkMode ? 'white' : '#1e293b',
                  }}
                >
                  {t('glossaryPage2.exportData', {
                    defaultValue: 'Export Data',
                  })}{' '}
                  - {glossary.name}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                    textAlign: 'center',
                  }}
                >
                  {t('glossaryPage2.exportMessage', {
                    defaultValue: 'Export data from',
                  })}{' '}
                  {glossary.name}{' '}
                  {t('glossaryPage2.exportMessage2', {
                    defaultValue: 'glossary in your preferred format.',
                  })}
                </p>
              </div>

              {/* Format Options - Fixed spacing with consistent styling */}
              <div
                style={{
                  display: 'grid',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                }}
              >
                <button
                  type="button"
                  onClick={async () => {
                    if (isExporting) return; // Prevent double clicks
                    setShowExportPopup(false);
                    try {
                      setIsExporting(true);
                      const terms = await getAllTermsForExport();
                      await downloadData(terms, 'csv', {}, glossary.name);
                      toast.success(
                        t('glossaryPage2.exportSuccess', {
                          defaultValue: 'Export successful',
                        }),
                        {
                          description: t('glossaryPage2.glossaryExported', {
                            defaultValue:
                              'Glossary has been exported successfully',
                          }),
                        },
                      );
                    } catch (error) {
                      console.error('CSV export failed:', error);
                      toast.error(
                        t('glossaryPage2.exportFailed', {
                          defaultValue: 'Export failed',
                        }),
                        {
                          description: t('glossaryPage2.exportErrorMessage', {
                            defaultValue: 'An error occurred during export',
                          }),
                        },
                      );
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${isDarkMode ? '#2d3748' : '#e2e8f0'}`,
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                  }}
                  disabled={isExporting}
                  onMouseOver={(e) => {
                    if (!isExporting) {
                      e.currentTarget.style.backgroundColor = isDarkMode
                        ? 'rgba(51, 65, 85, 0.5)'
                        : 'rgba(241, 245, 249, 0.8)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      color: '#1e40af',
                      width: '28px',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {isExporting ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <FileType size={24} />
                    )}
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    CSV {t('glossaryPage2.format', { defaultValue: 'Format' })}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (isExporting) return; // Prevent double clicks
                    setShowExportPopup(false);
                    try {
                      setIsExporting(true);
                      const terms = await getAllTermsForExport();
                      await downloadData(terms, 'json', {}, glossary.name);
                      toast.success(
                        t('glossaryPage2.exportSuccess', {
                          defaultValue: 'Export successful',
                        }),
                        {
                          description: t('glossaryPage2.glossaryExported', {
                            defaultValue:
                              'Glossary has been exported successfully',
                          }),
                        },
                      );
                    } catch (error) {
                      console.error('JSON export failed:', error);
                      toast.error(
                        t('glossaryPage2.exportFailed', {
                          defaultValue: 'Export failed',
                        }),
                        {
                          description: t('glossaryPage2.exportErrorMessage', {
                            defaultValue: 'An error occurred during export',
                          }),
                        },
                      );
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${isDarkMode ? '#2d3748' : '#e2e8f0'}`,
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                  }}
                  disabled={isExporting}
                  onMouseOver={(e) => {
                    if (!isExporting) {
                      e.currentTarget.style.backgroundColor = isDarkMode
                        ? 'rgba(51, 65, 85, 0.5)'
                        : 'rgba(241, 245, 249, 0.8)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      color: '#10b981',
                      width: '28px',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {isExporting ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <FileType size={24} />
                    )}
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    JSON {t('glossaryPage2.format', { defaultValue: 'Format' })}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (isExporting) return; // Prevent double clicks
                    setShowExportPopup(false);
                    try {
                      setIsExporting(true);
                      const terms = await getAllTermsForExport();
                      await downloadData(terms, 'html', {}, glossary.name);
                      toast.success(
                        t('glossaryPage2.exportSuccess', {
                          defaultValue: 'Export successful',
                        }),
                        {
                          description: t('glossaryPage2.glossaryExported', {
                            defaultValue:
                              'Glossary has been exported successfully',
                          }),
                        },
                      );
                    } catch (error) {
                      console.error('HTML export failed:', error);
                      toast.error(
                        t('glossaryPage2.exportFailed', {
                          defaultValue: 'Export failed',
                        }),
                        {
                          description: t('glossaryPage2.exportErrorMessage', {
                            defaultValue: 'An error occurred during export',
                          }),
                        },
                      );
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${isDarkMode ? '#2d3748' : '#e2e8f0'}`,
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                  }}
                  disabled={isExporting}
                  onMouseOver={(e) => {
                    if (!isExporting) {
                      e.currentTarget.style.backgroundColor = isDarkMode
                        ? 'rgba(51, 65, 85, 0.5)'
                        : 'rgba(241, 245, 249, 0.8)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      color: '#047857',
                      width: '28px',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {isExporting ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <FileType size={24} />
                    )}
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    HTML {t('glossaryPage2.format', { defaultValue: 'Format' })}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (isExporting) return; // Prevent double clicks
                    setShowExportPopup(false);
                    try {
                      setIsExporting(true);
                      const terms = await getAllTermsForExport();
                      await downloadData(terms, 'pdf', {}, glossary.name);
                      toast.success(
                        t('glossaryPage2.exportSuccess', {
                          defaultValue: 'Export successful',
                        }),
                        {
                          description: t('glossaryPage2.glossaryExported', {
                            defaultValue:
                              'Glossary has been exported successfully',
                          }),
                        },
                      );
                    } catch (error) {
                      console.error('PDF export failed:', error);
                      toast.error(
                        t('glossaryPage2.exportFailed', {
                          defaultValue: 'Export failed',
                        }),
                        {
                          description: t('glossaryPage2.exportErrorMessage', {
                            defaultValue: 'An error occurred during export',
                          }),
                        },
                      );
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${isDarkMode ? '#2d3748' : '#e2e8f0'}`,
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                  }}
                  disabled={isExporting}
                  onMouseOver={(e) => {
                    if (!isExporting) {
                      e.currentTarget.style.backgroundColor = isDarkMode
                        ? 'rgba(51, 65, 85, 0.5)'
                        : 'rgba(241, 245, 249, 0.8)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      color: '#dc2626',
                      width: '28px',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {isExporting ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <FileType size={24} />
                    )}
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    PDF {t('glossaryPage2.format', { defaultValue: 'Format' })}
                  </div>
                </button>
              </div>
            </div>
          </div>,
          portalNode,
        )}
    </div>
  );
}
