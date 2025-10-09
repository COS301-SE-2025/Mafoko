import React, { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { HelpNodeSection } from './HelpSection.tsx';
import { SectionProps } from './types.ts';
import { useTranslation } from 'react-i18next';

export const WorkspaceHelp: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const WorkspaceContent: SectionProps[] = [
    {
      id: 'groups',
      title: t('workspaceHelpPage.groupsTitle'),
      content: (
        <div className="space-y-6 leading-relaxed text-base">
          <p>{t('workspaceHelpPage.groupsBody')}</p>
          <ol className="list-decimal list-inside space-y-2 mt-1">
            {t('workspaceHelpPage.groupsSteps', { returnObjects: true }).map(
              (step: string, i: number) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
              )
            )}
          </ol>
        </div>
      ),
      assetLocation: '/Mafoko/videos/workspace.mp4',
    },
    {
      id: 'move-terms',
      title: t('workspaceHelpPage.moveTitle'),
      content: (
        <div
          className="space-y-6 leading-relaxed text-base"
          dangerouslySetInnerHTML={{
            __html: t('workspaceHelpPage.moveBody'),
          }}
        />
      ),
      assetLocation: '',
    },
    {
      id: 'notes',
      title: t('workspaceHelpPage.notesTitle'),
      content: (
        <div className="space-y-6 leading-relaxed text-base">
          <p>{t('workspaceHelpPage.notesBody')}</p>
          <ol className="list-decimal list-inside space-y-2 mt-1">
            {t('workspaceHelpPage.notesSteps', { returnObjects: true }).map(
              (step: string, i: number) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
              )
            )}
          </ol>
        </div>
      ),
      assetLocation: '',
    },
    {
      id: 'delete-items',
      title: t('workspaceHelpPage.deleteTitle'),
      content: (
        <div className="space-y-6 leading-relaxed text-base">
          <p>{t('workspaceHelpPage.deleteBody')}</p>
          <ol className="list-decimal list-inside space-y-2 mt-1">
            {t('workspaceHelpPage.deleteSteps', { returnObjects: true }).map(
              (step: string, i: number) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
              )
            )}
          </ol>
        </div>
      ),
      assetLocation: '',
    },
  ];

  return (
    <div>
      <div
        className={`article-fixed-background ${
          isDarkMode ? 'theme-dark' : 'theme-light'
        }`}
      >
        <div className="article-top-bar">
          <button
            type="button"
            className="article-theme-toggle-btn"
            onClick={() => { navigate('/help')}}
          >
            {t('common.back')}
          </button>
        </div>

        <div
          className={`article-container ${
            isDarkMode ? 'theme-dark' : 'theme-light'
          }`}
        >
          <section className="article-section">
            <div className="article-section-inner">
              {/* Sidebar */}
              <aside className="article-section-sidebar">
                <h2 className="article-h2">{t('common.onThisPage')}</h2>
                <ul className="text-left">
                  <li>
                    <button
                      type="button"
                      onClick={() => {scrollToSection('intro')}}
                      className="text-left hover:text-theme transition-colors"
                    >
                      {t('workspaceHelpPage.title')}
                    </button>
                  </li>
                  {WorkspaceContent.map((obj) => (
                    <li key={`${obj.title}-${obj.id}`}>
                      <button
                        type="button"
                        onClick={() => {scrollToSection(obj.id)}}
                        className="text-left hover:text-theme transition-colors"
                      >
                        {obj.title}
                      </button>
                    </li>
                  ))}
                </ul>

              </aside>

              {/* Main content */}
              <div className="article-content article-scrollable-content">
                <div className="p-6 max-w-4xl mx-auto space-y-12 text-base leading-relaxed text-left">
                  <section id="intro">
                    <h1 className="text-3xl font-bold text-theme mb-4">
                      {t('workspaceHelpPage.title')}
                    </h1>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: t('workspaceHelpPage.intro'),
                      }}
                    />
                  </section>

                  {WorkspaceContent.map((obj) => (
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

export default WorkspaceHelp;
