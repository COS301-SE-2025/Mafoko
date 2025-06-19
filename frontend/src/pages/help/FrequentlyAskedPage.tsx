import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';

const FrequentlyAskedPage: React.FC = () => {
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
            className="article-theme-toggle-btn"
            onClick={() => {
              void navigate('/help');
            }}
          >
            Back
          </button>
          <button
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
                <h2 className="article-h2">FAQs</h2>
                <ul>
                  <li>
                    <a href="#multiple-download">Can I download multiple dictionaries at once?</a>
                  </li>
                  <li>
                    <a href="#fuzzy-offline">Will AI or fuzzy search still work offline?</a>
                  </li>
                  <li>
                    <a href="#unable-to-find-domain">What if the domain I need isn’t listed?</a>
                  </li>
                  <li>
                    <a href="#moderation">Are definitions moderated?</a>
                  </li>
                </ul>
              </aside>

              <div className="article-content article-scrollable-content">
                <div className="p-6 max-w-4xl mx-auto space-y-12 text-base leading-relaxed text-left">
                  <h1>Frequently Asked Questions</h1>
                  <section id="multiple-download" className="mb-10">
                    <h3 className="text-2xl font-semibold text-theme mb-3">
                      Can I download multiple dictionaries at once?
                    </h3>
                    <p className="mb-2">
                      Yes! You can select multiple dictionaries to download based on your needs. Each downloaded dictionary includes all associated terms, making them accessible during offline searches.
                    </p>
                    <p className="mb-2">
                      If you're low on space, you can remove previously downloaded dictionaries at any time. This gives you full control over what data is stored locally on your device.
                    </p>
                    <p>
                      To manage your downloads and see which dictionaries are available offline, visit the{' '}
                      <Link
                        to="/dictionary"
                        className="help-page-article-link font-medium"
                        style={{ color: '#f00a50' }}
                      >
                        Dictionary Page
                      </Link>.
                    </p>
                    <p>
                      To get more information regarding offline use, visit the{' '}
                      <Link
                        to="/help/terms#offline-use"
                        className="help-page-article-link font-medium"
                        style={{ color: '#f00a50' }}
                      >
                        Offline Help Section
                      </Link>.
                    </p>
                  </section>


                  <section id="fuzzy-offline" className="mb-10">
                    <h3 className="text-2xl font-semibold text-theme mb-3">
                      Will AI or fuzzy search still work offline?
                    </h3>
                    <p className="mb-2">
                      Yes! As long as the relevant dictionary has been downloaded, both AI Semantic Search and Fuzzy Search are fully supported even when you’re offline.
                    </p>
                    <p>
                      These features operate locally using the data bundled with each downloaded dictionary, ensuring smooth and intelligent search experiences without requiring an internet connection.
                    </p>
                    <p>
                      To get more information regarding fuzzy and AI semantic search use, visit the{' '}
                      <Link
                        to="/help/terms"
                        className="help-page-article-link font-medium"
                        style={{ color: '#f00a50' }}
                      >
                        Search Help Section
                      </Link>.
                    </p>
                  </section>

                  <section id="unable-to-find-domain" className="mb-10">
                    <h3 className="text-2xl font-semibold text-theme mb-3">
                      What if the domain I need isn’t listed?
                    </h3>
                    <p className="mb-2">
                      If the domain you're looking for doesn’t appear in the filters, it may not yet be part of our current dataset.
                    </p>
                    <p>
                      You can help improve the platform by suggesting a new domain or submitting relevant terms using the{' '}
                      <Link
                        to="/contribute"
                        className="help-page-article-link font-medium underline"
                        style={{ color: '#f00a50' }}
                      >
                        Contribution Form
                      </Link>.

                    </p>
                    <p>Please note that all submissions go through a review process before being published.</p>
                  </section>

                  <section id="moderation" className="mb-10">
                    <h3 className="text-2xl font-semibold text-theme mb-3">
                      Are definitions moderated?
                    </h3>
                    <p className="mb-2">
                      Yes. Marito uses a community moderation system to ensure quality and accuracy.
                    </p>
                    <p>
                      Users can leave <strong>comments</strong>, <strong>suggest improvements</strong>, and <strong>vote</strong> on definitions. Highly upvoted terms are considered more reliable, while flagged or controversial entries are reviewed by moderators.
                    </p>
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

export default FrequentlyAskedPage;
