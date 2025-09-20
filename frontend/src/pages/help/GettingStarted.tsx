import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { HelpSection } from './HelpSection.tsx';
import { GettingStartedContent } from './utils/GettingStartedUtils.ts';

const GettingStarted: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

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
        </div>

        <div
          className={`article-container ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
        >
          <section className="article-section">
            <div className="article-section-inner">
              <aside className="article-section-sidebar">
                <h2 className="article-h2">On this page</h2>
                <ul className="text-left">
                  <li>
                    <a href="#intro">Getting Started</a>
                  </li>
                  {GettingStartedContent.map((obj, index) => {
                    return (
                      <li key={index}>
                        <a href={`#${obj.id}`}>{obj.title}</a>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              <div className="article-content article-scrollable-content">
                <div className="p-6 max-w-4xl mx-auto space-y-12 text-base leading-relaxed text-left">
                  <section id="intro">
                    <h1 className="text-3xl font-bold text-theme mb-4">
                      Getting Started
                    </h1>
                    <div className="text-left space-y-6 leading-relaxed text-base">
                      <p>
                        Welcome to <b>Marito</b>, your gateway to South Africa’s
                        multilingual digital lexicon. This guide will walk you
                        through the basics. Whether you're a linguist,
                        contributor, or researcher, these steps will help you
                        get up and running quickly.
                      </p>
                    </div>
                  </section>

                  {GettingStartedContent.map((obj, index) => {
                    return (
                      <HelpSection
                        key={index}
                        id={obj.id}
                        title={obj.title}
                        content={obj.content}
                        assetLocation={obj.assetLocation}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;
