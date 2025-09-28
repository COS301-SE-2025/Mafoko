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
import { v4 as uuidv4 } from 'uuid';
import {
  addPendingCommentEdit,
  addPendingCommentDelete,
  PendingCommentEdit,
  PendingCommentDelete,
} from '../../utils/indexedDB';

export interface CommentItemProps {
  comment: Comment;
  onVote: (commentId: string, voteType: 'upvote' | 'downvote') => void;
  onReply: (parentCommentId: string) => void;
  onEdit: (commentId: string, newContent: string) => void;
  onDelete: (commentId: string) => void;
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

  const isOwner = currentUserId === comment?.user?.id;
  const itemClassName = comment.isReply ? 'comment-item reply' : 'comment-item';

  const handleUpvote = () => {
    if (!comment.isDeleted) {
      onVote(comment.id, 'upvote');
    }
  };

  const handleDownvote = () => {
    if (!comment.isDeleted) {
      onVote(comment.id, 'downvote');
    }
  };

  const handleReply = () => {
    if (!comment.isDeleted) {
      onReply(comment.id);
    }
  };

  const handleSaveEdit = async () => {
    if (editedContent.trim() === '' || editedContent === comment.content) {
      setIsEditing(false);
      setEditedContent(comment.content);
      return;
    }

    if (!navigator.onLine) {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const pendingEdit: PendingCommentEdit = {
        id: uuidv4(),
        comment_id: comment.id,
        content: editedContent,
        token,
      };
      await addPendingCommentEdit(pendingEdit);
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-comment-edits');
      onEdit(comment.id, editedContent);
      setIsEditing(false);
      return;
    }

    await onEdit(comment.id, editedContent);
    setIsEditing(false);
  };

  const handleConfirmDelete = async () => {
    if (!navigator.onLine) {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const pendingDelete: PendingCommentDelete = {
        id: uuidv4(),
        comment_id: comment.id,
        token,
      };
      await addPendingCommentDelete(pendingDelete);
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-comment-deletes');
      onDelete(comment.id);
      setShowDeleteConfirm(false);
      return;
    }

    await onDelete(comment.id);
    setShowDeleteConfirm(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(comment.content);
    setIsEditing(false);
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
        {!comment?.user?.avatar &&
          (comment?.user?.name?.charAt(20) ?? '?').toUpperCase()}
      </div>
      <div className="comment-main">
        <div className="comment-main-header">
          <span className="comment-user">
            {comment?.user?.name ?? 'Unknown User'}
          </span>
          <span className="comment-timestamp">{comment.timeAgo}</span>
        </div>

        {isEditing ? (
          <div className="edit-comment-container">
            <textarea
              className="edit-comment-textarea"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
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
              className={`vote-button ${comment.userVote === 'upvote' ? 'upvote-active' : ''}`}
              onClick={handleUpvote}
              aria-label="Upvote comment"
            >
              <UpArrowIcon />
            </button>
            <span className="vote-count">
              {comment.upvotes - comment.downvotes}
            </span>
            <button
              type="button"
              className={`vote-button ${comment.userVote === 'downvote' ? 'downvote-active' : ''}`}
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
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              >
                <DotsIcon />
              </button>
            )}
            {showOptionsMenu && isOwner && (
              <div className="options-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setShowOptionsMenu(false);
                  }}
                >
                  <EditIcon /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowOptionsMenu(false);
                  }}
                >
                  <DeleteIcon /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <button
            type="button"
            className="replies-toggle"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies
              ? `Hide ${comment.replies.length} Replies`
              : `View ${comment.replies.length} Replies`}
          </button>
        )}

        {showReplies && comment.replies && comment.replies.length > 0 && (
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
                onClick={() => setShowDeleteConfirm(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
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
