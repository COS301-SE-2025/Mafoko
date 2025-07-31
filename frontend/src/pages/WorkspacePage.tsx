import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  Search,
  Clock,
  Check,
  AlertCircle,
  StickyNote,
  Save,
  X,
  BookOpen,
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
  notes?: string;
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean;
  }>({});
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedGroupsForDeletion, setSelectedGroupsForDeletion] = useState<
    string[]
  >([]);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Glossaries state
  const [glossaries, setGlossaries] = useState<Glossary[]>([
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
  ]);

  // Initialize groups from saved terms
  const initialGroups = [
    'all',
    'All Terms',
    'Thesis Research',
    'General Study',
    'Farming Methods',
  ];
  const [groups, setGroups] = useState<string[]>(initialGroups);

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
  const [savedTerms, setSavedTerms] = useState<Term[]>([
    {
      id: 1,
      term: 'Landbou-insette',
      definition:
        'Crops that are planted and harvested during the same production season.',
      language: 'Afrikaans',
      category: 'Agriculture',
      group: 'Thesis Research',
      lastModified: '2024-07-15',
      notes:
        'Important concept for Chapter 3 of thesis. Need to research more about seasonal variations.',
    },
    {
      id: 2,
      term: 'Biodiversity',
      definition:
        'The variety of life in the world or in a particular habitat or ecosystem.',
      language: 'English',
      category: 'Environmental Science',
      group: 'All Terms',
      lastModified: '2024-07-14',
      notes:
        'This term was moved to All Terms when its original group was deleted.',
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
      notes:
        'Key process for understanding plant biology. Good example for explaining cellular respiration.',
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
  ]);

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
    {
      id: 5,
      term: 'Organic Farming Practices',
      status: 'approved',
      submittedDate: '2024-07-12',
      reviewedDate: '2024-07-16',
    },
    {
      id: 6,
      term: 'Water Conservation',
      status: 'pending',
      submittedDate: '2024-07-18',
      reviewedDate: null,
    },
    {
      id: 7,
      term: 'Crop Rotation Benefits',
      status: 'rejected',
      submittedDate: '2024-07-11',
      reviewedDate: '2024-07-15',
      feedback: 'Please provide more scientific references',
    },
    {
      id: 8,
      term: 'Biodiversity Conservation',
      status: 'under_review',
      submittedDate: '2024-07-19',
      reviewedDate: null,
    },
    {
      id: 9,
      term: 'Integrated Pest Management',
      status: 'approved',
      submittedDate: '2024-07-13',
      reviewedDate: '2024-07-17',
    },
    {
      id: 10,
      term: 'Soil Health Assessment',
      status: 'pending',
      submittedDate: '2024-07-20',
      reviewedDate: null,
    },
  ];

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

  const toggleFollow = (glossaryId: number) => {
    setGlossaries((prev) =>
      prev.map((glossary) =>
        glossary.id === glossaryId
          ? { ...glossary, followed: !glossary.followed }
          : glossary,
      ),
    );
  };

  // Removed unused getStatusIcon function

  // Functions for handling notes
  const handleAddNote = (termId: number) => {
    const term = savedTerms.find((t) => t.id === termId);
    setEditingNotes(termId);
    setNoteText(term?.notes || '');
  };

  const handleSaveNote = (termId: number) => {
    setSavedTerms((prevTerms) =>
      prevTerms.map((term) =>
        term.id === termId
          ? { ...term, notes: noteText.trim() || undefined }
          : term,
      ),
    );
    setEditingNotes(null);
    setNoteText('');
  };

  const handleCancelNote = () => {
    setEditingNotes(null);
    setNoteText('');
  };

  // Functions for handling bulk group deletion
  const handleEnterDeleteMode = () => {
    setIsDeleteMode(true);
    setSelectedGroupsForDeletion([]);
  };

  const handleExitDeleteMode = () => {
    setIsDeleteMode(false);
    setSelectedGroupsForDeletion([]);
  };

  const handleToggleGroupSelection = (groupName: string) => {
    if (groupName === 'all' || groupName === 'All Terms') return; // Don't allow selecting these groups

    setSelectedGroupsForDeletion((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName],
    );
  };

  const handleDeleteSelectedGroups = () => {
    if (selectedGroupsForDeletion.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedGroupsForDeletion.length.toString()} group(s)? This will move all terms from these groups to "All Terms" group.`,
    );

    if (!confirmDelete) return;

    // Move all terms from deleted groups to "All Terms"
    setSavedTerms((prevTerms) =>
      prevTerms.map((term) =>
        selectedGroupsForDeletion.includes(term.group)
          ? { ...term, group: 'All Terms' }
          : term,
      ),
    );

    // Remove the groups from the groups list
    setGroups((prevGroups) =>
      prevGroups.filter((group) => !selectedGroupsForDeletion.includes(group)),
    );

    // Exit delete mode
    handleExitDeleteMode();
  };

  // Functions for handling new group creation
  const handleOpenNewGroupModal = () => {
    setIsNewGroupModalOpen(true);
    setNewGroupName('');
  };

  const handleCloseNewGroupModal = () => {
    setIsNewGroupModalOpen(false);
    setNewGroupName('');
  };

  const handleCreateNewGroup = () => {
    const trimmedName = newGroupName.trim();

    if (!trimmedName) {
      alert('Please enter a group name');
      return;
    }

    if (groups.includes(trimmedName)) {
      alert('A group with this name already exists');
      return;
    }

    // Add the new group to the groups list with proper sorting
    setGroups((prevGroups) => {
      const newGroups = [...prevGroups, trimmedName];
      return newGroups.sort((a, b) => {
        // Keep 'all' and 'All Terms' at the beginning, sort the rest alphabetically
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        if (a === 'All Terms') return -1;
        if (b === 'All Terms') return 1;
        return a.localeCompare(b);
      });
    });

    // Automatically expand the new group
    setExpandedGroups((prev) => ({
      ...prev,
      [trimmedName]: true,
    }));

    handleCloseNewGroupModal();
  };

  // Get unique categories from terms
  const getCategories = () => {
    const categories = ['all'];
    const uniqueCategories = [
      ...new Set(
        savedTerms
          .map((term) => term.category)
          .filter((category) => category !== undefined),
      ),
    ] as string[];

    return categories.concat(uniqueCategories.sort());
  };

  const filteredTerms = savedTerms.filter((term) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      term.term.toLowerCase().includes(searchLower) ||
      (term.definition?.toLowerCase().includes(searchLower) ?? false);

    const matchesCategory =
      selectedCategory === 'all' || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

  // Add empty groups to always show all groups (excluding 'all' which is a filter option)
  groups
    .filter((group) => group !== 'all')
    .forEach((group) => {
      if (!(group in groupedTerms)) {
        groupedTerms[group] = [];
      }
    });

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
              <div className="workspace-tabs">
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
                {isDeleteMode ? (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleDeleteSelectedGroups}
                      disabled={selectedGroupsForDeletion.length === 0}
                      className={`delete-selected-btn ${selectedGroupsForDeletion.length === 0 ? 'disabled' : ''}`}
                    >
                      <Trash2 className="icon" />
                      Delete Selected (
                      {selectedGroupsForDeletion.length.toString()})
                    </button>
                    <button
                      type="button"
                      onClick={handleExitDeleteMode}
                      className="cancel-delete-btn"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="create-new-btn"
                      onClick={handleOpenNewGroupModal}
                    >
                      <Plus className="w-5 h-5" />
                      <span>New Group</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleEnterDeleteMode}
                      className="delete-mode-btn"
                    >
                      <Trash2 className="icon" />
                      Delete Groups
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Saved Terms Tab */}
            {activeTab === 'saved-terms' && (
              <div className="tab-content">
                <div
                  className={`${isDarkMode ? 'bg-[#292e41] border-gray-600' : 'bg-white border-gray-200'} rounded-lg shadow-sm border p-6`}
                >
                  <div className="space-y-8 h-full">
                    {/* Search and Filter */}
                    <div className="flex-col sm:flex-row">
                      <div className="flex-1">
                        <Search className="absolute" />
                        <input
                          type="text"
                          placeholder="Search terms..."
                          className="search-input"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                          }}
                        />
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          className="groups-dropdown"
                          onClick={() => {
                            setIsDropdownOpen(!isDropdownOpen);
                          }}
                        >
                          <span>
                            {selectedCategory === 'all'
                              ? 'All Categories'
                              : selectedCategory}
                          </span>
                          <ChevronDown
                            className={`w-4 ${isDropdownOpen ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {isDropdownOpen && (
                          <div className="dropdown-menu">
                            {getCategories().map((category) => (
                              <button
                                key={category}
                                type="button"
                                className={`dropdown-item ${selectedCategory === category ? 'selected' : ''}`}
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setIsDropdownOpen(false);
                                }}
                              >
                                {category === 'all'
                                  ? 'All Categories'
                                  : category}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Terms by Group */}
                    <div
                      className="space-y-6 flex-1 pr-2 saved-terms-scrollbar"
                      style={{
                        maxHeight: '414px',
                        overflowY: 'auto',
                        scrollbarWidth: 'thin',
                        marginTop: '-30px',
                      }}
                    >
                      <style>{`
                        .saved-terms-scrollbar::-webkit-scrollbar {
                          width: 6px;
                        }
                        .saved-terms-scrollbar::-webkit-scrollbar-track {
                          background: ${isDarkMode ? '#374151' : '#f1f5f9'};
                          border-radius: 3px;
                        }
                        .saved-terms-scrollbar::-webkit-scrollbar-thumb {
                          background: ${isDarkMode ? '#6b7280' : '#cbd5e1'};
                          border-radius: 3px;
                        }
                        .saved-terms-scrollbar::-webkit-scrollbar-thumb:hover {
                          background: ${isDarkMode ? '#9ca3af' : '#94a3b8'};
                        }
                      `}</style>
                      {Object.entries(groupedTerms)
                        .sort(([a], [b]) => {
                          // Keep 'all' and 'All Terms' at the beginning, sort the rest alphabetically
                          if (a === 'all') return -1;
                          if (b === 'all') return 1;
                          if (a === 'All Terms') return -1;
                          if (b === 'All Terms') return 1;
                          return a.localeCompare(b);
                        })
                        .map(([groupName, terms]) => (
                          <div
                            key={groupName}
                            className="workspace-group-card saved-terms-scrollbar"
                          >
                            <div className="group-header">
                              <div
                                className="group-info"
                                onClick={() => {
                                  if (!isDeleteMode) {
                                    toggleGroup(groupName);
                                  }
                                }}
                              >
                                {isDeleteMode &&
                                groupName !== 'all' &&
                                groupName !== 'All Terms' ? (
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedGroupsForDeletion.includes(
                                        groupName,
                                      )}
                                      onChange={() => {
                                        handleToggleGroupSelection(groupName);
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                      className="group-checkbox"
                                    />
                                    <FolderPlus className="group-icon" />
                                  </div>
                                ) : (
                                  <FolderPlus className="group-icon" />
                                )}
                                <h3 className="group-title">{groupName}</h3>
                                <span className="term-count">
                                  {terms.length} terms
                                </span>
                              </div>
                              <div className="group-actions">
                                {!isDeleteMode && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      toggleGroup(groupName);
                                    }}
                                  >
                                    {expandedGroups[groupName] ? (
                                      <ChevronUp className="chevron-icon" />
                                    ) : (
                                      <ChevronDown className="chevron-icon" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {expandedGroups[groupName] && (
                              <div className="group-content">
                                {terms.map((term) => (
                                  <div
                                    key={term.id}
                                    className="term-item"
                                    style={{
                                      backgroundColor: isDarkMode
                                        ? '#23273a'
                                        : '#f3f4f6',
                                      borderRadius: '0.5rem',
                                      padding: '1rem',
                                    }}
                                  >
                                    <div
                                      className="term-header"
                                      style={{
                                        backgroundColor: 'transparent',
                                        borderRadius: '0.5rem',
                                      }}
                                    >
                                      <div className="term-info">
                                        <div className="term-title-row">
                                          <h4 className="term-title">
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
                                          <p className="term-definition">
                                            {term.definition}
                                          </p>
                                        )}

                                        {/* Notes Section */}
                                        <div className="notes-section">
                                          {editingNotes === term.id ? (
                                            <div className="notes-editor">
                                              <textarea
                                                value={noteText}
                                                onChange={(e) => {
                                                  setNoteText(e.target.value);
                                                }}
                                                placeholder="Add your notes here..."
                                                className="notes-textarea"
                                                rows={3}
                                              />
                                              <div className="notes-actions">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    handleSaveNote(term.id);
                                                  }}
                                                  className="save-btn"
                                                >
                                                  <Save className="icon" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={handleCancelNote}
                                                  className="cancel-btn"
                                                >
                                                  <X className="icon" />
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              {term.notes && (
                                                <div className="notes-display">
                                                  <div className="notes-content">
                                                    <div className="notes-text">
                                                      <StickyNote className="sticky-note-icon" />
                                                      <p>{term.notes}</p>
                                                    </div>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        handleAddNote(term.id);
                                                      }}
                                                      className="edit-note-btn"
                                                    >
                                                      <Edit2 className="edit-icon" />
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <div className="term-actions">
                                        {!term.notes &&
                                          editingNotes !== term.id && (
                                            <button
                                              onClick={() => {
                                                handleAddNote(term.id);
                                              }}
                                              type="button"
                                              className="add-note-btn"
                                              title="Add note"
                                              style={{
                                                backgroundColor: isDarkMode
                                                  ? '#31374e'
                                                  : '#f2d20142',
                                              }}
                                            >
                                              <StickyNote className="icon" />
                                            </button>
                                          )}
                                        <button
                                          type="button"
                                          className="delete-btn"
                                        >
                                          <Trash2 className="icon" />
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
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <div
                className={`space-y-6 ${isDarkMode ? 'bg-[#1e2433] min-h-screen' : 'bg-[#f5f5f5] min-h-screen'}`}
              >
                <div
                  className={`${isDarkMode ? 'bg-[#292e41] border-gray-600' : 'bg-white border-gray-200'} rounded-lg shadow-sm border`}
                >
                  <div className="p-6">
                    <h3
                      className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {/* Submission Progress */}
                    </h3>
                    <div
                      className="space-y-4 max-h-[414px] overflow-y-auto pr-2"
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      <style>{`
                        .submission-scrollbar::-webkit-scrollbar {
                          width: 6px;
                        }
                        .submission-scrollbar::-webkit-scrollbar-track {
                          background: ${isDarkMode ? '#374151' : '#f1f5f9'};
                          border-radius: 3px;
                        }
                        .submission-scrollbar::-webkit-scrollbar-thumb {
                          background: ${isDarkMode ? '#6b7280' : '#cbd5e1'};
                          border-radius: 3px;
                        }
                        .submission-scrollbar::-webkit-scrollbar-thumb:hover {
                          background: ${isDarkMode ? '#9ca3af' : '#94a3b8'};
                        }
                      `}</style>
                      {submittedTerms.map((term) => (
                        <div
                          key={term.id}
                          className={`submission-scrollbar border rounded-lg p-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                          style={{
                            backgroundColor: isDarkMode ? '#23273a' : '#f5f5f5',
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4
                              className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              {term.term}
                            </h4>
                            <div
                              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${(() => {
                                const baseColors = {
                                  approved: isDarkMode
                                    ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                                    : 'bg-green-100 text-green-700',
                                  pending: isDarkMode
                                    ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50'
                                    : 'bg-yellow-100 text-yellow-700',
                                  rejected: isDarkMode
                                    ? 'bg-red-900/30 text-red-400 border border-red-700/50'
                                    : 'bg-red-100 text-red-700',
                                  under_review: isDarkMode
                                    ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50'
                                    : 'bg-blue-100 text-blue-700',
                                };
                                return (
                                  baseColors[term.status] ||
                                  (isDarkMode
                                    ? 'bg-gray-800 text-gray-300 border border-gray-600'
                                    : 'bg-gray-100 text-gray-700')
                                );
                              })()}`}
                            >
                              {(() => {
                                switch (term.status) {
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
                              })()}
                              <span className="capitalize">
                                {term.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`flex items-center space-x-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            <span>Submitted: {term.submittedDate}</span>
                            {term.reviewedDate && (
                              <span>Reviewed: {term.reviewedDate}</span>
                            )}
                          </div>
                          {term.feedback && (
                            <div
                              className={`mt-3 p-3 rounded-md ${
                                isDarkMode
                                  ? 'bg-red-900/20 border border-red-800/50 text-red-400'
                                  : 'bg-red-50 border border-red-200 text-red-700'
                              }`}
                            >
                              <p className="text-sm">{term.feedback}</p>
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
              <div className="tab-content">
                <div className="space-y-6">
                  <div
                    className={`rounded-lg shadow-sm border ${isDarkMode ? 'border-gray-700' : 'bg-white border-gray-200'}`}
                    style={isDarkMode ? { backgroundColor: '#292e41' } : {}}
                  >
                    <div className="p-6">
                      <h3
                        className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
                      >
                        {/* Followed Glossaries */}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {glossaries.map((glossary) => (
                          <div
                            key={glossary.id}
                            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                            style={
                              isDarkMode
                                ? { backgroundColor: '#222535ff' }
                                : { backgroundColor: '#f5f5f5' }
                            }
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <BookOpen
                                  className="w-5 h-5"
                                  style={{ color: '#00ceaf' }}
                                />
                                <div>
                                  <h4
                                    className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
                                  >
                                    {glossary.name}
                                  </h4>
                                  <span className="language-tag">
                                    {glossary.language}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`w-3 h-3 rounded-full ${glossary.followed ? 'bg-green-500' : 'bg-gray-300'}`}
                              ></div>
                            </div>
                            <div
                              className={`flex items-center justify-between text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                            >
                              <span>{glossary.termCount} terms</span>
                              <span>Updated: {glossary.lastUpdated}</span>
                            </div>
                            <div className="mt-3 flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  toggleFollow(glossary.id);
                                }}
                                className={`px-3 py-1 rounded-full text-sm font-medium border border-transparent cursor-pointer transition-all duration-200 ease-in-out ${
                                  glossary.followed
                                    ? isDarkMode
                                      ? 'text-red-300'
                                      : 'text-red-500'
                                    : isDarkMode
                                      ? 'text-green-300'
                                      : 'text-green-500'
                                }`}
                                style={
                                  glossary.followed
                                    ? isDarkMode
                                      ? { backgroundColor: '#31374eff' }
                                      : {
                                          backgroundColor:
                                            'rgba(239, 68, 68, 0.1)',
                                        }
                                    : isDarkMode
                                      ? { backgroundColor: '#31374eff' }
                                      : {
                                          backgroundColor:
                                            'rgba(16, 185, 129, 0.1)',
                                        }
                                }
                                onMouseEnter={(e) => {
                                  if (isDarkMode) {
                                    if (glossary.followed) {
                                      e.currentTarget.style.color = 'white';
                                      e.currentTarget.style.borderColor =
                                        'rgba(239, 68, 68, 0.3)';
                                    } else {
                                      e.currentTarget.style.color = 'white';
                                      e.currentTarget.style.borderColor =
                                        'rgba(16, 185, 129, 0.3)';
                                    }
                                  } else if (glossary.followed) {
                                    e.currentTarget.style.color = '#dc2626';
                                    e.currentTarget.style.backgroundColor =
                                      '#fef2f2';
                                    e.currentTarget.style.borderColor =
                                      '#fecaca';
                                  } else {
                                    e.currentTarget.style.color = '#059669';
                                    e.currentTarget.style.backgroundColor =
                                      '#f0fdf4';
                                    e.currentTarget.style.borderColor =
                                      '#bbf7d0';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (isDarkMode) {
                                    if (glossary.followed) {
                                      e.currentTarget.style.color = '#fca5a5';
                                      e.currentTarget.style.borderColor =
                                        'transparent';
                                    } else {
                                      e.currentTarget.style.color = '#86efac';
                                      e.currentTarget.style.borderColor =
                                        'transparent';
                                    }
                                  } else if (glossary.followed) {
                                    e.currentTarget.style.color = '#ef4444';
                                    e.currentTarget.style.backgroundColor =
                                      'rgba(239, 68, 68, 0.1)';
                                    e.currentTarget.style.borderColor =
                                      'transparent';
                                  } else {
                                    e.currentTarget.style.color = '#10b981';
                                    e.currentTarget.style.backgroundColor =
                                      'rgba(16, 185, 129, 0.1)';
                                    e.currentTarget.style.borderColor =
                                      'transparent';
                                  }
                                }}
                              >
                                {glossary.followed ? 'Unfollow' : 'Follow'}
                              </button>
                              <button
                                type="button"
                                className={`px-3 py-1 rounded-full text-sm font-medium border-none cursor-pointer transition-all duration-200 ease-in-out ${
                                  isDarkMode
                                    ? 'text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                style={
                                  isDarkMode
                                    ? { backgroundColor: '#292e41' }
                                    : {}
                                }
                                onMouseEnter={(e) => {
                                  if (isDarkMode) {
                                    e.currentTarget.style.backgroundColor =
                                      '#3b83f67b';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (isDarkMode) {
                                    e.currentTarget.style.backgroundColor =
                                      '#292e41';
                                  }
                                }}
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

      {/* New Group Modal */}
      {isNewGroupModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="modal-title">Create New Group</h3>
              <button
                type="button"
                onClick={handleCloseNewGroupModal}
                className="close-btn"
              >
                <X className="close-icon" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="groupName" className="form-label">
                  Group Name
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={newGroupName}
                  onChange={(e) => {
                    setNewGroupName(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewGroup();
                    } else if (e.key === 'Escape') {
                      handleCloseNewGroupModal();
                    }
                  }}
                  placeholder="Enter group name..."
                  className="form-input"
                  autoFocus
                />
              </div>
              <p className="form-description">
                Create a new group to organize your saved terms.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                onClick={handleCloseNewGroupModal}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewGroup}
                disabled={!newGroupName.trim()}
                className={`create-btn ${!newGroupName.trim() ? 'disabled' : ''}`}
              >
                <Plus className="plus-icon" />
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
