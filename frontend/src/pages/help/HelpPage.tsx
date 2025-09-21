import React, { useState, useCallback, useEffect, useMemo } from 'react';
import HelpSearch from '../../components/ui/HelpSearch.tsx';
import '../../styles/HelpPage.scss';
import { Link } from 'react-router-dom';
import Navbar from '../../components/ui/Navbar.tsx';
import LeftNav from '../../components/ui/LeftNav.tsx';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { useTranslation } from 'react-i18next';

interface Article {
  title: string;
  desc: string;
  link: string;
  keywords: string[];
}

const HelpPage: React.FC = () => {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [activeMenuItem, setActiveMenuItem] = useState('help');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { isDarkMode } = useDarkMode();
  const { t } = useTranslation();

  const articles: Article[] = useMemo(
    () => [
      {
        title: 'Getting Started',
        desc: 'Step-by-step guide for creating an account, signing in, and navigating the platform for the first time.',
        link: '/help/getting-started',
        keywords: [
          'introduction',
          'first steps',
          'account',
          'navigation',
          'login',
          'register',
          'registration',
          'sign up',
        ],
      },
      {
        title: 'Community Interaction',
        desc: 'Learn how to post, comment, and engage with others using the community tools like upvotes and discussions.',
        link: '/help/community-feature',
        keywords: ['comment', 'upvote', 'downvote', 'community'],
      },
      {
        title: 'Dictionary',
        desc: 'Search for terms across multiple languages, enable fuzzy search, and adjust your dictionary settings.',
        link: '/help/terms',
        keywords: [
          'fuzzy',
          'dictionary',
          'language',
          'search',
          'dictionary',
          'term',
          'language',
        ],
      },
      {
        title: 'Glossary',
        desc: 'Organize, filter, and export glossaries by category, domain, or translation bank.',
        link: '/help/glossary-help',
        keywords: [
          'glossary',
          'category',
          'domain',
          'translation bank',
          'export',
          'csv export',
          'pdf export',
          'json export',
          'data export',
        ],
      },
      {
        title: 'Workspace',
        desc: 'Save and manage your own terms and glossaries, track submissions, and collaborate using notes and groups.',
        link: '/help/workspace-help',
        keywords: [
          'workspace',
          'save',
          'save term',
          'save glossary',
          'groups',
          'term submission',
          'track term submission',
          'notes',
        ],
      },
      {
        title: 'Settings and Customization',
        desc: 'Adjust preferences like dark/light mode, accessibility options, profile details, and other user settings.',
        link: '/help/settings-help',
        keywords: [
          'settings',
          'user settings',
          'mode',
          'light mode',
          'dark mode',
          'accessibility',
          'accessibility options',
          'options',
          'profile',
          'profile picture',
          'contrast',
          'colour',
        ],
      },
      {
        title: 'Home Page',
        desc: 'Explore the interactive South African map, discover random terms, and get an overview of featured content.',
        link: '/help/home-help',
        keywords: [
          'home',
          'home page',
          'map',
          'South African map',
          'interactive map',
          'random terms',
        ],
      },
      {
        title: 'Dashboard',
        desc: 'Track application activity with graphs, view platform data, and analyze your contributions in one place.',
        link: '/help/dashboard-help',
        keywords: ['dashboard', 'graph', 'app activity', 'data information'],
      },
      {
        title: 'Feedback',
        desc: 'Send suggestions, compliments, or complaints directly to the team to help improve the platform.',
        link: '/help/feedback-help',
        keywords: [
          'feedback',
          'complaint',
          'compliment',
          'suggest',
          'suggestion',
        ],
      },
      {
        title: 'FAQs',
        desc: 'Answers to common questions about the platform.',
        link: '/help/faqs',
        keywords: [
          'faq',
          'downloads',
          'contribute',
          'search',
          'dictionary',
          'offline',
        ],
      },
    ],
    [],
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSearch = useCallback(
    async (t: string): Promise<void> => {
      await Promise.resolve();
      setTerm(t);
      setCurrentPage(1);
      const query = t.toLowerCase().trim();

      if (!query) {
        setResults([]);
        setTerm('');
        return;
      }

      const filtered = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.keywords.some((k) => k.includes(query)),
      );
      setResults(filtered);
    },
    [articles],
  );

  const fetchSuggestions = async (term: string): Promise<string[]> => {
    await Promise.resolve();
    const query = term.toLowerCase().trim();

    const keywordSet = new Set<string>();

    articles.forEach((article) => {
      article.keywords.forEach((keyword) => {
        if (keyword.includes(query) || query.includes(keyword)) {
          keywordSet.add(keyword);
        }
      });
    });

    return Array.from(keywordSet).slice(0, 5);
  };

  const paginatedResults = results.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));

  return (
    <div
      className={`help-page-fixed-background ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      <div className={`help-page-container`}>
        {isMobile ? (
          <Navbar />
        ) : (
          <LeftNav
            activeItem={activeMenuItem}
            setActiveItem={setActiveMenuItem}
          />
        )}

        <div className="help-page-main-content">
          <div className="help-page-search-background">
            <div className="help-page-search-inner">
              <section>
                <h1>{t('helpPage.howCanWeHelp')}</h1>
                <HelpSearch
                  onSearch={handleSearch}
                  fetchSuggestions={fetchSuggestions}
                />
              </section>
            </div>
          </div>

          <div className="min-h-screen help-page pt-16">
            {!term && (
              <section className="help-page-topics-section w-full px-4">
                <h2 className="help-page-topics-heading">
                  {t('helpPage.commonTopics')}
                </h2>
                <div className="help-page-topics-grid">
                  {articles.map((topic, index) => (
                    // eslint-disable-next-line react-x/no-array-index-key
                    <div key={index} className="help-page-topic-card">
                      <h3>{topic.title}</h3>
                      <p>{topic.desc}</p>
                      <Link to={topic.link} className="help-page-article-link">
                        {t('helpPage.articleLink')}
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {term && (
              <div className="p-6 w-full">
                {paginatedResults.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-2">
                    {paginatedResults.map((res, index) => (
                      // eslint-disable-next-line react-x/no-array-index-key
                      <div key={index} className="help-page-topic-card">
                        <h3>{res.title}</h3>
                        <p>{res.desc}</p>
                        <Link to={res.link} className="help-page-article-link">
                          {t('helpPage.articleLink')}
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-theme opacity-60 text-center">
                    {t('searchPage.noResults', { term: term })}
                  </p>
                )}
              </div>
            )}
            {term && totalPages > 1 && (
              <div className="pagination-controls flex justify-center space-x-4 p-4">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage(currentPage - 1);
                  }}
                  className="px-4 py-2 bg-theme rounded disabled:opacity-50"
                >
                  {t('helpPage.previous')}
                </button>
                <span>
                  {t('helpPage.pageInfo', {
                    current: currentPage,
                    total: totalPages,
                  })}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage(currentPage + 1);
                  }}
                  className="px-4 py-2 bg-theme rounded disabled:opacity-50"
                >
                  {t('helpPage.next')}
                </button>
              </div>
            )}

            <section className="help-page-support-cta">
              <h3>{t('helpPage.cantFind')}</h3>
              <a href="mailto:veloxcapstone@gmail.com" className="support-link">
                {t('helpPage.submitRequest')}
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
