import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import { API_ENDPOINTS } from '../../config';
import '../../styles/TermCard.scss';

// FIX 1: Define a type for the API response to avoid 'any'
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

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('Please log in to vote.');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.submitVote, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          term_id: id,
          vote: voteType,
        }),
      });

      if (!response.ok) {
        throw new Error('Vote submission failed');
      }

      // Use the type assertion here to fix all the 'any' errors
      const result = (await response.json()) as VoteApiResponse;
      setUpvotes(result.upvotes);
      setDownvotes(result.downvotes);
      setUserVote(result.user_vote);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error casting vote:', error.message);
      } else {
        console.error('An unknown error occurred while casting vote');
      }
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
            type="button" // FIX 3: Add explicit button type
            className={`social-button ${userVote === 'up' ? 'voted' : ''}`}
            // FIX 2: Use 'void' to correctly handle the promise in onClick
            onClick={() => void handleVote('upvote')}
            aria-label="Upvote"
          >
            <ThumbsUp size={20} className="icon" />
            <span className="count up">{upvotes}</span>
          </button>
          <button
            type="button" // FIX 3: Add explicit button type
            className={`social-button ${userVote === 'down' ? 'voted' : ''}`}
            onClick={() => void handleVote('downvote')}
            aria-label="Downvote"
          >
            <ThumbsDown size={20} className="icon" />
            <span className="count down">{downvotes}</span>
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
