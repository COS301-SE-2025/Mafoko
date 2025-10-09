import React, { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { HelpNodeSection } from './HelpSection.tsx';
import { SettingsContent } from './utils/SettingsUtils';

export const SettingsHelp: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div>
      <div
        className={`article-fixed-background ${
          isDarkMode ? 'theme-dark' : 'theme-light'
        }`}
      >
        {/* Top bar */}
        <div className="article-top-bar">
          <button
            type="button"
            className="article-theme-toggle-btn"
            onClick={() => navigate('/help')}
          >
            Back
          </button>
        </div>

        {/* Main container */}
        <div
          className={`article-container ${
            isDarkMode ? 'theme-dark' : 'theme-light'
          }`}
        >
          <section className="article-section">
            <div className="article-section-inner">
              {/* Sidebar with scroll buttons */}
              <aside className="article-section-sidebar">
                <h2 className="article-h2">On this page</h2>
                <ul className="text-left space-y-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollToSection('intro')}
                      className="text-left hover:text-theme transition-colors"
                    >
                      Settings & Customization
                    </button>
                  </li>
                  {SettingsContent.map((obj) => (
                    <li key={`${obj.title}-${obj.id}`}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(obj.id)}
                        className="text-left hover:text-theme transition-colors"
                      >
                        {obj.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>

              {/* Main scrollable content */}
              <div className="article-content article-scrollable-content">
                <div className="p-6 max-w-4xl mx-auto space-y-12 text-base leading-relaxed text-left">
                  <section id="intro">
                    <h1 className="text-3xl font-bold text-theme mb-4">
                      Settings & Customization
                    </h1>
                    <div className="text-left space-y-6 leading-relaxed text-base">
                      <p>
                        Use the <strong>Settings</strong> page to adjust your
                        preferences — including theme, profile details, and
                        accessibility — to create the best experience for you.
                      </p>
                    </div>
                  </section>

                  {SettingsContent.map((obj) => (
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

export default SettingsHelp;
