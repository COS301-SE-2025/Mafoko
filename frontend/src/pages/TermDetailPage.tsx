import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CommentItem } from '../components/TermDetail/CommentItem';
import { Comment } from '../types/termDetailTypes';
import '../styles/TermDetailPage.scss';
import { SendIcon, SuggestEditArrowIcon } from '../components/Icons';
import Navbar from '../components/ui/Navbar';
import LeftNav from '../components/ui/LeftNav';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import { API_ENDPOINTS } from '../config';
import { GamificationService } from '../utils/gamification';
import { Term } from '../types/terms/types.ts';
import '../styles/TermPage.scss';
import { ArrowUp, ArrowDown, Share2 } from 'lucide-react';
import { Badge } from '../components/ui/badge.tsx';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { LanguageClassMap, SearchResponseType } from '../types/search/types.ts';
import { v4 as uuidv4 } from 'uuid';
import {
  getTerm,
  getCommentsForTerm,
  addPendingComment,
  PendingComment,
  addPendingCommentVote,
  PendingCommentVote,
  addPendingCommentEdit,
  PendingCommentEdit,
  addPendingCommentDelete,
  PendingCommentDelete,
  addTerm,
  addCommentsForTerm,
  PendingVote,
  addPendingVote,
} from '../utils/indexedDB.ts';

const formatStatus = (status: string): string => {
  if (!status) return '';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface BackendComment {
  id: string;
  term_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  is_deleted: boolean;
  user?: {
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
  id: string;
}

const mapBackendCommentToFrontend = (
  backendComment: BackendComment,
): Comment => {
  const userName = backendComment.user
    ? `${backendComment.user.first_name} ${backendComment.user.last_name}`
    : 'Unknown User';
  const userId = backendComment.user?.id || backendComment.user_id || '';
  const userAvatar = backendComment.user?.profile_pic_url || undefined;
  const upvotes = backendComment.upvotes ?? 0;
  const downvotes = backendComment.downvotes ?? 0;
  const createdAt = backendComment.created_at || new Date().toISOString();
  return {
    id: backendComment.id,
    user: { id: userId, name: userName, avatar: userAvatar },
    content: backendComment.content,
    timeAgo: new Date(createdAt).toLocaleString(),
    votes: upvotes - downvotes,
    upvotes: upvotes,
    downvotes: downvotes,
    userVote: backendComment.user_vote,
    isReply: !!backendComment.parent_id,
    replies: backendComment.replies?.map(mapBackendCommentToFrontend) || [],
    isDeleted: backendComment.is_deleted,
  };
};

export const TermDetailPage: React.FC = () => {
  const {
    language,
    name,
    id: termId,
  } = useParams<{ language: string; name: string; id: string }>();
  const navigate = useNavigate();
  const [term, setTerm] = useState<Term | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedTerms, setRelatedTerms] = useState<Term[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { isDarkMode } = useDarkMode();
  const [activeMenuItem] = useState('terms');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null,
  );
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [downvotes, setDownvotes] = useState<number>(0);
  const [upvotes, setUpvotes] = useState<number>(0);
  const [userTermVote, setUserTermVote] = useState<
    'upvote' | 'downvote' | null
  >(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setAuthToken(token);
    const storedUserDataString = localStorage.getItem('userData');
    if (storedUserDataString) {
      try {
        const parsedData = JSON.parse(storedUserDataString) as UserData;
        setCurrentUserId(parsedData.id);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!termId) return;
      setIsLoading(true);
      setError(null);
      let localTerm: Term | undefined;
      try {
        localTerm = await getTerm(termId);
        if (localTerm) {
          const localComments = await getCommentsForTerm(termId);
          setTerm(localTerm);
          setComments(localComments);
          setUpvotes(localTerm.upvotes ?? 0);
          setDownvotes(localTerm.downvotes ?? 0);
          setUserTermVote(localTerm.user_vote || null);
        }
      } catch (dbError) {
        console.error('Failed to load from IndexedDB:', dbError);
      }
      if (isOffline) {
        if (!localTerm) {
          setError('This term is not available for offline viewing.');
        }
        setIsLoading(false);
        return;
      }
      try {
        const params = new URLSearchParams({
          query: name || '',
          language: language || '',
          page: '1',
          page_size: '1',
        });
        const termResponse = await fetch(
          `${API_ENDPOINTS.search}?${params.toString()}`,
        );
        if (!termResponse.ok)
          throw new Error('Network response was not ok for term details');
        const termData: SearchResponseType = await termResponse.json();
        const foundTerm =
          termData.items.find((t: Term) => t.id === termId) ||
          termData.items[0];
        if (foundTerm) {
          setTerm(foundTerm);
          setUpvotes(foundTerm.upvotes ?? 0);
          setDownvotes(foundTerm.downvotes ?? 0);
          setUserTermVote(foundTerm.user_vote || null);
          await addTerm(foundTerm);
          const relatedParams = new URLSearchParams({
            domain: foundTerm.domain,
            page_size: '4',
          });
          const relatedResponse = await fetch(
            `${API_ENDPOINTS.search}?${relatedParams.toString()}`,
          );
          if (relatedResponse.ok) {
            const relatedData: SearchResponseType =
              await relatedResponse.json();
            setRelatedTerms(
              relatedData.items.filter((t: Term) => t.id !== termId),
            );
          }
          if (authToken) {
            const commentsResponse = await fetch(
              API_ENDPOINTS.getComments(termId),
              { headers: { Authorization: `Bearer ${authToken}` } },
            );
            if (commentsResponse.ok) {
              const backendComments: BackendComment[] =
                await commentsResponse.json();
              const frontendComments = backendComments.map(
                mapBackendCommentToFrontend,
              );
              setComments(frontendComments);
              await addCommentsForTerm(termId, frontendComments);
            }
          }
        } else if (!localTerm) {
          setError('Term not found.');
        }
      } catch (fetchError) {
        if (!localTerm) {
          setError('Failed to fetch term. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, [termId, isOffline, authToken, name, language]);

  const createOptimisticComment = (
    text: string,
    parentId: string | null,
  ): Comment => {
    return {
      id: uuidv4(),
      user: { id: currentUserId || '', name: 'You', avatar: undefined },
      content: text,
      timeAgo: 'Just now',
      votes: 0,
      upvotes: 0,
      downvotes: 0,
      userVote: null,
      isReply: !!parentId,
      replies: [],
      isDeleted: false,
    };
  };

  const handleAddComment = async (parentCommentId: string | null = null) => {
    if (!newComment.trim() || !termId || !authToken) return;
    const optimisticComment = createOptimisticComment(
      newComment,
      parentCommentId,
    );
    const updatedComments = parentCommentId
      ? comments.map((c) =>
          c.id === parentCommentId
            ? { ...c, replies: [...c.replies, optimisticComment] }
            : c,
        )
      : [...comments, optimisticComment];
    setComments(updatedComments);
    await addCommentsForTerm(termId, updatedComments);
    setNewComment('');
    setReplyingToCommentId(null);
    if (isOffline) {
      const pendingComment: PendingComment = {
        id: optimisticComment.id,
        term_id: termId,
        text: newComment,
        parentId: parentCommentId,
        token: authToken,
      };
      await addPendingComment(pendingComment);
      const swRegistration = await navigator.serviceWorker.ready;
      await swRegistration.sync.register('sync-comment-actions');
      return;
    }
    try {
      const response = await fetch(API_ENDPOINTS.postComment, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term_id: termId,
          content: newComment,
          parent_id: parentCommentId,
          tempId: optimisticComment.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to post comment');
      const { newComment: savedComment } = await response.json();

      // Award XP in background - don't block the UI refresh
      if (currentUserId && savedComment.id) {
        Promise.resolve().then(async () => {
          try {
            await GamificationService.awardCommentXP(
              currentUserId,
              savedComment.id,
            );
          } catch (xpError) {
            console.warn('Failed to award XP for comment:', xpError);
            // XP failure doesn't affect the comment creation success
          }
        });
      }

      const finalComments = updatedComments.map((c) =>
        c.id === optimisticComment.id
          ? mapBackendCommentToFrontend(savedComment)
          : c,
      );
      setComments(finalComments);
      await addCommentsForTerm(termId, finalComments);
    } catch (error) {
      console.error('Failed to add comment:', error);
      setError('Failed to add comment.');
      setComments(comments);
      await addCommentsForTerm(termId, comments);
    }
  };

  const handleVoteComment = async (
    commentId: string,
    voteType: 'upvote' | 'downvote',
  ) => {
    if (!authToken || !termId) return;
    const originalComments = [...comments];
    const optimisticComments = comments.map((c) => {
      if (c.id === commentId) {
        let newUpvotes = c.upvotes;
        let newDownvotes = c.downvotes;
        const currentVote = c.userVote;
        if (currentVote === voteType) {
          voteType === 'upvote' ? newUpvotes-- : newDownvotes--;
          return {
            ...c,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            userVote: null,
            votes: newUpvotes - newDownvotes,
          };
        } else {
          voteType === 'upvote' ? newUpvotes++ : newDownvotes++;
          if (currentVote === 'upvote') newUpvotes--;
          if (currentVote === 'downvote') newDownvotes--;
          return {
            ...c,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            userVote: voteType,
            votes: newUpvotes - newDownvotes,
          };
        }
      }
      return c;
    });
    setComments(optimisticComments);
    await addCommentsForTerm(termId, optimisticComments);
    if (isOffline) {
      const pendingVote: PendingCommentVote = {
        id: uuidv4(),
        comment_id: commentId,
        vote: voteType,
        token: authToken,
      };
      await addPendingCommentVote(pendingVote);
      const swRegistration = await navigator.serviceWorker.ready;
      await swRegistration.sync.register('sync-comment-actions');
      return;
    }
    try {
      const response = await fetch(API_ENDPOINTS.voteOnComment, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment_id: commentId, vote: voteType }),
      });

      if (!response.ok) throw new Error('Vote failed');
      const serverUpdatedComment: BackendComment = await response.json();

      // Award XP in background - don't block the UI refresh
      if (voteType === 'upvote') {
        const comment = comments.find((c) => c.id === commentId);
        if (comment && comment.user.id) {
          Promise.resolve().then(async () => {
            try {
              await GamificationService.awardUpvoteXP(
                comment.user.id,
                commentId,
              );
            } catch (xpError) {
              console.warn('Failed to award XP for upvote:', xpError);
              // XP failure doesn't affect the vote success
            }
          });
        }
      }

      const finalComments = optimisticComments.map((c) =>
        c.id === commentId
          ? {
              ...c,
              upvotes: serverUpdatedComment.upvotes,
              downvotes: serverUpdatedComment.downvotes,
              userVote: serverUpdatedComment.user_vote,
              votes:
                serverUpdatedComment.upvotes - serverUpdatedComment.downvotes,
            }
          : c,
      );
      setComments(finalComments);
      await addCommentsForTerm(termId, finalComments);
    } catch (error) {
      setError('Failed to cast vote.');
      setComments(originalComments);
      await addCommentsForTerm(termId, originalComments);
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!authToken || !termId) return;
    const originalComments = [...comments];
    const updatedComments = comments.map((c) =>
      c.id === commentId ? { ...c, content: newContent } : c,
    );
    setComments(updatedComments);
    await addCommentsForTerm(termId, updatedComments);
    if (isOffline) {
      const pendingEdit: PendingCommentEdit = {
        id: uuidv4(),
        comment_id: commentId,
        content: newContent,
        token: authToken,
      };
      await addPendingCommentEdit(pendingEdit);
      const swRegistration = await navigator.serviceWorker.ready;
      await swRegistration.sync.register('sync-comment-actions');
      return;
    }
    try {
      const response = await fetch(API_ENDPOINTS.editComment(commentId), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });
      if (!response.ok) throw new Error('Edit failed');
    } catch (error) {
      setError('Failed to edit comment.');
      setComments(originalComments);
      await addCommentsForTerm(termId, originalComments);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!authToken || !termId) return;
    const originalComments = [...comments];
    const updatedComments = comments.filter((c) => c.id !== commentId);
    setComments(updatedComments);
    await addCommentsForTerm(termId, updatedComments);
    if (isOffline) {
      const pendingDelete: PendingCommentDelete = {
        id: uuidv4(),
        comment_id: commentId,
        token: authToken,
      };
      await addPendingCommentDelete(pendingDelete);
      const swRegistration = await navigator.serviceWorker.ready;
      await swRegistration.sync.register('sync-comment-actions');
      return;
    }
    try {
      const response = await fetch(API_ENDPOINTS.deleteComment(commentId), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Delete failed');
    } catch (error) {
      setError('Failed to delete comment.');
      setComments(originalComments);
      await addCommentsForTerm(termId, originalComments);
    }
  };

  const handleTermVote = async (voteType: 'upvote' | 'downvote') => {
    if (!authToken) {
      alert('Please log in to vote.');
      navigate('/login');
      return;
    }
    if (!termId || !term) return;
    const originalTerm = { ...term };
    const originalUserVote = userTermVote;
    let newUpvotes = upvotes;
    let newDownvotes = downvotes;
    let newUserVote: 'upvote' | 'downvote' | null = originalUserVote;
    if (originalUserVote === voteType) {
      newUserVote = null;
      voteType === 'upvote' ? newUpvotes-- : newDownvotes--;
    } else {
      newUserVote = voteType;
      voteType === 'upvote' ? newUpvotes++ : newDownvotes++;
      if (originalUserVote === 'upvote') newUpvotes--;
      if (originalUserVote === 'downvote') newDownvotes--;
    }
    const updatedTerm = {
      ...term,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      user_vote: newUserVote,
    };
    setUpvotes(newUpvotes);
    setDownvotes(newDownvotes);
    setUserTermVote(newUserVote);
    setTerm(updatedTerm);
    await addTerm(updatedTerm);
    if (isOffline) {
      const pendingVote: PendingVote = {
        id: uuidv4(),
        term_id: termId,
        vote: voteType,
        token: authToken,
      };
      await addPendingVote(pendingVote);
      const swRegistration = await navigator.serviceWorker.ready;
      await swRegistration.sync.register('sync-votes');
      return;
    }
    try {
      const response = await fetch(API_ENDPOINTS.voteOnTerm, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ term_id: termId, vote: voteType }),
      });
      if (!response.ok) throw new Error('Term vote failed');

      // The response is just the vote update, not the full term
      const voteUpdate = await response.json();

      const termWithOwner = term as Term & { owner_id?: string };
      if (
        voteType === 'upvote' &&
        termWithOwner.owner_id &&
        voteUpdate.user_vote === 'upvote'
      ) {
        Promise.resolve().then(async () => {
          try {
            await GamificationService.awardTermUpvoteXP(
              termWithOwner.owner_id!,
              termId,
            );
          } catch (xpError) {
            console.warn('Failed to award XP for term upvote:', xpError);
            // XP failure doesn't affect the vote success
          }
        });
      }

      // Create a new, complete term object by merging the update
      const newFinalTerm = {
        ...term,
        upvotes: voteUpdate.upvotes,
        downvotes: voteUpdate.downvotes,
        user_vote: voteUpdate.user_vote,
      };

      // Now, update the state and DB with the complete object
      setUpvotes(newFinalTerm.upvotes);
      setDownvotes(newFinalTerm.downvotes);
      setUserTermVote(newFinalTerm.user_vote || null);
      setTerm(newFinalTerm);
      await addTerm(newFinalTerm);
    } catch (error) {
      setError('Failed to cast vote on term.');
      setUpvotes(originalTerm.upvotes);
      setDownvotes(originalTerm.downvotes);
      setUserTermVote(originalUserVote);
      setTerm(originalTerm);
      await addTerm(originalTerm);
    }
  };

  const handleReplyClick = useCallback((commentId: string) => {
    setReplyingToCommentId(commentId);
    commentInputRef.current?.focus();
  }, []);

  const replyingToUser = comments.find((c) => c.id === replyingToCommentId)
    ?.user.name;
  const languageKey = term?.language
    ? term.language.charAt(0).toUpperCase() +
      term.language.slice(1).toLowerCase()
    : 'Default';
  const languageClass = LanguageClassMap[languageKey] ?? 'bg-rose-500';
  const statusClassMap: { [key: string]: string } = {
    Verified: 'bg-green-500 text-white',
    Pending: 'bg-yellow-500 text-white',
    Rejected: 'bg-red-500 text-white',
  };

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
            <div className="term-main-content min-h-0 min-w-0">
              {isLoading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="error-message">{error}</p>
              ) : term ? (
                <div className="min-h-screen term-page pt-16 w-full">
                  <div className="flex justify-between items-center w-full mb-4">
                    <button
                      type="button"
                      className="bg-theme rounded-md text-sm mb-4 text-theme justify-start h-10 w-20"
                      onClick={() => navigate(`/search`)}
                    >
                      Back
                    </button>
                    <div className="flex flex-row items-center gap-2">
                      <ArrowUp
                        onClick={() => handleTermVote('upvote')}
                        className={`cursor-pointer hover:text-teal-500 ${userTermVote === 'upvote' ? 'text-teal-400' : ''}`}
                      />
                      <span className="text-xs">{upvotes}</span>
                      <ArrowDown
                        onClick={() => handleTermVote('downvote')}
                        className={`cursor-pointer hover:text-teal-500 ${userTermVote === 'downvote' ? 'text-red-400' : ''}`}
                      />
                      <span className="text-xs">{downvotes}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Share2 className="cursor-pointer hover:text-rose-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigator.clipboard.writeText(
                                window.location.href,
                              )
                            }
                          >
                            Copy URL
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="term-conent w-full pb-3">
                    <Card className="w-full max-w-screen mx-auto bg-theme text-theme text-left">
                      <CardHeader>
                        <div className="flex flex-row items-start gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-accent text-sm"
                          >
                            {term.domain}
                          </Badge>
                          <Badge
                            variant="destructive"
                            className={`bg-accent text-sm ${languageClass} text-theme`}
                          >
                            {term.language}
                          </Badge>
                          {term.status && (
                            <Badge
                              variant="default"
                              className={`text-sm ${statusClassMap[term.status] || 'bg-gray-500 text-white'}`}
                            >
                              {formatStatus(term.status)}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-3xl md:text-4xl mt-4">
                          <h1 className="term-title">{term.term}</h1>
                        </CardTitle>
                        <div className="h-px bg-muted my-4 w-full" />
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <section>
                          <h3 className="font-semibold text-2xl mb-2">
                            Description
                          </h3>
                          <p className="text-sm leading-relaxed">
                            {term.definition}
                          </p>
                        </section>
                        <section>
                          {relatedTerms.length > 0 && (
                            <div>
                              <h3 className="font-semibold text-2xl mb-2">
                                Related Terms
                              </h3>
                              <div className="flex flex-wrap gap-2 text-3xl">
                                {relatedTerms.map((relatedTerm) => (
                                  <Badge
                                    key={relatedTerm.id}
                                    variant="outline"
                                    className="text-sm text-theme"
                                  >
                                    <Link
                                      to={`/term/${relatedTerm.language}/${relatedTerm.term}/${relatedTerm.id}`}
                                      className="!text-pink-600"
                                    >
                                      {relatedTerm.term}
                                    </Link>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </section>
                        <section className="comments-section">
                          <div className="comments-header">
                            <h3 className="section-title">Comments</h3>
                            <span className="comment-count">
                              {comments.length}
                            </span>
                          </div>
                          <div className="comments-list">
                            {comments
                              .filter((comment) => comment && comment.id)
                              .map((comment) => (
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
                          <div className="add-comment">
                            {replyingToCommentId && (
                              <div className="replying-to-info">
                                <span>Replying to {replyingToUser}</span>
                                <button
                                  onClick={() => setReplyingToCommentId(null)}
                                  className="cancel-reply-btn"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                            <input
                              ref={commentInputRef}
                              type="text"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder={
                                replyingToCommentId
                                  ? 'Add a reply...'
                                  : 'Add a comment....'
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleAddComment(replyingToCommentId)
                              }
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
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <p>Term not found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
