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
    <div className="words-panel bg-transparent">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBackClick}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Glossaries
        </button>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {knownWords.size} of {studySession.words.length} words completed
          </div>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-teal-500"
              style={{
                width: `${getProgressPercentage().toString()}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        {studySession.words.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No terms found in this glossary.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {currentWords.map((word) => (
                <div
                  key={word.id}
                  className="flex flex-col p-3 rounded-lg border border-gray-200 hover:bg-gray-50 h-[120px] justify-between"
                >
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                      {word.term}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {word.english_translation || word.definition}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    {knownWords.has(word.id) ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <span className="mx-2">·</span>
                <span>
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, studySession.words.length)} of{' '}
                  {studySession.words.length} terms
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="Next page"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WordsPanel;
