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
import { workspaceAPI } from '../utils/workspaceAPI';
import type {
  BookmarkedTerm,
  BookmarkedGlossary,
  WorkspaceGroup,
} from '../types/workspace';

import '../styles/WorkspacePage.scss';

// Legacy interfaces for submitted terms (keeping until we have submission API)
interface SubmittedTerm {
  id: number;
  term: string;
  status: 'approved' | 'pending' | 'rejected' | 'under_review';
  submittedDate: string;
  reviewedDate: string | null;
  feedback?: string;
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
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedGroupsForDeletion, setSelectedGroupsForDeletion] = useState<
    string[]
  >([]);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Real workspace data state
  // const [bookmarkedTerms, setBookmarkedTerms] = useState<BookmarkedTerm[]>([]);
  const [bookmarkedGlossaries, setBookmarkedGlossaries] = useState<
    BookmarkedGlossary[]
  >([]);
  const [workspaceGroups, setWorkspaceGroups] = useState<WorkspaceGroup[]>([]);
  // const [workspaceOverview, setWorkspaceOverview] = useState<WorkspaceOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize groups from workspace groups
  const [groups, setGroups] = useState<string[]>(['all', 'All Terms']);

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
  const [savedTerms, setSavedTerms] = useState<BookmarkedTerm[]>([]);

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

  // Load workspace data on component mount
  useEffect(() => {
    void loadWorkspaceData();
  }, []);

  // Function to load all workspace data
  const loadWorkspaceData = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [
        bookmarkedTermsData,
        bookmarkedGlossariesData,
        workspaceGroupsData,
      ] = await Promise.all([
        workspaceAPI.bookmarks.terms.getAll(),
        workspaceAPI.bookmarks.glossaries.getAll(),
        workspaceAPI.groups.getAll(),
        // workspaceAPI.overview.getOverview(), // For future use
      ]);

      // setBookmarkedTerms(bookmarkedTermsData); // For future use
      setSavedTerms(bookmarkedTermsData); // Use bookmarked terms as saved terms
      setBookmarkedGlossaries(bookmarkedGlossariesData);
      setWorkspaceGroups(workspaceGroupsData);
      // setWorkspaceOverview(overviewData); // For future use

      // Update groups list from workspace groups
      const groupNames = [
        'all',
        'All Terms',
        ...workspaceGroupsData.map((group) => group.name),
      ];
      setGroups(groupNames);
    } catch (error) {
      console.error('Failed to load workspace data:', error);
      setError('Failed to load workspace data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Functions for handling notes
  const handleAddNote = (termId: string) => {
    const term = savedTerms.find((t) => t.id === termId);
    setEditingNotes(termId);
    setNoteText(term?.notes || '');
  };

  const handleSaveNote = async (bookmarkId: string) => {
    try {
      // Find the term to get the term_id for the API call
      const termToUpdate = savedTerms.find((term) => term.id === bookmarkId);
      if (!termToUpdate) {
        console.error('Term not found in local state');
        return;
      }

      // Call the API to update the bookmark notes using term_id
      await workspaceAPI.bookmarks.terms.update(
        termToUpdate.term_id,
        noteText.trim(),
      );

      // Update local state
      setSavedTerms((prevTerms) =>
        prevTerms.map((term) =>
          term.id === bookmarkId
            ? { ...term, notes: noteText.trim() || undefined }
            : term,
        ),
      );

      setEditingNotes(null);
      setNoteText('');

      console.log('Notes saved successfully');
    } catch (error) {
      console.error('Failed to save notes:', error);
      setError('Failed to save notes. Please try again.');
    }
  };

  const handleCancelNote = () => {
    setEditingNotes(null);
    setNoteText('');
  };

  // Function for deleting a saved term
  const handleDeleteTerm = async (bookmarkId: string) => {
    try {
      // Find the term to get the term_id for the API call
      const termToDelete = savedTerms.find((term) => term.id === bookmarkId);
      if (!termToDelete) {
        console.error('Term not found in local state');
        return;
      }

      // Call the API to delete the bookmark using term_id
      await workspaceAPI.bookmarks.terms.delete(termToDelete.term_id);

      // Remove the term from local state
      setSavedTerms((prevTerms) =>
        prevTerms.filter((term) => term.id !== bookmarkId),
      );

      console.log('Term bookmark deleted successfully');
    } catch (error) {
      console.error('Failed to delete term bookmark:', error);
      setError('Failed to delete term. Please try again.');
    }
  };

  // Function for deleting a bookmarked glossary
  const handleDeleteGlossary = async (bookmarkId: string) => {
    try {
      // Find the glossary to get the domain for the API call
      const glossaryToDelete = bookmarkedGlossaries.find(
        (glossary) => glossary.id === bookmarkId,
      );
      if (!glossaryToDelete) {
        console.error('Glossary not found in local state');
        return;
      }

      // Call the API to delete the bookmark using domain
      await workspaceAPI.bookmarks.glossaries.delete(glossaryToDelete.domain);

      // Remove the glossary from local state
      setBookmarkedGlossaries((prevGlossaries) =>
        prevGlossaries.filter((glossary) => glossary.id !== bookmarkId),
      );

      console.log('Glossary bookmark deleted successfully');
    } catch (error) {
      console.error('Failed to delete glossary bookmark:', error);
      setError('Failed to delete glossary. Please try again.');
    }
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
      prevTerms.map((term) => {
        const termGroupName = getTermGroupName(term.term_id);
        return selectedGroupsForDeletion.includes(termGroupName)
          ? { ...term } // BookmarkedTerm doesn't need group reassignment since groups are separate
          : term;
      }),
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
          .map((bookmarkedTerm) => bookmarkedTerm.domain)
          .filter((domain) => domain !== undefined),
      ),
    ] as string[];

    return categories.concat(uniqueCategories.sort());
  };

  const filteredTerms = savedTerms.filter((bookmarkedTerm) => {
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch =
      bookmarkedTerm.term?.toLowerCase().includes(searchLower) ||
      bookmarkedTerm.definition?.toLowerCase().includes(searchLower) ||
      (bookmarkedTerm.notes?.toLowerCase().includes(searchLower) ?? false);

    const matchesCategory =
      selectedCategory === 'all' || bookmarkedTerm.domain === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Helper function to get group name for a term
  const getTermGroupName = (termId: string): string => {
    for (const group of workspaceGroups) {
      const hasTermInGroup = group.items.some(
        (item) => item.item_type === 'term' && item.term_id === termId,
      );
      if (hasTermInGroup) {
        return group.name;
      }
    }
    return 'All Terms'; // Default group
  };

  // Group terms by their group property
  const groupedTerms = filteredTerms.reduce<Record<string, BookmarkedTerm[]>>(
    (acc, term) => {
      const groupName = getTermGroupName(term.term_id);
      // Create a new array for this group or use the existing one
      const groupArray = acc[groupName] ?? [];
      // Add the current term to its group array
      acc[groupName] = [...groupArray, term];
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
            {/* Error Display */}
            {error && (
              <div
                style={{
                  background: '#553c2c',
                  border: '1px solid #d69e2e',
                  color: '#fbb6ce',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            {/* Loading Display */}
            {loading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: isDarkMode ? '#a0aec0' : '#4a5568',
                }}
              >
                Loading workspace data...
              </div>
            )}

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
                                          {term.domain && (
                                            <span className="category-tag">
                                              {term.domain}
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
                                                    void handleSaveNote(
                                                      term.id,
                                                    );
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
                                          onClick={() => {
                                            void handleDeleteTerm(term.id);
                                          }}
                                          title="Delete bookmark"
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
                        {bookmarkedGlossaries.map((bookmark) => (
                          <div
                            key={bookmark.id}
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
                                    {bookmark.domain} Glossary
                                  </h4>
                                  <span className="language-tag">
                                    {bookmark.domain}
                                  </span>
                                </div>
                              </div>
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <div
                              className={`flex items-center justify-between text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                            >
                              <span>Bookmarked glossary</span>
                              <span>
                                Added:{' '}
                                {new Date(
                                  bookmark.bookmarked_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            {bookmark.notes && (
                              <div className="mt-2">
                                <p
                                  className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                                >
                                  {bookmark.notes}
                                </p>
                              </div>
                            )}
                            <div className="mt-3 flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  void handleDeleteGlossary(bookmark.id);
                                }}
                                className="px-3 py-1 text-sm border rounded"
                                title="Remove glossary bookmark"
                                style={{
                                  borderColor: '#ff6b6b',
                                  color: '#ff6b6b',
                                  backgroundColor: 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    '#ff6b6b';
                                  e.currentTarget.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    'transparent';
                                  e.currentTarget.style.color = '#ff6b6b';
                                }}
                              >
                                Remove Bookmark
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
