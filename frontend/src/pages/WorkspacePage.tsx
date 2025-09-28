import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Plus,
  Move,
  Trash2,
  FolderPlus,
  Search,
  StickyNote,
  Save,
  X,
  BookOpen,
} from 'lucide-react';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import { API_ENDPOINTS } from '../config';

import '../styles/WorkspacePage.scss';

// Type definitions for workspace components
interface BookmarkedTerm {
  id: string;
  term_id: string;
  term: string;
  definition: string;
  language: string;
  domain: string;
  bookmarked_at: string;
  notes?: string;
}

interface BookmarkedGlossary {
  id: string;
  domain: string;
  term_count: number;
  bookmarked_at: string;
  description?: string;
  notes?: string;
}

interface GlossaryStats {
  [domain: string]: {
    term_count: number;
    language_count?: number;
  };
}

interface WorkspaceGroup {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  items?: Array<{
    term_id: string;
    added_at: string;
    item_type?: string;
  }>;
}

const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();

  // For navigation integration
  const [activeMenuItem, setActiveMenuItem] = useState('workspace');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  // Used to force re-renders when data is updated
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_dataVersion, setDataVersion] = useState(0);
  const { isDarkMode } = useDarkMode();

  const [activeTab, setActiveTab] = useState('saved-terms');
  const [searchQuery, setSearchQuery] = useState('');

  // Notification state for user feedback
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({
    message: '',
    type: 'info',
    visible: false,
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
    onCancel: () => {},
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
  const [isTermSelectionModalOpen, setIsTermSelectionModalOpen] =
    useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);

  // State for moving terms between groups
  const [isMoveTermModalOpen, setIsMoveTermModalOpen] = useState(false);
  const [termToMove, setTermToMove] = useState<{
    termId: string;
    termName: string;
    currentGroup: string;
  } | null>(null);

  // State for renaming groups
  const [isRenameGroupModalOpen, setIsRenameGroupModalOpen] = useState(false);
  const [groupToRename, setGroupToRename] = useState<{
    groupId: string;
    currentName: string;
  } | null>(null);
  const [newGroupNameForRename, setNewGroupNameForRename] = useState('');

  // Real workspace data state
  // const [bookmarkedTerms, setBookmarkedTerms] = useState<BookmarkedTerm[]>([]);
  const [bookmarkedGlossaries, setBookmarkedGlossaries] = useState<
    BookmarkedGlossary[]
  >([]);
  const [glossaryStats, setGlossaryStats] = useState<GlossaryStats>({});
  const [workspaceGroups, setWorkspaceGroups] = useState<WorkspaceGroup[]>([]);
  // const [workspaceOverview, setWorkspaceOverview] = useState<WorkspaceOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
  ) => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  const showSuccess = (message: string) => {
    showNotification(message, 'success');
  };
  const showError = (message: string) => {
    showNotification(message, 'error');
  };
  const showInfo = (message: string) => {
    showNotification(message, 'info');
  };

  // Helper function for confirmation modal
  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Workspace data state
  const [savedTerms, setSavedTerms] = useState<BookmarkedTerm[]>([]);

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

  // Load workspace data on component mount
  useEffect(() => {
    console.log('[DEBUG INIT] Component mounted, loading workspace data');
    console.log(
      '[DEBUG AUTH] Current token:',
      localStorage.getItem('accessToken') ? 'Token exists' : 'No token found',
    );

    // Check if bookmarks have changed since last workspace load
    const lastBookmarkChange = localStorage.getItem('bookmarksChanged');
    const lastWorkspaceLoad = localStorage.getItem('workspaceLastLoaded');

    if (
      lastBookmarkChange &&
      (!lastWorkspaceLoad || lastBookmarkChange > lastWorkspaceLoad)
    ) {
      console.log(
        '[DEBUG INIT] Bookmarks changed since last load, will refresh',
      );
    }

    void loadWorkspaceData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload workspace data when page becomes visible (to catch changes from other pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log(
          '[DEBUG REFRESH] Page became visible, checking for bookmark changes',
        );

        // Check if bookmarks have changed since last visit
        const lastBookmarkChange = localStorage.getItem('bookmarksChanged');
        const lastWorkspaceLoad = localStorage.getItem('workspaceLastLoaded');

        if (
          lastBookmarkChange &&
          (!lastWorkspaceLoad || lastBookmarkChange > lastWorkspaceLoad)
        ) {
          console.log(
            '[DEBUG REFRESH] Bookmarks changed, refreshing workspace data',
          );
          void loadWorkspaceData();
          localStorage.setItem('workspaceLastLoaded', Date.now().toString());
        }
      }
    };

    // Add listener for when the tab becomes visible
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also add a focus listener as a backup
    const handleFocus = () => {
      console.log(
        '[DEBUG REFRESH] Window focused, checking for bookmark changes',
      );

      // Check if bookmarks have changed since last visit
      const lastBookmarkChange = localStorage.getItem('bookmarksChanged');
      const lastWorkspaceLoad = localStorage.getItem('workspaceLastLoaded');

      if (
        lastBookmarkChange &&
        (!lastWorkspaceLoad || lastBookmarkChange > lastWorkspaceLoad)
      ) {
        console.log(
          '[DEBUG REFRESH] Bookmarks changed, refreshing workspace data',
        );
        void loadWorkspaceData();
        localStorage.setItem('workspaceLastLoaded', Date.now().toString());
      }
    };
    window.addEventListener('focus', handleFocus);

    // Listen for bookmark changes from other parts of the app
    const handleBookmarkChange = (
      event: CustomEvent<{ action?: string; name?: string }>,
    ) => {
      console.log(
        '🚨 [NUCLEAR WORKSPACE DEBUG] BOOKMARK CHANGE EVENT RECEIVED!',
      );
      console.log('🚨 [NUCLEAR WORKSPACE DEBUG] Event detail:', event.detail);
      console.log('🚨 [NUCLEAR WORKSPACE DEBUG] Event type:', event.type);
      console.log(
        '🚨 [NUCLEAR WORKSPACE DEBUG] Current time:',
        new Date().toISOString(),
      );

      const action = event.detail.action ?? 'unknown';
      const name = event.detail.name ?? 'unknown';
      console.log(
        `WORKSPACE: Received bookmark change event! Action: ${action}, Name: ${name}`,
      );

      console.log(
        '🔄 [NUCLEAR WORKSPACE DEBUG] About to reload workspace data...',
      );
      void loadWorkspaceData();

      const timestamp = Date.now().toString();
      localStorage.setItem('workspaceLastLoaded', timestamp);
      console.log(
        '💾 [NUCLEAR WORKSPACE DEBUG] Set workspaceLastLoaded to:',
        timestamp,
      );
    };
    window.addEventListener(
      'bookmarkChanged',
      handleBookmarkChange as EventListener,
    );
    console.log(
      '👂 [NUCLEAR WORKSPACE DEBUG] Added bookmark change event listener!',
    );

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener(
        'bookmarkChanged',
        handleBookmarkChange as EventListener,
      );
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to load all workspace data
  const loadWorkspaceData = useCallback(async (): Promise<void> => {
    console.log('🔄 [NUCLEAR WORKSPACE DEBUG] loadWorkspaceData() CALLED!');
    console.log(
      '🔄 [NUCLEAR WORKSPACE DEBUG] Current time:',
      new Date().toISOString(),
    );

    setLoading(true);
    setError(null);

    const token = localStorage.getItem('accessToken');
    console.log('🔑 [NUCLEAR WORKSPACE DEBUG] Token exists:', !!token);

    if (!token) {
      console.log('❌ [NUCLEAR WORKSPACE DEBUG] No token found!');
      setError('Please log in to access your workspace.');
      setLoading(false);
      return;
    }

    try {
      console.log('📡 [NUCLEAR WORKSPACE DEBUG] About to fetch bookmarks...');
      console.log(
        '📡 [NUCLEAR WORKSPACE DEBUG] Bookmarks URL:',
        API_ENDPOINTS.getBookmarks,
      );

      // Fetch bookmarks (terms and glossaries)
      const bookmarksResponse = await fetch(API_ENDPOINTS.getBookmarks, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        '📡 [NUCLEAR WORKSPACE DEBUG] Bookmarks response status:',
        bookmarksResponse.status,
      );
      console.log(
        '📡 [NUCLEAR WORKSPACE DEBUG] Bookmarks response ok:',
        bookmarksResponse.ok,
      );

      if (!bookmarksResponse.ok) {
        throw new Error(
          `Failed to fetch bookmarks: ${bookmarksResponse.status.toString()}`,
        );
      }

      const bookmarksData = (await bookmarksResponse.json()) as {
        terms?: BookmarkedTerm[];
        glossaries?: BookmarkedGlossary[];
      };
      console.log(
        '📊 [NUCLEAR WORKSPACE DEBUG] Bookmarks data received:',
        bookmarksData,
      );
      console.log(
        '📊 [NUCLEAR WORKSPACE DEBUG] Terms count:',
        (bookmarksData.terms?.length || 0).toString(),
      );
      console.log(
        '📊 [NUCLEAR WORKSPACE DEBUG] Glossaries count:',
        (bookmarksData.glossaries?.length || 0).toString(),
      );

      setSavedTerms(bookmarksData.terms || []);
      setBookmarkedGlossaries(bookmarksData.glossaries || []);

      console.log(
        '✅ [NUCLEAR WORKSPACE DEBUG] Successfully updated workspace state!',
      );

      // Fetch workspace groups
      const groupsResponse = await fetch(API_ENDPOINTS.getUserGroups, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!groupsResponse.ok) {
        throw new Error('Failed to fetch groups');
      }

      const groupsData = (await groupsResponse.json()) as WorkspaceGroup[];
      console.log(
        '📊 [NUCLEAR WORKSPACE DEBUG] Groups data received:',
        groupsData,
      );
      console.log(
        '📊 [NUCLEAR WORKSPACE DEBUG] Groups count:',
        groupsData.length.toString(),
      );

      setWorkspaceGroups(groupsData);

      // Update groups list from workspace groups
      const groupNames = [
        'all',
        'All Terms',
        ...groupsData.map((group: WorkspaceGroup) => group.name),
      ];
      setGroups(groupNames);

      // Fetch glossary stats (don't block on failure)
      await fetchGlossaryStats();

      console.log('Workspace data loaded successfully');

      // Mark that workspace data has been loaded
      localStorage.setItem('workspaceLastLoaded', Date.now().toString());
    } catch (error) {
      console.error('Failed to load workspace data:', error);
      setError('Failed to load workspace data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to fetch glossary stats
  const fetchGlossaryStats = async (): Promise<void> => {
    try {
      const response = await fetch(API_ENDPOINTS.glossaryCategoriesStats);

      if (!response.ok) {
        console.warn('Failed to fetch glossary stats:', response.status);
        return;
      }

      const statsData = (await response.json()) as Array<{
        category: string;
        term_count: number;
        language_count?: number;
      }>;

      // Convert array to object for easier lookup
      const statsMap: GlossaryStats = {};
      statsData.forEach((stat) => {
        statsMap[stat.category] = {
          term_count: stat.term_count,
          language_count: stat.language_count,
        };
      });

      setGlossaryStats(statsMap);
      console.log('✅ Glossary stats loaded successfully:', statsMap);
    } catch (error) {
      console.warn('Failed to fetch glossary stats:', error);
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
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Please log in to save notes.');
      return;
    }

    try {
      // Find the term to update
      const termToUpdate = savedTerms.find((term) => term.id === bookmarkId);
      if (!termToUpdate) {
        console.error('Term not found in local state');
        return;
      }

      // Update bookmark note via API
      const response = await fetch(API_ENDPOINTS.updateBookmarkNote, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookmark_id: bookmarkId, // This is already the correct bookmark ID
          notes: noteText.trim(), // Changed back to 'notes' as per the correct schema
          bookmark_type: 'term',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          'Update bookmark note failed:',
          response.status,
          errorText,
        );
        throw new Error(
          `Failed to update bookmark note: ${response.status.toString()} ${errorText}`,
        );
      }

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
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Please log in to delete bookmarks.');
      return;
    }

    try {
      // Find the term to confirm it exists
      const termToDelete = savedTerms.find((term) => term.id === bookmarkId);
      if (!termToDelete) {
        console.error('Term not found in local state');
        return;
      }

      // Delete bookmark via API
      const response = await fetch(
        API_ENDPOINTS.unbookmarkTerm(termToDelete.term_id),
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete term bookmark');
      }

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
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Please log in to delete bookmarks.');
      return;
    }

    try {
      console.log('=== STARTING GLOSSARY DELETION ===');
      console.log('Attempting to delete glossary with domain:', domain);

      // Find the glossary to confirm it exists
      const glossaryToDelete = bookmarkedGlossaries.find(
        (glossary) => glossary.domain === domain,
      );
      if (!glossaryToDelete) {
        console.error('Glossary not found in local state. Domain:', domain);
        return;
      }

      console.log('Found glossary to delete:', glossaryToDelete);

      // Call the API to delete the bookmark
      const response = await fetch(API_ENDPOINTS.unbookmarkGlossary(domain), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete glossary bookmark');
      }

      console.log('API call completed successfully');

      // Remove the glossary from local state
      setBookmarkedGlossaries((prevGlossaries) =>
        prevGlossaries.filter((glossary) => glossary.domain !== domain),
      );

      // Set a flag in localStorage to indicate bookmarks have changed
      localStorage.setItem('bookmarksChanged', Date.now().toString());

      // Trigger bookmark change event for other components
      window.dispatchEvent(
        new CustomEvent('bookmarkChanged', {
          detail: { type: 'glossary', action: 'unbookmark', name: domain },
        }),
      );

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

  const handleDeleteSelectedGroups = () => {
    if (selectedGroupsForDeletion.length === 0) return;

    const deleteAction = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('accessToken');
        if (!token) {
          showError('Please log in to delete groups.');
          return;
        }

        // Delete each selected group using real API
        for (const groupName of selectedGroupsForDeletion) {
          // Find the group to delete
          const groupToDelete = workspaceGroups.find(
            (g) => g.name === groupName,
          );
          if (groupToDelete) {
            const response = await fetch(
              API_ENDPOINTS.deleteGroup(groupToDelete.id),
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (!response.ok) {
              throw new Error(`Failed to delete group: ${groupToDelete.name}`);
            }
          }
        }

        // Refresh workspace data to reflect the changes
        await loadWorkspaceData();
        showSuccess(
          `Successfully deleted ${selectedGroupsForDeletion.length.toString()} group(s)!`,
        );

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
      `Are you sure you want to delete ${selectedGroupsForDeletion.length.toString()} group(s)? This will move all terms from these groups to "All Terms" group.`,
      () => {
        void deleteAction();
      },
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
    if (workspaceGroups.some((group) => group.name === trimmedName)) {
      showError('A group with this name already exists');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      showError('Please log in to create groups.');
      return;
    }

    try {
      setLoading(true);

      // Create the group via API
      const response = await fetch(API_ENDPOINTS.createGroup, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          description: `Group for organizing terms: ${trimmedName}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      const newGroup = (await response.json()) as WorkspaceGroup;

      // Update the workspace groups state
      setWorkspaceGroups((prev) => [...prev, newGroup]);

      // Expand the newly created group so it's ready to show terms
      setExpandedGroups((prev) => ({
        ...prev,
        [newGroup.name]: true,
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
    setSelectedTermIds((prev) =>
      prev.includes(termId)
        ? prev.filter((id) => id !== termId)
        : [...prev, termId],
    );
  };

  const handleAddTermsToGroup = async () => {
    if (!createdGroupId || selectedTermIds.length === 0) {
      showError('Please select at least one term to add to the group');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      showError('Please log in to add terms to groups.');
      return;
    }

    try {
      setLoading(true);

      // Add terms to group via API
      const response = await fetch(
        API_ENDPOINTS.addTermsToGroup(createdGroupId),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            term_ids: selectedTermIds,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to add terms to group');
      }

      const result = (await response.json()) as {
        added_terms?: Array<unknown>;
      };

      // Close the modal first
      handleCloseTermSelectionModal();

      // Reload all workspace data to ensure UI is in sync
      await loadWorkspaceData();

      // Force a complete re-render by updating dataVersion
      setDataVersion((prev: number) => prev + 1);

      // Show success message
      if (result.added_terms && result.added_terms.length > 0) {
        showSuccess(
          `Successfully added ${result.added_terms.length.toString()} term(s) to the group!`,
        );
      } else {
        showInfo('No new terms were added - they may already be in the group.');
      }
    } catch (error) {
      console.error('Failed to add terms to group:', error);
      showError('Failed to add terms to group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Functions for moving terms between groups
  const handleMoveTermToGroup = (
    termId: string,
    termName: string,
    currentGroup: string,
  ) => {
    setTermToMove({ termId, termName, currentGroup });
    setIsMoveTermModalOpen(true);
  };

  const handleCloseMoveTermModal = () => {
    setIsMoveTermModalOpen(false);
    setTermToMove(null);
  };

  // Functions for renaming groups
  const handleRenameGroup = (groupId: string, currentName: string) => {
    setGroupToRename({ groupId, currentName });
    setNewGroupNameForRename(currentName);
    setIsRenameGroupModalOpen(true);
  };

  const handleCloseRenameGroupModal = () => {
    setIsRenameGroupModalOpen(false);
    setGroupToRename(null);
    setNewGroupNameForRename('');
  };

  const handleConfirmRenameGroup = async () => {
    if (!groupToRename || !newGroupNameForRename.trim()) {
      showError('Please enter a valid group name');
      return;
    }

    const trimmedName = newGroupNameForRename.trim();

    // Check if the new name is the same as the current name
    if (trimmedName === groupToRename.currentName) {
      handleCloseRenameGroupModal();
      return;
    }

    // Check if group name already exists
    if (
      workspaceGroups.some(
        (group) =>
          group.name === trimmedName && group.id !== groupToRename.groupId,
      )
    ) {
      showError('A group with this name already exists');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      showError('Please log in to rename groups.');
      return;
    }

    try {
      setLoading(true);

      // Update the group via API
      const response = await fetch(
        API_ENDPOINTS.updateGroup(groupToRename.groupId),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: trimmedName,
            description: `Group for organizing terms: ${trimmedName}`,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to rename group');
      }

      // Close the modal
      handleCloseRenameGroupModal();

      // Reload workspace data to reflect changes
      await loadWorkspaceData();

      // Force a complete re-render
      setDataVersion((prev: number) => prev + 1);

      // Show success message
      showSuccess(`Successfully renamed group to "${trimmedName}"!`);
    } catch (error) {
      console.error('Failed to rename group:', error);
      showError('Failed to rename group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMoveTermToGroup = async (targetGroupId: string) => {
    if (!termToMove) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      showError('Please log in to move terms between groups.');
      return;
    }

    try {
      setLoading(true);

      // First, remove the term from its current group (if it's not "All Terms")
      if (termToMove.currentGroup !== 'All Terms') {
        const currentGroup = workspaceGroups.find(
          (g) => g.name === termToMove.currentGroup,
        );
        if (currentGroup) {
          const removeResponse = await fetch(
            API_ENDPOINTS.removeTermFromGroup(
              currentGroup.id,
              termToMove.termId,
            ),
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!removeResponse.ok) {
            throw new Error('Failed to remove term from current group');
          }
        }
      }

      // Then, add the term to the target group (if it's not "All Terms")
      if (targetGroupId !== 'all-terms') {
        const addResponse = await fetch(
          API_ENDPOINTS.addTermsToGroup(targetGroupId),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              term_ids: [termToMove.termId],
            }),
          },
        );

        if (!addResponse.ok) {
          throw new Error('Failed to add term to target group');
        }
      }

      // Close the modal
      handleCloseMoveTermModal();

      // Reload workspace data to reflect changes
      await loadWorkspaceData();

      // Force a complete re-render
      setDataVersion((prev: number) => prev + 1);

      // Show success message
      const targetGroupName =
        targetGroupId === 'all-terms'
          ? 'All Terms'
          : workspaceGroups.find((g) => g.id === targetGroupId)?.name ||
            'selected group';

      showSuccess(
        `Successfully moved "${termToMove.termName}" to ${targetGroupName}!`,
      );
    } catch (error) {
      console.error('Failed to move term:', error);
      showError('Failed to move term. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTerms = savedTerms.filter((bookmarkedTerm) => {
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch =
      bookmarkedTerm.term.toLowerCase().includes(searchLower) ||
      bookmarkedTerm.definition.toLowerCase().includes(searchLower) ||
      (bookmarkedTerm.notes &&
        bookmarkedTerm.notes.toLowerCase().includes(searchLower));

    return matchesSearch;
  });

  // Group terms by their group property
  const groupedTerms = useMemo(() => {
    // Create the grouping function inside useMemo to capture current workspaceGroups
    const getGroupForTerm = (termId: string): string => {
      console.log(`🔍 [GROUP DEBUG] Looking for group for term: ${termId}`);
      console.log(
        `🔍 [GROUP DEBUG] Available workspace groups:`,
        workspaceGroups.map((g) => ({
          name: g.name,
          items: (g.items?.length || 0).toString(),
        })),
      );

      for (const group of workspaceGroups) {
        const items = group.items || [];
        console.log(
          `🔍 [GROUP DEBUG] Checking group "${group.name}" with ${items.length.toString()} items`,
        );

        for (const item of items) {
          const itemTermIdStr = item.term_id;
          const termIdStr = termId;
          const match =
            item.item_type === 'term' && itemTermIdStr === termIdStr;
          console.log(
            `🔍 [GROUP DEBUG] Comparing item ${itemTermIdStr} with term ${termIdStr}, match: ${match.toString()}`,
          );

          if (match) {
            console.log(
              `✅ [GROUP DEBUG] Found term ${termId} in group "${group.name}"`,
            );
            return group.name;
          }
        }
      }
      console.log(
        `❌ [GROUP DEBUG] Term ${termId} not found in any group, defaulting to "All Terms"`,
      );
      return 'All Terms';
    };

    const result: Record<string, BookmarkedTerm[]> = {};

    // Initialize empty arrays for ALL workspace groups (not just the groups array)
    result['All Terms'] = [];

    // Initialize arrays for all workspace groups to ensure they exist
    workspaceGroups.forEach((group) => {
      result[group.name] = [];
    });

    // Also initialize for any groups in the groups array that might not be in workspaceGroups yet
    groups
      .filter((g) => g !== 'all' && g !== 'All Terms')
      .forEach((groupName) => {
        result[groupName] = [];
      });

    // Categorize each term using the local function AND ensure all terms appear in "All Terms"
    filteredTerms.forEach((term) => {
      // Always add to "All Terms" group
      result['All Terms'].push(term);

      // Also add to specific group if it has one (and it's not "All Terms")
      const groupName = getGroupForTerm(term.term_id);
      if (groupName !== 'All Terms') {
        result[groupName].push(term);
      }
    });

    return result;
  }, [filteredTerms, workspaceGroups, groups]);

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
                  background: '#d91748',
                  border: '1px solid #d91748',
                  color: '#ffffff',
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
                        color: '#ffffff',
                        textDecoration: 'underline',
                        fontWeight: 'bold',
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
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '1rem',
                }}
              >
                <div className="loading-spinner"></div>
              </div>
            )}

            {/* Header */}
            <div className="workspace-header">
              {/* Navigation Tabs */}
              <div
                style={{
                  backgroundColor: isDarkMode
                    ? '#212431ad'
                    : 'rgba(196, 196, 196, 0.4)',
                  display: 'flex',
                  gap: '0.25rem',
                  padding: '0.25rem',
                  borderRadius: '0.75rem',
                }}
                className="workspace-tabs"
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
                    setActiveTab('glossaries');
                  }}
                  className={`tab-button ${activeTab === 'glossaries' ? 'active' : ''}`}
                >
                  Followed Glossaries
                </button>
              </div>

              {activeTab === 'saved-terms' && (
                <div className="workspace-actions">
                  {isDeleteMode ? (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleDeleteSelectedGroups}
                        disabled={selectedGroupsForDeletion.length === 0}
                        className={`create-new-btn ${selectedGroupsForDeletion.length === 0 ? 'disabled' : ''}`}
                      >
                        <Trash2 className="w-5 h-5" />
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
                        className="create-new-btn"
                      >
                        <Trash2 className="icon" />
                        Delete Groups
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                                  <>
                                    {groupName !== 'All Terms' && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const group = workspaceGroups.find(
                                            (g) => g.name === groupName,
                                          );
                                          if (group) {
                                            handleRenameGroup(
                                              group.id,
                                              group.name,
                                            );
                                          }
                                        }}
                                        className="group-action-btn"
                                        title="Rename group"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                    )}
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
                                  </>
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
                                      marginBottom: '1rem',
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
                                          <div className="term-badges">
                                            <span className="term-language-badge">
                                              {term.language}
                                            </span>
                                            {term.domain && (
                                              <span className="category-tag">
                                                {term.domain}
                                              </span>
                                            )}
                                          </div>
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
                                                  style={{
                                                    backgroundColor: isDarkMode
                                                      ? undefined
                                                      : '#00ceaf16', // pink in light mode
                                                  }}
                                                >
                                                  <Save className="icon" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={handleCancelNote}
                                                  className="cancel-btn"
                                                  style={{
                                                    backgroundColor: isDarkMode
                                                      ? undefined
                                                      : '#f8717148',
                                                  }}
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
                                          className="add-note-btn"
                                          onClick={() => {
                                            // Find the actual group this term belongs to (not "All Terms")
                                            let currentGroup = 'All Terms';
                                            for (const group of workspaceGroups) {
                                              const items = group.items || [];
                                              for (const item of items) {
                                                if (
                                                  item.item_type === 'term' &&
                                                  item.term_id === term.term_id
                                                ) {
                                                  currentGroup = group.name;
                                                  break;
                                                }
                                              }
                                              if (currentGroup !== 'All Terms')
                                                break;
                                            }
                                            handleMoveTermToGroup(
                                              term.term_id,
                                              term.term,
                                              currentGroup,
                                            );
                                          }}
                                          title="Move to group"
                                          style={{
                                            backgroundColor: isDarkMode
                                              ? '#31374e'
                                              : '#00ceaf25',
                                          }}
                                        >
                                          <Move
                                            style={{ color: '#00ceaf' }}
                                            className="icon"
                                          />
                                        </button>
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
                      <div className="grid grid-cols-2 gap-4">
                        {bookmarkedGlossaries.map((bookmark) => (
                          <div
                            key={bookmark.id}
                            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                            style={
                              isDarkMode
                                ? { backgroundColor: '#222535c0' }
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
                                    {bookmark.domain}
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="term-count-badge">
                                  {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
                                  {(glossaryStats[bookmark.domain] &&
                                  glossaryStats[bookmark.domain].term_count > 0
                                    ? glossaryStats[bookmark.domain].term_count
                                    : bookmark.term_count) || 0}{' '}
                                  terms
                                </span>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              </div>
                            </div>
                            {/* Date removed as requested */}
                            {bookmark.notes && (
                              <div className="mt-2">
                                <p
                                  className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                                >
                                  {bookmark.notes}
                                </p>
                              </div>
                            )}
                            <div className="mt-3 flex items-center space-x-2 justify-center">
                              <div
                                style={{
                                  display: 'flex',
                                  width: '100%',
                                  justifyContent: 'space-between',
                                  gap: '0.5rem',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Handle view glossary action
                                    console.log(
                                      'View glossary:',
                                      bookmark.domain,
                                    );
                                    // Navigate to glossary page with selected glossary
                                    void navigate('/glossary', {
                                      state: {
                                        selectedGlossaryName: bookmark.domain,
                                      },
                                    });
                                  }}
                                  className="create-new-btn"
                                  title="View glossary"
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? '#1b1d28ff'
                                      : '#e5e7eb', // dark blue in dark mode, grey in light mode
                                    color: isDarkMode ? 'white' : '#363b4d',
                                    border: 'none',
                                    fontSize: '0.875rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '9999px',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      isDarkMode ? '#212431bd' : '#d1d5db';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      isDarkMode ? '#1b1d28ff' : '#e5e7eb';
                                  }}
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleDeleteGlossary(bookmark.domain);
                                  }}
                                  className="create-new-btn"
                                  title="Remove glossary bookmark"
                                  style={{
                                    backgroundColor: '#d9174836',
                                    color: '#d91748',
                                    border: 'none',
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      '#d9174880';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      '#d9174836';
                                  }}
                                >
                                  <Trash2
                                    className="icon"
                                    style={{ width: '16px', height: '16px' }}
                                  />
                                </button>
                              </div>
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
                      void handleCreateNewGroup();
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
                onClick={() => {
                  void handleCreateNewGroup();
                }}
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
                Select the terms you want to add to your new group. You can
                select multiple terms.
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
                  scrollbarColor: '#cbd5e1 #f1f5f9',
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
                        backgroundColor: selectedTermIds.includes(term.term_id)
                          ? '#f3f4f6'
                          : 'white',
                      }}
                      onClick={() => {
                        handleTermSelection(term.term_id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTermIds.includes(term.term_id)}
                        onChange={() => {
                          handleTermSelection(term.term_id);
                        }}
                        style={{ marginRight: '0.75rem' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontWeight: '600', marginBottom: '0.25rem' }}
                        >
                          {term.term}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {term.definition}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#9ca3af',
                            marginTop: '0.25rem',
                          }}
                        >
                          Domain: {term.domain} | Language: {term.language}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#6b7280',
                    }}
                  >
                    No bookmarked terms available. Bookmark some terms first to
                    add them to groups.
                  </div>
                )}
              </div>

              {selectedTermIds.length > 0 && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem',
                  }}
                >
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
                onClick={() => {
                  void handleAddTermsToGroup();
                }}
                disabled={selectedTermIds.length === 0 || loading}
                className={`create-btn ${selectedTermIds.length === 0 || loading ? 'disabled' : ''}`}
              >
                <Plus className="plus-icon" />
                {loading
                  ? 'Adding...'
                  : `Add ${selectedTermIds.length.toString()} Term(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Term Modal */}
      {isMoveTermModalOpen && termToMove && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="modal-title">Move Term to Group</h3>
              <button
                type="button"
                onClick={handleCloseMoveTermModal}
                className="close-btn"
              >
                <X className="close-icon" />
              </button>
            </div>
            <div className="modal-body">
              <p className="form-description">
                Move "{termToMove.termName}" from "{termToMove.currentGroup}" to
                a different group.
              </p>

              {/* Groups List */}
              <div
                className="groups-list"
                style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  marginTop: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                }}
              >
                {/* All Terms option */}
                <div
                  className={`group-option ${termToMove.currentGroup === 'All Terms' ? 'disabled' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                    cursor:
                      termToMove.currentGroup === 'All Terms'
                        ? 'not-allowed'
                        : 'pointer',
                    backgroundColor:
                      termToMove.currentGroup === 'All Terms'
                        ? '#f3f4f6'
                        : 'white',
                    opacity: termToMove.currentGroup === 'All Terms' ? 0.5 : 1,
                  }}
                  onClick={() => {
                    if (termToMove.currentGroup !== 'All Terms') {
                      void handleConfirmMoveTermToGroup('all-terms');
                    }
                  }}
                >
                  <FolderPlus
                    className="w-4 h-4 mr-2"
                    style={{ color: '#00ceaf' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>All Terms</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Remove from specific groups
                    </div>
                  </div>
                  {termToMove.currentGroup === 'All Terms' && (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      Current
                    </span>
                  )}
                </div>

                {/* Workspace Groups */}
                {workspaceGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`group-option ${termToMove.currentGroup === group.name ? 'disabled' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      marginBottom: '0.5rem',
                      cursor:
                        termToMove.currentGroup === group.name
                          ? 'not-allowed'
                          : 'pointer',
                      backgroundColor:
                        termToMove.currentGroup === group.name
                          ? '#f3f4f6'
                          : 'white',
                      opacity: termToMove.currentGroup === group.name ? 0.5 : 1,
                    }}
                    onClick={() => {
                      if (termToMove.currentGroup !== group.name) {
                        void handleConfirmMoveTermToGroup(group.id);
                      }
                    }}
                  >
                    <FolderPlus
                      className="w-4 h-4 mr-2"
                      style={{ color: '#00ceaf' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600' }}>{group.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {group.items?.length || 0} term(s)
                      </div>
                    </div>
                    {termToMove.currentGroup === group.name && (
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                onClick={handleCloseMoveTermModal}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Group Modal */}
      {isRenameGroupModalOpen && groupToRename && (
        <div className="modal-overlay">
          <div className="modal-container">
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="modal-title">
                <Edit2 className="w-5 h-5 inline mr-2" />
                Rename Group
              </h3>
              <button
                type="button"
                onClick={handleCloseRenameGroupModal}
                className="close-btn"
              >
                <X className="close-icon" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="renameGroupName" className="form-label">
                  Group Name
                </label>
                <input
                  type="text"
                  id="renameGroupName"
                  value={newGroupNameForRename}
                  onChange={(e) => {
                    setNewGroupNameForRename(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleConfirmRenameGroup();
                    } else if (e.key === 'Escape') {
                      handleCloseRenameGroupModal();
                    }
                  }}
                  placeholder="Enter new group name..."
                  className="form-input"
                  autoFocus
                />
              </div>
              <p className="form-description">
                Rename "{groupToRename.currentName}" to a new name.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                onClick={handleCloseRenameGroupModal}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleConfirmRenameGroup();
                }}
                disabled={!newGroupNameForRename.trim() || loading}
                className={`create-btn ${!newGroupNameForRename.trim() || loading ? 'disabled' : ''}`}
              >
                <Edit2 className="plus-icon" />
                {loading ? 'Renaming...' : 'Rename Group'}
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
                type="button"
                className="cancel-button"
                onClick={confirmationModal.onCancel}
              >
                Cancel
              </button>
              <button
                type="button"
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
