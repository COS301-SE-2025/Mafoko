import React, { useEffect, useState, useMemo } from 'react';

interface LanguageCardProps {
  code: string;
  name: string;
  totalWords: number;
  completedPercentage: number;
  onClick?: () => void;
}

const COLOURS = [
  'bg-[#f00a50]',
  'bg-[#f2d001]',
  'bg-[#00ceaf]',
];

const LanguageCard: React.FC<LanguageCardProps> = ({
                                                     code,
                                                     name,
                                                     completedPercentage,
                                                     onClick,
                                                   }) => {
  const [isDark, setIsDark] = useState(false);

  // Pick a random background colour for the avatar (stable per card)
  const avatarBg = useMemo(() => {
    // stable random seed based on code string
    const index = Math.abs(
      code.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    ) % COLOURS.length;
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
      className={`rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 !bg-[var(--bg-tir)]`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="language-card-inner flex flex-col items-start !text-theme gap-6">
        {/* Avatar */}
        <div className="flex felx-row justify-start items-center gap-6 border-b-1 w-full">
          <div
            className={`language-avatar w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-4 text-white ${avatarBg}`}
          >
            {code}
          </div>

          {/* Title and Stats */}
          <div className="text-left">
            <h3 className="language-name text-lg font-semibold mb-1 !text-theme">
              {name}
            </h3>
          </div>

        </div>



        {/* Progress bar */}

        <div className="w-full flex flex-row gap-0">
          <div className="w-full flex justify-center items-center m-0 p-0 gap-5">
            <div className="relative w-[80%] h-4.5 rounded-full overflow-hidden bg-gray-300/30">
              {/* progress fill */}
              <div
                className="absolute top-0 left-0 h-full bg-[var(--accent-color)] transition-all duration-500"
                style={{
                  width: `${Math.max(0, Math.min(100, Math.round(completedPercentage)))}%`,
                }}
              />
            </div>
            <div className={`!text-[13px] text-left ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              {completedPercentage}%
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LanguageCard;
