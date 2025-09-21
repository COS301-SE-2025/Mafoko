import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { HelpNodeSection } from './HelpSection.tsx';
import { CommunityContent } from './utils/FeedbackUtils.tsx';

export const CommunityHelpPage: React.FC = () => {
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
                    <a href="#intro">Collaboration in Marito</a>
                  </li>
                  {CommunityContent.map((obj) => {
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
                      Collaboration in Marito
                    </h1>
                    <div className="text-left space-y-6 leading-relaxed text-base">
                      <p>
                        The <strong>Community</strong> features in Marito let
                        you interact with other users by commenting on terms,
                        voting on contributions, and participating in
                        challenges. Every action you take helps grow your
                        <strong> community level</strong> and reflects your
                        involvement in building the multilingual lexicon.
                      </p>
                    </div>
                  </section>

                  {CommunityContent.map((obj) => {
                    return (
                      <HelpNodeSection
                        key={`${obj.title}-${obj.id}`}
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

export default CommunityHelpPage;
