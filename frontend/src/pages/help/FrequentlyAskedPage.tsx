import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Article.scss';
import { useDarkMode } from '../../components/ui/DarkModeComponent.tsx';
import { faqs } from './types.ts';

const FrequentlyAskedPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const groupedFaqs = faqs.reduce<Record<string, typeof faqs>>((acc, faq) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

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
                <h2 className="article-h2">FAQs</h2>
                {Object.entries(groupedFaqs).map(([category, items]) => (
                  <div key={category} className="mb-12">
                    <h2 className="article-h2">{category}</h2>
                    {items.map((faq) => (
                      <section id={faq.id} key={faq.id} className="mb-10">
                        <a className="!text-theme" href={`#${faq.id}`}>
                          {faq.question}
                        </a>
                      </section>
                    ))}
                  </div>
                ))}
              </aside>

              <div className="article-content article-scrollable-content">
                <div className="p-6 max-w-4xl mx-auto space-y-12 text-base leading-relaxed text-left">
                  <h1>Frequently Asked Questions</h1>
                  {faqs.map((faq) => (
                    <section id={faq.id} key={faq.id} className="mb-10">
                      <h3 className="text-2xl font-semibold text-theme mb-3">
                        {faq.question}
                      </h3>
                      <p className="mb-2">{faq.answer}</p>
                    </section>
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

export default FrequentlyAskedPage;
