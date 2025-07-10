// src/i18n.tsx (Corrected)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: [
      'en',
      'zu',
      'af',
      'st',
      'xh',
      'nso',
      'tn',
      'ss',
      've',
      'ts',
      'nr',
    ],
    fallbackLng: 'en',
    debug: true, // Enable debug to see what's happening with translations
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/Mavito/locales/{{lng}}/{{ns}}.json',
      addPath: '/Mavito/locales/add/{{lng}}/{{ns}}',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
    },
  })
  .then(() => {
    console.log('i18next has been initialized successfully.');
    console.log('Current language:', i18n.language);
    console.log('Available languages:', i18n.languages);
  })
  .catch((err: unknown) => {
    let errorMessage =
      'An unknown error occurred during i18next initialization.';
    if (err instanceof Error) {
      errorMessage = `Error initializing i18next: ${err.message}`;
    }
    console.error(errorMessage, err);
  });

export default i18n;
