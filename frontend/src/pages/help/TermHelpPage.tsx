import React, { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { HelpNodeSection } from './HelpSection.tsx';
import { SectionProps } from './types.ts';
import { useTranslation } from 'react-i18next';

const TermHelpPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const { t } = useTranslation();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const DictionaryContent: SectionProps[] = [
    {
      id: 'overview',
      title: t('termHelpPage.overviewTitle'),
      content: (
        <div
          dangerouslySetInnerHTML={{ __html: t('termHelpPage.overviewBody') }}
        />
      ),
      assetLocation: '',
    },
    {
      id: 'what-is-a-term',
      title: t('termHelpPage.whatIsATermTitle'),
      content: (
        <div>
          <p>{t('termHelpPage.whatIsATermBody')}</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>{t('termHelpPage.termFields.term')}</li>
            <li>{t('termHelpPage.termFields.language')}</li>
            <li>{t('termHelpPage.termFields.domain')}</li>
            <li>{t('termHelpPage.termFields.definition')}</li>
            <li>{t('termHelpPage.termFields.related')}</li>
          </ul>
        </div>
      ),
      assetLocation: '/Mafoko/videos/search/search-overview.mp4',
    },
    {
      id: 'languages',
      title: t('termHelpPage.languagesTitle'),
      content: (
        <div>
          <p>{t('termHelpPage.languagesBody')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm mt-3">
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-call */}
            {t('termHelpPage.languagesList', { returnObjects: true }).map(
              (lang: string) => (
                <div key={lang} className="px-3 py-1 rounded bg-theme">
                  {lang}
                </div>
              ),
            )}
          </div>
        </div>
      ),
      assetLocation: '',
    },
    {
      id: 'search',
      title: t('termHelpPage.searchTitle'),
      content: (
        <div>
          <h2 className="text-2xl font-semibold text-theme mb-3">
            {t('termHelpPage.searchSubheadingHow')}
          </h2>
          <p>{t('termHelpPage.searchBody1')}</p>
          <p>{t('termHelpPage.searchBody2')}</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>{t('termHelpPage.searchFields.term')}</li>
            <li>{t('termHelpPage.searchFields.definition')}</li>
            <li>{t('termHelpPage.searchFields.filters')}</li>
          </ul>
          <h3 className="text-lg font-medium mt-4">
            {t('termHelpPage.searchSubheadingLive')}
          </h3>
          <p>{t('termHelpPage.searchLiveBody')}</p>
          <h3 className="text-lg font-medium mt-4">
            {t('termHelpPage.searchSubheadingSensitivity')}
          </h3>
          <p>{t('termHelpPage.searchSensitivityBody')}</p>
          <h3 className="text-lg font-medium mt-4">
            {t('termHelpPage.searchSubheadingResultCards')}
          </h3>
          <p>{t('termHelpPage.searchResultBody')}</p>
        </div>
      ),
      assetLocation: '/Mafoko/videos/search/search-live.mp4',
    },
    {
      id: 'filters',
      title: t('termHelpPage.filtersTitle'),
      content: (
        <div>
          <p>{t('termHelpPage.filtersBody')}</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>{t('termHelpPage.filtersList.language')}</li>
            <li>{t('termHelpPage.filtersList.domain')}</li>
            <li>{t('termHelpPage.filtersList.fuzzy')}</li>
          </ul>
        </div>
      ),
      assetLocation: '/Mafoko/videos/search/search-filter.mp4',
    },
    {
      id: 'view',
      title: t('termHelpPage.viewTitle'),
      content: <p>{t('termHelpPage.viewBody')}</p>,
      assetLocation: '/Mafoko/videos/search/search-view-card.mp4',
    },
    {
      id: 'offline-use',
      title: t('termHelpPage.offlineTitle'),
      content: (
        <div>
          <p>{t('termHelpPage.offlineBody')}</p>
          <h3 className="text-lg font-medium mt-3">
            {t('termHelpPage.offlineHow')}
          </h3>
          <ol className="list-decimal list-inside ml-4 space-y-1">
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-call */}
            {t('termHelpPage.offlineSteps', { returnObjects: true }).map(
              (step: string, i: number) => (
                <li key={i}>{step}</li>
              ),
            )}
          </ol>
          <p className="mt-2">{t('termHelpPage.offlineEnd')}</p>
        </div>
      ),
      assetLocation: '',
    },
  ];

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
                <h2 className="article-h2">{t('termHelpPage.onThisPage')}</h2>
                <ul className="text-left space-y-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        scrollToSection('intro');
                      }}
                      className="text-left hover:text-theme transition-colors"
                    >
                      {t('termHelpPage.title')}
                    </button>
                  </li>
                  {DictionaryContent.map((obj) => (
                    <li key={`${obj.title}-${obj.id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          scrollToSection(obj.id);
                        }}
                        className="text-left hover:text-theme transition-colors"
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
                      {t('termHelpPage.title')}
                    </h1>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: t('termHelpPage.intro'),
                      }}
                    />
                  </section>

                  {DictionaryContent.map((obj) => {
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

export default TermHelpPage;
