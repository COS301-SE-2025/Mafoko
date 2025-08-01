import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Bookmark } from 'lucide-react';
import { API_ENDPOINTS } from '../../config';
import { workspaceAPI } from '../../utils/workspaceAPI';
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
  onView?: () => void;
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
  onView,
}) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  // Check if term is bookmarked when component mounts
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return; // User not logged in

      try {
        const bookmarks = await workspaceAPI.bookmarks.terms.getAll();
        const isBookmarked = bookmarks.some(bookmark => bookmark.term_id === id);
        setBookmarked(isBookmarked);
      } catch (error) {
        // Silently fail if we can't check bookmark status
        console.debug('Could not check bookmark status:', error);
      }
    };

    void checkBookmarkStatus();
  }, [id]);

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
      if (bookmarked) {
        // Remove bookmark
        await workspaceAPI.bookmarks.terms.delete(id);
        setBookmarked(false);
        console.log('Term unbookmarked successfully');
      } else {
        // Add bookmark
        await workspaceAPI.bookmarks.terms.create({
          term_id: id,
          notes: '', // No initial notes
        });
        setBookmarked(true);
        console.log('Term bookmarked successfully');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Could show a toast notification here
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
            className="social-button"
            aria-label="Bookmark"
            onClick={() => void handleBookmark()}
          >
            <Bookmark
              size={20}
              className={`icon bookmark${bookmarked ? ' bookmarked' : ''}`}
              color={bookmarked ? undefined : undefined}
              fill={bookmarked ? 'currentColor' : 'none'}
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
