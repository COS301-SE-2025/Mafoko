import React, { useState, useCallback, useEffect } from 'react';
import HelpSearch from '../../components/ui/HelpSearch.tsx';
import '../../styles/HelpPage.scss';
import { useNavigate } from 'react-router-dom';
import LeftPane from '../../components/dashboard/LeftPane.tsx';

interface Term {
  id: string;
  term: string;
  language: string;
  domain: string;
  definition: string;
  upvotes: number;
  downvotes: number;
}

const HelpPage: React.FC = () => {

  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Term[]>([]);
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('help');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleMenuItemClick = (item: string) => {
    setActiveMenuItem(item);
    if (window.innerWidth <= 768) setIsMobileMenuOpen(false);

    if (item === 'dashboard') {
      void navigate('/dashboard');
    } else if (item === 'search') {
      void navigate('/search');
    } else if (item === 'saved') {
      void navigate('/saved-terms');
    } else if (item === 'analytics') {
      void navigate('/analytics');
    } else if (item === 'help') {
      void navigate('/help');
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored) setIsDarkMode(stored === 'false');
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  const handleSearch = useCallback(
    async (t: string) => {
      await Promise.resolve(); // 👈 Silences the linter

      setTerm(t);
      setCurrentPage(1);
      setResults([
        {
          id: '1',
          term: 'Placeholder',
          language: 'English',
          domain: 'Test',
          definition: 'This is a dummy term for testing.',
          upvotes: 0,
          downvotes: 0,
        },
      ]);
      setTotalPages(1);
    },
    [],
  );


  const fetchSuggestions = async (term: string): Promise<string[]> => {
    return Promise.resolve([
      `${term} Test`,
      `${term} Example`,
      `${term} Sample`,
    ]);
  };


  return (
    <div
      className={`fixed-background  ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      <div
        className={`help-page-container ${isMobileMenuOpen ? 'mobile-menu-is-open' : ''} `}
      >
        {isMobileMenuOpen && (
          <div
            className="mobile-menu-overlay"
            onClick={() => {
              setIsMobileMenuOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsMobileMenuOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />
        )}

        <LeftPane
          activeItem={activeMenuItem}
          onItemClick={handleMenuItemClick}
        />

        <div className="help-main-content">
          <div className="top-bar">
            <button
              className="hamburger-icon"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              type="button"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDarkMode((prev) => !prev);
              }}
              className="theme-toggle-btn"
            >
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>

          <div className="help-search-background">
            <div className="help-search-inner">
              <section>
                <h1>How Can We Help?</h1>
                <HelpSearch
                  onSearch={handleSearch}
                  fetchSuggestions={fetchSuggestions}
                />
              </section>
            </div>
          </div>

          <div className="min-h-screen search-page pt-16">

            <section className="help-topics-section w-full px-4">
              <h2 className="help-topics-heading">Common Topics</h2>
              <div className="help-topics-grid">
                {[
                  { title: 'Getting Started', desc: 'Learn how to quickly get the most out of the platform.', count: 12 },
                  { title: 'Desktop App', desc: 'Get to know the basics of using the desktop app.', count: 22 },
                  { title: 'Dashboard', desc: 'Manage users, folders, and your account settings.', count: 6 },
                  { title: 'Releases', desc: "Learn what's new, improved or fixed.", count: 39 },
                  { title: 'FAQs', desc: 'Answers to common questions about the platform.', count: 12 },
                  { title: 'How To', desc: 'Find various tips on how to do things efficiently.', count: 20 },
                ].map((topic, index) => (
                  <div key={index} className="help-topic-card">
                    <h3>{topic.title}</h3>
                    <p>{topic.desc}</p>
                    <a href="#" className="article-link">
                      See all {topic.count} articles →
                    </a>
                  </div>
                ))}
              </div>
            </section>

            <section className="help-support-cta">
              <h3>Can’t find what you’re looking for?</h3>
              <a href="#" className="support-link">
                Submit a request →
              </a>
            </section>


            <div className="flex-1 overflow-y-auto p-6 scrollable-content">
              <div className="p-6 w-full">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-2">
                  {/*{results.map((res) => (

                  ))}
                  {results.length === 0 && term && (
                    <p className="text-theme opacity-60">
                      No results found for "{term}".
                    </p>
                  )}*/}
                </div>
              </div>

              <div className="pagination-controls flex justify-center space-x-4 p-4">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage(currentPage - 1);
                  }}
                  className="px-4 py-2 bg-theme rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage(currentPage + 1);
                  }}
                  className="px-4 py-2 bg-theme rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
