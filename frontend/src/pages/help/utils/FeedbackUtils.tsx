import { SectionProps } from '../types.ts';

export const FeedbackContent: SectionProps[] = [
  {
    id: 'submitting',
    title: 'Submitting Feedback',
    content: (
      <div>
        <ol className="list-decimal list-inside space-y-2 mt-4">
          <li>
            <strong>Enter Your Details (Optional):</strong> You can fill in your
            contact information if you’d like a reply, or leave these fields
            blank to submit anonymously.
          </li>
          <li>
            <strong>Write Your Feedback:</strong> Enter your message in the text
            field, whether it’s a suggestion, compliment, or complaint.
          </li>
          <li>
            <strong>Click Send:</strong> Submit your feedback to the
            administrators for review.
          </li>
        </ol>
      </div>
    ),
    assetLocation: '',
  },
];

export const HomeContent: SectionProps[] = [
  {
    id: 'interactive-map',
    title: 'Interactive Map',
    content: (
      <p>
        Hover over any province on the map to see facts about the region and its
        linguistic diversity.
      </p>
    ),
    assetLocation: '',
  },
  {
    id: 'random-terms',
    title: 'Random Terms Discovery',
    content: (
      <p>
        Click the <strong>refresh button</strong> to explore a new set of terms
        from across different glossaries. You can also click on a glossary name
        directly to dive into that domain.
      </p>
    ),
    assetLocation: '',
  },
  {
    id: 'profile-access',
    title: 'Profile Quick Access',
    content: (
      <p>
        Click your <strong>name</strong> in the top-right corner of the page to
        quickly navigate to your profile page.
      </p>
    ),
    assetLocation: '',
  },
  {
    id: 'dsfsi-info',
    title: 'Learning About DSFSI',
    content: (
      <p>
        Click the <strong>Learn More</strong> button to access information about
        the <em>Data Science for Social Impact (DSFSI)</em> initiative.
      </p>
    ),
    assetLocation: '',
  },
];

export const DashboardContent: SectionProps[] = [
  {
    id: 'filter',
    title: 'Filtering Analytics',
    content: (
      <p>
        Use the <strong>language filter</strong> to focus your analytics on a
        specific language. This makes it easier to understand your contributions
        and learning progress within a single language context.
      </p>
    ),
    assetLocation: '',
  },
  {
    id: 'activity-overview',
    title: 'Activity Overview',
    content: (
      <p>
        Track your general usage patterns and contributions across the platform.
        This section highlights how frequently you engage with different
        features.
      </p>
    ),
    assetLocation: '',
  },
  {
    id: 'language-analytics',
    title: 'Language Analytics',
    content: (
      <p>
        View statistics filtered by your preferred languages to see how your
        activity and contributions are distributed across them.
      </p>
    ),
    assetLocation: '',
  },
  {
    id: 'category-distribution',
    title: 'Category Distribution',
    content: (
      <p>
        Explore how terms are distributed across different domains, such as
        education, health, law, and technology. This helps you understand which
        areas you’ve contributed to most.
      </p>
    ),
    assetLocation: '',
  },
  {
    id: 'progress-tracking',
    title: 'Progress Tracking',
    content: (
      <p>
        Monitor your learning journey and contribution milestones over time.
        This section helps you measure your growth and track achievements as you
        engage with the platform.
      </p>
    ),
    assetLocation: '',
  },
];
