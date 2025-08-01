import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CommentItem } from '../components/TermDetail/CommentItem';
import { Comment, TermDetail } from '../types/termDetailTypes';
import '../styles/TermDetailPage.scss';
import {
  BackArrowIcon,
  BookmarkIcon,
  DotsIcon,
  SendIcon,
  ShareIcon,
  SuggestEditArrowIcon,
  UpArrowIcon,
  DownArrowIcon,
} from '../components/Icons';
import Navbar from '../components/ui/Navbar';
import LeftNav from '../components/ui/LeftNav';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import { API_ENDPOINTS } from '../config';

interface BackendComment {
  id: string;
  term_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  is_deleted: boolean;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic_url: string | null;
  };
  upvotes: number;
  downvotes: number;
  user_vote: 'upvote' | 'downvote' | null;
  replies: BackendComment[];
}

interface UserData {
  uuid: string;
}

const mapBackendCommentToFrontend = (
  backendComment: BackendComment,
): Comment => {
  return {
    id: backendComment.id,
    user: {
      id: backendComment.user.id || backendComment.user_id,
      name: `${backendComment.user.first_name} ${backendComment.user.last_name}`,
      avatar: backendComment.user.profile_pic_url || undefined,
    },
    content: backendComment.content,
    timeAgo: new Date(backendComment.created_at).toLocaleString(),
    votes: backendComment.upvotes - backendComment.downvotes,
    upvotes: backendComment.upvotes,
    downvotes: backendComment.downvotes,
    userVote: backendComment.user_vote,
    isReply: !!backendComment.parent_id,
    replies: backendComment.replies.map(mapBackendCommentToFrontend),
    isDeleted: backendComment.is_deleted,
  };
};

export const TermDetailPage: React.FC = () => {
  const { termId } = useParams<{ termId: string }>();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { isDarkMode } = useDarkMode();
  const [activeMenuItem] = useState('terms');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [errorComments, setErrorComments] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null,
  );
  const [authToken, setAuthToken] = useState<string | null>(null);

  const commentInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setAuthToken(token);

    const storedUserDataString = localStorage.getItem('userData');
    if (storedUserDataString) {
      try {
        const parsedData: unknown = JSON.parse(storedUserDataString);
        if (
          parsedData &&
          typeof parsedData === 'object' &&
          'uuid' in parsedData &&
          typeof (parsedData as UserData).uuid === 'string'
        ) {
          setCurrentUserId((parsedData as UserData).uuid);
        } else {
          console.error(
            'User data from localStorage is not in the expected format.',
          );
          localStorage.removeItem('userData');
        }
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
        localStorage.removeItem('userData');
      }
    } else {
      setCurrentUserId(null);
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        commentInputRef.current &&
        !commentInputRef.current.contains(event.target as Node)
      ) {
        setReplyingToCommentId(null);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBack = () => {
    void navigate(-1);
  };

  const [term] = useState<TermDetail>({
    id: termId || '1',
    term: 'Afsetpunt',
    translation: 'Outlet',
    definition:
      'A place of business for retailing goods / services. Examples: shop, market, service establishment, or other place, where goods and / or services are sold.',
    partOfSpeech: 'Noun',
    source: 'AI generated',
    example: 'Die ontwerperswinkel verkoop goedere teen afslagpryse.',
    relatedTerms: [
      { id: '2', term: 'Netto wins' },
      { id: '3', term: 'Netto verlies' },
      { id: '4', term: 'nyerheidsgebied' },
    ],
  });

  const fetchComments = useCallback(async () => {
    if (!termId) return;
    if (!authToken) {
      setErrorComments('Authentication required to load comments.');
      setLoadingComments(false);
      return;
    }

    setLoadingComments(true);
    setErrorComments(null);
    try {
      const response = await fetch(API_ENDPOINTS.getComments(termId), {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('accessToken');
          setErrorComments(
            'Session expired or unauthorized. Please log in again.',
          );
        }
        throw new Error(`HTTP error! status: ${String(response.status)}`);
      }
      const data = (await response.json()) as BackendComment[];
      setComments(data.map(mapBackendCommentToFrontend));
    } catch (error) {
      console.error('Error fetching comments:', error);
      if (
        !(
          error instanceof Error &&
          (error.message.includes('401') || error.message.includes('403'))
        )
      ) {
        setErrorComments('Failed to load comments. Please try again.');
      }
    } finally {
      setLoadingComments(false);
    }
  }, [termId, authToken]);

  useEffect(() => {
    if (authToken) {
      void fetchComments();
    }
  }, [fetchComments, authToken]);

  const handleAddComment = async (parentCommentId: string | null = null) => {
    if (!newComment.trim() || !termId) return;
    if (!authToken) {
      setErrorComments('Authentication required to add comments.');
      return;
    }

    try {
      const payload = {
        term_id: termId,
        content: newComment,
        parent_id: parentCommentId,
      };

      const response = await fetch(API_ENDPOINTS.postComment, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('accessToken');
          setErrorComments(
            'Session expired or unauthorized. Please log in again to add comments.',
          );
        }
        throw new Error(`HTTP error! status: ${String(response.status)}`);
      }

      await fetchComments();
      setNewComment('');
      setReplyingToCommentId(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      if (
        !(
          error instanceof Error &&
          (error.message.includes('401') || error.message.includes('403'))
        )
      ) {
        setErrorComments('Failed to add comment. Please try again.');
      }
    }
  };

  const handleVoteComment = async (
    commentId: string,
    voteType: 'upvote' | 'downvote',
  ) => {
    if (!authToken) {
      setErrorComments('Authentication required to vote.');
      return;
    }

    try {
      const payload = {
        comment_id: commentId,
        vote: voteType,
      };

      const response = await fetch(API_ENDPOINTS.voteOnComment, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('accessToken');
          setErrorComments(
            'Session expired or unauthorized. Please log in again to vote.',
          );
        }
        throw new Error(`HTTP error! status: ${String(response.status)}`);
      }

      await fetchComments();
    } catch (error) {
      console.error('Error voting on comment:', error);
      if (
        !(
          error instanceof Error &&
          (error.message.includes('401') || error.message.includes('403'))
        )
      ) {
        setErrorComments('Failed to cast vote. Please try again.');
      }
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!authToken) {
      setErrorComments('Authentication required to edit comments.');
      return;
    }
    try {
      const payload = {
        content: newContent,
      };
      const response = await fetch(API_ENDPOINTS.editComment(commentId), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('accessToken');
          setErrorComments(
            'Session expired or unauthorized. Please log in again to edit comments.',
          );
        } else if (response.status === 404) {
          setErrorComments('Comment not found.');
        } else {
          throw new Error(`HTTP error! status: ${String(response.status)}`);
        }
      }
      await fetchComments();
    } catch (error) {
      console.error('Error editing comment:', error);
      if (
        !(
          error instanceof Error &&
          (error.message.includes('401') || error.message.includes('403'))
        )
      ) {
        setErrorComments('Failed to edit comment. Please try again.');
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!authToken) {
      setErrorComments('Authentication required to delete comments.');
      return;
    }
    try {
      const response = await fetch(API_ENDPOINTS.deleteComment(commentId), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('accessToken');
          setErrorComments(
            'Session expired or unauthorized. Please log in again to delete comments.',
          );
        } else if (response.status === 404) {
          setErrorComments('Comment not found.');
        } else {
          throw new Error(`HTTP error! status: ${String(response.status)}`);
        }
      }
      await fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (
        !(
          error instanceof Error &&
          (error.message.includes('401') || error.message.includes('403'))
        )
      ) {
        setErrorComments('Failed to delete comment. Please try again.');
      }
    }
  };

  const handleReplyClick = useCallback((commentId: string): void => {
    setReplyingToCommentId(commentId);
    setNewComment('');
    const commentInput = document.querySelector('.add-comment input');
    if (commentInput) {
      (commentInput as HTMLInputElement).focus();
    }
  }, []);

  return (
    <div
      className={`term-page-fixed-background ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      <div className="term-page-container">
        {isMobile ? (
          <Navbar />
        ) : (
          <LeftNav activeItem={activeMenuItem} setActiveItem={() => {}} />
        )}
        <div className="main-content">
          <div
            className={`term-page ${isDarkMode ? 'term-page-dark' : 'term-page-light'}`}
          >
            <div className="top-bar">
              <button
                type="button"
                className="back-button"
                onClick={handleBack}
                aria-label="Go back"
              >
                <BackArrowIcon />
              </button>

              <div className="top-actions">
                {!isMobile && (
                  <div className="vote-actions">
                    <button
                      type="button"
                      className="vote-button"
                      aria-label="Upvote"
                    >
                      <UpArrowIcon />
                      <span className="vote-count">1.6k</span>
                    </button>
                    <button
                      type="button"
                      className="vote-button"
                      aria-label="Downvote"
                    >
                      <DownArrowIcon />
                      <span className="vote-count">5k</span>
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="action-button"
                  aria-label="Share"
                >
                  <ShareIcon />
                </button>
                <button
                  type="button"
                  className="action-button"
                  aria-label="More options"
                >
                  <DotsIcon />
                </button>
              </div>
            </div>

            <div className="term-header">
              <span className="category-tag">Business Enterprises</span>
              <h1 className="term-title">{term.term}</h1>
              <h2 className="term-translation">{term.translation}</h2>
            </div>

            <div className="content-container">
              <button
                type="button"
                className="bookmark-button"
                aria-label="Bookmark"
              >
                <BookmarkIcon />
              </button>

              <section className="term-section">
                <div className="term-meta">
                  <span className="part-of-speech">{term.partOfSpeech}</span>
                  <span className="source">{term.source}</span>
                </div>
                <p className="definition">{term.definition}</p>
              </section>

              <section className="term-section">
                <h3 className="section-title">Example Usage</h3>
                <p className="example">{term.example}</p>
                <span className="source">{term.source}</span>
              </section>

              <section className="term-section">
                <h3 className="section-title">Related Terms</h3>
                <div className="related-terms">
                  {term.relatedTerms.map((relatedTerm) => (
                    <span key={relatedTerm.id} className="related-term">
                      {relatedTerm.term}
                    </span>
                  ))}
                </div>
              </section>

              <section className="comments-section">
                <div className="comments-header">
                  <h3 className="section-title">Comments</h3>
                  <span className="comment-count">{comments.length}</span>
                </div>

                <div className="comments-list">
                  {loadingComments && <p>Loading comments...</p>}
                  {errorComments && (
                    <p className="error-message">{errorComments}</p>
                  )}
                  {!loadingComments && comments.length === 0 && (
                    <p>No comments yet. Be the first to comment!</p>
                  )}
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onVote={handleVoteComment}
                      onReply={handleReplyClick}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>

                <div className="add-comment" ref={commentInputRef}>
                  {replyingToCommentId && (
                    <div className="replying-to-info">
                      Replying to:{' '}
                      {comments.find((c) => c.id === replyingToCommentId)?.user
                        .name || 'comment'}
                    </div>
                  )}
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value);
                    }}
                    placeholder={
                      replyingToCommentId
                        ? 'Add a reply...'
                        : 'Add a comment....'
                    }
                    aria-label={
                      replyingToCommentId ? 'Add a reply' : 'Add a comment'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => void handleAddComment(replyingToCommentId)}
                    aria-label="Send comment"
                    className="send-comment-button"
                  >
                    <SendIcon />
                  </button>
                </div>
              </section>

              <footer className="page-footer">
                <button
                  type="button"
                  className="suggest-edit"
                  aria-label="Suggest an edit"
                >
                  Suggest an edit
                  <SuggestEditArrowIcon />
                </button>
              </footer>
            </div>

            {isMobile && (
              <div className="mobile-voting-section">
                <button
                  type="button"
                  className="vote-button"
                  aria-label="Upvote"
                >
                  <UpArrowIcon />
                  <span className="vote-count">1.6k</span>
                </button>
                <button
                  type="button"
                  className="vote-button"
                  aria-label="Downvote"
                >
                  <DownArrowIcon />
                  <span className="vote-count">5k</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
