import React, { Fragment } from 'react';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { HelpNodeSection } from './HelpSection.tsx';
import { HomeContent } from './utils/FeedbackUtils.tsx';

export const HomeHelp: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  // Navigate safely under HashRouter
  const goBack = () => {
    window.location.hash = '#/help';
  };

  // Smooth scroll to section by ID
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
                      Understanding the Home Page
                    </button>
                  </li>
                  {HomeContent.map((obj) => (
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

                  {HomeContent.map((obj) => (
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

export default HomeHelp;
