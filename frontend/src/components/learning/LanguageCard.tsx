import React from 'react';

interface LanguageCardProps {
  code: string;
  name: string;
  totalWords: number;
  color: string;
  completedPercentage: number;
  onClick?: () => void;
}

const LanguageCard: React.FC<LanguageCardProps> = ({
  code,
  name,
  totalWords,
  color,
  completedPercentage,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="language-card bg-white rounded-xl p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex flex-col items-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4"
          style={{ backgroundColor: color }}
        >
          {code}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {totalWords.toLocaleString()} Categories
        </p>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ backgroundColor: color, width: `${completedPercentage}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-500">
          {completedPercentage}% completed
        </span>
      </div>
    </div>
  );
};

export default LanguageCard;
