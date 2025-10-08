import React, { useEffect, useState, useMemo } from 'react';
import { Trash2 } from 'lucide-react';

interface LanguageCardProps {
  code: string;
  name: string;
  totalWords: number;
  completedPercentage: number;
  onClick?: () => void;
  onDelete?: () => void;
}

const COLOURS = ['bg-[#f00a50]', 'bg-[#f2d001]', 'bg-[#00ceaf]'];

const LanguageCard: React.FC<LanguageCardProps> = ({
  code,
  name,
  completedPercentage,
  onClick,
  onDelete,
}) => {
  const [isDark, setIsDark] = useState(false);

  // Pick a random background colour for the avatar (stable per card)
  const avatarBg = useMemo(() => {
    // stable random seed based on code string
    const index =
      Math.abs(code.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) %
      COLOURS.length;
    return COLOURS[index];
  }, [code]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detect = () => {
      const el = document.documentElement;
      const body = document.body;
      const prefersDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      const hasThemeClass =
        el.classList.contains('theme-dark') ||
        el.classList.contains('dark-mode') ||
        body.classList.contains('dark-mode');
      setIsDark(Boolean(hasThemeClass || prefersDark));
    };

    detect();

    let mq: MediaQueryList | null = null;
    try {
      if (window.matchMedia) {
        mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (mq.addEventListener) mq.addEventListener('change', detect);
        else if ((mq as any).addListener) (mq as any).addListener(detect);
      }
    } catch {
      // ignore
    }

    const observer = new MutationObserver(() => detect());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      if (mq) {
        if (mq.removeEventListener) mq.removeEventListener('change', detect);
        else if ((mq as any).removeListener) (mq as any).removeListener(detect);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div
      onClick={onClick}
      className={`
    rounded-xl p-4 sm:p-5 md:p-6 
    shadow-sm border cursor-pointer 
    hover:shadow-md transition-all hover:-translate-y-1 
    !bg-[var(--bg-tir)]
    h-full w-full
  `}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="language-card-inner flex flex-col items-start justify-between !text-theme gap-6 h-full">
        {/* Avatar */}
        <div
          className="flex flex-row justify-start items-center gap-6 border-b w-full pb-3"
          style={{ paddingBottom: '10px' }}
        >
          <div
            className={`language-avatar w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white ${avatarBg}`}
          >
            {code}
          </div>

          <div className="flex-1 text-left">
            <h3 className="language-name text-lg font-semibold mb-1 !text-theme break-words">
              {name}
            </h3>
          </div>

          <button
            type="button"
            aria-label="Delete learning path"
            title="Delete learning path"
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete();
            }}
            className="text-red-600 hover:text-red-700 rounded-full w-20 h-20 flex justify-center items-center"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-auto w-full flex flex-row items-center justify-between gap-4">
          <div className="relative w-full h-3 rounded-full overflow-hidden bg-gray-300/30">
            <div
              className="absolute top-0 left-0 h-full bg-[var(--accent-color)] transition-all duration-500"
              style={{
                width: `${Math.max(0, Math.min(100, Math.round(completedPercentage)))}%`,
              }}
            />
          </div>
          <span
            className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}
          >
            {completedPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default LanguageCard;
