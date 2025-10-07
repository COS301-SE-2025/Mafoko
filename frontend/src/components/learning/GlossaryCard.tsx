import React from 'react';
import { BookOpen, Play } from 'lucide-react';

interface Glossary {
  id: string;
  name: string;
  words: number;
  description?: string;
}

interface GlossaryCardProps {
  glossary: Glossary;
  onClick?: () => void;
  onStudy?: () => void;
  onFlashcards?: () => void;
  completedPercentage?: number;
}

const GlossaryCard: React.FC<GlossaryCardProps> = ({
  glossary,
  onClick,
  onStudy,
  onFlashcards,
  completedPercentage = 0,
}) => {
  return (
    <div
      className="!bg-[var(--bg-tir)] rounded-xl p-3 sm:p-4 md:p-6 shadow-sm  cursor-default hover:shadow-md transition-all !text-theme"
      style={{ padding: '10px' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <h3 className="text-lg font-semibold mb-4">
        {glossary.name}
      </h3>

      <div className="w-full flex justify-center items-center" style={{ padding: "10px"}}>
        <div className="flex flex-col items-center w-[80%]">
          <div className="w-full flex items-center gap-5">
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${completedPercentage}%`,
                  background: '#00ceaf',
                }}
              />
            </div>
            <span className="text-sm text-gray-600 w-10 text-right">
        {completedPercentage}%
      </span>
          </div>
        </div>
      </div>


      <div className="glossary-card-actions flex gap-3">
        <button
          type="button"
          className="study-btn flex items-center justify-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            if (onStudy) onStudy();
          }}
        >
          <BookOpen className="w-4 h-4" />
          Study Words
        </button>

        <button
          type="button"
          className="flashcard-btn flex items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            if (onFlashcards) onFlashcards();
          }}
        >
          <Play className="w-4 h-4" />
          Flashcards
        </button>
      </div>
    </div>
  );
};

export default GlossaryCard;
