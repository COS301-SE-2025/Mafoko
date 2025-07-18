import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  Search,
  BookOpen,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useDarkMode } from '../components/ui/DarkModeComponent';

import '../styles/WorkspacePage.scss';

// Define types for our data
interface Term {
  id: number;
  term: string;
  definition?: string;
  language: string;
  category?: string;
  group: string;
  lastModified: string;
}

interface SubmittedTerm {
  id: number;
  term: string;
  status: 'approved' | 'pending' | 'rejected' | 'under_review';
  submittedDate: string;
  reviewedDate: string | null;
  feedback?: string;
}

interface Glossary {
  id: number;
  name: string;
  language: string;
  termCount: number;
  lastUpdated: string;
  followed: boolean;
}

const WorkspacePage: React.FC = () => {
  // For navigation integration
  const [activeMenuItem, setActiveMenuItem] = useState('workspace');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { isDarkMode } = useDarkMode();

  const [activeTab, setActiveTab] = useState('saved-terms');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean;
  }>({});

  // Apply theme to document based on isDarkMode state
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
    } else {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
    }
  }, [isDarkMode]);

  // Mock data
  const savedTerms: Term[] = [
    {
      id: 1,
      term: 'Landbou-insette',
      definition:
        'Crops that are planted and harvested during the same production season.',
      language: 'Afrikaans',
      category: 'Agriculture',
      group: 'Thesis Research',
      lastModified: '2024-07-15',
    },
    {
      id: 2,
      term: 'Biodiversity',
      definition:
        'The variety of life in the world or in a particular habitat or ecosystem.',
      language: 'English',
      category: 'Environmental Science',
      group: 'Thesis Research',
      lastModified: '2024-07-14',
    },
    {
      id: 3,
      term: 'Photosynthesis',
      definition:
        'The process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy.',
      language: 'English',
      category: 'Biology',
      group: 'General Study',
      lastModified: '2024-07-13',
    },
    {
      id: 4,
      term: 'Gewasrotasie',
      definition:
        'The practice of growing different types of crops in the same area across seasons.',
      language: 'Afrikaans',
      category: 'Agriculture',
      group: 'Farming Methods',
      lastModified: '2024-07-12',
    },
  ];

  const submittedTerms: SubmittedTerm[] = [
    {
      id: 1,
      term: 'Sustainable Agriculture',
      status: 'approved',
      submittedDate: '2024-07-10',
      reviewedDate: '2024-07-14',
    },
    {
      id: 2,
      term: 'Irrigation Methods',
      status: 'pending',
      submittedDate: '2024-07-16',
      reviewedDate: null,
    },
    {
      id: 3,
      term: 'Soil Composition',
      status: 'rejected',
      submittedDate: '2024-07-08',
      reviewedDate: '2024-07-12',
      feedback: 'Definition needs more detail',
    },
    {
      id: 4,
      term: 'Climate Change Impact',
      status: 'under_review',
      submittedDate: '2024-07-17',
      reviewedDate: null,
    },
  ];

  const glossaries: Glossary[] = [
    {
      id: 1,
      name: 'Agriculture Glossary',
      language: 'Afrikaans',
      termCount: 245,
      lastUpdated: '2024-07-15',
      followed: true,
    },
    {
      id: 2,
      name: 'Environmental Science Terms',
      language: 'English',
      termCount: 189,
      lastUpdated: '2024-07-14',
      followed: true,
    },
    {
      id: 3,
      name: 'Biology Fundamentals',
      language: 'English',
      termCount: 156,
      lastUpdated: '2024-07-13',
      followed: false,
    },
    {
      id: 4,
      name: 'Farming Techniques',
      language: 'Afrikaans',
      termCount: 98,
      lastUpdated: '2024-07-12',
      followed: true,
    },
  ];

  const groups = ['all', 'Thesis Research', 'General Study', 'Farming Methods'];

  // Handle window resize with debounce for better performance
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setIsMobile(window.innerWidth <= 768);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    // Call once on mount to set initial state
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const getStatusColor = (status: SubmittedTerm['status']) => {
    if (isDarkMode) {
      switch (status) {
        case 'approved':
          return 'bg-green-800 text-green-100';
        case 'pending':
          return 'bg-yellow-800 text-yellow-100';
        case 'rejected':
          return 'bg-red-800 text-red-100';
        case 'under_review':
          return 'bg-blue-800 text-blue-100';
        default:
          return 'bg-gray-700 text-gray-100';
      }
    } else {
      switch (status) {
        case 'approved':
          return 'bg-green-100 text-green-700';
        case 'pending':
          return 'bg-yellow-100 text-yellow-700';
        case 'rejected':
          return 'bg-red-100 text-red-700';
        case 'under_review':
          return 'bg-blue-100 text-blue-700';
        default:
          return 'bg-gray-100 text-gray-700';
      }
    }
  };

  const getStatusIcon = (status: SubmittedTerm['status']) => {
    switch (status) {
      case 'approved':
        return <Check className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      case 'under_review':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredTerms = savedTerms.filter((term) => {
    let matchesSearch = term.term
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (term.definition) {
      matchesSearch =
        matchesSearch ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase());
    }

    const matchesGroup =
      selectedGroup === 'all' || term.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  // Group terms by their group property
  const groupedTerms = filteredTerms.reduce<Record<string, Term[]>>(
    (acc, term) => {
      // Create a new array for this group or use the existing one
      const groupArray = acc[term.group] ?? [];
      // Add the current term to its group array
      acc[term.group] = [...groupArray, term];
      return acc;
    },
    {},
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div
      className={`workspace-container ${isMobileMenuOpen ? 'mobile-menu-is-open' : ''} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={toggleMobileMenu}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              toggleMobileMenu();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      {/* Navigation */}
      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      )}

      <div className="main-content">
        {!isMobile && (
          <div className="top-bar workspace-top-bar">
            <button
              className="hamburger-icon"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              type="button"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        )}

        <div className={`workspace-content ${isMobile ? 'pt-16' : ''}`}>
          <div className="workspace-content-wrapper">
            {/* Header */}
            <div className="workspace-header">
              {/* Navigation Tabs */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('saved-terms');
                  }}
                  className={`py-3 px-6 rounded-lg font-medium text-base ${
                    activeTab === 'saved-terms'
                      ? isDarkMode
                        ? 'bg-slate-700 text-white'
                        : 'bg-white text-gray-900'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Saved Terms
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('progress');
                  }}
                  className={`py-3 px-6 rounded-lg font-medium text-base ${
                    activeTab === 'progress'
                      ? isDarkMode
                        ? 'bg-slate-700 text-white'
                        : 'bg-white text-gray-900'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Submission Progress
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('glossaries');
                  }}
                  className={`py-3 px-6 rounded-lg font-medium text-base ${
                    activeTab === 'glossaries'
                      ? isDarkMode
                        ? 'bg-slate-700 text-white'
                        : 'bg-white text-gray-900'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Followed Glossaries
                </button>
              </div>

              <div className="workspace-actions">
                <button type="button" className="create-new-btn">
                  <Plus className="w-4 h-4" />
                  <span>New Group</span>
                </button>
              </div>
            </div>

            {/* Saved Terms Tab */}
            {activeTab === 'saved-terms' && (
              <div className="space-y-8">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search terms..."
                      className={`w-full pl-10 pr-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-slate-700/50 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                      }}
                    />
                  </div>
                  <select
                    className={`px-4 py-3 border ${isDarkMode ? 'border-gray-600 bg-slate-700/50 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                    value={selectedGroup}
                    onChange={(e) => {
                      setSelectedGroup(e.target.value);
                    }}
                  >
                    {groups.map((group) => (
                      <option key={group} value={group}>
                        {group === 'all' ? 'All Groups' : group}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Terms by Group */}
                <div className="space-y-6">
                  {Object.entries(groupedTerms).map(([groupName, terms]) => (
                    <div
                      key={groupName}
                      className={`${isDarkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-white/90 border-gray-200'} rounded-lg shadow-sm border`}
                    >
                      <div
                        className={`flex items-center justify-between p-4 cursor-pointer ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                        onClick={() => {
                          toggleGroup(groupName);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <FolderPlus
                            className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
                          />
                          <h3
                            className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {groupName}
                          </h3>
                          <span
                            className={`${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded-full text-sm`}
                          >
                            {terms.length} terms
                          </span>
                        </div>
                        {expandedGroups[groupName] ? (
                          <ChevronUp className="w-5 h-5 text-white" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white" />
                        )}
                      </div>

                      {expandedGroups[groupName] && (
                        <div
                          className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}
                        >
                          {terms.map((term) => (
                            <div
                              key={term.id}
                              className={`p-4 border-b ${isDarkMode ? 'border-slate-700 last:border-b-0 hover:bg-slate-700' : 'border-gray-200 last:border-b-0 hover:bg-gray-50'}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4
                                      className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                    >
                                      {term.term}
                                    </h4>
                                    <span className="bg-blue-800 text-blue-100 px-2 py-1 rounded-full text-xs">
                                      {term.language}
                                    </span>
                                    {term.category && (
                                      <span
                                        className={`${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded-full text-xs`}
                                      >
                                        {term.category}
                                      </span>
                                    )}
                                  </div>
                                  {term.definition && (
                                    <p
                                      className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                                    >
                                      {term.definition}
                                    </p>
                                  )}
                                  <p
                                    className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                                  >
                                    Last modified: {term.lastModified}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  <button
                                    type="button"
                                    className="p-2 text-gray-300 hover:text-white"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="p-2 text-gray-300 hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <div className="space-y-8">
                <div
                  className={`${isDarkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-white/90 border-gray-200'} rounded-lg shadow-sm border`}
                >
                  <div className="p-6">
                    <h3
                      className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}
                    >
                      Submission Progress
                    </h3>
                    <div className="space-y-4">
                      {submittedTerms.map((term) => (
                        <div
                          key={term.id}
                          className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-700 bg-slate-700/50' : 'border-gray-200 bg-gray-50/80'}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4
                              className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              {term.term}
                            </h4>
                            <div
                              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${getStatusColor(term.status)}`}
                            >
                              {getStatusIcon(term.status)}
                              <span className="capitalize">
                                {term.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`flex items-center space-x-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                          >
                            <span>Submitted: {term.submittedDate}</span>
                            {term.reviewedDate && (
                              <span>Reviewed: {term.reviewedDate}</span>
                            )}
                          </div>
                          {term.feedback && (
                            <div
                              className={`mt-3 p-3 rounded-md ${isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}
                            >
                              <p
                                className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}
                              >
                                {term.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Glossaries Tab */}
            {activeTab === 'glossaries' && (
              <div className="space-y-8">
                <div
                  className={`${isDarkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-white/90 border-gray-200'} rounded-lg shadow-sm border`}
                >
                  <div className="p-6">
                    <h3
                      className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}
                    >
                      Followed Glossaries
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {glossaries.map((glossary) => (
                        <div
                          key={glossary.id}
                          className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isDarkMode ? 'border-slate-700 bg-slate-700/50' : 'border-gray-200 bg-gray-50/80'}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <BookOpen
                                className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
                              />
                              <div>
                                <h4
                                  className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                >
                                  {glossary.name}
                                </h4>
                                <p
                                  className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                                >
                                  {glossary.language}
                                </p>
                              </div>
                            </div>
                            <div
                              className={`w-3 h-3 rounded-full ${glossary.followed ? 'bg-green-500' : 'bg-gray-300'}`}
                            ></div>
                          </div>
                          <div
                            className={`flex items-center justify-between text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                          >
                            <span>{glossary.termCount} terms</span>
                            <span>Updated: {glossary.lastUpdated}</span>
                          </div>
                          <div className="mt-3 flex items-center space-x-2">
                            <button
                              type="button"
                              className={`px-3 py-1 rounded-full text-sm ${
                                glossary.followed
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {glossary.followed ? 'Unfollow' : 'Follow'}
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-1 rounded-full text-sm ${isDarkMode ? 'bg-slate-600 text-white hover:bg-slate-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;
