import React, { useState, useCallback, useEffect } from 'react';
import SearchBar from '../components/ui/SearchBar';
import '../styles/HelpPage.scss';
import { useNavigate } from 'react-router-dom';
import LeftPane from '../components/dashboard/LeftPane.tsx';

const HelpPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('search');
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
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored) setIsDarkMode(stored === 'false');
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

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

          <div className="min-h-screen search-page pt-16">
            <div className="help-conent">
              <section className="p-6 space-y-4 w-full max-w-4xl mx-auto">
                <SearchBar
                  onSearch={handleSearch}
                  fetchSuggestions={fetchSuggestions}
                />
              </section>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollable-content">
              <div className="p-6 w-full">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-2">
                  {results.map((res) => (

                  ))}
                  {results.length === 0 && term && (
                    <p className="text-theme opacity-60">
                      No results found for "{term}".
                    </p>
                  )}
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
