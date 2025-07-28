import React from 'react';
import {
  CommentBubbleIcon,
  DotsIcon,
  UpArrowIcon,
  DownArrowIcon,
} from '../../components/Icons';
import { Comment } from '../../types/termDetailTypes';

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const itemClassName = comment.isReply ? 'comment-item reply' : 'comment-item';
  const [userVote, setUserVote] = React.useState<'up' | 'down' | null>(null);
  const [currentVotes, setCurrentVotes] = React.useState(comment.votes);

  const handleUpvote = () => {
    if (userVote === 'up') {
      setUserVote(null);
      setCurrentVotes((prev) => prev - 1);
    } else {
      setUserVote('up');
      setCurrentVotes((prev) => prev + (userVote === 'down' ? 2 : 1));
    }
  };

  const handleDownvote = () => {
    if (userVote === 'down') {
      setUserVote(null);
      setCurrentVotes((prev) => prev + 1);
    } else {
      setUserVote('down');
      setCurrentVotes((prev) => prev - (userVote === 'up' ? 2 : 1));
    }
  };

  return (
    <div className={itemClassName}>
      <div className="comment-avatar" />
      <div className="comment-main">
        <div className="comment-main-header">
          <span className="comment-user-name">{comment.user.name}</span>
          <span className="comment-time-ago">{comment.timeAgo}</span>
        </div>
        <p className="comment-content">{comment.content}</p>
        <div className="comment-actions">
          <button type="button" className="action-button" aria-label="Reply">
            <CommentBubbleIcon />
          </button>

          <div className="vote-container">
            <button
              type="button"
              className={`vote-button ${userVote === 'up' ? 'upvote-active' : ''}`}
              onClick={handleUpvote}
              aria-label="Upvote comment"
            >
              <UpArrowIcon />
            </button>
            <span className="vote-count">{currentVotes}</span>
            <button
              type="button"
              className={`vote-button ${userVote === 'down' ? 'downvote-active' : ''}`}
              onClick={handleDownvote}
              aria-label="Downvote comment"
            >
              <DownArrowIcon />
            </button>
          </div>

          <button
            type="button"
            className="action-button"
            aria-label="More options"
          >
            <DotsIcon />
          </button>
        </div>
      </div>
    </div>
  );
};
