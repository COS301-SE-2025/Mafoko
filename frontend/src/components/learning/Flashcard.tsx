import React from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { Word } from '../../types/learning';
import '../../styles/FlashcardStyles.scss';

interface FlashcardProps {
  currentCard: Word | null;
  answerOptions: string[];
  selectedAnswer: string | null;
  showResult: boolean;
  currentCardIndex: number;
  totalCards: number;
  score: { correct: number; total: number };
  progressPercent: number;
  onExit: () => void;
  onSelectAnswer: (answer: string) => void;
  onNext: () => void;
  onRetry: () => void;
}

// 2. The local, conflicting Word interface has been removed.

const Flashcard: React.FC<FlashcardProps> = ({
  currentCard,
  answerOptions,
  selectedAnswer,
  showResult,
  currentCardIndex,
  totalCards,
  score,
  progressPercent,
  onExit,
  onSelectAnswer,
  onNext,
  onRetry,
}) => {
  const isCorrect =
    selectedAnswer ===
    (currentCard?.english_translation || currentCard?.definition);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onExit} className="text-gray-600 hover:text-gray-900">
          ← Exit Flashcards
        </button>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Card {currentCardIndex + 1} of {totalCards}
          </div>
          <div className="text-sm font-medium" style={{ color: '#00ceaf' }}>
            Score: {score.correct}/{score.total}
          </div>
        </div>
      </div>

      {currentCardIndex < totalCards ? (
        <div className="max-w-2xl mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: '#00ceaf',
              }}
            />
          </div>

          <div className="flashcard-container">
            <div className={`flashcard ${showResult ? 'is-flipped' : ''}`}>
              {/* Question Side */}
              <div className="card-face card-front">
                <div className="card-content">
                  <span className="card-prompt">Translate this word:</span>
                  <h2 className="card-word">{currentCard?.term}</h2>

                  <div className="answer-grid">
                    {!showResult &&
                      answerOptions.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => onSelectAnswer(option)}
                          type="button"
                        >
                          {option}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Answer Side */}
              <div className="card-face card-back">
                <div
                  className={`card-content ${isCorrect ? 'correct' : 'incorrect'}`}
                >
                  <div>
                    <div className="result-label">Correct answer:</div>
                    <div className="result-text">
                      {currentCard?.english_translation ||
                        currentCard?.definition}
                    </div>
                  </div>

                  <div>
                    <div className="result-label">Your answer:</div>
                    <div className="result-text">{selectedAnswer}</div>
                  </div>

                  <button
                    type="button"
                    onClick={onNext}
                    className="next-button"
                  >
                    {currentCardIndex === totalCards - 1
                      ? 'Finish'
                      : 'Next Card'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Flashcards Complete!
            </h2>
            <div className="text-lg text-gray-600 mb-6">
              You got{' '}
              <span className="font-bold text-blue-600">{score.correct}</span>{' '}
              out of <span className="font-bold">{score.total}</span> correct
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
              <button
                onClick={onExit}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Back to Words
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Flashcard;
