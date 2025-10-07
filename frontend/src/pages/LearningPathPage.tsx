import React, { useState, useEffect } from 'react';
import Flashcard from '../components/learning/Flashcard';
import WordsPanel from '../components/learning/WordsPanel';
import LearningPathList from '../components/learning/LearningPathList';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import '../styles/LearningPathPage.scss';
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
import {toast} from "sonner";
import {
  LearningPathGlossaryList
} from "../components/ui/LearningPathGlossaryList.tsx";

const LearningPathPage: React.FC = () => {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getProficiencyLevel = (percentage: number): string => {
    if (percentage >= 80) return 'Advanced';
    if (percentage >= 40) return 'Intermediate';
    return 'Beginner';
  };

  const overallProgressPercentage = Math.round(
    learningPaths.reduce((sum, p) => sum + (p.completedPercentage || 0), 0) /
      (learningPaths.length || 1),
  );

  const getProgressPercentage = (): number => {
    if (!studySession || studySession.words.length === 0) return 0;
    const knownCount = studySession.words.filter((word) =>
      knownWords.has(word.id),
    ).length;
    return Math.round((knownCount / studySession.words.length) * 100);
  };

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
        description: 'Please fill out all fields and select at least one glossary.',
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
    if (currentView === "paths")
    {
      return(<>
        <div
            className="level-badge-wrapper"
            style={{ position: 'relative' }}
        >
                      <span className="level-badge">
                        Level: {getProficiencyLevel(overallProgressPercentage)}
                      </span>
          <div className="level-tooltip">
            <div className="tooltip-title">Overall Progress</div>
            <div className="tooltip-progress">
              <div
                  className="tooltip-progress-fill"
                  style={{
                    width: `${overallProgressPercentage.toString()}%`,
                  }}
              />
            </div>
            <div className="tooltip-text">
              {100 - overallProgressPercentage}% to next level
            </div>
          </div>
        </div>
        <button
            className="new-path-button"
            onClick={() => {
              void handleOpenCreateModal();
            }}
            type="button"
        >
          <span className="new-path-button-text">+ New Path</span>
        </button>
      </>);
    } else if (currentView === 'words' && !flashcardMode && studySession) {
      return(
          <div className="learning-path-progress-display">
          </div>
      )
    } else if(currentView === 'words' && flashcardMode && studySession){
      return (<div className="learning-path-progress-display">
        <div className="learning-path-progress-percentage">
          Card {currentCardIndex + 1}
        </div>
        <div className="learning-path-progress-label">
          of {studySession.words.length.toString()}
        </div>
      </div>)
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
      )
    } else if (currentView === 'glossaries' && selectedPath )
    {
      return(
          <LearningPathGlossaryList selectedPath={selectedPath} setCurrentView={setCurrentView} glossaryWordCounts={glossaryWordCounts} handleGlossarySelect={handleGlossarySelect} />
      )
    } else if (currentView === 'words' && !flashcardMode && studySession ) {
      return (
          <WordsPanel
            studySession={studySession}
            knownWords={knownWords}
            onBackClick={() => {
              setCurrentView('glossaries');
            }}
          />
      )
    } else if(flashcardMode && currentView === 'words' && studySession) {
      return(
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
      )
    }
  }

  return (
    <div
      className={`learning-path-container  !bg-[var(--bg-first)] ${isMobileMenuOpen ? 'mobile-menu-is-open' : ''} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={toggleMobileMenu}
          onKeyDown={(e) => {
            if (e.key === 'Enter') toggleMobileMenu();
          }}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}
      {isMobile ? (
        <div className="workspace-navbar-mobile bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>
      ) : (
        <LeftNav
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      )}
      <div className="main-content !bg-[var(--bg-first)]">
        {!isMobile && (
          <div className="top-bar learning-path-top-bar">
            <button
              className="hamburger-icon"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              type="button"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        )}
        <div className={`learning-path-content${isMobile ? ' pt-16' : ''}`}>
          <div className="learning-path-header">
            <div className="learning-path-header-content">
              <div className="learning-path-title-section">
                <h1 className="learning-path-main-title">
                  {currentView === 'paths'}
                  {currentView === 'glossaries' &&
                    (selectedPath?.path_name || '')}
                  {currentView === 'words' &&
                    !flashcardMode &&
                    (selectedGlossary?.name || 'Study Session')}
                  {currentView === 'words' &&
                    flashcardMode &&
                    `${selectedGlossary?.name || ''} - Flashcards`}
                </h1>
                <p className="learning-path-subtitle">
                  {currentView === 'paths'}
                  {currentView === 'glossaries'}
                  {currentView === 'words' && !flashcardMode}
                </p>
              </div>

              <div className="learning-path-header-actions">
                <LearningPathMode />
              </div>
            </div>
          </div>

          <Modes />
        </div>

        {showNewPathModal && (
          <div
            className="learning-path-modal-overlay"
            role="dialog"
            aria-modal="true"
          >
            <div
              className={`learning-path-modal flex gap-4 flex-col text-left ${isDarkMode ? 'dark-mode' : ''}`}
            >
              <h2 className="modal-title text-center">
                Create a New Learning Path
              </h2>

              <label className="font-bold">Learning Path Name</label>
              <input
                type="text"
                placeholder="Path Name (e.g. Afrikaans for Business)"
                className="modal-input"
                value={modalPathName}
                onChange={(e) => {
                  setModalPathName(e.target.value);
                }}
              />

              <label className="font-bold">Language</label>
              <Select
                value={modalLanguage}
                onValueChange={(value) => {
                  void handleModalLanguageChange(value);
                }}
              >
                <SelectTrigger
                  className={`modal-select ${isDarkMode ? 'dark-mode' : ''}`}
                >
                  <SelectValue placeholder="-- Select language --" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.name} value={lang.name}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="modal-glossaries">
                <label className="modal-label">Choose glossaries</label>
                {!modalLanguage && (
                  <div className="modal-hint">
                    Select a language first to see available glossaries.
                  </div>
                )}
                {modalLanguage && (
                  <div className="space-y-2 flex flex-col gap-3">
                    {modalGlossaries.map((g) => (
                      <label
                        key={g.id}
                        className="flex items-center justify-between rounded-lg border border-input bg-background px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={modalSelectedGlossaries.has(g.name)}
                            onChange={() => {
                              handleGlossaryToggle(g.name);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="font-medium">{g.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {g.words} words
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-cancel"
                  onClick={() => {
                    setShowNewPathModal(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-btn modal-create"
                  onClick={() => {
                    void handleCreatePath();
                  }}
                >
                  Create Path
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
          onConfirm={() => {
            void handleConfirmDelete();
          }}
          title="Delete Learning Path"
        >
          <p>Are you sure you want to permanently delete this learning path?</p>
        </ConfirmationModal>
      </div>
    </div>
  );
};

export default LearningPathPage;
