import React, { useState, useEffect, useMemo } from 'react';
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
import { workspaceAPI, workspaceGroupAPI } from '../utils/workspaceAPI';
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

  // Notification state for user feedback
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({
    message: '',
    type: 'info',
    visible: false
  });

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean;
  }>({
    'All Terms': true, // All Terms folder should be expanded by default
  });
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedGroupsForDeletion, setSelectedGroupsForDeletion] = useState<
    string[]
  >([]);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isTermSelectionModalOpen, setIsTermSelectionModalOpen] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);

  // Real workspace data state
  // const [bookmarkedTerms, setBookmarkedTerms] = useState<BookmarkedTerm[]>([]);
  const [bookmarkedGlossaries, setBookmarkedGlossaries] = useState<
    BookmarkedGlossary[]
  >([]);
  const [workspaceGroups, setWorkspaceGroups] = useState<WorkspaceGroup[]>([]);
  // const [workspaceOverview, setWorkspaceOverview] = useState<WorkspaceOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Force re-render when workspace data changes
  const [dataVersion, setDataVersion] = useState(0);

  // Initialize groups (will be populated from workspace groups)
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

  // Helper functions for user notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  const showSuccess = (message: string) => showNotification(message, 'success');
  const showError = (message: string) => showNotification(message, 'error');
  const showInfo = (message: string) => showNotification(message, 'info');

  // Helper function for confirmation modal
  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

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
    console.log('[DEBUG INIT] Component mounted, loading workspace data');
    console.log('[DEBUG AUTH] Current token:', localStorage.getItem('accessToken') ? 'Token exists' : 'No token found');
    void loadWorkspaceData();
  }, []);

  // Function to load all workspace data
  const loadWorkspaceData = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Please log in to access your workspace.');
      setLoading(false);
      return;
    }

    try {
      const [
        bookmarkedTermsData,
        bookmarkedGlossariesData,
        workspaceGroupsData,
      ] = await Promise.all([
        workspaceAPI.bookmarks.terms.getAll(),
        workspaceAPI.bookmarks.glossaries.getAll(),
        workspaceAPI.groups.getAll(),
      ]);

      // Combine terms from bookmarks and groups
      const termSet = new Set<BookmarkedTerm>();
      
      // Add all bookmarked terms
      bookmarkedTermsData.forEach(term => termSet.add(term));
      
      // Add terms from groups that might not be bookmarked
      workspaceGroupsData.forEach(group => {
        group.items?.forEach(item => {
          if (item.item_type === 'term' && item.term_id) {
            // Try to find the term in bookmarked terms first
            const existingTerm = bookmarkedTermsData.find(t => t.term_id === item.term_id);
            if (existingTerm) {
              termSet.add(existingTerm);
            }
          }
        });
      });

      const allTerms = Array.from(termSet);

      // Set the state with fetched data
      setSavedTerms(allTerms);
      setBookmarkedGlossaries(bookmarkedGlossariesData);
      setWorkspaceGroups(workspaceGroupsData);

      // Update groups list from workspace groups
      const groupNames = [
        'all',
        'All Terms',
        ...workspaceGroupsData.map((group) => group.name),
      ];
      setGroups(groupNames);
    } catch (error) {
      console.error('Failed to load workspace data:', error);
      
      // Check if this is an authentication error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('User not found') || 
          errorMessage.includes('Not authenticated') || 
          errorMessage.includes('401')) {
        setError('Please log in to access your workspace.');
      } else {
        setError('Failed to load workspace data. Please try again.');
      }
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
  const handleDeleteGlossary = async (domain: string) => {
    try {
      console.log('=== STARTING GLOSSARY DELETION ===');
      console.log('Attempting to delete glossary with domain:', domain);
      console.log('Current bookmarked glossaries count:', bookmarkedGlossaries.length);
      console.log('Current bookmarked glossaries:', bookmarkedGlossaries.map(g => ({ id: g.id, domain: g.domain })));
      
      // Find the glossary to confirm it exists
      const glossaryToDelete = bookmarkedGlossaries.find(
        (glossary) => glossary.domain === domain,
      );
      if (!glossaryToDelete) {
        console.error('Glossary not found in local state. Domain:', domain);
        console.error('Available glossary domains:', bookmarkedGlossaries.map(g => g.domain));
        return;
      }

      console.log('Found glossary to delete:', glossaryToDelete);
      console.log('Deleting glossary with domain:', domain);

      // Call the API to delete the bookmark using domain
      console.log('Calling API to delete bookmark...');
      await workspaceAPI.bookmarks.glossaries.delete(domain);
      console.log('API call completed successfully');

      // Remove the glossary from local state using domain instead of id
      console.log('Updating local state...');
      setBookmarkedGlossaries((prevGlossaries) => {
        console.log('Previous glossaries count:', prevGlossaries.length);
        const newGlossaries = prevGlossaries.filter((glossary) => glossary.domain !== domain);
        console.log('New glossaries count after filter:', newGlossaries.length);
        console.log('New glossaries:', newGlossaries.map(g => ({ id: g.id, domain: g.domain })));
        return newGlossaries;
      });

      console.log('=== GLOSSARY DELETION COMPLETED ===');
    } catch (error) {
      console.error('=== GLOSSARY DELETION FAILED ===');
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

  const handleDeleteSelectedGroups = async () => {
    if (selectedGroupsForDeletion.length === 0) return;

    const deleteAction = async () => {
      try {
        setLoading(true);

        // Delete each selected group via API
        for (const groupName of selectedGroupsForDeletion) {
          // Find the group to get its ID
          const groupToDelete = workspaceGroups.find(g => g.name === groupName);
          if (groupToDelete) {
            await workspaceGroupAPI.delete(groupToDelete.id);
          }
        }

        // Refresh workspace data to reflect the changes
        await loadWorkspaceData();
        showSuccess(`Successfully deleted ${selectedGroupsForDeletion.length} group(s)!`);

        // Exit delete mode
        handleExitDeleteMode();
        
      } catch (error) {
        console.error('Failed to delete groups:', error);
        showError('Failed to delete groups. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    showConfirmation(
      'Delete Groups',
      `Are you sure you want to delete ${selectedGroupsForDeletion.length} group(s)? This will move all terms from these groups to "All Terms" group.`,
      deleteAction
    );
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

  const handleCreateNewGroup = async () => {
    const trimmedName = newGroupName.trim();

    if (!trimmedName) {
      showError('Please enter a group name');
      return;
    }

    // Check if group name already exists
    if (workspaceGroups.some(group => group.name === trimmedName)) {
      showError('A group with this name already exists');
      return;
    }

    try {
      setLoading(true);

      // Create the group using the API
      const newGroup = await workspaceGroupAPI.create({
        name: trimmedName,
        group_type: 'terms',
        description: `Group for organizing terms: ${trimmedName}`,
      });

      // Update the workspace groups state
      setWorkspaceGroups(prev => [...prev, newGroup]);

      // Expand the newly created group so it's ready to show terms
      setExpandedGroups(prev => ({
        ...prev,
        [newGroup.name]: true
      }));

      // Store the created group ID and close the first modal
      setCreatedGroupId(newGroup.id);
      setIsNewGroupModalOpen(false);
      
      // Open the term selection modal
      setIsTermSelectionModalOpen(true);
      setSelectedTermIds([]); // Reset selected terms

    } catch (error) {
      console.error('Failed to create group:', error);
      showError('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Functions for handling term selection modal
  const handleCloseTermSelectionModal = () => {
    setIsTermSelectionModalOpen(false);
    setCreatedGroupId(null);
    setSelectedTermIds([]);
    setNewGroupName('');
  };

  const handleTermSelection = (termId: string) => {
    setSelectedTermIds(prev => 
      prev.includes(termId) 
        ? prev.filter(id => id !== termId)
        : [...prev, termId]
    );
  };

  const handleAddTermsToGroup = async () => {
    if (!createdGroupId || selectedTermIds.length === 0) {
      showError('Please select at least one term to add to the group');
      return;
    }

    try {
      setLoading(true);

      // Use the bulk add API to add selected terms to the group
      const addedItems = await workspaceGroupAPI.bulkAddTerms(createdGroupId, selectedTermIds);

      // Get fresh data from the API to ensure consistency
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const [
        bookmarkedTermsData,
        bookmarkedGlossariesData,
        workspaceGroupsData,
      ] = await Promise.all([
        workspaceAPI.bookmarks.terms.getAll(),
        workspaceAPI.bookmarks.glossaries.getAll(),
        workspaceAPI.groups.getAll(),
      ]);

      // Update all state with a slight delay to ensure proper ordering
      setSavedTerms(bookmarkedTermsData);
      setBookmarkedGlossaries(bookmarkedGlossariesData);
      
      // Update workspace groups and force re-render
      setWorkspaceGroups(workspaceGroupsData);

      // Update groups list from workspace groups
      const groupNames = [
        'all',
        'All Terms',
        ...workspaceGroupsData.map((group) => group.name),
      ];
      setGroups(groupNames);
      
      // Find the group name that was just updated and expand it so user can see the added terms
      const updatedGroup = workspaceGroupsData.find(group => group.id === createdGroupId);
      if (updatedGroup) {
        setExpandedGroups(prev => ({
          ...prev,
          [updatedGroup.name]: true
        }));
      }
      
      // Force complete re-render
      setDataVersion(prev => prev + 1);

      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        // State update completion check
      }, 100);

      // Close the modal first
      handleCloseTermSelectionModal();
      
      // Reload all workspace data to ensure UI is in sync
      await loadWorkspaceData();

      // Force a complete re-render by updating dataVersion
      setDataVersion(prev => prev + 1);

      // Show more informative success message
      if (addedItems.length > 0) {
        showSuccess(`Successfully added ${addedItems.length} term(s) to the group!`);
      } else {
        showInfo('No new terms were added - they may already be in the group.');
      }

    } catch (error) {
      console.error('Failed to add terms to group:', error);
      // Check if it's a specific error about duplicates
      if (error instanceof Error && error.message.includes('already in the group')) {
        showInfo('All selected terms are already in this group.');
      } else {
        showError('Failed to add terms to group. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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

  // Group terms by their group property
  const groupedTerms = useMemo(() => {
    // Create the grouping function inside useMemo to capture current workspaceGroups
    const getGroupForTerm = (termId: string): string => {
      for (const group of workspaceGroups) {
        const items = group.items || [];
        for (const item of items) {
          const itemTermIdStr = item.term_id?.toString();
          const termIdStr = termId?.toString();
          const match = item.item_type === 'term' && itemTermIdStr === termIdStr;
          if (match) {
            return group.name;
          }
        }
      }
      return 'All Terms';
    };

    const result: Record<string, BookmarkedTerm[]> = {};

    // Initialize empty arrays for ALL workspace groups (not just the groups array)
    result['All Terms'] = [];
    
    // Initialize arrays for all workspace groups to ensure they exist
    workspaceGroups.forEach(group => {
      result[group.name] = [];
    });
    
    // Also initialize for any groups in the groups array that might not be in workspaceGroups yet
    groups.filter(g => g !== 'all' && g !== 'All Terms').forEach(groupName => {
      if (!result[groupName]) {
        result[groupName] = [];
      }
    });

    // Categorize each term using the local function
    filteredTerms.forEach((term) => {
      const groupName = getGroupForTerm(term.term_id);
      if (!result[groupName]) {
        result[groupName] = [];
      }
      result[groupName].push(term);
    });
    
    return result;
  }, [filteredTerms, workspaceGroups, groups, dataVersion]);

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
                {error.includes('log in') && (
                  <div style={{ marginTop: '8px' }}>
                    <a 
                      href="/login" 
                      style={{ 
                        color: '#ffd700', 
                        textDecoration: 'underline',
                        fontWeight: 'bold'
                      }}
                    >
                      Go to Login
                    </a>
                  </div>
                )}
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
                                  void handleDeleteGlossary(bookmark.domain);
                                }}
                                className="create-new-btn"
                                title="Remove glossary bookmark"
                                style={{
                                  backgroundColor: 'var(--accent-color)',
                                  color: 'white',
                                  border: 'none',
                                  fontSize: '0.875rem',
                                  padding: '0.5rem 1rem',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#d91748';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--accent-color)';
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

      {/* Term Selection Modal */}
      {isTermSelectionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="modal-title">Select Terms to Add to Group</h3>
              <button
                type="button"
                onClick={handleCloseTermSelectionModal}
                className="close-btn"
              >
                <X className="close-icon" />
              </button>
            </div>
            <div className="modal-body">
              <p className="form-description">
                Select the terms you want to add to your new group. You can select multiple terms.
              </p>
              
              {/* Terms List with improved scrollbar */}
              <div 
                className="terms-list" 
                style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto', 
                  marginTop: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}
              >
                {savedTerms.length > 0 ? (
                  savedTerms.map((term) => (
                    <div
                      key={term.id}
                      className={`term-item ${selectedTermIds.includes(term.term_id) ? 'selected' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        backgroundColor: selectedTermIds.includes(term.term_id) ? '#f3f4f6' : 'white',
                      }}
                      onClick={() => handleTermSelection(term.term_id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTermIds.includes(term.term_id)}
                        onChange={() => handleTermSelection(term.term_id)}
                        style={{ marginRight: '0.75rem' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {term.term}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {term.definition}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                          Domain: {term.domain} | Language: {term.language}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No bookmarked terms available. Bookmark some terms first to add them to groups.
                  </div>
                )}
              </div>

              {selectedTermIds.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                  <strong>{selectedTermIds.length}</strong> term(s) selected
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                onClick={handleCloseTermSelectionModal}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTermsToGroup}
                disabled={selectedTermIds.length === 0 || loading}
                className={`create-btn ${selectedTermIds.length === 0 || loading ? 'disabled' : ''}`}
              >
                <Plus className="plus-icon" />
                {loading ? 'Adding...' : `Add ${selectedTermIds.length} Term(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Display */}
      {notification.visible && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <h3>{confirmationModal.title}</h3>
            <p>{confirmationModal.message}</p>
            <div className="confirmation-modal-buttons">
              <button 
                className="cancel-button" 
                onClick={confirmationModal.onCancel}
              >
                Cancel
              </button>
              <button 
                className="confirm-button" 
                onClick={confirmationModal.onConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
