import React from 'react';
import { Word } from '../../types/learning';
import '../../styles/FlashcardStyles.scss';
import { RotateCcw } from 'lucide-react';

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
  const isCorrect =
    selectedAnswer ===
    (currentCard?.english_translation || currentCard?.definition);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 ">
        <button
          onClick={onExit}
          className="text-theme hover:text-gray-900 text-sm sm:text-base"
        >
          ← Exit Test Knowledge
        </button>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="text-sm text-theme">
            Card {currentCardIndex + 1} of {totalCards}
          </div>
          <div className="text-sm font-medium" style={{ color: '#00ceaf' }}>
            Score: {score.correct}/{score.total}
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center flex-col gap-10 w-full">
        {currentCardIndex < totalCards ? (
          <div className="max-w-2xl mx-auto !w-full">
            <div className="w-full justify-start items-center ">
              <div
                className="w-full bg-gray-200 rounded-full h-3 mb-8 "
                style={{ marginBottom: '20px' }}
              >
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: '#00ceaf',
                  }}
                />
              </div>
            </div>

            <div className="flashcard-container flex flex-col gap-5 ">
              <div className={`flashcard ${showResult ? 'is-flipped' : ''}`}>
                {/* Question Side */}
                <div className="card-face card-front !bg-[var(--bg-tir)] !text-theme">
                  <div className="card-content !text-theme">
                    <span className="card-prompt !text-theme">
                      Translate this word:
                    </span>
                    <h2 className="card-word !text-theme">
                      {currentCard?.term}
                    </h2>

                    <div className="answer-grid !text-theme">
                      {!showResult &&
                        answerOptions.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => onSelectAnswer(option)}
                            type="button"
                            className="!text-theme"
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
                    className={`card-content  flex flex-col gap-10 justify-between items-center" ${isCorrect ? 'correct' : 'incorrect'}`}
                  >
                    <div>
                      <div className="result-label text-primary">
                        Correct answer:
                      </div>
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
          <div className="max-w-lg mx-auto text-center px-4">
            <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-gray-200">
              <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">
                🎉
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                Test Complete!
              </h2>
              <div className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                You got{' '}
                <span className="font-bold text-blue-600">{score.correct}</span>{' '}
                out of <span className="font-bold">{score.total}</span> correct
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={onRetry}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base"
                >
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>
                <button
                  onClick={onExit}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm sm:text-base"
                >
                  Back to Words
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Flashcard;
