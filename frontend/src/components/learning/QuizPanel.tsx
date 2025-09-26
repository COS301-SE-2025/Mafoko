import React from 'react';
import { Word } from '../../types/learning';

interface QuizPanelProps {
  currentWord: Word | null;
  answerOptions: string[];
  selectedAnswer: string | null;
  showResult: boolean;
  currentIndex: number;
  totalCards: number;
  score: { correct: number; total: number };
  progressPercent: number;
  onExit: () => void;
  onSelectAnswer: (answer: string) => void;
  onNext: () => void;
  onRetry: () => void;
}

const QuizPanel: React.FC<QuizPanelProps> = ({
  currentWord,
  answerOptions,
  selectedAnswer,
  showResult,
  currentIndex,
  totalCards,
  score,
  progressPercent,
  onExit,
  onSelectAnswer,
  onNext,
  onRetry,
}) => {
  return (
    <div className="component-container">
      <div className="content-wrapper">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={onExit}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Exit Quiz
          </button>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              Question {currentIndex + 1}
            </div>
            <div className="text-sm text-gray-600">of {totalCards}</div>
          </div>
        </div>

        <div className="quiz-content bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          {currentWord ? (
            <>
              <div className="mb-8">
                <div className="text-sm text-gray-600 mb-2">Translate:</div>
                <div className="text-2xl font-bold mb-6">
                  {currentWord.term}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {answerOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => onSelectAnswer(option)}
                      disabled={showResult}
                      className={`p-4 rounded-lg border-2 text-left ${
                        selectedAnswer === option
                          ? showResult
                            ? selectedAnswer ===
                              (currentWord.english_translation ||
                                currentWord.definition)
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                            : 'border-primary bg-primary-50'
                          : 'border-gray-200 hover:border-primary'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {showResult && (
                <div className="flex justify-end">
                  <button
                    onClick={onNext}
                    className="px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-2xl font-bold mb-4">Quiz Complete!</div>
              <div className="text-lg text-gray-600 mb-6">
                You got {score.correct} out of {score.total} correct
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={onRetry}
                  className="px-4 py-2 border border-gray-200 rounded-lg"
                >
                  Try Again
                </button>
                <button
                  onClick={onExit}
                  className="px-4 py-2 bg-primary text-white rounded-lg"
                >
                  Finish
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPanel;
