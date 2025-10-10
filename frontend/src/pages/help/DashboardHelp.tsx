import React from 'react';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { HelpNodeSection } from './HelpSection.tsx';
import { DashboardContent } from './utils/FeedbackUtils.tsx';

export const DashboardHelp: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  // Safe back navigation under HashRouter
  const goBack = () => {
    window.location.hash = '#/help';
  };

  // Smooth scroll behavior for in-page navigation
  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div>
      <div
        className={`article-fixed-background ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
      >
        <div className="article-top-bar">
          <button
            type="button"
            className="article-theme-toggle-btn"
            onClick={goBack}
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
                    <button
                      type="button"
                      onClick={() => {
                        handleScrollTo('intro');
                      }}
                      className=" text-left hover:text-theme focus:outline-none"
                    >
                      Understanding the Dashboard
                    </button>
                  </li>
                  {DashboardContent.map((obj) => (
                    <li key={`${obj.title}-${obj.id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          handleScrollTo(obj.id);
                        }}
                        className=" text-left hover:text-theme focus:outline-none"
                      >
                        {obj.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>

              <div className="article-content article-scrollable-content">
                <div className="p-6 max-w-4xl mx-auto space-y-12 text-base leading-relaxed text-left">
                  <section id="intro">
                    <h1 className="text-3xl font-bold text-theme mb-4">
                      Understanding the Dashboard
                    </h1>
                    <div className="text-left space-y-6 leading-relaxed text-base">
                      <p>
                        The <strong>Dashboard</strong> provides a central view
                        of your activity on Marito. It brings together usage
                        statistics, contribution history, and progress tracking,
                        giving you a clear picture of how you’re engaging with
                        the platform.
                      </p>
                    </div>
                  </section>

                  {DashboardContent.map((obj) => (
                    <HelpNodeSection
                      key={`${obj.title}-${obj.id}`}
                      id={obj.id}
                      title={obj.title}
                      content={obj.content}
                      assetLocation={obj.assetLocation}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardHelp;
