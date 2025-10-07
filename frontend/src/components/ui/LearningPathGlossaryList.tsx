import GlossaryCard from '../learning/GlossaryCard.tsx';
import React from 'react';
import {
  GlossaryProgress,
  LearningPathGlossary
} from '../../types/learning.ts';

interface LearningPath {
  id: string
  path_name: string
  language_name: string
  selected_glossaries: LearningPathGlossary[]
  completedPercentage?: number
}

export function LearningPathGlossaryList({selectedPath, setCurrentView, glossaryWordCounts, handleGlossarySelect} : { selectedPath: LearningPath, setCurrentView:  React.Dispatch<React.SetStateAction<"paths" | "glossaries" | "words">>,glossaryWordCounts: Record<string, number>, handleGlossarySelect: (glossary: GlossaryProgress, startWithFlashcards: boolean)=> Promise<void> } ) {
  return (
    <>
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => {
            setCurrentView('paths');
          }}
          className="text-gray-600 hover:text-gray-900 mr-4"
        >
          ← Back to Paths
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
              completedPercentage={
                selectedPath.completedPercentage || 0
              }
            />
          );
        })}
      </div>
    </>
  )
}