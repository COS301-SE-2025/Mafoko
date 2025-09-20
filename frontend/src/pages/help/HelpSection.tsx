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
    </section>
  );
};
