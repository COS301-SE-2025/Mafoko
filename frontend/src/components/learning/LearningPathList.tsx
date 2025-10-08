import type { FC } from 'react';
import LanguageCard from './LanguageCard';

type GlossaryRef = { glossary_name: string };

export interface LearningPath {
  id: string;
  language_name: string;
  path_name: string;
  selected_glossaries: GlossaryRef[];
  completedPercentage?: number;
}

interface LearningPathListProps {
  paths: LearningPath[];
  onPathSelect: (path: LearningPath) => void;
  onPathDelete: (pathId: string) => void;
  isLoading: boolean;
}

const LearningPathList: FC<LearningPathListProps> = ({
  paths,
  onPathSelect,
  onPathDelete,
  isLoading,
}) => {
  return (
    <div className="w-full text-theme">
      <h1>Learning Paths</h1>
      <div className="w-full">
        {isLoading ? (
          <p>Loading paths...</p>
        ) : paths.length === 0 ? (
          <p>
            You haven't created any learning paths yet. Click "+ New Path" to
            get started!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6 w-full">
            {paths.map((path) => {
              const code =
                (path.language_name ?? '').slice(0, 2).toUpperCase() || '??';

              return (
                <div key={path.id} className="relative">
                  <LanguageCard
                    code={code}
                    name={path.path_name}
                    totalWords={path.selected_glossaries.length}
                    completedPercentage={path.completedPercentage ?? 0}
                    onClick={() => onPathSelect(path)}
                    onDelete={() => onPathDelete(path.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPathList;
