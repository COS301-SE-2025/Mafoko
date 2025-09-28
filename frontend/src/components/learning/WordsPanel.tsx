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
    <div className="component-container words-panel">
      <div className="content-wrapper">
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

        {studySession.words.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-lg font-medium mb-2">No terms found</div>
            <div className="text-sm">
              This glossary doesn't contain any terms yet.
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {currentWords.map((word) => (
                <div
                  key={word.id}
                  className="word-card bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-200 min-h-[140px] flex flex-col justify-between"
                >
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                      {word.term}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {word.english_translation || word.definition}
                    </p>
                  </div>
                  <div className="flex justify-end mt-4">
                    {knownWords.has(word.id) ? (
                      <div className="flex items-center gap-2 text-teal-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-medium">Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Circle className="w-5 h-5" />
                        <span className="text-xs">Not completed</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-controls">
                <div className="pagination-info">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, studySession.words.length)} of{' '}
                  {studySession.words.length} terms
                </div>
                <div className="pagination-buttons">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                    aria-label="First page"
                  >
                    <ChevronLeft size={16} />
                    <ChevronLeft size={16} style={{ marginLeft: '-12px' }} />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="pagination-current">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                    aria-label="Last page"
                  >
                    <ChevronRight size={16} />
                    <ChevronRight size={16} style={{ marginLeft: '-12px' }} />
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
