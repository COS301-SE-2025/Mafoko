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
  StickyNote,
  Save,
  X,
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
                              {category === 'all' ? 'All Categories' : category}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms by Group */}
                  <div className="space-y-6 flex-1 overflow-y-auto">
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
                        <div key={groupName} className="workspace-group-card">
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
                                <div key={term.id} className="term-item">
                                  <div className="term-header">
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
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <div className="tab-content">
                <div className="space-y-8 h-full">
                  <div className="progress-container">
                    <div className="progress-header">
                      <h3 className="progress-title">Submission Progress</h3>
                      <div className="progress-content">
                        {submittedTerms.map((term) => (
                          <div key={term.id} className="progress-item">
                            <div className="progress-item-header">
                              <h4 className="progress-term-title">
                                {term.term}
                              </h4>
                              <div
                                className={`status-badge status-${term.status.replace('_', '-')}`}
                              >
                                {getStatusIcon(term.status)}
                                <span>{term.status.replace('_', ' ')}</span>
                              </div>
                            </div>
                            <div className="progress-dates">
                              <span>Submitted: {term.submittedDate}</span>
                              {term.reviewedDate && (
                                <span>Reviewed: {term.reviewedDate}</span>
                              )}
                            </div>
                            {term.feedback && (
                              <div className="progress-feedback">
                                <p>{term.feedback}</p>
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
                  <div className="glossaries-container">
                    <div className="glossaries-header">
                      <h3 className="glossaries-title">Followed Glossaries</h3>
                      <div className="glossaries-grid">
                        {glossaries.map((glossary) => (
                          <div key={glossary.id} className="glossary-card">
                            <div className="glossary-header">
                              <div className="glossary-info">
                                <BookOpen className="book-icon" />
                                <div className="glossary-details">
                                  <h4 className="glossary-title">
                                    {glossary.name}
                                  </h4>
                                </div>
                              </div>
                              <div
                                className={`follow-indicator ${
                                  glossary.followed ? 'followed' : 'unfollowed'
                                }`}
                              />
                            </div>
                            <div className="glossary-stats">
                              <span className="term-count">
                                {glossary.termCount} terms
                              </span>
                              <span>Updated: {glossary.lastUpdated}</span>
                            </div>
                            <div className="glossary-actions">
                              <button
                                type="button"
                                className={`follow-btn ${
                                  glossary.followed
                                    ? 'following'
                                    : 'not-following'
                                }`}
                              >
                                {glossary.followed ? 'Unfollow' : 'Follow'}
                              </button>
                              <button type="button" className="view-btn">
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

            {/* Modal Body */}
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
