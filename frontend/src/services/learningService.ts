import axios from 'axios';
import { API_ENDPOINTS } from '../config';
import {
  LearningPath,
  LearningPathCreate,
  StudySession,
  GlossaryProgress,
  LanguageProgress,
} from '../types/learning';
import { Word } from '../types/learning';

const learningApiClient = axios.create();

learningApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(new Error(String(error))),
);

export const getLearningPaths = async (): Promise<LearningPath[]> => {
  const response = await learningApiClient.get<LearningPath[]>(
    API_ENDPOINTS.learningPaths,
  );
  return response.data;
};

export const createLearningPath = async (
  pathData: LearningPathCreate,
): Promise<LearningPath> => {
  const response = await learningApiClient.post<LearningPath>(
    API_ENDPOINTS.learningPaths,
    pathData,
  );
  return response.data;
};

export const deleteLearningPath = async (pathId: string): Promise<void> => {
  await learningApiClient.delete(API_ENDPOINTS.learningPathDetail(pathId));
};

export const updateLearningPath = async (
  pathId: string,
  glossaryNames: string[],
): Promise<LearningPath> => {
  const response = await learningApiClient.put<LearningPath>(
    API_ENDPOINTS.learningPathDetail(pathId),
    {
      glossary_names: glossaryNames,
    },
  );
  return response.data;
};

export const getGlossariesForLanguage = async (
  languageName: string,
): Promise<GlossaryProgress[]> => {
  const response = await learningApiClient.get<GlossaryProgress[]>(
    API_ENDPOINTS.getGlossaryProgress(languageName),
  );
  return response.data;
};

export const getStudySession = async (
  languageName: string,
  glossaryName: string,
): Promise<StudySession> => {
  const response = await learningApiClient.get<StudySession>(
    API_ENDPOINTS.getStudySessionWords(languageName, glossaryName),
  );
  return response.data;
};

export const updateProgress = async (termId: string): Promise<void> => {
  await learningApiClient.post(API_ENDPOINTS.updateLearningProgress, {
    term_id: termId,
    is_correct: true,
  });
};

export const getDashboard = async (): Promise<LanguageProgress[]> => {
  try {
    const response = await learningApiClient.get<LanguageProgress[]>(
      API_ENDPOINTS.getLearningDashboard,
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching global learning dashboard:', error);
    throw error;
  }
};

export const getRandomTerms = async (languageName: string): Promise<Word[]> => {
  const response = await learningApiClient.get<Word[]>(
    API_ENDPOINTS.getRandomTerms(languageName),
  );
  return response.data;
};

export const getWordCounts = async (
  languageName: string,
  glossaryNames: string[],
): Promise<Record<string, number>> => {
  const response = await learningApiClient.post<Record<string, number>>(
    API_ENDPOINTS.getWordCounts,
    { language_name: languageName, glossary_names: glossaryNames },
  );
  return response.data;
};

/**
 * Saves the user's last position in a flashcard deck.
 * @param languageName The name of the language for the session.
 * @param glossaryName The name of the glossary for the session.
 * @param lastCardIndex The index of the card the user was on.
 */
export const updateSessionProgress = async (
  languageName: string,
  glossaryName: string,
  lastCardIndex: number,
  retryPileIds: string[],
): Promise<void> => {
  await learningApiClient.post(API_ENDPOINTS.updateSessionProgress, {
    language_name: languageName,
    glossary_name: glossaryName,
    last_card_index: lastCardIndex,
    retry_pile_ids: retryPileIds,
  });
};
