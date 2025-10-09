import React from 'react';
import { BookOpen, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
      <div className="w-full flex flex-col items-start gap-3 px-4 py-3 text-theme">
        {/* Title */}
        <h3 className="text-lg font-semibold ">{glossary.name}</h3>

        {/* Progress bar container */}
        <div className="w-full flex items-center gap-4">
          <div className="flex-1 bg-gray-200/80 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-[#00ceaf] rounded-full transition-all duration-300"
              style={{ width: `${completedPercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-zinc-400 w-12 text-right">
            {completedPercentage}%
          </span>
        </div>
      </div>

      <div
        className="glossary-card-actions flex gap-3 justify-between items-center"
        style={{ paddingTop: '15px' }}
      >
        <button
          type="button"
          className=" flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white"
          onClick={(e) => {
            e.stopPropagation();
            if (onStudy) onStudy();
          }}
        >
          <BookOpen className="w-4 h-4" />
          {t('learningPathPage.learningGlossarylist.flashCards')}
        </button>

        <button
          type="button"
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white"
          onClick={(e) => {
            e.stopPropagation();
            if (onFlashcards) onFlashcards();
          }}
        >
          <Play className="w-4 h-4" />
          {t('learningPathPage.learningGlossarylist.testKnowledge')}
        </button>
      </div>
    </div>
  );
};

export default GlossaryCard;
