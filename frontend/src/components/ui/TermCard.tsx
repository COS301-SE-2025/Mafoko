import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Bookmark } from 'lucide-react';
import { API_ENDPOINTS } from '../../config';
import '../../styles/TermCard.scss';
import { addPendingVote } from '../../utils/indexedDB';
import { Link } from 'react-router-dom';
import { LanguageColorMap } from '../../types/search/types.ts';
import { GamificationService } from '../../utils/gamification';
import { useTranslation } from 'react-i18next';

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
          <span className="view-button">{t('view', { defaultValue: 'View' })}</span>
        </Link>
      </button>
    </div>
  );
};

export default TermCard;
