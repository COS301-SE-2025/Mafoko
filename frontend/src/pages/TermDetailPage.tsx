import React, { useState, useEffect } from 'react';
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

export const TermDetailPage: React.FC = () => {
  const { termId } = useParams<{ termId: string }>();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { isDarkMode } = useDarkMode();
  const [activeMenuItem, setActiveMenuItem] = useState('terms');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleBack = () => {
    void navigate(-1);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    console.log('New comment:', newComment);
    setNewComment('');
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

  const [comments] = useState<Comment[]>([
    {
      id: '1',
      user: { id: '1', name: 'Noah Pierre' },
      content:
        "I'm a bit unclear about how this would fit into a sentence. Can someone help?",
      timeAgo: '58 minutes ago',
      votes: 10,
      isReply: false,
    },
    {
      id: '2',
      user: { id: '2', name: 'AI Chat Bot' },
      content:
        'Die ontwerperswinkel verkoop goedere teen afslagoryse. Is a sentence where this would work.',
      timeAgo: '58 minutes ago',
      votes: 5,
      isReply: false,
    },
    {
      id: '3',
      user: { id: '3', name: 'Molly Hall' },
      content: 'This is great.',
      timeAgo: '20 minutes ago',
      votes: 2,
      isReply: true,
    },
  ]);

  return (
    <div
      className={`term-page-fixed-background ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      <div className="term-page-container">
        {isMobile ? (
          <Navbar />
        ) : (
          <LeftNav
            activeItem={activeMenuItem}
            setActiveItem={setActiveMenuItem}
          />
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
                  <span className="comment-count">25</span>
                </div>

                <div className="comments-list">
                  {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
                </div>

                <div className="add-comment">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value);
                    }}
                    placeholder="Add a comment...."
                    aria-label="Add a comment"
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    aria-label="Send comment"
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
