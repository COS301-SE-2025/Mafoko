import React from 'react';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { HelpNodeSection } from './HelpSection.tsx';
import { FeedbackContent } from './utils/FeedbackUtils.tsx';

export const FeedbackHelp: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  // Navigate safely under HashRouter
  const goBack = () => {
    window.location.hash = '#/help';
  };

  // Smoothly scroll to sections by ID
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
                      className="!text-theme text-left hover:text-theme focus:outline-none"
                    >
                      Understanding Feedback
                    </button>
                  </li>
                  {FeedbackContent.map((obj) => (
                    <li key={`${obj.title}-${obj.id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          handleScrollTo(obj.id);
                        }}
                        className="text-theme! text-left hover:text-theme focus:outline-none"
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
                      Understanding Feedback
                    </h1>
                    <div className="text-left space-y-6 leading-relaxed text-base">
                      <p>
                        The <strong>Feedback</strong> page allows you to share{' '}
                        <strong>complaints</strong>,{' '}
                        <strong>compliments</strong>, or{' '}
                        <strong>suggestions</strong> with the administrators.
                      </p>
                      <p>
                        You can submit feedback <em>anonymously</em> or include
                        your contact details if you’d like someone to follow up
                        with you. The submission process is the same for all
                        types of feedback.
                      </p>
                    </div>
                  </section>

                  {FeedbackContent.map((obj) => (
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

export default FeedbackHelp;
