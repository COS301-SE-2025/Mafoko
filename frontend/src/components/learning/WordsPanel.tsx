import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Word {
  id: string;
  term: string;
  english_translation?: string;
  definition?: string;
}

interface StudySession {
  words: Word[];
  knownWordIds: string[];
  retryPileIds?: string[];
}

interface WordsPanelProps {
  studySession: StudySession;
  knownWords: Set<string>;
  onBackClick: () => void;
}

const ITEMS_PER_PAGE = 20;

const WordsPanel: React.FC<WordsPanelProps> = ({
                                                 studySession,
                                                 knownWords,
                                                 onBackClick,
                                               }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (wordId: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [wordId]: !prev[wordId],
    }));
  };

  const getProgressPercentage = (): number => {
    if (!studySession || studySession.words.length === 0) return 0;
    const knownCount = studySession.words.filter((word) =>
      knownWords.has(word.id),
    ).length;
    return Math.round((knownCount / studySession.words.length) * 100);
  };

  const totalPages = Math.ceil(studySession.words.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentWords = studySession.words.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="">
      <div className="content-wrapper">
        {/* Header / Progress */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <button
            type="button"
            onClick={onBackClick}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 font-medium"
          >
            ← Back to Glossaries
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="text-sm text-gray-600">
              {knownWords.size} of {studySession.words.length} words completed
            </div>
            <div className="w-full sm:w-32 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-teal-500 transition-all duration-300"
                style={{
                  width: `${getProgressPercentage().toString()}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        {studySession.words.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-lg font-medium mb-2">No terms found</div>
            <div className="text-sm">
              This glossary doesn't contain any terms yet.
            </div>
          </div>
        ) : (
          <>
            {/* Flashcards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {currentWords.map((word) => {
                const flipped = flippedCards[word.id] || false;
                return (
                  <div
                    key={word.id}
                    onClick={() => toggleFlip(word.id)}
                    className="relative cursor-pointer transform-gpu perspective"
                  >
                    {/* Card inner container */}
                    <div
                      className={`relative w-full h-44 transition-transform duration-500 ${
                        flipped ? 'rotate-y-180' : ''
                      }`}
                      style={{
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Front side */}
                      <div
                        className="absolute inset-0 bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col justify-center items-center backface-hidden"
                      >
                        <h4 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                          {word.term}
                        </h4>
                        <p className="text-xs text-gray-500 text-center">
                          Tap to reveal
                        </p>
                      </div>

                      {/* Back side */}
                      <div
                        className={`absolute inset-0 ${knownWords.has(word.id) ? "bg-teal-500" : "bg-zinc-700" } text-white rounded-xl p-6 shadow-md flex flex-col justify-center items-center rotate-y-180 backface-hidden`}
                      >
                        <p className="text-lg font-bold text-center">
                          {word.english_translation || 'No translation'}
                        </p>
                        {word.definition && (
                          <p className="text-sm mt-2 text-center opacity-90 leading-relaxed">
                            {word.definition}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Completion status */}
                    <div className="flex justify-end mt-2">
                      {knownWords.has(word.id) ? (
                        <div className="flex items-center gap-2 text-teal-600 text-xs font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Known
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <Circle className="w-4 h-4" />
                          Not learned
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-controls flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                <div>
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, studySession.words.length)} of{' '}
                  {studySession.words.length} terms
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 disabled:opacity-40 hover:text-teal-600"
                  >
                    <ChevronLeft size={16} />
                    <ChevronLeft size={16} className="-ml-3" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 disabled:opacity-40 hover:text-teal-600"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 disabled:opacity-40 hover:text-teal-600"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 disabled:opacity-40 hover:text-teal-600"
                  >
                    <ChevronRight size={16} />
                    <ChevronRight size={16} className="-ml-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WordsPanel;
