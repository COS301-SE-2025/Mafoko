import React, { useState, useEffect } from 'react';
import Flashcard from '../components/learning/Flashcard';
import WordsPanel from '../components/learning/WordsPanel';
import LearningPathList from '../components/learning/LearningPathList';
import ConfirmationModal from '../components/ui/ConfirmationModal';

import { useDarkMode } from '../components/ui/DarkModeComponent';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';

import * as learningService from '../services/learningService';
import {
  LearningPath,
  GlossaryProgress,
  StudySession,
  Word,
  LanguageProgress,
} from '../types/learning';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.tsx';
import { toast } from 'sonner';
import { LearningPathGlossaryList } from '../components/ui/LearningPathGlossaryList.tsx';
import { useTranslation } from 'react-i18next';

const LearningPathPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<
    'paths' | 'glossaries' | 'words'
  >('paths');

  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [selectedGlossary, setSelectedGlossary] =
    useState<GlossaryProgress | null>(null);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [distractorTerms, setDistractorTerms] = useState<Word[]>([]);
  const [glossaryWordCounts, setGlossaryWordCounts] = useState<
    Record<string, number>
  >({});

  const [showNewPathModal, setShowNewPathModal] = useState(false);
  const [modalPathName, setModalPathName] = useState('');
  const [modalLanguage, setModalLanguage] = useState('');
  const [modalGlossaries, setModalGlossaries] = useState<GlossaryProgress[]>(
    [],
  );
  const [modalSelectedGlossaries, setModalSelectedGlossaries] = useState<
    Set<string>
  >(new Set());
  const [availableLanguages, setAvailableLanguages] = useState<
    LanguageProgress[]
  >([]);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pathToDelete, setPathToDelete] = useState<string | null>(null);

  const [knownWords, setKnownWords] = useState<Set<string>>(new Set());
  const [flashcardMode, setFlashcardMode] = useState<boolean>(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });
  const [retryPile, setRetryPile] = useState<Word[]>([]);

  const [activeMenuItem, setActiveMenuItem] = useState('learning-path');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const fetchUserPaths = async () => {
    setIsLoading(true);
    try {
      const paths = await learningService.getLearningPaths();
      setLearningPaths(paths);
    } catch (error) {
      console.error('Failed to load learning paths.', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchUserPaths();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getProficiencyLevel = (percentage: number): string => {
    if (percentage >= 80) return 'Advanced';
    if (percentage >= 40) return 'Intermediate';
    return 'Beginner';
  };

  const overallProgressPercentage = Math.round(
    learningPaths.reduce((sum, p) => sum + (p.completedPercentage || 0), 0) /
      (learningPaths.length || 1),
  );

  const handleOpenCreateModal = async () => {
    try {
      const dashboardData = await learningService.getDashboard();
      setAvailableLanguages(dashboardData);
      setModalPathName('');
      setModalLanguage('');
      setModalGlossaries([]);
      setModalSelectedGlossaries(new Set());
      setShowNewPathModal(true);
    } catch (error) {
      console.error('Failed to get data for modal.', error);
    }
  };

  const handleModalLanguageChange = async (langName: string) => {
    setModalLanguage(langName);
    setModalSelectedGlossaries(new Set());
    if (langName) {
      try {
        const glossariesForLang =
          await learningService.getGlossariesForLanguage(langName);
        setModalGlossaries(glossariesForLang);
      } catch (error) {
        setModalGlossaries([]);
        console.error('Failed to get glossaries for language.', error);
      }
    } else {
      setModalGlossaries([]);
    }
  };

  const handleGlossaryToggle = (glossaryName: string) => {
    setModalSelectedGlossaries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(glossaryName)) newSet.delete(glossaryName);
      else newSet.add(glossaryName);
      return newSet;
    });
  };

  const handleCreatePath = async () => {
    if (
      !modalPathName ||
      !modalLanguage ||
      modalSelectedGlossaries.size === 0
    ) {
      toast('Submission Failed', {
        description:
          'Please fill out all fields and select at least one glossary.',
      });
      return;
    }
    try {
      await learningService.createLearningPath({
        path_name: modalPathName,
        language_name: modalLanguage,
        glossary_names: Array.from(modalSelectedGlossaries),
      });
      setShowNewPathModal(false);
      void fetchUserPaths();
    } catch (error) {
      console.error('Failed to create learning path', error);
    }
  };

  const handleDeletePath = (pathId: string) => {
    setPathToDelete(pathId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (pathToDelete) {
      try {
        await learningService.deleteLearningPath(pathToDelete);
        void fetchUserPaths();
      } catch (error) {
        console.error(`Failed to delete path ${pathToDelete}`, error);
      } finally {
        setIsConfirmModalOpen(false);
        setPathToDelete(null);
      }
    }
  };

  const handleSelectPath = async (path: LearningPath) => {
    setSelectedPath(path);
    setCurrentView('glossaries');
    try {
      const glossaryNames = path.selected_glossaries.map(
        (g) => g.glossary_name,
      );
      if (glossaryNames.length > 0) {
        const counts = await learningService.getWordCounts(
          path.language_name,
          glossaryNames,
        );
        setGlossaryWordCounts(counts);
      }
    } catch (error) {
      console.error('Failed to fetch word counts', error);
      setGlossaryWordCounts({});
    }
  };

  const handleGlossarySelect = async (
    glossary: GlossaryProgress,
    startWithFlashcards: boolean,
  ) => {
    if (!selectedPath) return;
    setSelectedGlossary(glossary);
    setCurrentView('words');
    try {
      const [sessionData, randomTerms] = await Promise.all([
        learningService.getStudySession(
          selectedPath.language_name,
          glossary.name.trim(),
        ),
        learningService.getRandomTerms(selectedPath.language_name),
      ]);
      setStudySession(sessionData);
      setDistractorTerms(randomTerms);
      setKnownWords(new Set(sessionData.knownWordIds));

      const initialRetryPile = sessionData.words.filter((w) =>
        // eslint-disable-next-line
        (sessionData.retryPileIds || []).includes(w.id),
      );

      if (startWithFlashcards) {
        startFlashcards(
          sessionData.words,
          sessionData.lastCardIndex || 0,
          initialRetryPile,
        );
      }
    } catch (error) {
      console.error(
        `Failed to load study session for ${glossary.name}.`,
        error,
      );
    }
  };

  const handleFlashcardCorrect = async (termId: string) => {
    try {
      await learningService.updateProgress(termId);
      setKnownWords((prev) => new Set([...prev, termId]));
    } catch (error) {
      console.error(`Failed to update progress for term ${termId}.`, error);
    }
  };

  const getCurrentCard = (): Word | null => {
    if (
      !flashcardMode ||
      !studySession ||
      currentCardIndex >= studySession.words.length
    )
      return null;
    return studySession.words[currentCardIndex];
  };

  const generateWrongAnswers = (correctAnswer: string): string[] => {
    const pool = distractorTerms
      .map((t) => t.english_translation || t.definition)
      .filter(Boolean);
    return pool
      .filter((t) => t !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  };

  const getAnswerOptions = (): string[] => {
    const currentCard = getCurrentCard();
    if (!currentCard) return [];
    const correctAnswer =
      currentCard.english_translation || currentCard.definition;
    const wrongAnswers = generateWrongAnswers(correctAnswer);
    return [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
  };

  const handleAnswerSelect = (answer: string) => {
    const currentCard = getCurrentCard();
    if (!currentCard || showResult) return;
    const correctAnswer =
      currentCard.english_translation || currentCard.definition;
    const isCorrect = answer === correctAnswer;
    setSelectedAnswer(answer);
    setShowResult(true);
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    if (isCorrect) {
      void handleFlashcardCorrect(currentCard.id);
    } else {
      setRetryPile((prev) => [...prev, currentCard]);
    }
  };

  const nextCard = () => {
    const newIndex = currentCardIndex + 1;
    if (studySession && newIndex >= studySession.words.length) {
      if (retryPile.length > 0) {
        const reviewSession = { ...studySession, words: retryPile };
        setStudySession(reviewSession);
        setRetryPile([]);
        setCurrentCardIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        return;
      } else {
        if (selectedPath && selectedGlossary) {
          void learningService.updateSessionProgress(
            selectedPath.language_name,
            selectedGlossary.name,
            0,
            [],
          );
        }
      }
    }
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentCardIndex(newIndex);
  };

  const startFlashcards = (
    words: Word[],
    startIndex: number = 0,
    initialRetry: Word[] = [],
  ) => {
    if (words.length === 0) return;
    setRetryPile(initialRetry);
    setFlashcardMode(true);
    setCurrentCardIndex(startIndex);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore({ correct: 0, total: 0 });
  };

  const exitFlashcards = () => {
    if (selectedPath && selectedGlossary) {
      const isFinished =
        currentCardIndex >= (studySession?.words.length || 0) &&
        retryPile.length === 0;

      const indexToSave = isFinished ? 0 : currentCardIndex;
      const retryIdsToSave = isFinished ? [] : retryPile.map((w) => w.id);

      void learningService.updateSessionProgress(
        selectedPath.language_name,
        selectedGlossary.name,
        indexToSave,
        retryIdsToSave,
      );
    }
    setFlashcardMode(false);
    setCurrentView('glossaries');
  };

  // eslint-disable-next-line react-x/no-nested-component-definitions
  function LearningPathMode() {
    if (currentView === 'paths') {
      return (
        <div className="flex flex-row gap-5 justify-center items-center">
          <div className="relative group inline-block">
            <span className="level-badge cursor-pointer">
              {t('learningPathPage.main.levelTitle')}:{' '}
              {getProficiencyLevel(overallProgressPercentage)}
            </span>

            {/* Tooltip */}
            <div
              className="absolute left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex flex-col gap-3 items-center !bg-[var(--bg-tir)] text-theme text-xs rounded-lg shadow-lg p-3 w-40 z-50 transition-opacity duration-200"
              style={{ padding: '5px' }}
            >
              <div className="font-semibold mb-1 text-center">
                {t('learningPathPage.main.overallProgress')}
              </div>
              <div className="w-[80%] bg-gray-700 rounded-full h-2 mb-2 ">
                <div
                  className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgressPercentage.toString()}%` }}
                />
              </div>
              <div className="opacity-80 text-center">
                {100 - overallProgressPercentage}%{' '}
                {t('learningPathPage.main.toNextLevel')}
              </div>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--bg-tir)] rotate-45" />
            </div>
          </div>

          <button
            className="bg-teal-500 text-white hover:bg-teal-600"
            onClick={() => {
              void handleOpenCreateModal();
            }}
            type="button"
          >
            <span className="new-path-button-text">
              + {t('learningPathPage.main.newPath')}
            </span>
          </button>
        </div>
      );
    } else if (currentView === 'words' && !flashcardMode && studySession) {
      return <div className="learning-path-progress-display"></div>;
    } else if (currentView === 'words' && flashcardMode && studySession) {
      return <div className="learning-path-progress-display"></div>;
    }
  }

  // eslint-disable-next-line react-x/no-nested-component-definitions
  function Modes() {
    if (currentView === 'paths') {
      return (
        <LearningPathList
          paths={learningPaths}
          onPathSelect={(p) => {
            void handleSelectPath(p);
          }}
          onPathDelete={handleDeletePath}
          isLoading={isLoading}
        />
      );
    } else if (currentView === 'glossaries' && selectedPath) {
      return (
        <LearningPathGlossaryList
          selectedPath={selectedPath}
          setCurrentView={setCurrentView}
          glossaryWordCounts={glossaryWordCounts}
          handleGlossarySelect={handleGlossarySelect}
        />
      );
    } else if (currentView === 'words' && !flashcardMode && studySession) {
      return (
        <WordsPanel
          studySession={studySession}
          knownWords={knownWords}
          onBackClick={() => {
            setCurrentView('glossaries');
          }}
        />
      );
    } else if (flashcardMode && currentView === 'words' && studySession) {
      return (
        <Flashcard
          currentCard={getCurrentCard()}
          answerOptions={getAnswerOptions()}
          selectedAnswer={selectedAnswer}
          showResult={showResult}
          currentCardIndex={currentCardIndex}
          totalCards={studySession.words.length}
          score={score}
          progressPercent={
            // eslint-disable-next-line
            studySession
              ? ((currentCardIndex + 1) / studySession.words.length) * 100
              : 0
          }
          onExit={exitFlashcards}
          onSelectAnswer={handleAnswerSelect}
          onNext={nextCard}
          onRetry={() => {
            // eslint-disable-next-line
            if (studySession) {
              startFlashcards(studySession.words);
            }
          }}
        />
      );
    }
  }

  return (
    <>
      {showNewPathModal && (
        <div
          className="fixed inset-0 z-[9989] !bg-[var(--bg-tir)] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`w-full max-w-md mx-auto rounded-xl p-6 shadow-xl border !bg-[var(--bg-first)] text-theme text-left flex flex-col gap-5`}
            style={{ padding: '20px' }}
          >
            <h2 className="text-xl font-semibold mb-4 text-center">
              {t('learningPathPage.main.createNewPath')}
            </h2>

            <div>
              <label className="font-bold !text-[15px]">
                {t('learningPathPage.main.learningPathName')}
              </label>
              <input
                type="text"
                placeholder={t('learningPathPage.main.learningPathName')}
                value={modalPathName}
                onChange={(e) => {
                  setModalPathName(e.target.value);
                }}
                className="
    w-full
    rounded-md
    px-3
    py-2
    mb-3
    bg-transparent
    shadow-sm

    border-zinc-500
    focus:outline-none
    focus:ring-0
    focus:border-0
    text-[var(--text-theme)]
    placeholder:text-zinc-400
  "
                style={{ padding: '5px' }}
              />
            </div>

            <div>
              <label className="font-bold">
                {t('learningPathPage.main.language')}
              </label>
              <Select
                value={modalLanguage}
                onValueChange={(value) => void handleModalLanguageChange(value)}
              >
                <SelectTrigger className="w-full mt-1 mb-3">
                  <SelectValue
                    placeholder={t('contributePlaceholder.language')}
                  />
                </SelectTrigger>
                <SelectContent
                  className="max-h-60 z-[9999] !bg-[var(--bg-first)] text-theme "
                  style={{ padding: '5px' }}
                >
                  {availableLanguages.map((lang) => (
                    <SelectItem
                      key={lang.name}
                      value={lang.name}
                      className="hover:bg-[var(--bg-tir)] "
                      style={{ padding: '5px' }}
                    >
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-bold">
                {t('learningPathPage.main.glossaries')}
              </label>
              {modalLanguage && (
                <div
                  className="
      space-y-2
      mb-4
      max-h-40        /* limits visible height */
      overflow-y-auto /* enables smooth scrolling */
      pr-2            /* keeps scrollbar from overlapping content */
      rounded-md
      border
      border-gray-200
      bg-[var(--bg-tir)]
    "
                >
                  {modalGlossaries.map((g) => (
                    <label
                      key={g.id}
                      className="
          flex items-center justify-between
          rounded-lg
          px-4 py-2
          cursor-pointer
          hover:bg-accent/10
          transition
        "
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={modalSelectedGlossaries.has(g.name)}
                          onChange={() => {
                            handleGlossaryToggle(g.name);
                          }}
                          className="h-4 w-4 text-primary border-gray-300 rounded accent-teal-500"
                        />
                        <span>{g.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {g.words} {t('learningPathPage.main.words')}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-black"
                onClick={() => {
                  setShowNewPathModal(false);
                }}
              >
                {t('learningPathPage.main.cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-teal-500 hover:bg-teal-600 text-white"
                onClick={() => void handleCreatePath()}
              >
                {t('learningPathPage.main.createPath')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
        }}
        onConfirm={() => void handleConfirmDelete()}
        title="Delete Learning Path"
      >
        <p className="text-theme">{t('learningPathPage.main.deleteMessage')}</p>
      </ConfirmationModal>

      <div
        className={`fixed inset-0 flex box-border !bg-[var(--bg-first)] z-[1] ${
          isDarkMode ? 'theme-dark' : 'theme-light'
        }`}
        style={{
          marginLeft:
            window.innerWidth >= 1024
              ? '300px'
              : window.innerWidth >= 770
                ? '300px'
                : '0px',
        }}
      >
        {/* Side nav or top nav */}
        {isMobile ? (
          <div className="fixed top-0 left-0 w-full z-50">
            <Navbar />
          </div>
        ) : (
          <LeftNav
            activeItem={activeMenuItem}
            setActiveItem={setActiveMenuItem}
          />
        )}

        {/* Main content area */}
        <main
          className={`flex-1 relative z-[2] box-border overflow-y-auto h-screen !bg-[var(--bg-first)] ${
            isMobile ? 'pt-16' : 'pl-[280px]'
          } px-6 sm:px-10`}
        >
          <div className="max-w-[1200px] mx-auto py-6 ">
            <h1 className="text-2xl font-semibold mb-4 text-theme">
              {currentView === 'paths'}
              {currentView === 'glossaries' && selectedPath?.path_name}
              {currentView === 'words' &&
                !flashcardMode &&
                (selectedGlossary?.name ||
                  t('learningPathPage.main.studySession'))}
              {currentView === 'words' &&
                flashcardMode &&
                `${selectedGlossary?.name || ''} ${t('learningPathPage.main.test')}`}
            </h1>

            <div className="flex justify-end items-center mb-8 text-theme">
              <LearningPathMode />
            </div>

            <Modes />
          </div>
        </main>
      </div>
    </>
  );
};

export default LearningPathPage;
