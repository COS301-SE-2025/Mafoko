// src/components/VotingSection.tsx
import { useState } from 'react';
import { API_ENDPOINTS } from '../../config';
import '../../styles/VotingSection.scss';

interface VotingSectionProps {
  termId: string;
}

interface VoteResponse {
  total: number;
  [key: string]: unknown;
}

export const VotingSection = ({ termId }: VotingSectionProps) => {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [voteCount, setVoteCount] = useState(0);

  const handleVote = async (voteType: 'up' | 'down') => {
    try {
      const response = await fetch(API_ENDPOINTS.submitVote, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id: termId,
          target_type: 'term',
          vote: voteType,
        }),
      });

      const data: VoteResponse = (await response.json()) as VoteResponse;
      setUserVote(voteType);
      setVoteCount(data.total);
    } catch (error) {
      console.error('Error submitting vote:', error);
      // Optionally handle the error in the UI
    }
  };

  return (
    <div className="voting-section">
      <button
        type="button"
        onClick={() => void handleVote('up')}
        className={`vote-btn upvote ${userVote === 'up' ? 'active' : ''}`}
      >
        👍 Upvote
      </button>
      <div className="vote-count">{voteCount}</div>
      <button
        type="button"
        onClick={() => void handleVote('down')}
        className={`vote-btn downvote ${userVote === 'down' ? 'active' : ''}`}
      >
        👎 Downvote
      </button>
    </div>
  );
};
