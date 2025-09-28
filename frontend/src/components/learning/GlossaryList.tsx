import React from 'react';
import GlossaryCard from './GlossaryCard';

interface GlossaryListProps {
  glossaries: Array<{
    id: string;
    name: string;
    words: number;
    completedPercentage: number;
  }>;
  onStudy: (glossary: any) => void;
  onFlashcards: (glossary: any) => void;
}

const GlossaryList: React.FC<GlossaryListProps> = ({
  glossaries,
  onStudy,
  onFlashcards,
}) => {
  return (
    <div className="component-container">
      <div className="content-wrapper">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {glossaries.map((glossary) => (
            <GlossaryCard
              key={glossary.id}
              glossary={glossary}
              onStudy={() => onStudy(glossary)}
              onFlashcards={() => onFlashcards(glossary)}
              completedPercentage={glossary.completedPercentage}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GlossaryList;
