import React, { useEffect, useState } from 'react';

interface LanguageCardProps {
  code: string;
  name: string;
  totalWords: number;
  color: string;
  completedPercentage: number;
  onClick?: () => void;
}

const LanguageCard: React.FC<LanguageCardProps> = ({
  code,
  name,
  totalWords,
  color,
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

  const cardStyle: React.CSSProperties = isDark
    ? {
        backgroundColor: 'var(--card-bg-dark, #292e41)',
        borderColor: '#292e41',
        color: 'var(--text-color-dark, #ffffff)',
      }
    : {};

  const subtitleStyle: React.CSSProperties = isDark
    ? { color: 'rgba(140, 30, 30, 0.75)' }
    : {};

  const progressBg = isDark ? '#292e41' : undefined;

  return (
    <div
      onClick={onClick}
      className="language-card rounded-xl p-6 shadow-sm border cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      style={cardStyle}
    >
      <div className="flex flex-col items-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4"
          style={{ backgroundColor: color }}
        >
          {code}
        </div>
        <h3
          className="text-lg font-semibold mb-1"
          style={{ color: cardStyle.color }}
        >
          {name}
        </h3>
        <p className="text-sm mb-4" style={subtitleStyle}>
          {totalWords.toLocaleString()} Categories
        </p>

        <div
          className="w-full rounded-full h-2 mb-2"
          style={{ backgroundColor: progressBg }}
        >
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ backgroundColor: color, width: `${completedPercentage}%` }}
          ></div>
        </div>
        <span className="text-xs" style={subtitleStyle}>
          {completedPercentage}% completed
        </span>
      </div>
    </div>
  );
};

export default LanguageCard;
