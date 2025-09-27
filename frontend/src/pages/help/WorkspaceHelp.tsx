import React, { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { HelpNodeSection } from './HelpSection.tsx';
import { WorkspaceContent } from './utils/WorkspaceUtils.tsx';

export const WorkspaceHelp: React.FC = () => {
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
                    <a href="#intro">Understanding the Workspace</a>
                  </li>
                  {WorkspaceContent.map((obj) => {
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
                      Understanding the Workspace
                    </h1>
                    <div className="text-left space-y-6 leading-relaxed text-base">
                      <p>
                        The <strong>Workspace</strong> allows you to save terms
                        and glossaries you’re interested in, organize them into
                        groups, and manage those groups. It’s also where you can
                        track the progress of your term submissions and keep
                        notes related to your work.
                      </p>
                    </div>
                  </section>

                  {WorkspaceContent.map((obj) => {
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

export default WorkspaceHelp;
