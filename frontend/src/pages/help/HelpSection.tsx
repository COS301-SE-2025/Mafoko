import { HelpSectionProps } from './types.ts';

export const HelpSection = ({
  id,
  title,
  content,
  assetLocation,
}: HelpSectionProps) => {
  return (
    <section id={id}>
      <h2 className="text-3xl font-bold text-theme mb-4">{title}</h2>
      <div className="space-y-6 leading-relaxed text-base">
        <p>{content}</p>
      </div>
      {assetLocation !== '' && (
        <div className="video-container">
          <video
            controls
            width="100%"
            style={{
              maxWidth: '800px',
              marginTop: '2rem',
              borderRadius: '0.75rem',
            }}
          >
            <source src={assetLocation} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </section>
  );
};

import { SectionProps } from './types.ts';

export const HelpNodeSection = ({
  id,
  title,
  content,
  assetLocation,
}: SectionProps) => {
  return (
    <section id={id} className="pb-3 mb-4">
      <h2 className="text-3xl font-bold text-theme mb-4 mt-2">{title}</h2>

      {content}

      {assetLocation && (
        <div className="video-container pb-3">
          <video
            controls
            width="100%"
            style={{
              maxWidth: '800px',
              marginTop: '2rem',
              borderRadius: '0.75rem',
            }}
          >
            <source src={assetLocation} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </section>
  );
};
