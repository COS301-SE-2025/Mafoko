import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { LearningPathContent } from './utils/FeedbackUtils.tsx';
import { HelpNodeSection } from './HelpSection.tsx';

const LearningPathPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();

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
                    <a href="#intro">Understanding Learning Paths</a>
                  </li>
                  {LearningPathContent.map((obj) => {
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
                      Understanding Learning Paths
                    </h1>
                    <p>
                      The <strong>Learning Path</strong> feature lets you design
                      a guided journey for learning one of South Africa’s
                      official languages. By selecting a language and choosing
                      the resources you want to study, you can follow a
                      structured path rather than exploring at random.
                    </p>
                    <p>
                      Each learning path combines glossaries, practice tools,
                      and progress tracking to help you stay motivated and
                      consistent.
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
                        <source src="/Marito/videos/learning-path/learning-path-overview.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </section>

                  {LearningPathContent.map((obj) => {
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

export default LearningPathPage;
