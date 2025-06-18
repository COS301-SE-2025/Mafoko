import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';

const CommunityHelpPage: React.FC = () => {
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
        className={`fixed-background ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
      >
        <div className="top-bar">
          <button
            className="theme-toggle-btn"
            onClick={() => {
              void navigate('/help');
            }}
          >
            Back
          </button>
          <button
            className="theme-toggle-btn"
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
            <div className="article-inner">
              <aside className="article-sidebar">
                <h2 className="help-h2">On this page</h2>
                <ul>
                  <li>
                    <a href="#intro">Community Feature</a>
                  </li>
                  <li>
                    <a href="#video">Community in Action</a>
                  </li>
                  <li>
                    <a href="#workflow">Community Features</a>
                  </li>
                </ul>
              </aside>

              <div className="article-content scrollable-content">
                <h1 id="intro">Using Marito's Community Features</h1>
                <div className="text-center space-y-6 leading-relaxed text-base">
                  <p>
                    Marito isn’t just a multilingual term bank, it’s a
                    collaborative space designed for open, community-driven
                    contributions. Built to support South Africa’s rich
                    linguistic diversity, Marito allows users to not only search
                    and save terms, but also actively participate in improving
                    and curating the glossary through discussion, feedback, and
                    peer review.
                  </p>
                </div>

                <h2 className="help-h2" id="video">
                  Community in Action
                </h2>
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

                <h2 className="help-h2" id="workflow">
                  Community Features
                </h2>
                <div className="text-left space-y-6 leading-relaxed text-base">
                  <p>
                    Here’s how to get the most out of Marito’s collaborative
                    features:
                  </p>
                  <ol className="list-decimal list-inside space-y-4">
                    <li>
                      <strong>Engage in Discussions:</strong> Every term has a
                      comment section. Share suggestions, provide
                      clarifications, or discuss alternative definitions with
                      other users.
                    </li>

                    <li>
                      <strong>Suggest Edits:</strong> Approved users can propose
                      changes to terms, whether it’s fixing typos, enhancing
                      clarity, or adding better domain-specific context.
                    </li>

                    <li>
                      <strong>Upvote or Downvote:</strong> Rate the quality of
                      terms or suggestions to signal accuracy and community
                      consensus. This feedback helps build Marito's linguistic
                      knowledge.
                    </li>

                    <li>
                      <strong>Build Together:</strong> Collaborate with other
                      language contributors, linguists, and researchers to
                      improve South Africa’s linguistic data, one term at a
                      time.
                    </li>
                  </ol>
                  <p>
                    <em>Watch the video above</em> for a real-time overview of
                    these community tools in action.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CommunityHelpPage;
