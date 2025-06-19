import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';

const TermHelpPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored) setIsDarkMode(stored === 'false');
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  return (
    <div>
      <div
        className={`article-fixed-background ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
      >
        <div className="article-top-bar">
          <button
            type="button"
            className="article-theme-toggle-btn"
            onClick={() => {
              void navigate('/help');
            }}
          >
            Back
          </button>
          <button
            type="button"
            className="article-theme-toggle-btn"
            style={{ marginRight: '1rem' }}
            onClick={() => {
              setIsDarkMode((prev) => !prev);
            }}
          >
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        <div
          className={`article-container ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
        >
          <section className="article-section">
            <div className="article-section-inner">
              <aside className="article-section-sidebar">
                <h2 className="article-h2">On this page</h2>
                <ul>
                  <li>
                    <a href="#intro">Understanding Terms in Marito</a>
                  </li>
                  <li>
                    <a href="#what-is-a-term">What is a Term</a>
                  </li>
                  <li>
                    <a href="#languages">Supported Languages</a>
                  </li>
                  <li>
                    <a href="#how-search-works">How Search Works</a>
                  </li>
                  <li>
                    <a href="#search-and-filters">Search & Filter Options</a>
                  </li>
                  <li>
                    <a href="#offline-use">Offline Use</a>
                  </li>
                </ul>
              </aside>

              <div className="article-content article-scrollable-content">
                <div className="p-6 max-w-4xl mx-auto space-y-12 text-base leading-relaxed text-left">
                  {/* INTRO */}
                  <section id="intro">
                    <h1 className="text-3xl font-bold text-theme mb-4">
                      Understanding Terms in Marito
                    </h1>
                    <p>
                      In Marito, terms are the heart of the glossary. Each entry
                      reflects a concept in one of South Africa's 11 official
                      languages, helping communities preserve linguistic
                      richness while supporting accurate translations and search
                      functionality.
                    </p>
                  </section>

                  {/* WHAT IS A TERM */}
                  <section id="what-is-a-term">
                    <h2 className="text-2xl font-semibold text-theme mb-3">
                      What is a Term?
                    </h2>
                    <p>Every term Marito contains the following fields:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>
                        <strong>Term:</strong> The actual word or phrase (e.g.,
                        Ubuntu)
                      </li>
                      <li>
                        <strong>Language:</strong> One of South Africa’s 11
                        official languages the term belongs to
                      </li>
                      <li>
                        <strong>Domain:</strong> The context or subject area
                        (e.g. Law, Technology, Education)
                      </li>
                      <li>
                        <strong>Definition:</strong> A clear, concise
                        description or meaning of the term
                      </li>
                      <li>
                        <strong>Upvotes / Downvotes:</strong> Community-driven
                        scoring to indicate accuracy or usefulness
                      </li>
                    </ul>
                  </section>

                  {/* LANGUAGES */}
                  <section id="languages">
                    <h2 className="text-2xl font-semibold text-theme mb-3">
                      Supported Languages
                    </h2>
                    <p>
                      Marito supports all 11 official South African languages
                      and you can filter and explore terms in any of these
                      languages using the search filters.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                      {[
                        'Afrikaans',
                        'English',
                        'isiNdebele',
                        'isiXhosa',
                        'isiZulu',
                        'Sesotho',
                        'Sepedi',
                        'Setswana',
                        'Siswati',
                        'Tshivenda',
                        'Xitsonga',
                      ].map((lang) => (
                        <div
                          key={lang}
                          className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700"
                        >
                          {lang}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* SEARCHING */}
                  <section id="how-search-works">
                    <h2 className="text-2xl font-semibold text-theme mb-3">
                      How Searching Works
                    </h2>
                    <p>
                      The search functionality in Marito is designed to help you
                      explore glossary terms quickly and efficiently across all
                      11 official South African languages. Whether you're
                      looking for a specific translation, trying to understand a
                      domain-specific term, or exploring linguistic
                      relationships, the search engine adapts to your needs.
                    </p>

                    <p>
                      You’ll find the search bar prominently at the top of the
                      page. As you type, Marito performs a live search, updating
                      results in real-time based on your input. This makes it
                      easy to experiment with different keywords, spelling
                      variants, or even partial matches.
                    </p>

                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li>
                        <strong>Term:</strong> The primary label or phrase
                        representing a concept.
                      </li>
                      <li>
                        <strong>Definition:</strong> Terms whose explanations
                        contain your search keywords will also appear.
                      </li>
                      <li>
                        <strong>Filters:</strong> If you use filters, only terms
                        in the selected language or domain will be returned.
                      </li>
                    </ul>
                    <h3 className="text-lg font-medium mt-4 font-semibold">
                      Live Suggestions
                    </h3>
                    <p>
                      As you type, Marito may suggest possible completions or
                      closely related terms based on common queries. These
                      suggestions speed up the process and help you discover
                      terms even if you’re unsure of the exact wording.
                    </p>

                    <h3 className="text-lg font-medium mt-4 font-semibold">
                      Search Sensitivity
                    </h3>
                    <p>
                      By default, Marito performs{' '}
                      <strong>exact or near-exact matching</strong>. However,
                      you can expand the search behavior by enabling:
                    </p>
                    <ul className="list-disc list-inside ml-4">
                      <li>
                        <strong>Fuzzy Search:</strong> Finds results even if
                        there are typos or minor differences between your input
                        and the actual term.
                      </li>
                      <li>
                        <strong>AI Semantic Search:</strong> Uses natural
                        language processing to find results based on{' '}
                        <em>meaning</em> rather than exact words which is
                        perfect when you're looking for related or conceptually
                        similar terms.
                      </li>
                    </ul>

                    <h3 className="text-lg font-medium mt-4 font-semibold">
                      Result Cards
                    </h3>
                    <p>
                      The terms are shown in cards that display the term name,
                      language, domain, definition, and voting buttons. Each
                      card also includes a “View” link where you can explore the
                      term in more detail, comment on it, or suggest changes.
                    </p>

                    <p>
                      You can combine search with filters and sorting to refine
                      your experience (see the sections below). For offline use,
                      remember to download the relevant dictionaries from the
                      dictionary page.
                    </p>

                    <p>
                      <em>
                        A video tutorial is available below that demonstrates
                        the full search workflow.
                      </em>
                    </p>

                    <div className="video-container">
                      <video
                        controls
                        width="100%"
                        style={{
                          maxWidth: '800px',
                          marginTop: '2rem',
                          borderRadius: '0.75rem',
                        }}
                      >
                        <source
                          src="/videos/community-features.mp4"
                          type="video/mp4"
                        />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </section>

                  {/* FILTERS */}
                  <section id="search-and-filters">
                    <h2 className="text-2xl font-semibold text-theme mb-3">
                      Search & Filter Options
                    </h2>
                    <p>
                      Marito provides several tools to help you find the right
                      term quickly and efficiently:
                    </p>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium font-semibold">
                          Filter by Language
                        </h3>
                        <p>
                          Restrict your search to a specific language. This is
                          useful when looking up terms in a single linguistic
                          context (e.g., only isiZulu terms).
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium font-semibold">
                          Filter by Domain
                        </h3>
                        <p>
                          Domains are thematic categories such as{' '}
                          <em>Education</em>, <em>Health</em>, or{' '}
                          <em>Technology</em>. This filter helps narrow results
                          to a subject-specific context.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium font-semibold">
                          Fuzzy Search
                        </h3>
                        <p>
                          If you're unsure how a term is spelled, Fuzzy Search
                          helps by returning similar-looking matches even with
                          typos. For example, typing "educashun" may return
                          "education".
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium font-semibold">
                          AI Semantic Search
                        </h3>
                        <p>
                          This uses artificial intelligence to understand the{' '}
                          <em>meaning</em> behind your query. For example,
                          searching "learning place" may return "school" or
                          "classroom", even if those exact words weren’t typed.
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium font-semibold">
                          Sort Options
                        </h3>
                        <ul className="list-disc list-inside ml-4">
                          <li>
                            <strong>By Popularity:</strong> Sort terms by their
                            number of upvotes
                          </li>
                          <li>
                            <strong>Alphabetical:</strong> Sort terms from A to
                            Z or Z to A
                          </li>
                        </ul>
                      </div>
                    </div>
                    <br />
                    <p>
                      <em>
                        A video tutorial is available below that demonstrates
                        the full filter and sorting workflow.
                      </em>
                    </p>

                    <div className="video-container">
                      <video
                        controls
                        width="100%"
                        style={{
                          maxWidth: '800px',
                          marginTop: '2rem',
                          borderRadius: '0.75rem',
                        }}
                      >
                        <source
                          src="/videos/community-features.mp4"
                          type="video/mp4"
                        />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </section>

                  {/* OFFLINE USAGE */}
                  <section id="offline-use">
                    <h2 className="text-2xl font-semibold text-theme mb-3">
                      Offline Usage
                    </h2>
                    <p>
                      Marito is a Progressive Web App (PWA), meaning you can use
                      its features even when you're offline. To do this, you'll
                      need to download a dictionary first.
                    </p>
                    <h3 className="font-medium font-semibold">
                      How to Download Dictionaries
                    </h3>
                    <ol className="list-decimal list-inside ml-4 space-y-1">
                      <li>
                        Go to the <strong>Dictionary</strong> page
                      </li>
                      <li>
                        Select one or more dictionaries to download (e.g.
                        English–Health, isiZulu–Technology)
                      </li>
                      <li>
                        Click <strong>Download</strong>
                      </li>
                    </ol>
                    <p>
                      Once downloaded, all the terms in that dictionary will be
                      available offline, including support for fuzzy and AI
                      search (limited to downloaded data).
                    </p>

                    <p>
                      <em>
                        A video tutorial is available below that demonstrates
                        the full offline download workflow.
                      </em>
                    </p>
                    <div className="video-container">
                      <video
                        controls
                        width="100%"
                        style={{
                          maxWidth: '800px',
                          marginTop: '2rem',
                          borderRadius: '0.75rem',
                        }}
                      >
                        <source
                          src="/videos/community-features.mp4"
                          type="video/mp4"
                        />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermHelpPage;
