import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { HelpNodeSection } from './HelpSection.tsx';
import { SectionProps } from './types.ts';
import { useTranslation } from 'react-i18next';

const LearningPathPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const LearningPathContent: SectionProps[] = [
    {
      id: 'select-glossary',
      title: t('leaningPathHelp.section4Title'),
      content: <p>{t('leaningPathHelp.section4')}</p>,
      assetLocation: '',
    },
    {
      id: 'study-methods',
      title: t('leaningPathHelp.section10'),
      content: (
        <div>
          <p>{t('leaningPathHelp.section5')}:</p>
          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
            <li>
              <strong>{t('leaningPathHelp.section6')}:</strong>
              {t('leaningPathHelp.section7')}
            </li>
            <li>
              <strong>{t('leaningPathHelp.section8')}:</strong>{' '}
              {t('leaningPathHelp.section9')}
            </li>
          </ul>
        </div>
      ),
      assetLocation: '',
    },
    {
      id: 'progress',
      title: t('leaningPathHelp.section11'),
      content: (
        <div>
          <p>{t('leaningPathHelp.section12')}</p>
          <p>{t('leaningPathHelp.section13')}</p>
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
        {/* Top bar */}
        <div className="article-top-bar">
          <button
            type="button"
            className="article-theme-toggle-btn"
            onClick={() => void navigate('/help')}
          >
            {t('common.back')}
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
                      onClick={() => {
                        scrollToSection('intro');
                      }}
                      className="text-left hover:text-theme transition-colors"
                    >
                      {t('leaningPathHelp.title')}
                    </button>
                  </li>
                  {LearningPathContent.map((obj) => (
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

              {/* Main content */}
              <div className="article-content article-scrollable-content">
                <div className="p-6 max-w-4xl mx-auto space-y-12 text-base leading-relaxed text-left">
                  {/* Intro section */}
                  <section id="intro">
                    <h1 className="text-3xl font-bold text-theme mb-4">
                      {t('leaningPathHelp.title')}
                    </h1>
                    <p>{t('leaningPathHelp.section1')}</p>
                    <p>{t('leaningPathHelp.section2')}</p>

                    <div
                      className="video-container"
                      style={{ paddingBottom: '30px' }}
                    >
                      <video
                        controls
                        width="100%"
                        style={{
                          maxWidth: '800px',
                          marginTop: '2rem',
                          borderRadius: '0.75rem',
                        }}
                      >
                        <source
                          src="/Mafoko/videos/learning-path/learning-path-overview.mp4"
                          type="video/mp4"
                        />
                        {t('leaningPathHelp.section3')}
                      </video>
                    </div>
                  </section>

                  {/* Dynamic help sections */}
                  {LearningPathContent.map((obj) => (
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

export default LearningPathPage;
