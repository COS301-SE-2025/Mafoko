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
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 cursor-default hover:shadow-md transition-all"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm text-gray-500">{glossary.words} words</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {glossary.name}
      </h3>

      {/* Progress bar above the action buttons */}
      <div className="glossary-card-progress mb-4">
        <div className="progress-row flex items-center justify-between">
          <div className="progress-bar w-full bg-gray-200 rounded-full h-2 mr-3 overflow-hidden">
            <div
              className="progress-fill h-2 rounded-full"
              style={{
                width: `${completedPercentage}%`,
                background: '#00ceaf',
              }}
            />
          </div>
          <div className="progress-label text-sm text-gray-600">
            {completedPercentage}%
          </div>
        </div>
      </div>

      <div className="glossary-card-actions flex gap-3">
        <button
          type="button"
          className="study-btn flex items-center gap-2"
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
