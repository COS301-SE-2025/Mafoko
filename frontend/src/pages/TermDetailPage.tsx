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
import { getAllTerms } from '../utils/indexedDB.ts';

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
  const { language, name, id } = useParams<{
    language: string;
    name: string;
    id: string;
  }>();
  const termId = id;
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
  const [isLoading, setIsLoading] = useState(false);
  const [relatedTerms, setRelatedTerms] = useState<Term[]>([]);
  const [term, setTerm] = useState<Term | null>(null);

  const commentInputRef = useRef<HTMLDivElement>(null);

  const fetchTerm = useCallback(async (): Promise<SearchResponseType> => {
    const params = new URLSearchParams({
      query: String(name),
      language: String(language),
      sort_by: 'name',
      page: '1',
      page_size: '100',
      fuzzy: 'false',
    });
    const resp = await fetch(`${API_ENDPOINTS.search}?${params.toString()}`);
    if (!resp.ok) throw new Error('Failed to fetch search results');
    return (await resp.json()) as SearchResponseType;
  }, [name, language]);

  const fetchRelatedTerms = useCallback(async (domain: string): Promise<Term[]> => {
    const params = new URLSearchParams({
      domain,
      sort_by: 'name',
      page: '1',
      page_size: '3',
      fuzzy: 'false',
    });
    try {
      const resp = await fetch(`${API_ENDPOINTS.search}?${params.toString()}`);
      if (!resp.ok) console.error('Failed to fetch search results');
      const data = (await resp.json()) as SearchResponseType;
      return data.items;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (ex) {
      const cached = await getAllTerms();
      return cached.filter((t) => t.domain === domain);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      try {
        let picked: Term | null = null;

        try {
          const res = await fetchTerm();
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          picked = res.items?.[0] ?? null;
        } catch {
          const cached = await getAllTerms();
          picked =
              cached.find(
                  (t) => t.term.toLowerCase() === (name ?? "").toLowerCase(),
              ) ?? null;
        }
        //eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled) {
          setTerm(picked);
        }

        if (picked) {
          const related = await fetchRelatedTerms(picked.domain);
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (!cancelled) {
            setRelatedTerms(related.filter((r) => r.id !== picked.id));
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (!cancelled) {
            setRelatedTerms([]);
          }
        }
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, name, language, fetchTerm, fetchRelatedTerms]);

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);


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

    // const handleBack = () => {
    //   void navigate(-1);
    // };



  const languageKey = term?.language
    ? term.language.charAt(0).toUpperCase() +
      term.language.slice(1).toLowerCase()
    : 'Default';
  const languageClass = LanguageClassMap[languageKey] ?? 'bg-rose-500';

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
        console.error(`HTTP error! status: ${String(response.status)}`);
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
        console.error(`HTTP error! status: ${String(response.status)}`);
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
        console.error(`HTTP error! status: ${String(response.status)}`);
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
          console.error(`HTTP error! status: ${String(response.status)}`);
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
          console.error(`HTTP error! status: ${String(response.status)}`);
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
            <div className="term-main-content min-h-0 min-w-0">
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="min-h-screen term-page pt-16 w-full">
                  <div className="flex justify-between items-center w-full mb-4">
                    <button
                      type="button"
                      className="bg-theme rounded-md text-sm mb-4 text-theme justify-start h-10 w-20"
                      onClick={() => {
                        void navigate(`/search`);
                      }}
                    >
                      Back
                    </button>
                    <div className="flex flex-row items-center gap-2">
                      <ArrowUp className="cursor-pointer hover:text-teal-500" />
                      <span className="text-xs">{term?.upvotes}</span>
                      <ArrowDown className="cursor-pointer hover:text-teal-500" />
                      <span className="text-xs">{term?.downvotes}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Share2 className="cursor-pointer hover:text-rose-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              void navigator.clipboard.writeText(
                                window.location.href,
                              );
                            }}
                          >
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const subject = `Check out this term: ${term?.term ? term.term : ''}`;
                              const body = `Hi,\n\nI wanted to share this term with you:\n\n${term?.term ? term.term : ''}\n\nDefinition: ${term?.definition ? term.definition : ''}\n\nLink: ${window.location.href}`;
                              window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                            }}
                          >
                            Share via Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>


                    </div>
                  </div>

                  <div className="term-conent w-full pb-3">
                    <Card className="w-full max-w-screen mx-auto bg-theme text-theme text-left">
                      <CardHeader className="">
                        <div className="flex flex-row items-start gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-accent text-sm"
                          >
                            {term?.domain}
                          </Badge>
                          <Badge
                            variant="destructive"
                            className={`bg-accent text-sm ${languageClass} text-theme`}
                          >
                            {term?.language}
                          </Badge>
                        </div>
                        <CardTitle className="text-3xl md:text-4xl mt-4">
                          {term?.term}
                        </CardTitle>
                        <div className="h-px bg-muted my-4 w-full" />
                      </CardHeader>

                      <CardContent className="space-y-6">
                        <section>
                          <h3 className="font-semibold text-2xl mb-2">
                            Description
                          </h3>
                          <p className="text-sm leading-relaxed">
                            {term?.definition}
                          </p>
                        </section>

                        <section className="text-theme">
                          {relatedTerms.length === 0 ? null : (
                            <div>
                              <h3 className="font-semibold text-2xl mb-2">
                                Related Terms
                              </h3>
                              <div className="flex flex-wrap gap-2 text-theme text-3xl">
                                {relatedTerms[0] ? (
                                  <Badge
                                    variant="outline"
                                    className="text-sm text-theme"
                                  >
                                    {
                                      <Link
                                        to={`/term/${relatedTerms[0].language}/${relatedTerms[0].term}/${relatedTerms[0].id}`}
                                        className="!text-pink-600"
                                      >
                                        {relatedTerms[0].term}
                                      </Link>
                                    }
                                  </Badge>
                                ) : null}
                                {relatedTerms[1] ? (
                                  <Badge
                                    variant="outline"
                                    className="text-sm text-theme"
                                  >
                                    {
                                      <Link
                                        to={`/term/${relatedTerms[1].language}/${relatedTerms[1].term}/${relatedTerms[1].id}`}
                                        className="!text-pink-600"
                                      >
                                        {relatedTerms[1].term}
                                      </Link>
                                    }
                                  </Badge>
                                ) : null}
                                {relatedTerms[2] ? (
                                  <Badge
                                    variant="outline"
                                    className="text-sm text-theme"
                                  >
                                    {
                                      <Link
                                        to={`/term/${relatedTerms[2].language}/${relatedTerms[2].term}/${relatedTerms[2].id}`}
                                        className="!text-pink-600"
                                      >
                                        {relatedTerms[2].term}
                                      </Link>
                                    }
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </section>

                        <section>
                          <h3 className="font-semibold mb-2 text-2xl">
                            Comments
                          </h3>
                          <div className="border border-muted rounded-md p-4 min-h-[100px] bg-muted/30">
                            <section className="comments-section">
                              <div className="comments-header">
                                <h3 className="section-title">Comments</h3>
                                <span className="comment-count">
                                  {comments.length}
                                </span>
                              </div>

                              <div className="comments-list">
                                {loadingComments && <p>Loading comments...</p>}
                                {errorComments && (
                                  <p className="error-message">
                                    {errorComments}
                                  </p>
                                )}
                                {!loadingComments && comments.length === 0 && (
                                  <p>
                                    No comments yet. Be the first to comment!
                                  </p>
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

                              <div
                                className="add-comment"
                                ref={commentInputRef}
                              >
                                {replyingToCommentId && (
                                  <div className="replying-to-info">
                                    Replying to:{' '}
                                    {comments.find(
                                      (c) => c.id === replyingToCommentId,
                                    )?.user.name || 'comment'}
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
                                    replyingToCommentId
                                      ? 'Add a reply'
                                      : 'Add a comment'
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleAddComment(replyingToCommentId)
                                  }
                                  aria-label="Send comment"
                                  className="send-comment-button bg-theme text-theme"
                                >
                                  <SendIcon />
                                </button>
                              </div>
                            </section>

                            <footer className="page-footer">
                              <button
                                type="button"
                                className="suggest-edit bg-theme text-theme"
                                aria-label="Suggest an edit"
                              >
                                Suggest an edit
                                <SuggestEditArrowIcon />
                              </button>
                            </footer>
                          </div>
                        </section>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
