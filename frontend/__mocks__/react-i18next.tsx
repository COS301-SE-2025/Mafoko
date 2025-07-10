// __mocks__/react-i18next.tsx
import React from 'react';

// Mock useTranslation hook
export const useTranslation = () => {
  return {
    t: (key: string) => {
      // Return a simple mapping for our test cases
      const translations: Record<string, string> = {
        'searchPage.language': 'Language',
        'searchPage.domain': 'Domain',
        'searchPage.fuzzySearch': 'Fuzzy Search',
        'searchPage.noResults': 'No results found for {{term}}',
        'searchPage.loading': 'Loading...',
        'searchPage.showAll': 'Show All',
        'searchPage.showTermsWithLetter': 'Show terms starting with {{letter}}',
        'searchPage.pagination.previous': 'Previous',
        'searchPage.pagination.next': 'Next',
        'searchPage.pagination.pageInfo': 'Page {{current}} of {{total}}'
      };
      
      // Handle interpolation for simple cases
      if (key.includes('{{term}}')) {
        return key.replace('{{term}}', '');
      }
      
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: () => new Promise(() => {}),
      language: 'en',
    },
  };
};

// Mock Trans component
export const Trans = ({ i18nKey, children }: { i18nKey: string, children?: React.ReactNode }) => {
  return <>{children || i18nKey}</>;
};

export default {
  useTranslation,
  Trans,
};
