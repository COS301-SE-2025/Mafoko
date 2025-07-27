// src/components/LanguageSwitcher.tsx (Corrected and Complete)
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/LanguageSwitcher.css';

const appSupportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'zu', name: 'isiZulu' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'st', name: 'Sesotho' },
  { code: 'xh', name: 'isiXhosa' },
  { code: 'nso', name: 'Sepedi' },
  { code: 'tn', name: 'Setswana' },
  { code: 'ss', name: 'Siswati' },
  { code: 've', name: 'Tshivenda' },
  { code: 'ts', name: 'Xitsonga' },
  { code: 'nr', name: 'isiNdebele' },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      document.documentElement.lang = languageCode;
      localStorage.setItem('i18nextLng', languageCode);
      setIsOpen(false); // Close dropdown after selection
    } catch (err) {
      console.error('Error changing language:', err);
    }
  };

  return (
    <div className="language-switcher-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="language-switcher-button"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('languageSwitcher.selectLanguage', 'Select Language')}
      >
        🌐
      </button>

      {isOpen && (
        <div className="language-dropdown-menu" role="menu">
          {appSupportedLanguages.map((lang) => (
            <a
              key={lang.code}
              href="#"
              className={`language-dropdown-item ${i18n.resolvedLanguage === lang.code ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                // We now call the async function
                void handleLanguageChange(lang.code);
              }}
              role="menuitem"
            >
              {lang.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
