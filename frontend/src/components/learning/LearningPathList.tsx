import type { FC } from 'react';
import LanguageCard from './LanguageCard';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <div className="w-full text-theme">
      <h1>{t('learningPathPage.learningPathlist.learningPathTitle')}</h1>
      <div className="w-full">
        {isLoading ? (
          <p>{t('learningPathPage.learningPathlist.loadingPaths')}...</p>
        ) : paths.length === 0 ? (
          <p>{t('learningPathPage.learningPathlist.message')}</p>
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
