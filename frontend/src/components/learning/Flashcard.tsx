import React from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';

interface Word {
  id: number;
  word: string;
  translation: string;
  difficulty?: string;
}

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
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: '#00ceaf',
              }}
            />
          </div>

          {/* Flashcard */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">
                Translate this word:
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                {currentCard?.word}
              </h2>
            </div>
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {answerOptions.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentCard?.translation;
              let buttonClass =
                'w-full p-4 text-left rounded-xl border-2 transition-all ';

              if (!showResult) {
                buttonClass +=
                  'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer';
              } else if (isCorrect) {
                buttonClass += 'border-green-500 bg-green-100 text-green-800';
              } else if (isSelected && !isCorrect) {
                buttonClass += 'border-red-500 bg-red-100 text-red-800';
              } else {
                buttonClass += 'border-gray-200 bg-gray-50 text-gray-600';
              }

              return (
                <button
                  key={index}
                  onClick={() => onSelectAnswer(option)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <span className="text-lg font-medium">{option}</span>
                  {showResult && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 float-right mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          {showResult && (
            <div className="text-center">
              <button
                type="button"
                onClick={onNext}
                className="px-6 py-3 text-white rounded-xl transition-colors"
                style={{
                  backgroundColor: '#f00a50',
                  color: '#ffffff',
                  border: 'none',
                  opacity: 1,
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  boxShadow: '0 6px 18px rgba(240,10,80,0.12)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#d10946')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f00a50')
                }
                aria-disabled={false}
              >
                {currentCardIndex === totalCards - 1 ? 'Finish' : 'Next Card'}
              </button>
            </div>
          )}
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
            <div className="text-sm text-gray-500 mb-8">
              {score.correct} words have been marked as known
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={onExit}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
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
