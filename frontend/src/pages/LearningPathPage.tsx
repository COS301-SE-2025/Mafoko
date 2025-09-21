import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import Flashcard from '../components/learning/Flashcard';
import GlossaryCard from '../components/learning/GlossaryCard';
import LanguageCard from '../components/learning/LanguageCard';
import '../styles/LearningPathPage.scss';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';

// Define interfaces
interface Language {
  code: string;
  name: string;
  totalWords: number;
  color: string;
  completedPercentage: number;
}

interface Glossary {
  id: number;
  name: string;
  words: number;
  description: string;
}

interface Word {
  id: number;
  word: string;
  translation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Interface declarations for LearningPathPage

const LearningPathPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const [currentView, setCurrentView] = useState<
    'languages' | 'glossaries' | 'words'
  >('languages');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null,
  );
  const [selectedGlossary, setSelectedGlossary] = useState<Glossary | null>(
    null,
  );
  const [knownWords, setKnownWords] = useState<Set<number>>(new Set());
  const [flashcardMode, setFlashcardMode] = useState<boolean>(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });

  // UI state for navigation
  const [activeMenuItem, setActiveMenuItem] = useState('learning-path');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  // Modal state for creating a new learning path
  const [showNewPathModal, setShowNewPathModal] = useState(false);
  const [modalLanguageCode, setModalLanguageCode] = useState<string | null>(
    null,
  );
  const [modalSelectedGlossaryIds, setModalSelectedGlossaryIds] = useState<
    number[]
  >([]);

  // Handle responsive behavior
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

  // Mock data
  const languages: Language[] = [
    {
      code: 'ES',
      name: 'Spanish',
      totalWords: 2500,
      color: '#f00a50',
      completedPercentage: 65,
    },
    {
      code: 'FR',
      name: 'French',
      totalWords: 2200,
      color: '#212431',
      completedPercentage: 32,
    },
    {
      code: 'DE',
      name: 'German',
      totalWords: 1800,
      color: '#f2d001',
      completedPercentage: 18,
    },
    {
      code: 'IT',
      name: 'Italian',
      totalWords: 2100,
      color: '#00ceaf',
      completedPercentage: 45,
    },
  ];

  const glossaries: Record<string, Glossary[]> = {
    ES: [
      {
        id: 1,
        name: 'Basic Vocabulary',
        words: 200,
        description: 'Essential everyday words',
      },
      {
        id: 2,
        name: 'Food & Dining',
        words: 150,
        description: 'Restaurant and cooking terms',
      },
      {
        id: 3,
        name: 'Travel & Transportation',
        words: 180,
        description: 'Getting around and exploring',
      },
      {
        id: 4,
        name: 'Business Spanish',
        words: 220,
        description: 'Professional vocabulary',
      },
      {
        id: 5,
        name: 'Family & Relationships',
        words: 120,
        description: 'Personal connections',
      },
    ],
    FR: [
      {
        id: 1,
        name: 'Basic Vocabulary',
        words: 180,
        description: 'Essential everyday words',
      },
      {
        id: 2,
        name: 'Culture & Arts',
        words: 160,
        description: 'French culture and artistic terms',
      },
      {
        id: 3,
        name: 'Fashion & Style',
        words: 140,
        description: 'Fashion and beauty vocabulary',
      },
      {
        id: 4,
        name: 'Cuisine & Gastronomy',
        words: 200,
        description: 'French cooking and dining',
      },
    ],
    DE: [
      {
        id: 1,
        name: 'Basic Vocabulary',
        words: 150,
        description: 'Essential everyday words',
      },
      {
        id: 2,
        name: 'Technology & Innovation',
        words: 170,
        description: 'Tech and engineering terms',
      },
      {
        id: 3,
        name: 'Music & Entertainment',
        words: 130,
        description: 'Arts and entertainment',
      },
      {
        id: 4,
        name: 'Science & Research',
        words: 190,
        description: 'Academic and scientific vocabulary',
      },
    ],
    IT: [
      {
        id: 1,
        name: 'Basic Vocabulary',
        words: 160,
        description: 'Essential everyday words',
      },
      {
        id: 2,
        name: 'Art & Architecture',
        words: 180,
        description: 'Italian art and design terms',
      },
      {
        id: 3,
        name: 'Food & Wine',
        words: 200,
        description: 'Culinary vocabulary',
      },
      {
        id: 4,
        name: 'History & Culture',
        words: 150,
        description: 'Cultural and historical terms',
      },
    ],
  };

  const sampleWords: Word[] = [
    { id: 1, word: 'hola', translation: 'hello', difficulty: 'beginner' },
    {
      id: 2,
      word: 'gracias',
      translation: 'thank you',
      difficulty: 'beginner',
    },
    {
      id: 3,
      word: 'restaurante',
      translation: 'restaurant',
      difficulty: 'intermediate',
    },
    {
      id: 4,
      word: 'conversación',
      translation: 'conversation',
      difficulty: 'intermediate',
    },
    {
      id: 5,
      word: 'extraordinario',
      translation: 'extraordinary',
      difficulty: 'advanced',
    },
    { id: 6, word: 'por favor', translation: 'please', difficulty: 'beginner' },
    {
      id: 7,
      word: 'bienvenido',
      translation: 'welcome',
      difficulty: 'intermediate',
    },
    {
      id: 8,
      word: 'comprensión',
      translation: 'understanding',
      difficulty: 'advanced',
    },
    { id: 9, word: 'agua', translation: 'water', difficulty: 'beginner' },
    {
      id: 10,
      word: 'aventura',
      translation: 'adventure',
      difficulty: 'intermediate',
    },
  ];

  // Additional words for creating wrong answers
  const allTranslations = [
    'hello',
    'thank you',
    'restaurant',
    'conversation',
    'extraordinary',
    'please',
    'welcome',
    'understanding',
    'water',
    'adventure',
    'goodbye',
    'house',
    'friend',
    'family',
    'book',
    'school',
    'car',
    'music',
    'love',
    'time',
    'world',
    'life',
    'work',
    'food',
    'money',
  ];

  // Known-word marking is handled by flashcard correctness; remove manual toggle to prevent user clicks.

  // Compute an overall progress percentage (simple average of languages) for the level tooltip
  const overallProgressPercentage = Math.round(
    languages.reduce((sum, l) => sum + (l.completedPercentage || 0), 0) /
      languages.length,
  );

  const getProgressPercentage = (): number => {
    if (!selectedGlossary) return 0;
    return Math.round((knownWords.size / sampleWords.length) * 100);
  };

  // Flashcard functions
  const generateWrongAnswers = (correctAnswer: string): string[] => {
    const wrongAnswers = allTranslations
      .filter((t) => t !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return wrongAnswers;
  };

  const getCurrentCard = (): Word | null => {
    if (!flashcardMode || currentCardIndex >= sampleWords.length) return null;
    return sampleWords[currentCardIndex];
  };

  const getAnswerOptions = (): string[] => {
    const currentCard = getCurrentCard();
    if (!currentCard) return [];

    const wrongAnswers = generateWrongAnswers(currentCard.translation);
    const allOptions = [currentCard.translation, ...wrongAnswers];
    return allOptions.sort(() => Math.random() - 0.5);
  };

  const handleAnswerSelect = (answer: string): void => {
    const currentCard = getCurrentCard();
    if (!currentCard || showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentCard.translation;
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    // If correct, mark word as known
    if (isCorrect) {
      setKnownWords((prev) => new Set([...prev, currentCard.id]));
    }
  };

  const nextCard = (): void => {
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentCardIndex((prev) => prev + 1);
  };

  const startFlashcards = (): void => {
    setFlashcardMode(true);
    setCurrentCardIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore({ correct: 0, total: 0 });
  };

  const exitFlashcards = (): void => {
    setFlashcardMode(false);
    setCurrentCardIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // Navigation items are now handled by the main app layout

  return (
    <div
      className={`learning-path-container ${isMobileMenuOpen ? 'mobile-menu-is-open' : ''} ${isDarkMode ? 'dark-mode' : ''}`}
    >
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={toggleMobileMenu}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              toggleMobileMenu();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      )}

      <div className="main-content">
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
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentView === 'languages'}
                {currentView === 'glossaries' &&
                  `${selectedLanguage?.name || ''} Glossaries`}
                {currentView === 'words' &&
                  !flashcardMode &&
                  (selectedGlossary?.name || '')}
                {currentView === 'words' &&
                  flashcardMode &&
                  `${selectedGlossary?.name || ''} - Flashcards`}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentView === 'languages'}
                {currentView === 'glossaries'}
                {currentView === 'words' && !flashcardMode}
                {currentView === 'words' && flashcardMode}
              </p>
            </div>

            {currentView === 'languages' && (
              <div className="flex items-center gap-4">
                <div
                  className="level-badge-wrapper"
                  style={{ position: 'relative' }}
                >
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium level-badge">
                    Level: Intermediate
                  </span>
                  {/* Tooltip shown on hover via CSS */}
                  <div className="level-tooltip" role="status" aria-hidden>
                    <div className="tooltip-title">Progress to next level</div>
                    <div className="tooltip-progress">
                      <div
                        className="tooltip-progress-fill"
                        style={{
                          width: `${overallProgressPercentage.toString()}%`,
                        }}
                      />
                    </div>
                    <div className="tooltip-text">
                      You are at {overallProgressPercentage.toString()}% —{' '}
                      {(100 - overallProgressPercentage).toString()}% to next
                      level
                    </div>
                  </div>
                </div>
                <button
                  className="px-4 py-2"
                  style={{ backgroundColor: '#f00a50', color: 'white' }}
                  onClick={() => {
                    setShowNewPathModal(true);
                    setModalLanguageCode(null);
                    setModalSelectedGlossaryIds([]);
                  }}
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={showNewPathModal}
                >
                  + New Path
                </button>
              </div>
            )}

            {currentView === 'words' && !flashcardMode && (
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {getProgressPercentage()}%
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            )}

            {currentView === 'words' && flashcardMode && (
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  Card {currentCardIndex + 1}
                </div>
                <div className="text-sm text-gray-600">
                  of {sampleWords.length}
                </div>
              </div>
            )}
          </div>

          {/* Languages View */}
          {currentView === 'languages' && (
            <div className="languages-panel bg-transparent">
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {languages.map((language) => (
                    <LanguageCard
                      key={language.code}
                      code={language.code}
                      name={language.name}
                      totalWords={language.totalWords}
                      color={language.color}
                      completedPercentage={language.completedPercentage}
                      onClick={() => {
                        setSelectedLanguage(language);
                        setCurrentView('glossaries');
                      }}
                    />
                  ))}
                </div>
              </>
            </div>
          )}

          {/* Glossaries View */}
          {currentView === 'glossaries' && selectedLanguage && (
            <>
              <div className="flex items-center mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('languages');
                  }}
                  className="text-gray-600 hover:text-gray-900 mr-4"
                >
                  ← Back to Languages
                </button>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                  style={{ backgroundColor: selectedLanguage.color }}
                >
                  {selectedLanguage.code}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {glossaries[selectedLanguage.code].map((glossary) => (
                  <GlossaryCard
                    key={glossary.id}
                    glossary={glossary}
                    onClick={() => {
                      setSelectedGlossary(glossary);
                      setCurrentView('words');
                    }}
                    onStudy={() => {
                      setSelectedGlossary(glossary);
                      setCurrentView('words');
                      setFlashcardMode(false);
                    }}
                    onFlashcards={() => {
                      setSelectedGlossary(glossary);
                      setCurrentView('words');
                      startFlashcards();
                    }}
                    completedPercentage={Math.round(
                      (knownWords.size / sampleWords.length) * 100,
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Words View */}
          {currentView === 'words' && selectedGlossary && !flashcardMode && (
            <div className="words-panel bg-transparent">
              <>
                <div className="flex items-center justify-between mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('glossaries');
                    }}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ← Back to Glossaries
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      {knownWords.size} of {sampleWords.length} words completed
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-teal-500 transition-all duration-300"
                        style={{
                          width: `${getProgressPercentage().toString()}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="grid grid-cols-1 gap-4">
                    {sampleWords.map((word) => (
                      <div
                        key={word.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {word.word}
                            </h4>
                          </div>
                          <p className="text-gray-600 mt-1">
                            {word.translation}
                          </p>
                        </div>

                        {/* Non-interactive known indicator: terms are marked by the system via flashcards only */}
                        <div
                          className="ml-4"
                          aria-hidden={false}
                          aria-label={
                            knownWords.has(word.id)
                              ? 'Known word'
                              : 'Unknown word'
                          }
                        >
                          {knownWords.has(word.id) ? (
                            <CheckCircle2 className="w-6 h-6 text-teal-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            </div>
          )}

          {/* Flashcard Mode (extracted into component) */}
          {flashcardMode && currentView === 'words' && (
            <Flashcard
              currentCard={getCurrentCard()}
              answerOptions={getAnswerOptions()}
              selectedAnswer={selectedAnswer}
              showResult={showResult}
              currentCardIndex={currentCardIndex}
              totalCards={sampleWords.length}
              score={score}
              progressPercent={
                ((currentCardIndex + 1) / sampleWords.length) * 100
              }
              onExit={exitFlashcards}
              onSelectAnswer={handleAnswerSelect}
              onNext={nextCard}
              onRetry={startFlashcards}
            />
          )}
        </div>
        {/* New Path Modal */}
        {showNewPathModal && (
          <div
            className="learning-path-modal-overlay"
            role="dialog"
            aria-modal="true"
          >
            <div className="learning-path-modal">
              <h2 className="modal-title">Create a New Learning Path</h2>

              <label className="modal-label">Choose a language</label>
              <select
                className="modal-select"
                value={modalLanguageCode ?? ''}
                onChange={(e) => {
                  const code = e.target.value || null;
                  setModalLanguageCode(code);
                  setModalSelectedGlossaryIds([]);
                }}
                aria-label="Select language"
              >
                <option value="">-- Select language --</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>

              <div className="modal-glossaries">
                <label className="modal-label">Choose glossaries</label>
                {!modalLanguageCode && (
                  <div className="modal-hint">
                    Select a language first to see available glossaries.
                  </div>
                )}
                {modalLanguageCode && (
                  <div className="modal-glossary-list">
                    {glossaries[modalLanguageCode].map((g) => (
                      <label key={g.id} className="modal-glossary-item">
                        <input
                          type="checkbox"
                          checked={modalSelectedGlossaryIds.includes(g.id)}
                          onChange={() => {
                            setModalSelectedGlossaryIds((prev) =>
                              prev.includes(g.id)
                                ? prev.filter((id) => id !== g.id)
                                : [...prev, g.id],
                            );
                          }}
                        />
                        <span className="glossary-name">{g.name}</span>
                        <span className="glossary-count">{g.words} words</span>
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
                    if (!modalLanguageCode) {
                      alert('Please select a language');
                      return;
                    }
                    if (modalSelectedGlossaryIds.length === 0) {
                      alert('Please select at least one glossary');
                      return;
                    }

                    // Here you'd normally call an API or dispatch an action to create the path
                    console.log('Create learning path', {
                      language: modalLanguageCode,
                      glossaries: modalSelectedGlossaryIds,
                    });

                    // Optional: update UI to switch to glossaries view for the chosen language
                    const chosenLang =
                      languages.find((l) => l.code === modalLanguageCode) ||
                      null;
                    setSelectedLanguage(chosenLang);
                    setCurrentView('glossaries');

                    setShowNewPathModal(false);
                  }}
                >
                  Create Path
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPathPage;
