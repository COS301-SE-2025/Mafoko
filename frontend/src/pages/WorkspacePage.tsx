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
              <div className="flex space-x-8">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('saved-terms');
                  }}
                  className={`py-2 px-2 border-b-2 font-medium text-sm ${
                    activeTab === 'saved-terms'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Saved Terms
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('progress');
                  }}
                  className={`py-2 px-2 border-b-2 font-medium text-sm ${
                    activeTab === 'progress'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Submission Progress
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('glossaries');
                  }}
                  className={`py-2 px-2 border-b-2 font-medium text-sm ${
                    activeTab === 'glossaries'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
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
              <div className="space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search terms..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                      }}
                    />
                  </div>
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                <div className="space-y-4">
                  {Object.entries(groupedTerms).map(([groupName, terms]) => (
                    <div
                      key={groupName}
                      className="bg-white rounded-lg shadow-sm border border-gray-200"
                    >
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          toggleGroup(groupName);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <FolderPlus className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-900">
                            {groupName}
                          </h3>
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                            {terms.length} terms
                          </span>
                        </div>
                        {expandedGroups[groupName] ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {expandedGroups[groupName] && (
                        <div className="border-t border-gray-200">
                          {terms.map((term) => (
                            <div
                              key={term.id}
                              className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="text-lg font-medium text-gray-900">
                                      {term.term}
                                    </h4>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                                      {term.language}
                                    </span>
                                    {term.category && (
                                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                        {term.category}
                                      </span>
                                    )}
                                  </div>
                                  {term.definition && (
                                    <p className="text-gray-600 mb-2">
                                      {term.definition}
                                    </p>
                                  )}
                                  <p className="text-sm text-gray-500">
                                    Last modified: {term.lastModified}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  <button
                                    type="button"
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="p-2 text-gray-400 hover:text-red-500"
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
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Submission Progress
                    </h3>
                    <div className="space-y-4">
                      {submittedTerms.map((term) => (
                        <div
                          key={term.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-medium text-gray-900">
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
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Submitted: {term.submittedDate}</span>
                            {term.reviewedDate && (
                              <span>Reviewed: {term.reviewedDate}</span>
                            )}
                          </div>
                          {term.feedback && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                              <p className="text-sm text-red-700">
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
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Followed Glossaries
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {glossaries.map((glossary) => (
                        <div
                          key={glossary.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <BookOpen className="w-5 h-5 text-gray-400" />
                              <div>
                                <h4 className="text-lg font-medium text-gray-900">
                                  {glossary.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {glossary.language}
                                </p>
                              </div>
                            </div>
                            <div
                              className={`w-3 h-3 rounded-full ${glossary.followed ? 'bg-green-500' : 'bg-gray-300'}`}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500">
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
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
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
