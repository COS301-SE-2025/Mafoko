import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useDarkMode } from './DarkModeComponent';
import { glossaryMap } from './glossaryMock';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { cachingService } from '../../utils/cachingService';

interface Glossary {
  name: string;
  description: string;
  termCount: number;
}

interface GlossaryCardProps {
  glossary: Glossary;
  onView?: (glossary: Glossary) => void;
  onExport?: (glossary: Glossary) => void;
  /** Called after a bookmark toggle completes successfully */
  onBookmark?: (glossary: Glossary, isBookmarked: boolean) => void;
  isBookmarked?: boolean;
}

export default function GlossaryCard({
                                       glossary,
                                       onView,
                                       onExport,
                                       onBookmark,
                                       isBookmarked: initialBookmarked = false,
                                     }: GlossaryCardProps) {
  // use glossary name to pick correct mock icon/description
  const { icon: Icon, description } = glossaryMap[glossary.name] ?? {
    icon: null,
    description: glossary.description,
  };

  const { isDarkMode } = useDarkMode();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const networkStatus = useNetworkStatus();

  const handleBookmarkToggle = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation(); // prevent triggering onView
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in to bookmark glossaries.');
      return;
    }

    if (networkStatus.isOffline) {
      alert('Bookmark operations require internet connection.');
      return;
    }

    setLoading(true);
    try {
      const currentlyBookmarked = isBookmarked;
      setIsBookmarked(!currentlyBookmarked); // optimistic UI update

      let success = false;
      if (currentlyBookmarked) {
        success = await cachingService.unbookmarkGlossary(token, glossary.name);
      } else {
        success = await cachingService.bookmarkGlossary(
          token,
          glossary.name,
          glossary.description,
        );
      }

      if (success) {
        const newState = !currentlyBookmarked;
        setIsBookmarked(newState);

        // sync bookmarks cross-tab
        localStorage.setItem('bookmarksChanged', Date.now().toString());
        window.dispatchEvent(
          new CustomEvent('bookmarkChanged', {
            detail: {
              type: 'glossary',
              action: newState ? 'bookmark' : 'unbookmark',
              name: glossary.name,
            },
          }),
        );

        onBookmark?.(glossary, newState);
      } else {
        setIsBookmarked(currentlyBookmarked); // revert
        alert('Bookmark operation failed.');
      }
    } catch (error) {
      console.error('Bookmark toggle failed:', error);
      setIsBookmarked((prev) => !prev); // revert
      alert('Bookmark operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative cursor-pointer transition-transform duration-300 hover:-translate-y-1 group !bg-[var(--bg-tri)]"
      onClick={() => onView?.(glossary)}
    >
      {/* Folder background */}
      <div
        className={`
          absolute -top-4 left-0 right-0 bottom-0 rounded-2xl
          transition-colors duration-300
          ${
          isDarkMode
            ? 'bg-teal-900/40 group-hover:bg-teal-800/60'
            : 'bg-teal-100 group-hover:bg-teal-200'
        }
          z-0
        `}
      />

      <div
        className={`
          relative z-10 rounded-2xl border shadow-md transition-all duration-300
          p-5 flex flex-col justify-between h-[220px]
          ${
          isDarkMode
            ? 'bg-[#212431FF] border-gray-800 group-hover:border-teal-300'
            : 'bg-white border-gray-200 group-hover:border-teal-300'
        }
        `}
        style={{ padding: '15px' }}
      >
        <div className="flex items-start justify-between mb-2 text-left">
          <div>
            <h3
              className={`text-lg font-semibold ${
                isDarkMode ? 'text-gray-50' : 'text-gray-900'
              }`}
            >
              {glossary.name}
            </h3>
            <p className="text-xs font-medium text-zinc-500">
              {glossary.termCount} terms
            </p>
            <p className="text-xs font-medium text-zinc-500">
              {description || glossary.description}
            </p>
          </div>

          <button
            onClick={handleBookmarkToggle}
            disabled={loading}
            className={`
              w-[15] h-[15] flex items-center justify-center rounded-full
              ${
              isBookmarked
                ? 'bg-yellow-400 hover:bg-yellow-300'
                : 'bg-teal-400 hover:bg-teal-300'
            }
              transition-colors p-0
            `}
            title={isBookmarked ? 'Unbookmark glossary' : 'Bookmark glossary'}
          >
            <Bookmark
              className="w-5 h-5 text-white"
              fill={isBookmarked ? '#fff' : 'none'}
              strokeWidth={2.3}

            />
          </button>
        </div>

        <p
          className={`text-sm line-clamp-3 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          {glossary.description}
        </p>
      </div>
    </div>
  );
}
