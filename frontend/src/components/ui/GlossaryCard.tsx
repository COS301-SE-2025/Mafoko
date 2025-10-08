import { useState } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { useDarkMode } from './DarkModeComponent';
import { glossaryMap } from './glossaryMock';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { cachingService } from '../../utils/cachingService';
import { toast } from 'sonner';

interface Glossary {
  name: string;
  description: string;
  termCount: number;
}

interface GlossaryCardProps {
  glossary: Glossary;
  onView?: (glossary: Glossary) => void;
  onBookmark?: (glossary: Glossary, isBookmarked: boolean) => void;
  isBookmarked?: boolean;
}

export default function GlossaryCard({
  glossary,
  onView,
  onBookmark,
  isBookmarked: initialBookmarked = false,
}: GlossaryCardProps) {
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
    e.stopPropagation();

    if (loading) return; // 🔒 Prevent concurrent toggles

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast('Bookmark Failed', {
        description: 'Please log in to bookmark glossaries.',
      });
      return;
    }

    if (networkStatus.isOffline) {
      toast('Bookmark Failed', {
        description: 'Bookmark operations require internet connection.',
      });
      return;
    }

    setLoading(true);

    try {
      const currentlyBookmarked = isBookmarked;
      const action = currentlyBookmarked ? 'unbookmark' : 'bookmark';

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
        setIsBookmarked(!currentlyBookmarked);

        // sync cross-tab
        localStorage.setItem('bookmarksChanged', Date.now().toString());
        window.dispatchEvent(
          new CustomEvent('bookmarkChanged', {
            detail: {
              type: 'glossary',
              action,
              name: glossary.name,
            },
          }),
        );

        onBookmark?.(glossary, !currentlyBookmarked);
      } else {
        toast('Bookmark Failed', {
          description: 'Bookmark operation failed.',
        });
      }
    } catch (error) {
      console.error('Bookmark toggle failed:', error);
      toast('Bookmark Failed', {
        description: 'Unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative cursor-pointer transition-transform duration-300 hover:-translate-y-1 group !bg-[var(--bg-tri)]"
      onClick={() => onView?.(glossary)}
    >
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
              ? 'bg-[#212532FF] border-gray-800 group-hover:border-teal-300'
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
              w-[50] h-[50] flex items-center justify-center rounded-full
              ${
                isBookmarked
                  ? 'bg-yellow-400 hover:bg-yellow-300'
                  : 'bg-teal-400 hover:bg-teal-300'
              }
              transition-colors
            `}
            title={isBookmarked ? 'Unbookmark glossary' : 'Bookmark glossary'}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Bookmark
                className="w-5 h-5 text-white"
                fill={isBookmarked ? '#fff' : 'none'}
                strokeWidth={2.3}
              />
            )}
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
