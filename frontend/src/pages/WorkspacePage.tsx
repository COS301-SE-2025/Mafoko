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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector('.groups-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    // Call once on mount to set initial state
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
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
          <div className="workspace-content-wrapper w-full">
            {/* Header */}
            <div className="workspace-header">
              {/* Navigation Tabs */}
              <div
                className={`workspace-tabs p-1 rounded-xl ${
                  isDarkMode ? 'bg-slate-800/40' : 'bg-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('saved-terms');
                  }}
                  className={`tab-button ${activeTab === 'saved-terms' ? 'active' : ''}`}
                >
                  Saved Terms
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('progress');
                  }}
                  className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
                >
                  Submission Progress
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('glossaries');
                  }}
                  className={`tab-button ${activeTab === 'glossaries' ? 'active' : ''}`}
                >
                  Followed Glossaries
                </button>
              </div>

              <div className="workspace-actions">
                <button type="button" className="create-new-btn">
                  <Plus className="w-5 h-5" />
                  <span>New Group</span>
                </button>
              </div>
            </div>

            {/* Saved Terms Tab */}
            {activeTab === 'saved-terms' && (
              <div className="tab-content">
                <div className="space-y-8 h-full">
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search terms..."
                        className={`w-full pl-10 pr-4 py-3 border ${
                          isDarkMode
                            ? 'border-gray-600 bg-slate-700/50 text-white placeholder-gray-400'
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                        } rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                        }}
                      />
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        className={`groups-dropdown w-full px-4 py-3 border ${
                          isDarkMode
                            ? 'border-gray-600 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                            : 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                        } rounded-lg transition-colors duration-200 flex items-center justify-between`}
                        style={
                          isDarkMode
                            ? {
                                backgroundColor: '#212431',
                                color: '#f5f5f5',
                              }
                            : {}
                        }
                        onClick={() => {
                          setIsDropdownOpen(!isDropdownOpen);
                        }}
                      >
                        <span>
                          {selectedGroup === 'all'
                            ? 'All Groups'
                            : selectedGroup}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        />
                      </button>

                      {isDropdownOpen && (
                        <div
                          className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-50 ${
                            isDarkMode
                              ? 'border-gray-600 shadow-2xl'
                              : 'border-gray-300 bg-white text-gray-900 shadow-black/10'
                          }`}
                          style={
                            isDarkMode
                              ? {
                                  backgroundColor: '#212431',
                                  color: '#f5f5f5',
                                }
                              : {}
                          }
                        >
                          {groups.map((group) => (
                            <button
                              key={group}
                              type="button"
                              className={`w-full px-4 py-3 text-left transition-colors ${
                                selectedGroup === group
                                  ? isDarkMode
                                    ? ''
                                    : 'bg-gray-100 text-gray-900'
                                  : isDarkMode
                                    ? ''
                                    : 'text-gray-900'
                              } first:rounded-t-lg last:rounded-b-lg`}
                              style={
                                isDarkMode
                                  ? {
                                      backgroundColor:
                                        selectedGroup === group
                                          ? '#3a4050'
                                          : 'transparent',
                                      color: '#f5f5f5',
                                    }
                                  : {}
                              }
                              onMouseEnter={(e) => {
                                if (selectedGroup !== group) {
                                  if (isDarkMode) {
                                    (
                                      e.target as HTMLElement
                                    ).style.backgroundColor = '#3a4050';
                                    (e.target as HTMLElement).style.color =
                                      '#f5f5f5';
                                  } else {
                                    (
                                      e.target as HTMLElement
                                    ).style.backgroundColor = '#f5f5f5';
                                  }
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedGroup !== group) {
                                  if (isDarkMode) {
                                    (
                                      e.target as HTMLElement
                                    ).style.backgroundColor = 'transparent';
                                    (e.target as HTMLElement).style.color =
                                      '#f5f5f5';
                                  } else {
                                    (
                                      e.target as HTMLElement
                                    ).style.backgroundColor = 'white';
                                  }
                                }
                              }}
                              onClick={() => {
                                setSelectedGroup(group);
                                setIsDropdownOpen(false);
                              }}
                            >
                              {group === 'all' ? 'All Groups' : group}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms by Group */}
                  <div className="space-y-6 flex-1 overflow-y-auto">
                    {Object.entries(groupedTerms).map(([groupName, terms]) => (
                      <div key={groupName} className="workspace-group-card">
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
                            <ChevronUp
                              className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-[#212431]'}`}
                            />
                          ) : (
                            <ChevronDown
                              className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-[#212431]'}`}
                            />
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
                                      <span className="language-tag">
                                        {term.language}
                                      </span>
                                      {term.category && (
                                        <span className="category-tag">
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
                                      className={`p-2 rounded-md transition-all duration-200 ${
                                        isDarkMode
                                          ? 'text-cyan-400 hover:text-white border border-transparent hover:border-cyan-500/30'
                                          : 'text-cyan-600 hover:text-cyan-800 hover:bg-cyan-50 border border-transparent hover:border-cyan-200'
                                      }`}
                                      style={
                                        isDarkMode
                                          ? {
                                              backgroundColor: '#31374eff',
                                            }
                                          : {}
                                      }
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      className={`p-2 rounded-md transition-all duration-200 ${
                                        isDarkMode
                                          ? 'text-red-400 hover:text-white border border-transparent hover:border-red-500/30'
                                          : 'text-red-600 hover:text-red-800 hover:bg-red-50 border border-transparent hover:border-red-200'
                                      }`}
                                      style={
                                        isDarkMode
                                          ? {
                                              backgroundColor: '#31374eff',
                                            }
                                          : {}
                                      }
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
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <div className="tab-content">
                <div className="space-y-8 h-full">
                  <div
                    className={`${isDarkMode ? 'border-slate-700' : 'bg-white/90 border-gray-200'} rounded-lg shadow-sm border flex-1 overflow-hidden`}
                    style={isDarkMode ? { backgroundColor: '#292e41' } : {}}
                  >
                    <div className="p-6 h-full flex flex-col">
                      <h3
                        className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 flex-shrink-0`}
                      >
                        {/* Submission Progress */}
                      </h3>
                      <div
                        className="space-y-4 flex-1 overflow-y-auto pr-2"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: isDarkMode
                            ? '#4B5563 #1F2937'
                            : '#D1D5DB #F9FAFB',
                        }}
                      >
                        {submittedTerms.map((term) => (
                          <div
                            key={term.id}
                            className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-700' : 'border-gray-200 bg-gray-50/80'}`}
                            style={
                              isDarkMode ? { backgroundColor: '#272b3dff' } : {}
                            }
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
              </div>
            )}

            {/* Glossaries Tab */}
            {activeTab === 'glossaries' && (
              <div className="tab-content">
                <div className="space-y-8 h-full">
                  <div
                    className={`rounded-lg shadow-sm border-0 flex-1 overflow-hidden ${
                      isDarkMode ? '' : 'bg-gray-50/30'
                    }`}
                    style={
                      isDarkMode
                        ? {
                            backgroundColor: '#292e41',
                          }
                        : {}
                    }
                  >
                    <div className="p-6 pt-2 h-full flex flex-col">
                      <h3
                        className={`text-xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 flex-shrink-0`}
                      >
                        {/* Followed Glossaries */}
                      </h3>
                      <div
                        className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 overflow-y-auto pr-2"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: isDarkMode
                            ? '#4B5563 #1F2937'
                            : '#D1D5DB #F9FAFB',
                        }}
                      >
                        {glossaries.map((glossary) => (
                          <div
                            key={glossary.id}
                            className={`border rounded-lg p-5 hover:shadow-md transition-all ${
                              isDarkMode
                                ? 'border-slate-700'
                                : 'border-gray-200 bg-white'
                            }`}
                            style={
                              isDarkMode
                                ? {
                                    backgroundColor: '#232738ff',
                                  }
                                : {}
                            }
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <BookOpen
                                  className={`w-5 h-5 ${
                                    isDarkMode
                                      ? 'text-teal-400'
                                      : 'text-teal-600'
                                  }`}
                                />
                                <div>
                                  <h4
                                    className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                  >
                                    {glossary.name}
                                  </h4>
                                  <span className="language-tag">
                                    {glossary.language}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`w-3.5 h-3.5 rounded-full ring-2 ${
                                  glossary.followed
                                    ? 'bg-green-500 ring-green-400/30'
                                    : 'bg-gray-400 ring-gray-300/30'
                                }`}
                              ></div>
                            </div>
                            <div
                              className={`flex items-center justify-between text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} my-2`}
                            >
                              <span className="font-medium">
                                {glossary.termCount} terms
                              </span>
                              <span>Updated: {glossary.lastUpdated}</span>
                            </div>
                            <div className="mt-4 flex items-center space-x-3">
                              <button
                                type="button"
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                  glossary.followed
                                    ? isDarkMode
                                      ? 'text-white hover:bg-red-500'
                                      : 'bg-red-500 text-black hover:bg-red-600'
                                    : isDarkMode
                                      ? 'text-white hover:bg-green-500'
                                      : 'bg-green-500 text-black hover:bg-green-600'
                                }`}
                                style={
                                  isDarkMode
                                    ? {
                                        backgroundColor: '#292e41',
                                      }
                                    : {}
                                }
                              >
                                {glossary.followed ? 'Unfollow' : 'Follow'}
                              </button>
                              <button
                                type="button"
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                  isDarkMode
                                    ? 'text-white hover:bg-blue-500'
                                    : 'bg-blue-500 text-black hover:bg-blue-600'
                                }`}
                                style={
                                  isDarkMode
                                    ? {
                                        backgroundColor: '#292e41',
                                      }
                                    : {}
                                }
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;
