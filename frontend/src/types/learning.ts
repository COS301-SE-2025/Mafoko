/**
 * Represents a single glossary selected within a saved learning path.
 */
export interface LearningPathGlossary {
  glossary_name: string;
}

/**
 * Represents a user's saved learning path object received from the API.
 */
export interface LearningPath {
  id: string; // Changed from UUID
  path_name: string;
  language_name: string;
  selected_glossaries: LearningPathGlossary[];
  completedPercentage?: number;
}

/**
 * The shape of data needed to create a new learning path.
 */
export interface LearningPathCreate {
  path_name: string;
  language_name: string;
  glossary_names: string[];
}

/**
 * Represents progress for a single language across the entire glossary.
 */
export interface LanguageProgress {
  code: string;
  name: string;
  totalWords: number;
  completedPercentage: number;
}

/**
 * The shape of a single word in a study session.
 */
export interface Word {
  id: string; // Changed from UUID
  term: string;
  definition: string;
  english_translation?: string; // Optional English translation
}

/**
 * The full data package for a study session (words view/flashcards).
 */
export interface StudySession {
  words: Word[];
  knownWordIds: string[];
  lastCardIndex: number;
  retryPileIds: string[]; // Add this field
}
/**
 * Represents a single glossary with its progress.
 */
export interface GlossaryProgress {
  id: string;
  name: string;
  words: number;
  completedPercentage: number;
}
