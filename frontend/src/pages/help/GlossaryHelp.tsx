import React, { Fragment } from 'react';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { HelpNodeSection } from './HelpSection.tsx';
import { GlossaryContent } from './utils/GlossaryUtils.tsx';

export const GlossaryHelp: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  // Go back safely under HashRouter
  const goBack = () => {
    window.location.hash = '#/help';
  };

  // Smooth scroll to internal section IDs
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
                      Understanding Glossaries
                    </button>
                  </li>
                  {GlossaryContent.map((obj) => (
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
                      Understanding Glossaries
                    </h1>
                    <div className="text-left space-y-6 leading-relaxed text-base">
                      <p>
                        Glossaries in Marito are organized into{' '}
                        <strong>categories</strong>. Selecting a category will
                        show you all related terms with their definitions and
                        multilingual equivalents. This makes it easier to
                        explore vocabulary in a specific context or focus on
                        domain-specific translations.
                      </p>
                    </div>
                  </section>

                  {GlossaryContent.map((obj) => (
                    <Fragment key={`${obj.title}-${obj.id}`}>
                      <HelpNodeSection
                        id={obj.id}
                        title={obj.title}
                        content={obj.content}
                        assetLocation={obj.assetLocation}
                      />
                      <br />
                    </Fragment>
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

export default GlossaryHelp;
