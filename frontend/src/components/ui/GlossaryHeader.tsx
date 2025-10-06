import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface GlossaryHeaderProps {
  title: string;
  description?: string;
  countText?: string;
  onBack: () => void;
}

const GlossaryHeader: React.FC<GlossaryHeaderProps> = ({
  title,
  description,
  countText,
  onBack,
}) => (
  <div
    className="
      w-full flex flex-col items-center
      bg-[var(--header-background)] text-[var(--header-text)]
      py-4 md:py-5
    "
  >
    <div
      className="
        w-full flex items-center justify-center relative flex-wrap
        min-h-[56px] px-4 md:px-6
      "
    >
      {/* Back Button */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20">
        <button
          type="button"
          onClick={onBack}
          className="
            flex items-center justify-center
            bg-[var(--return-button-bg)] border border-[var(--glossary-border-color)]
            rounded-md p-2 min-w-[36px] min-h-[36px]
            transition-all duration-200 hover:opacity-90
          "
        >
          <ArrowLeft
            className="w-[22px] h-[22px]"
            style={{ color: 'var(--return-button-icon)' }}
          />
        </button>
      </div>

      {/* Title and Description */}
      <div
        className="flex-1 text-center min-w-0 px-2"
        style={{ padding: '30px' }}
      >
        <h1
          className="
            m-0 text-[1.35rem] font-bold truncate max-w-full
            md:text-[1.4rem]
          "
        >
          {title}
        </h1>
        {description && (
          <p
            className="
              text-[0.98rem] mt-[0.2rem] truncate max-w-full
              md:text-base
            "
          >
            {description}
          </p>
        )}
      </div>

      {/* Count Text */}
    </div>
  </div>
);

export default GlossaryHeader;
