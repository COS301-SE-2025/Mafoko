import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Bookmark } from 'lucide-react';
import { API_ENDPOINTS } from '../../config';
import '../../styles/TermCard.scss';
import { addPendingVote } from '../../utils/indexedDB';

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
  domain: string;
  upvotes: number;
  downvotes: number;
  definition: string;
  isBookmarked?: boolean;
  onView?: () => void;
  onBookmarkChange?: (termId: string, isBookmarked: boolean) => void;
}

const langColorMap: Record<string, string> = {
  Afrikaans: 'blue',
  English: 'yellow',
  isiNdebele: 'pink',
  isiXhosa: 'green',
  isiZulu: 'green',
  Sesotho: 'yellow',
  Setswana: 'orange',
  siSwati: 'teal',
  Tshivenda: 'indigo',
  Xitsonga: 'lime',
  Sepedi: 'cyan',
};

const TermCard: React.FC<TermCardProps> = ({
  id,
  term,
  language,
  domain,
  upvotes: initialUpvotes,
  downvotes: initialDownvotes,
  definition,
  isBookmarked: initialIsBookmarked = false,
  onView,
  onBookmarkChange,
}) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('Please log in to vote.');
      return;
    }

    const previousVote = userVote;
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;
    const currentVoteType = voteType.replace('vote', '') as 'up' | 'down';

    // Optimistic UI Update
    if (userVote === currentVoteType) {
      setUserVote(null);
      if (currentVoteType === 'up') {
        setUpvotes((c) => c - 1);
      } else {
        setDownvotes((c) => c - 1);
      }
    } else {
      let newUpvotes = upvotes;
      let newDownvotes = downvotes;
      if (currentVoteType === 'up') {
        newUpvotes += 1;
        if (previousVote === 'down') newDownvotes -= 1;
      } else {
        newDownvotes += 1;
        if (previousVote === 'up') newUpvotes -= 1;
      }
      setUpvotes(newUpvotes);
      setDownvotes(newDownvotes);
      setUserVote(currentVoteType);
    }

    if (navigator.onLine) {
      try {
        const response = await fetch(API_ENDPOINTS.voteOnTerm, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ term_id: id, vote: voteType }),
        });
        if (!response.ok) throw new Error('Online vote submission failed');
        const result = (await response.json()) as VoteApiResponse;
        setUpvotes(result.upvotes);
        setDownvotes(result.downvotes);
        setUserVote(result.user_vote);
      } catch (error) {
        console.error('Error casting vote online:', error);
        // Revert optimistic UI update on failure
        setUserVote(previousVote);
        setUpvotes(previousUpvotes);
        setDownvotes(previousDownvotes);
      }
    } else {
      console.log('You are offline. Queuing authenticated vote.');
      try {
        await addPendingVote({
          id: new Date().toISOString(),
          term_id: id,
          vote: voteType,
          token: token,
        });

        // 2. Register the background sync task
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const swRegistration = await navigator.serviceWorker.ready;
          await swRegistration.sync.register('sync-votes');
        }
      } catch (dbError) {
        console.error('Could not queue vote in IndexedDB:', dbError);
        // Revert optimistic UI update on failure
        setUserVote(previousVote);
        setUpvotes(previousUpvotes);
        setDownvotes(previousDownvotes);
      }
    }
  };

  const handleBookmark = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('Please log in to bookmark terms.');
      return;
    }

    try {
      // Toggle bookmark state optimistically
      const wasBookmarked = isBookmarked;
      setIsBookmarked(!isBookmarked);

      if (wasBookmarked) {
        // Unbookmark the term
        const response = await fetch(API_ENDPOINTS.unbookmarkTerm(id), {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Unbookmark action failed');
        console.log(`Unbookmarked term: ${term}`);
      } else {
        // Bookmark the term
        const response = await fetch(API_ENDPOINTS.bookmarkTerm, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ term_id: id }),
        });
        if (!response.ok) throw new Error('Bookmark action failed');
        console.log(`Bookmarked term: ${term}`);
      }

      // Notify parent component of bookmark change
      onBookmarkChange?.(id, !isBookmarked);
    } catch (error) {
      console.error('Error bookmarking term:', error);
      // Revert optimistic update on failure
      setIsBookmarked(isBookmarked);
    }
  };

  return (
    <div className="term-card">
      <div className="term-header">
        <div className="term-left">
          <h3
            className="text-left font-bold text-lg truncate w-full term-title"
            title={term}
          >
            {term.length > 40 ? `${term.slice(0, 40)}...` : term}
          </h3>
          <div className="pills">
            <span className={`pill ${langColorMap[language] || 'gray'}`}>
              {language}
            </span>
            <span className="pill gray">
              {domain.length > 11 ? `${domain.slice(0, 11)}...` : domain}
            </span>
          </div>
        </div>
        <div className="term-socials">
          <button
            type="button"
            className={`social-button ${userVote === 'up' ? 'voted' : ''}`}
            onClick={() => void handleVote('upvote')}
            aria-label="Upvote"
          >
            <ThumbsUp size={20} className="icon" />
            <span className="count up">{upvotes}</span>
          </button>
          <button
            type="button"
            className={`social-button ${userVote === 'down' ? 'voted' : ''}`}
            onClick={() => void handleVote('downvote')}
            aria-label="Downvote"
          >
            <ThumbsDown size={20} className="icon" />
            <span className="count down">{downvotes}</span>
          </button>
          <button
            type="button"
            className={`social-button ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={() => {
              void handleBookmark();
            }}
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
      <p className="term-description" title={definition}>
        {definition.length > 80 ? `${definition.slice(0, 80)}...` : definition}
      </p>
      <button className="view-button" onClick={() => onView?.()} type="button">
        View
      </button>
    </div>
  );
};

export default TermCard;
