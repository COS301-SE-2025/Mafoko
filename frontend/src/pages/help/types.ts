export type FAQ = {
  id: string;
  question: string;
  answer: string;
  category:
    | 'Account'
    | 'Customization'
    | 'Data & Exports'
    | 'Feedback & Support';
};

export type HelpSectionProps = {
  id: string;
  title: string;
  content: string;
  assetLocation?: string;
};

export type GettingStartedContentType = {
  id: string;
  title: string;
  content: string;
  assetLocation?: string;
};

export const faqs: FAQ[] = [
  {
    id: 'languages',
    question: 'What languages does Marito support?',
    answer: `Marito supports all 11 official South African languages, giving you the flexibility to search, learn, and contribute in the language that works best for you.`,
    category: 'Account',
  },
  {
    id: 'create-account',
    question: 'How do I create an account on Marito?',
    answer: `To get started, click the Sign Up button on the login page and fill in your details to create a personal account.  
  If you’d prefer not to register right away, you can also explore Marito as a guest. Just keep in mind that guest access offers limited features compared to a full account.`,
    category: 'Account',
  },
  {
    id: 'guest-users',
    question: 'Can I use Marito without an account?',
    answer: `Yes. As a guest, you can browse the application without signing up.  
  However, to unlock the full set of features you’ll need to create an account.`,
    category: 'Account',
  },
  {
    id: 'password',
    question: 'I forgot my password — how do I reset it?',
    answer: `Click the Forgot Password option on the login page and follow the prompts to reset your password.  
  If you’re still unable to access your account, contact our Support Team for assistance with account recovery.`,
    category: 'Account',
  },
  {
    id: 'profile',
    question: 'How can I change my profile information?',
    answer: `Open the Settings page and select User Profile.  
  From there, you can update your details by clicking the appropriate Edit options.`,
    category: 'Customization',
  },
  {
    id: 'accessibility',
    question: 'How can I change the accessibility settings?',
    answer: `Go to the Settings page and open the Accessibility section.  
  There, you can adjust options such as text size, spacing, high-contrast mode, and interface language to match your preferences.`,
    category: 'Customization',
  },
  {
    id: 'mode-change',
    question: 'How do I switch between light and dark mode?',
    answer: `Click the theme icon in the bottom-left corner of any page.  
  This will instantly toggle between Light Mode and Dark Mode, so you can choose the look that suits you best.`,
    category: 'Customization',
  },
  {
    id: 'export',
    question: 'What file formats can I export data in?',
    answer: `You can export your data in PDF, JSON, CSV, or HTML format, making it easy to share or work with in other tools.`,
    category: 'Data & Exports',
  },
  {
    id: 'export-filters',
    question: 'Do exported files include my applied filters?',
    answer: `Yes. Any filters you apply will be reflected in the exported file, so your data matches exactly what you see on screen.`,
    category: 'Data & Exports',
  },
  {
    id: 'contribution-tracking',
    question: 'How do I track my contributions?',
    answer: `Open your Dashboard to see statistics about your overall activity and contributions.  
  You can also visit your Workspace to monitor the status and progress of your individual term submissions.`,
    category: 'Data & Exports',
  },

  {
    id: 'search-terms',
    question: 'How can I search for a specific term?',
    answer: `Use the Dictionary to enter your keyword in the search bar.  
  You can also apply language and domain filters to narrow down your results and quickly find the exact term you’re looking for.`,
    category: 'Data & Exports',
  },
  {
    id: 'save-terms',
    question: 'How do I save terms?',
    answer: `Click the bookmark icon next to any term to add it to your Workspace.  
  From there, you can organize your saved terms into custom groups for easier management and quick access later.`,
    category: 'Data & Exports',
  },
  {
    id: 'feedback',
    question: 'How do I submit feedback or suggestions?',
    answer: `Go to the Feedback tab to share your thoughts as a complaint, compliment, or suggestion.  
  You can choose to include your details or submit your feedback anonymously.`,
    category: 'Feedback & Support',
  },

  {
    id: 'bugs',
    question: 'How do I report technical issues or bugs?',
    answer: `Go to the Feedback tab and submit the details of the issue you encountered.  
  For urgent problems, you can also reach out directly to the Support Team for immediate assistance.`,
    category: 'Feedback & Support',
  },
];
