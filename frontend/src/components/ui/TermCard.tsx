import React, { useState, useRef, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  Download,
  X,
  Loader2,
  FileType,
} from 'lucide-react';
import { API_ENDPOINTS } from '../../config';
import '../../styles/TermCard.scss';
import { addPendingVote } from '../../utils/indexedDB';
import { Link } from 'react-router-dom';
import { LanguageColorMap } from '../../types/search/types.ts';
import { GamificationService } from '../../utils/gamification';
import { useTranslation } from 'react-i18next';
import { canBookmark } from '../../utils/userUtils';
import { useUser } from '../../hooks/useUser';
import { downloadData } from '../../utils/exportUtils';
import { toast } from 'sonner';
import { useDarkMode } from './DarkModeComponent';

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

interface VoteApiResponse {
  term_id: string;
  upvotes: number;
  downvotes: number;
  user_vote: 'up' | 'down' | null;
}

interface TermCardProps {
  id: string;
  term: string;
  language: string;
  domain: string | null;
  upvotes: number;
  downvotes: number;
  definition: string | null;
  owner_id?: string;
  isBookmarked?: boolean;
  onView?: () => void;
  onBookmarkChange?: (termId: string, isBookmarked: boolean) => void;
}

const TermCard: React.FC<TermCardProps> = ({
  id,
  term,
  language,
  domain,
  upvotes: initialUpvotes,
  downvotes: initialDownvotes,
  definition,
  owner_id,
  isBookmarked: initialIsBookmarked = false,
  onView,
  onBookmarkChange,
}) => {
  const { t } = useTranslation();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportPopupRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useDarkMode();
  const { user } = useUser();

  // Add keyframe animations to document
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = fadeInKeyframes + scaleInKeyframes;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Close export popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportPopupRef.current &&
        !exportPopupRef.current.contains(event.target as Node)
      ) {
        setShowExportPopup(false);
      }
    }

    if (showExportPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportPopup]);

  const safeDomain = domain || '';
  const safeDefinition = definition || '';

  const handleVote = async (voteType: 'up' | 'down') => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('Please log in to vote.');
      return;
    }

    const previousVote = userVote;
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;

    setUserVote((prevVote) => (prevVote === voteType ? null : voteType));
    if (voteType === 'up') {
      if (userVote === 'up') setUpvotes((c) => c - 1);
      else if (userVote === 'down') {
        setUpvotes((c) => c + 1);
        setDownvotes((c) => c - 1);
      } else setUpvotes((c) => c + 1);
    } else {
      if (userVote === 'down') setDownvotes((c) => c - 1);
      else if (userVote === 'up') {
        setDownvotes((c) => c + 1);
        setUpvotes((c) => c - 1);
      } else setDownvotes((c) => c + 1);
    }

    if (navigator.onLine) {
      try {
        const response = await fetch(API_ENDPOINTS.voteOnTerm, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ term_id: id, vote: `${voteType}vote` }),
        });
        if (!response.ok) throw new Error('Online vote submission failed');
        const result = (await response.json()) as VoteApiResponse;
        setUpvotes(result.upvotes);
        setDownvotes(result.downvotes);
        setUserVote(result.user_vote);

        if (voteType === 'up' && owner_id && result.user_vote === 'up') {
          Promise.resolve().then(async () => {
            try {
              await GamificationService.awardTermUpvoteXP(owner_id, id);
            } catch (xpError) {
              console.warn(
                'Failed to award XP for term upvote on search page:',
                xpError,
              );
              // XP failure doesn't affect the vote success
            }
          });
        }
      } catch (error) {
        console.error('Error casting vote online, reverting:', error);
        setUserVote(previousVote);
        setUpvotes(previousUpvotes);
        setDownvotes(previousDownvotes);
      }
    } else {
      console.log('You are offline. Queuing vote.');
      try {
        await addPendingVote({
          id: new Date().toISOString(),
          term_id: id,
          vote: `${voteType}vote` as 'upvote' | 'downvote',
          token,
        });

        if (voteType === 'up' && owner_id) {
          await GamificationService.awardTermUpvoteXP(owner_id, id);
        }

        const swRegistration = await navigator.serviceWorker.ready;
        await swRegistration.sync.register('sync-votes');
      } catch (dbError) {
        console.error('Could not queue vote, reverting:', dbError);
        setUserVote(previousVote);
        setUpvotes(previousUpvotes);
        setDownvotes(previousDownvotes);
      }
    }
  };

  const handleBookmark = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Check if user can bookmark (not a guest)
    if (!canBookmark(user)) {
      console.log(
        'Guests cannot bookmark terms. Please register to save bookmarks.',
      );
      return;
    }

    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);

    try {
      const endpoint = wasBookmarked
        ? API_ENDPOINTS.unbookmarkTerm(id)
        : API_ENDPOINTS.bookmarkTerm;
      const method = wasBookmarked ? 'DELETE' : 'POST';

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      if (!wasBookmarked) {
        options.body = JSON.stringify({ term_id: id });
      }

      const response = await fetch(endpoint, options);
      if (!response.ok) throw new Error('Bookmark action failed');

      onBookmarkChange?.(id, !wasBookmarked);
    } catch (error) {
      console.error('Error bookmarking term:', error);
      setIsBookmarked(wasBookmarked);
    }
  };

  const handleExport = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowExportPopup(true);
  };

  const exportTerm = async (format: 'csv' | 'json' | 'html' | 'pdf') => {
    try {
      setIsExporting(true);
      setShowExportPopup(false);

      const termData = [
        {
          id,
          term,
          definition,
          language,
          domain,
          category: domain || 'Uncategorized', // Adding category field to match Term type
        },
      ];

      await downloadData(termData as any, format, {}, `Term-${term}`);

      toast.success(t('glossaryPage2.exportSuccess') || 'Export successful', {
        description:
          t('glossaryPage2.termExported') ||
          'Term has been exported successfully',
      });
    } catch (error) {
      console.error(`${format.toUpperCase()} export failed:`, error);
      toast.error(t('glossaryPage2.exportFailed') || 'Export failed', {
        description:
          t('glossaryPage2.exportErrorMessage') ||
          'An error occurred during export',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="term-card !items-start">
      <div className="term-header">
        <div className="term-left">
          <h3
            className="text-left font-bold text-lg truncate w-full"
            title={term}
          >
            {term.length > 20 ? `${term.slice(0, 20)}...` : term}
          </h3>
        </div>
        <div className="pills">
          <span className={`pill ${LanguageColorMap[language] || 'gray'}`}>
            {language}
          </span>
          <span className="pill gray">
            {safeDomain.length > 11
              ? `${safeDomain.slice(0, 11)}...`
              : safeDomain}
          </span>
        </div>
        <div className="term-socials">
          <button
            type="button"
            className={`social-button ${userVote === 'up' ? 'voted' : ''}`}
            onClick={() => void handleVote('up')}
            aria-label="Upvote"
          >
            <ThumbsUp size={20} className="icon" />
            <span className="count up">{upvotes}</span>
          </button>
          <button
            type="button"
            className={`social-button ${userVote === 'down' ? 'voted' : ''}`}
            onClick={() => void handleVote('down')}
            aria-label="Downvote"
          >
            <ThumbsDown size={20} className="icon" />
            <span className="count down">{downvotes}</span>
          </button>
          {/* Only show bookmark button for authenticated users (not guests) */}
          {canBookmark(user) && (
            <button
              type="button"
              className={`social-button ${isBookmarked ? 'bookmarked' : ''}`}
              onClick={handleBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <Bookmark
                size={20}
                className={`icon ${isBookmarked ? 'bookmarked' : ''}`}
              />
            </button>
          )}
          <button
            type="button"
            className="social-button"
            onClick={handleExport}
            aria-label="Export"
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 size={20} className="icon animate-spin" />
            ) : (
              <Download size={20} className="icon" />
            )}
          </button>
          <button type="button" className="social-button" aria-label="Share">
            <Share2 size={20} className="icon share" />
          </button>
        </div>
      </div>
      <p className="term-description" title={safeDefinition}>
        {safeDefinition.length > 60
          ? `${safeDefinition.slice(0, 60)}...`
          : safeDefinition}
      </p>
      <button className="view-button" onClick={onView} type="button">
        <Link
          className="!text-theme"
          to={`/term/${encodeURIComponent(language)}/${encodeURIComponent(term)}/${id}`}
        >
          <span className="view-button">
            {t('view', { defaultValue: 'View' })}
          </span>
        </Link>
      </button>

      {/* Export Data Popup Modal - Fixed position to avoid jumping */}
      {showExportPopup && (
        <div
          className="term-export-overlay"
          onClick={() => setShowExportPopup(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(2px)',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            ref={exportPopupRef}
            className="term-export-popup"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              maxWidth: '28rem',
              width: '100%',
              margin: '0 auto',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
              animation: 'scaleIn 0.3s ease-out',
            }}
          >
            {/* Close button - Fixed position to avoid shifting */}
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
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'rgba(100, 116, 139, 0.2)'
                  : 'rgba(226, 232, 240, 0.8)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} />
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
                {t('glossaryPage2.exportData', { defaultValue: 'Export Data' })}{' '}
                - {term}
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
                  defaultValue: 'Export data for',
                })}{' '}
                "{term}"{' '}
                {t('glossaryPage2.exportMessage2', {
                  defaultValue: 'in your preferred format',
                })}
              </p>
            </div>

            {/* Format Options - Fixed spacing */}
            <div
              style={{
                display: 'grid',
                gap: '0.75rem',
                marginTop: '1.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => exportTerm('csv')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${isDarkMode ? '#2d3748' : '#e2e8f0'}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(51, 65, 85, 0.5)'
                    : 'rgba(241, 245, 249, 0.8)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ color: '#1e40af', width: '20px' }}>
                  <FileType size={20} />
                </div>
                <div style={{ fontWeight: 600 }}>
                  CSV {t('glossaryPage2.format', { defaultValue: 'Format' })}
                </div>
              </button>

              <button
                type="button"
                onClick={() => exportTerm('json')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${isDarkMode ? '#2d3748' : '#e2e8f0'}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(51, 65, 85, 0.5)'
                    : 'rgba(241, 245, 249, 0.8)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ color: '#10b981', width: '20px' }}>
                  <FileType size={20} />
                </div>
                <div style={{ fontWeight: 600 }}>
                  JSON {t('glossaryPage2.format', { defaultValue: 'Format' })}
                </div>
              </button>

              <button
                type="button"
                onClick={() => exportTerm('html')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${isDarkMode ? '#2d3748' : '#e2e8f0'}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(51, 65, 85, 0.5)'
                    : 'rgba(241, 245, 249, 0.8)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ color: '#047857', width: '20px' }}>
                  <FileType size={20} />
                </div>
                <div style={{ fontWeight: 600 }}>
                  HTML {t('glossaryPage2.format', { defaultValue: 'Format' })}
                </div>
              </button>

              <button
                type="button"
                onClick={() => exportTerm('pdf')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${isDarkMode ? '#2d3748' : '#e2e8f0'}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(51, 65, 85, 0.5)'
                    : 'rgba(241, 245, 249, 0.8)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ color: '#dc2626', width: '20px' }}>
                  <FileType size={20} />
                </div>
                <div style={{ fontWeight: 600 }}>
                  PDF {t('glossaryPage2.format', { defaultValue: 'Format' })}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermCard;
