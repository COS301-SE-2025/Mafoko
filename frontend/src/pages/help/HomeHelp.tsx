import React, { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { HelpNodeSection } from './HelpSection.tsx';
import { HomeContent } from './utils/FeedbackUtils.tsx';

export const HomeHelp: React.FC = () => {
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
                    <a href="#intro">Understanding the Home Page</a>
                  </li>
                  {HomeContent.map((obj) => {
                    return (
                      <li key={`${obj.title}-${obj.id}`}>
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
                      Understanding the Home Page
                    </h1>
                    <div className="text-left space-y-6 leading-relaxed text-base">
                      <p>
                        The <strong>Home Page</strong> is your central hub for
                        exploring South African languages on Marito. It provides
                        quick access to interactive features, random term
                        discovery, your profile, and information about the DSFSI
                        initiative.
                      </p>
                      <p>
                        The layout is designed to be clean and intuitive, making
                        it easy to navigate and explore language-related
                        content.
                      </p>
                    </div>
                  </section>

                  {HomeContent.map((obj) => {
                    return (
                      <Fragment key={`${obj.title}-${obj.id}`}>
                        <HelpNodeSection
                          id={obj.id}
                          title={obj.title}
                          content={obj.content}
                          assetLocation={obj.assetLocation}
                        />
                        <br />
                      </Fragment>
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

export default HomeHelp;
