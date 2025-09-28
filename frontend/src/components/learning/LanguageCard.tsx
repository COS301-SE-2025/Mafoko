import React, { useEffect, useState } from 'react';

interface LanguageCardProps {
  code: string;
  name: string;
  totalWords: number;
  completedPercentage: number;
  onClick?: () => void;
}

const LanguageCard: React.FC<LanguageCardProps> = ({
  code,
  name,
  totalWords,
  completedPercentage,
  onClick,
}) => {
  const [isDark, setIsDark] = useState(false);

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
        // older browsers use addListener
        if (mq.addEventListener) {
          mq.addEventListener('change', detect);
        } else if ((mq as any).addListener) {
          (mq as any).addListener(detect);
        }
      }
    } catch (e) {
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

  // We use CSS classes for styling; dark mode is toggled via the `dark` class

  return (
    <div
      onClick={onClick}
      className={`language-card rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 ${isDark ? 'dark' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="language-card-inner flex flex-col items-center">
        <div className="language-avatar w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
          {code}
        </div>
        <h3 className="language-name text-lg font-semibold mb-1">{name}</h3>
        <p className="language-stats text-sm mb-4">
          {totalWords.toLocaleString()} Categories
        </p>

        <div className="w-full rounded-full h-2 mb-2 progress-track">
          <div
            className={`progress-fill`}
            style={{
              width: `${Math.max(0, Math.min(100, Math.round(completedPercentage)))}%`,
            }}
          />
        </div>
        <span className="progress-label text-xs">
          {completedPercentage}% completed
        </span>
      </div>
    </div>
  );
};

export default LanguageCard;
