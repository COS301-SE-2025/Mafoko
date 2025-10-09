import React, { useState, useCallback, useEffect, useMemo } from 'react';
import HelpSearch from '../../components/ui/HelpSearch.tsx';
import '../../styles/HelpPage.scss';
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

  const hashLink = (path: string) =>
    path.startsWith('#') || path.startsWith('/#')
      ? path
      : `#${path.startsWith('/') ? path : `/${path}`}`;

  const articles: Article[] = useMemo(
    () => [
      {
        title: t('helpPage2.section1'),
        desc: t('helpPage2.section2'),
        link: '#/help/getting-started',
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
        title: t('helpPage2.section3'),
        desc: t('helpPage2.section3Desc', {
          defaultValue:
            'Learn how to post, comment, and engage with others using the community tools like upvotes and discussions.',
        }),
        link: '#/help/community-feature',
        keywords: ['comment', 'upvote', 'downvote', 'community'],
      },
      {
        title: t('helpPage2.dictionaryTitle', { defaultValue: 'Dictionary' }),
        desc: t('helpPage2.dictionaryDesc', {
          defaultValue:
            'Search for terms across multiple languages, enable fuzzy search, and adjust your dictionary settings.',
        }),
        link: '#/help/terms',
        keywords: ['fuzzy', 'dictionary', 'language', 'search', 'term'],
      },
      {
        title: t('helpPage2.glossaryTitle', { defaultValue: 'Glossary' }),
        desc: t('helpPage2.glossaryDesc', {
          defaultValue:
            'Organize, filter, and export glossaries by category, domain, or translation bank.',
        }),
        link: '#/help/glossary-help',
        keywords: ['glossary', 'category', 'domain', 'translation bank'],
      },
      {
        title: t('helpPage2.workspaceTitle', { defaultValue: 'Workspace' }),
        desc: t('helpPage2.workspaceDesc', {
          defaultValue:
            'Save and manage your own terms and glossaries, track submissions, and collaborate using notes and groups.',
        }),
        link: '#/help/workspace-help',
        keywords: ['workspace', 'groups', 'save term', 'notes'],
      },
      {
        title: t('helpPage2.settingsTitle', {
          defaultValue: 'Settings and Customization',
        }),
        desc: t('helpPage2.settingsDesc', {
          defaultValue:
            'Adjust preferences like dark/light mode, accessibility options, profile details, and other user settings.',
        }),
        link: '#/help/settings-help',
        keywords: [
          'settings',
          'mode',
          'dark mode',
          'light mode',
          'accessibility',
        ],
      },
      {
        title: t('helpPage2.homeTitle', { defaultValue: 'Home Page' }),
        desc: t('helpPage2.homeDesc', {
          defaultValue:
            'Explore the interactive South African map, discover random terms, and get an overview of featured content.',
        }),
        link: '#/help/home-help',
        keywords: ['home', 'map', 'random terms'],
      },
      {
        title: t('helpPage2.dashboardTitle', { defaultValue: 'Dashboard' }),
        desc: t('helpPage2.dashboardDesc', {
          defaultValue:
            'Track application activity with graphs, view platform data, and analyze your contributions in one place.',
        }),
        link: '#/help/dashboard-help',
        keywords: ['dashboard', 'graph', 'app activity', 'data'],
      },
      {
        title: t('helpPage2.learningPathTitle', {
          defaultValue: 'Learning Paths',
        }),
        desc: t('helpPage2.learningPathDesc', {
          defaultValue:
            'Design a guided journey for learning one of South Africa’s official languages.',
        }),
        link: '#/help/learning-path-help',
        keywords: ['learn', 'languages', 'path'],
      },
      {
        title: t('helpPage2.feedbackTitle', { defaultValue: 'Feedback' }),
        desc: t('helpPage2.feedbackDesc', {
          defaultValue:
            'Send suggestions, compliments, or complaints directly to the team to help improve the platform.',
        }),
        link: '#/help/feedback-help',
        keywords: ['feedback', 'complaint', 'suggestion'],
      },
      {
        title: t('helpPage2.faqsTitle', { defaultValue: 'FAQs' }),
        desc: t('helpPage2.faqsDesc', {
          defaultValue: 'Answers to common questions about the platform.',
        }),
        link: '#/help/faqs',
        keywords: ['faq', 'questions', 'help'],
      },
    ],
    [t],
  );

  useEffect(() => {
    const handleResize = () => { setIsMobile(window.innerWidth <= 768); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); };
  }, []);

  const handleSearch = useCallback(
    async (text: string): Promise<void> => {
      await Promise.resolve();
      setTerm(text);
      setCurrentPage(1);
      const query = text.toLowerCase().trim();

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
      className={`help-page-fixed-background ${
        isDarkMode ? 'theme-dark' : 'theme-light'
      }`}
    >
      <div className="help-page-container">
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
                    <div key={index} className="help-page-topic-card">
                      <h3>{topic.title}</h3>
                      <p>{topic.desc}</p>
                      {/* ✅ Use normal <a> for HashRouter navigation */}
                      <a
                        href={hashLink(topic.link)}
                        className="help-page-article-link"
                      >
                        {t('helpPage.articleLink')}
                      </a>
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
                      <div key={index} className="help-page-topic-card">
                        <h3>{res.title}</h3>
                        <p>{res.desc}</p>
                        <a
                          href={hashLink(res.link)}
                          className="help-page-article-link"
                        >
                          {t('helpPage.articleLink')}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-theme opacity-60 text-center">
                    {t('searchPage.noResults', { term })}
                  </p>
                )}
              </div>
            )}

            {term && totalPages > 1 && (
              <div className="pagination-controls flex justify-center space-x-4 p-4">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage(currentPage - 1); }}
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
                  onClick={() => { setCurrentPage(currentPage + 1); }}
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
