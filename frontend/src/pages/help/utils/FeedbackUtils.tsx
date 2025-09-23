import { SectionProps } from '../types.ts';

export const LearningPathContent: SectionProps[] = [
  {
    id: 'select-glossary',
    title: 'Selecting a Glossary',
    content: (
      <p>
        After choosing a language, you’ll be prompted to pick a
        <strong> glossary</strong>. Each glossary is organized by domain (e.g.,
        Education, Health, Technology) so you can focus on the vocabulary that
        matters most to you.
      </p>
    ),
    assetLocation: '',
  },
  {
    id: 'study-methods',
    title: 'Learning with Tests and Cue Cards',
    content: (
      <div>
        <p>Once your glossary is set, you can choose how you want to study:</p>
        <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
          <li>
            <strong>Practice Tests:</strong> Answer questions to test your
            knowledge and reinforce what you’ve learned.
          </li>
          <li>
            <strong>Cue Cards:</strong> Use flashcard-style review to build
            recognition and recall of terms at your own pace.
          </li>
        </ul>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'progress',
    title: 'Tracking Your Progress',
    content: (
      <div>
        <p>
          The Learning Path tracks your activity so you can see how far you’ve
          come. Progress is displayed alongside your community stats, making it
          easy to stay motivated.
        </p>
        <p>
          Combine Learning Paths with weekly challenges and achievements to earn
          badges while improving your language skills.
        </p>
      </div>
    ),
    assetLocation: '',
  },
];

export const DictionaryContent: SectionProps[] = [
  {
    id: 'overview',
    title: 'Understanding the Dictionary',
    content: (
      <div>
        <p>
          The <strong>Dictionary</strong> is where you can look up multilingual
          term definitions across all of South Africa’s 11 official languages.
          It supports fast searching, filtering by language or domain, and
          offline access once dictionaries are downloaded.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'what-is-a-term',
    title: 'What is a Term?',
    content: (
      <div>
        <p>Each term in Marito includes the following details:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>
            <strong>Term:</strong> The word or phrase.
          </li>
          <li>
            <strong>Language:</strong> One of South Africa’s 11 official
            languages.
          </li>
          <li>
            <strong>Domain:</strong> The subject area.
          </li>
          <li>
            <strong>Definition:</strong> A clear explanation of the term’s
            meaning.
          </li>
          <li>
            <strong>Related Terms:</strong> Links to terms with similar or
            connected meanings.
          </li>
        </ul>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'languages',
    title: 'Supported Languages',
    content: (
      <div>
        <p>
          Marito supports all 11 official South African languages. You can
          filter your searches to focus on a single language or explore terms
          across all of them.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm mt-3">
          {[
            'Afrikaans',
            'English',
            'isiNdebele',
            'isiXhosa',
            'isiZulu',
            'Sesotho',
            'Sepedi',
            'Setswana',
            'Siswati',
            'Tshivenda',
            'Xitsonga',
          ].map((lang) => (
            <div key={lang} className="px-3 py-1 rounded bg-theme">
              {lang}
            </div>
          ))}
        </div>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'search',
    title: 'Searching for Terms',
    content: (
      <div>
        <h2 className="text-2xl font-semibold text-theme mb-3">
          How Searching Works
        </h2>
        <p>
          The search functionality in Marito is designed to help you explore
          glossary terms quickly and efficiently across all 11 official South
          African languages. Whether you're looking for a specific translation,
          trying to understand a domain-specific term, or exploring linguistic
          relationships, the search engine adapts to your needs.
        </p>

        <p>
          You’ll find the search bar prominently at the top of the page. As you
          type, Marito performs a live search, updating results in real-time
          based on your input. This makes it easy to experiment with different
          keywords, spelling variants, or even partial matches.
        </p>

        <ul className="list-disc list-inside ml-4 space-y-2">
          <li>
            <strong>Term:</strong> The primary label or phrase representing a
            concept.
          </li>
          <li>
            <strong>Definition:</strong> Terms whose explanations contain your
            search keywords will also appear.
          </li>
          <li>
            <strong>Filters:</strong> If you use filters, only terms in the
            selected language or domain will be returned.
          </li>
        </ul>
        <h3 className="text-lg font-medium mt-4 font-semibold">
          Live Suggestions
        </h3>
        <p>
          As you type, Marito may suggest possible completions or closely
          related terms based on common queries. These suggestions speed up the
          process and help you discover terms even if you’re unsure of the exact
          wording.
        </p>

        <h3 className="text-lg font-medium mt-4 font-semibold">
          Search Sensitivity
        </h3>
        <p>
          By default, Marito performs{' '}
          <strong>exact or near-exact matching</strong>. However, you can expand
          the search behavior by enabling <strong>fuzzy search</strong> which
          finds results even if there are typos or minor differences between
          your input and the actual term.
        </p>
        <h3 className="text-lg font-medium mt-4 font-semibold">Result Cards</h3>
        <p>
          The terms are shown in cards that display the term name, language,
          domain, definition, and voting buttons. Each card also includes a
          “View” link where you can explore the term in more detail, comment on
          it, or suggest changes.
        </p>

        <p>
          You can combine search with filters and sorting to refine your
          experience (see the sections below). For offline use, remember to
          download the relevant dictionaries from the dictionary page.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'filters',
    title: 'Filter Options',
    content: (
      <div>
        <p>
          To narrow results, apply filters from the search page. Available
          filters include:
        </p>
        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
          <li>
            <strong>Language:</strong> Restrict results to a single language.
          </li>
          <li>
            <strong>Domain:</strong> Focus on subject areas like Education,
            Health, or Technology.
          </li>
          <li>
            <strong>Fuzzy Search:</strong> Find terms even if there are typos or
            spelling differences.
          </li>
        </ul>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'view',
    title: 'Viewing Terms',
    content: (
      <p>
        Click the <strong>View</strong> button on a term card to open its full
        definition, see related terms, and explore more detail about its usage.
      </p>
    ),
    assetLocation: '',
  },
  {
    id: 'offline-use',
    title: 'Offline Usage',
    content: (
      <div>
        <p>
          Marito can be used offline by downloading glossaries in advance. Once
          downloaded, search and filters continue to work without an internet
          connection.
        </p>
        <h3 className="text-lg font-medium mt-3">How to Download</h3>
        <ol className="list-decimal list-inside ml-4 space-y-1">
          <li>
            Go to the <strong>Glossaries</strong> page.
          </li>
          <li>Select the glossaries you want to download.</li>
          <li>
            Click <strong>Download</strong> to save them locally.
          </li>
        </ol>
        <p className="mt-2">
          After downloading, terms in that glossary remain available even
          offline.
        </p>
      </div>
    ),
    assetLocation: '',
  },
];

export const CommunityContent: SectionProps[] = [
  {
    id: 'interactions',
    title: 'Comments and Voting',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          You can engage with the community by leaving comments, as well as
          upvoting or downvoting both comments and terms. This ensures that the
          best contributions rise to the top while giving everyone a chance to
          share their insights.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'points',
    title: 'Community Points',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Each interaction earns you points towards your{' '}
          <strong>Community Level</strong>. Points are awarded for:
        </p>
        <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
          <li>Submitting a new term</li>
          <li>Posting or replying with a comment</li>
          <li>Upvoting or downvoting content</li>
          <li>Adding a translation</li>
        </ul>
        <p className="mt-2">
          The more you participate, the higher your level grows.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'challenges',
    title: 'Weekly Challenges and Achievements',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Marito offers <strong>weekly challenges</strong> to help you earn
          additional XP. Completing these challenges contributes to your
          <strong> achievements</strong>.
        </p>
        <p>
          Achievements unlock <strong>badges</strong> that are displayed on your
          profile as a recognition of your contributions to the community.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'contribution-graph',
    title: 'Contribution Graph',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          The <strong>Contribution Graph</strong> shows your daily activity,
          similar to GitHub’s contribution heatmap. You can quickly see:
        </p>
        <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
          <li>How much XP you gained on a particular day</li>
          <li>Which days you were most active</li>
          <li>Your overall consistency in contributing</li>
        </ul>
      </div>
    ),
    assetLocation: '',
  },
];

export const FeedbackContent: SectionProps[] = [
  {
    id: 'submitting',
    title: 'Submitting Feedback',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
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
    assetLocation: '/Marito/videos/feedback/feedback.mp4',
  },
];

export const HomeContent: SectionProps[] = [
  {
    id: 'interactive-map',
    title: 'Interactive Map',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Hover over any province on the map to see facts about the region and
          its linguistic diversity.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'random-terms',
    title: 'Random Terms Discovery',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Click the <strong>refresh button</strong> to explore a new set of
          terms from across different glossaries. You can also click on a
          glossary name directly to dive into that domain.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'profile-access',
    title: 'Profile Quick Access',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Click your <strong>name</strong> in the top-right corner of the page
          to quickly navigate to your profile page.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'dsfsi-info',
    title: 'Learning About DSFSI',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Click the <strong>Learn More</strong> button to access information
          about the <em>Data Science for Social Impact (DSFSI)</em> initiative.
        </p>
      </div>
    ),
    assetLocation: '',
  },
];

export const DashboardContent: SectionProps[] = [
  {
    id: 'filter',
    title: 'Filtering Analytics',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Use the <strong>language filter</strong> to focus your analytics on a
          specific language. This makes it easier to understand your
          contributions and learning progress within a single language context.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'activity-overview',
    title: 'Activity Overview',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Track your general usage patterns and contributions across the
          platform. This section highlights how frequently you engage with
          different features.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'language-analytics',
    title: 'Language Analytics',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          View statistics filtered by your preferred languages to see how your
          activity and contributions are distributed across them.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'category-distribution',
    title: 'Category Distribution',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Explore how terms are distributed across different domains, such as
          education, health, law, and technology. This helps you understand
          which areas you’ve contributed to most.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'progress-tracking',
    title: 'Progress Tracking',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Monitor your learning journey and contribution milestones over time.
          This section helps you measure your growth and track achievements as
          you engage with the platform.
        </p>
      </div>
    ),
    assetLocation: '',
  },
];
