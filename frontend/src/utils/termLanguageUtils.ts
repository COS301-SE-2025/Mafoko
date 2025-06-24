import { Term, TermTranslations } from '../types/glossaryTypes';

/**
 * Determine the language of a term by checking if it exists in a translations object
 * @param term The term object
 * @param allTermsTranslations Cache of translation data for all terms
 * @returns The determined language or a fallback
 */
export const determineTermLanguage = (
  term: Term,
  allTermsTranslations: Record<string, TermTranslations | null>,
): string => {
  // If the term already has a language specified, use it
  if (term.language) {
    return term.language;
  }

  // Try to find the term in our translations cache
  const termTranslations = allTermsTranslations[term.id];

  if (termTranslations) {
    // Check if the term exists as a translation in any language
    for (const [language, translatedTerm] of Object.entries(
      termTranslations.translations,
    )) {
      if (translatedTerm === term.term) {
        return language;
      }
    }

    // If term doesn't match any translation, it's likely in the original language
    // (which is not included in translations object)
    return 'Original'; // Or another default like "Source Language"
  }

  // If we have no translations data, return a default
  return 'Not specified';
};
