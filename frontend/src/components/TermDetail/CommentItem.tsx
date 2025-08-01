import React, { useState } from 'react';
import {
  CommentBubbleIcon,
  DotsIcon,
  UpArrowIcon,
  DownArrowIcon,
  EditIcon,
  DeleteIcon,
  SendIcon,
} from '../../components/Icons';
import { Comment } from '../../types/termDetailTypes';

export interface CommentItemProps {
  comment: Comment;
  onVote: (commentId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
  onReply: (parentCommentId: string) => void;
  onEdit: (commentId: string, newContent: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  currentUserId: string | null;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onVote,
  onReply,
  onEdit,
  onDelete,
  currentUserId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = currentUserId === comment.user.id;
  const itemClassName = comment.isReply ? 'comment-item reply' : 'comment-item';
  const currentUserVote = comment.userVote;
  const netVotes = comment.upvotes - comment.downvotes;

  const handleUpvote = () => {
    if (!comment.isDeleted) {
      void onVote(comment.id, 'upvote');
    }
  };

  const handleDownvote = () => {
    if (!comment.isDeleted) {
      void onVote(comment.id, 'downvote');
    }
  };

  const handleReply = () => {
    if (!comment.isDeleted) {
      onReply(comment.id);
    }
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const toggleOptionsMenu = () => {
    setShowOptionsMenu(!showOptionsMenu);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowOptionsMenu(false);
  };

  const handleSaveEdit = async () => {
    if (editedContent.trim() !== '' && editedContent !== comment.content) {
      await onEdit(comment.id, editedContent);
      setIsEditing(false);
    } else {
      setIsEditing(false);
      setEditedContent(comment.content);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
    setShowOptionsMenu(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(comment.content);
    setIsEditing(false);
  };

  const handleConfirmDelete = () => {
    void onDelete(comment.id);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (comment.isDeleted) {
    return (
      <div className={itemClassName}>
        <div className="comment-main">
          <p className="deleted-comment-content">[This comment was deleted]</p>
        </div>
      </div>
    );
  }

  return (
    <div className={itemClassName}>
      <div
        className="comment-avatar"
        style={{
          backgroundImage: comment.user.avatar
            ? `url(${comment.user.avatar})`
            : 'none',
        }}
      >
        {!comment.user.avatar && comment.user.name.charAt(0).toUpperCase()}
      </div>
      <div className="comment-main">
        <div className="comment-main-header">
          <span className="comment-user">{comment.user.name}</span>
          <span className="comment-timestamp">{comment.timeAgo}</span>
        </div>

        {isEditing ? (
          <div className="edit-comment-container">
            <textarea
              className="edit-comment-textarea"
              value={editedContent}
              onChange={(e) => {
                setEditedContent(e.target.value);
              }}
            />
            <div className="edit-actions">
              <button type="button" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button type="button" onClick={() => void handleSaveEdit()}>
                <SendIcon />
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-content">{comment.content}</p>
        )}

        <div className="comment-actions">
          <button
            type="button"
            className="action-button"
            aria-label="Reply"
            onClick={handleReply}
          >
            <CommentBubbleIcon />
          </button>

          <div className="vote-container">
            <button
              type="button"
              className={`vote-button ${currentUserVote === 'upvote' ? 'upvote-active' : ''}`}
              onClick={handleUpvote}
              aria-label="Upvote comment"
            >
              <UpArrowIcon />
            </button>
            <span className="vote-count">{netVotes}</span>
            <button
              type="button"
              className={`vote-button ${currentUserVote === 'downvote' ? 'downvote-active' : ''}`}
              onClick={handleDownvote}
              aria-label="Downvote comment"
            >
              <DownArrowIcon />
            </button>
          </div>

          <div className="options-menu-container">
            {isOwner && (
              <button
                type="button"
                className="action-button"
                aria-label="More options"
                onClick={toggleOptionsMenu}
              >
                <DotsIcon />
              </button>
            )}
            {showOptionsMenu && isOwner && (
              <div className="options-dropdown">
                <button type="button" onClick={handleEdit}>
                  <EditIcon /> Edit
                </button>
                <button type="button" onClick={handleDelete}>
                  <DeleteIcon /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {comment.replies.length > 0 && (
          <button
            type="button"
            className="replies-toggle"
            onClick={toggleReplies}
          >
            {showReplies
              ? `Hide ${String(comment.replies.length)} Replies`
              : `View ${String(comment.replies.length)} Replies`}
          </button>
        )}

        {showReplies && comment.replies.length > 0 && (
          <div className="comment-replies">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onVote={onVote}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-popup">
          <div className="delete-confirm-content">
            <p>Are you sure you want to delete this comment?</p>
            <div className="delete-confirm-actions">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
