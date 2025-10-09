import GlossaryCard from '../learning/GlossaryCard.tsx';
import React from 'react';
import {
  GlossaryProgress,
  LearningPathGlossary,
} from '../../types/learning.ts';
import { useTranslation } from 'react-i18next';

interface LearningPath {
  id: string;
  path_name: string;
  language_name: string;
  selected_glossaries: LearningPathGlossary[];
  completedPercentage?: number;
}

export function LearningPathGlossaryList({
  selectedPath,
  setCurrentView,
  glossaryWordCounts,
  handleGlossarySelect,
}: {
  selectedPath: LearningPath;
  setCurrentView: React.Dispatch<
    React.SetStateAction<'paths' | 'glossaries' | 'words'>
  >;
  glossaryWordCounts: Record<string, number>;
  handleGlossarySelect: (
    glossary: GlossaryProgress,
    startWithFlashcards: boolean,
  ) => Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => {
            setCurrentView('paths');
          }}
          className="text-theme hover:text-gray-900 mr-4"
        >
          ← {t('learningPathPage.learningGlossarylist.backToPaths')}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {selectedPath.selected_glossaries.map((g) => {
          const glossaryInfo = {
            id: g.glossary_name,
            name: g.glossary_name,
            words: glossaryWordCounts[g.glossary_name] || 0,
            completedPercentage: 0,
          };
          return (
            <GlossaryCard
              key={g.glossary_name}
              glossary={glossaryInfo}
              onStudy={() => {
                void handleGlossarySelect(glossaryInfo, false);
              }}
              onFlashcards={() => {
                void handleGlossarySelect(glossaryInfo, true);
              }}
              completedPercentage={selectedPath.completedPercentage || 0}
            />
          );
        })}
      </div>
    </>
  );
}
