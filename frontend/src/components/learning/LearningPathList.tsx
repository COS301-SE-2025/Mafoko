import type { FC } from 'react';
import LanguageCard from './LanguageCard';
import { Trash2 } from 'lucide-react';

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
    <div className="component-container">
      <h1>Learning Paths</h1>
      <div className="content-wrapper">
        {isLoading ? (
          <p>Loading paths...</p>
        ) : paths.length === 0 ? (
          <p>
            You haven't created any learning paths yet. Click "+ New Path" to
            get started!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  />
                  <button
                    type="button"
                    aria-label="Delete learning path"
                    title="Delete learning path"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPathDelete(path.id);
                    }}
                    className="path-delete-button"
                  >
                    <Trash2 size={18} />
                  </button>
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
