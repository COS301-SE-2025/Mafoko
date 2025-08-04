import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  Search,
  StickyNote,
  Save,
  X,
  BookOpen,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import { API_ENDPOINTS } from '../config';

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
  const [dataVersion, setDataVersion] = useState(0);
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

  // Initialize groups (will be populated from workspace groups)
  const [groups, setGroups] = useState<string[]>(['all', 'All Terms']);

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

  const showSuccess = (message: string) => { showNotification(message, 'success'); };
  const showError = (message: string) => { showNotification(message, 'error'); };
  const showInfo = (message: string) => { showNotification(message, 'info'); };

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
    console.log('[DEBUG AUTH] Current token:', localStorage.getItem('accessToken') ? 'Token exists' : 'No token found');
    
    // Check if bookmarks have changed since last workspace load
    const lastBookmarkChange = localStorage.getItem('bookmarksChanged');
    const lastWorkspaceLoad = localStorage.getItem('workspaceLastLoaded');
    
    if (lastBookmarkChange && (!lastWorkspaceLoad || lastBookmarkChange > lastWorkspaceLoad)) {
      console.log('[DEBUG INIT] Bookmarks changed since last load, will refresh');
    }
    
    void loadWorkspaceData();
  }, []);

  // Reload workspace data when page becomes visible (to catch changes from other pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[DEBUG REFRESH] Page became visible, checking for bookmark changes');
        
        // Check if bookmarks have changed since last visit
        const lastBookmarkChange = localStorage.getItem('bookmarksChanged');
        const lastWorkspaceLoad = localStorage.getItem('workspaceLastLoaded');
        
        if (lastBookmarkChange && (!lastWorkspaceLoad || lastBookmarkChange > lastWorkspaceLoad)) {
          console.log('[DEBUG REFRESH] Bookmarks changed, refreshing workspace data');
          void loadWorkspaceData();
          localStorage.setItem('workspaceLastLoaded', Date.now().toString());
        }
      }
    };

    // Add listener for when the tab becomes visible
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also add a focus listener as a backup
    const handleFocus = () => {
      console.log('[DEBUG REFRESH] Window focused, checking for bookmark changes');
      
      // Check if bookmarks have changed since last visit
      const lastBookmarkChange = localStorage.getItem('bookmarksChanged');
      const lastWorkspaceLoad = localStorage.getItem('workspaceLastLoaded');
      
      if (lastBookmarkChange && (!lastWorkspaceLoad || lastBookmarkChange > lastWorkspaceLoad)) {
        console.log('[DEBUG REFRESH] Bookmarks changed, refreshing workspace data');
        void loadWorkspaceData();
        localStorage.setItem('workspaceLastLoaded', Date.now().toString());
      }
    };
    window.addEventListener('focus', handleFocus);

    // Listen for bookmark changes from other parts of the app
    const handleBookmarkChange = (event: CustomEvent<{action?: string; name?: string}>) => {
      console.log('🚨 [NUCLEAR WORKSPACE DEBUG] BOOKMARK CHANGE EVENT RECEIVED!');
      console.log('🚨 [NUCLEAR WORKSPACE DEBUG] Event detail:', event.detail);
      console.log('🚨 [NUCLEAR WORKSPACE DEBUG] Event type:', event.type);
      console.log('🚨 [NUCLEAR WORKSPACE DEBUG] Current time:', new Date().toISOString());
      
      const action = event.detail.action ?? 'unknown';
      const name = event.detail.name ?? 'unknown';
      console.log(`WORKSPACE: Received bookmark change event! Action: ${action}, Name: ${name}`);
      
      console.log('🔄 [NUCLEAR WORKSPACE DEBUG] About to reload workspace data...');
      void loadWorkspaceData();
      
      const timestamp = Date.now().toString();
      localStorage.setItem('workspaceLastLoaded', timestamp);
      console.log('💾 [NUCLEAR WORKSPACE DEBUG] Set workspaceLastLoaded to:', timestamp);
    };
    window.addEventListener('bookmarkChanged', handleBookmarkChange as EventListener);
    console.log('👂 [NUCLEAR WORKSPACE DEBUG] Added bookmark change event listener!');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('bookmarkChanged', handleBookmarkChange as EventListener);
    };
  }, []);

  // Function to load all workspace data
  const loadWorkspaceData = async (): Promise<void> => {
    console.log('🔄 [NUCLEAR WORKSPACE DEBUG] loadWorkspaceData() CALLED!');
    console.log('🔄 [NUCLEAR WORKSPACE DEBUG] Current time:', new Date().toISOString());
    
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
      console.log('📡 [NUCLEAR WORKSPACE DEBUG] Bookmarks URL:', API_ENDPOINTS.getBookmarks);
      
      // Fetch bookmarks (terms and glossaries)
      const bookmarksResponse = await fetch(API_ENDPOINTS.getBookmarks, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('📡 [NUCLEAR WORKSPACE DEBUG] Bookmarks response status:', bookmarksResponse.status);
      console.log('📡 [NUCLEAR WORKSPACE DEBUG] Bookmarks response ok:', bookmarksResponse.ok);
      
      if (!bookmarksResponse.ok) {
        throw new Error(`Failed to fetch bookmarks: ${bookmarksResponse.status.toString()}`);
      }
      
      const bookmarksData = await bookmarksResponse.json() as {
        terms?: BookmarkedTerm[];
        glossaries?: BookmarkedGlossary[];
      };
      console.log('📊 [NUCLEAR WORKSPACE DEBUG] Bookmarks data received:', bookmarksData);
      console.log('📊 [NUCLEAR WORKSPACE DEBUG] Terms count:', (bookmarksData.terms?.length || 0).toString());
      console.log('📊 [NUCLEAR WORKSPACE DEBUG] Glossaries count:', (bookmarksData.glossaries?.length || 0).toString());
      
      setSavedTerms(bookmarksData.terms || []);
      setBookmarkedGlossaries(bookmarksData.glossaries || []);
      
      console.log('✅ [NUCLEAR WORKSPACE DEBUG] Successfully updated workspace state!');

      // Fetch workspace groups
      const groupsResponse = await fetch(API_ENDPOINTS.getUserGroups, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!groupsResponse.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const groupsData = await groupsResponse.json() as WorkspaceGroup[];
      console.log('📊 [NUCLEAR WORKSPACE DEBUG] Groups data received:', groupsData);
      console.log('📊 [NUCLEAR WORKSPACE DEBUG] Groups count:', groupsData.length.toString());
      
      setWorkspaceGroups(groupsData);

      // Update groups list from workspace groups
      const groupNames = [
        'all',
        'All Terms',
        ...groupsData.map((group: WorkspaceGroup) => group.name),
      ];
      setGroups(groupNames);

      console.log('Workspace data loaded successfully');
      
      // Mark that workspace data has been loaded
      localStorage.setItem('workspaceLastLoaded', Date.now().toString());
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
          bookmark_id: bookmarkId,  // This is already the correct bookmark ID
          notes: noteText.trim(),  // Changed back to 'notes' as per the correct schema
          bookmark_type: 'term'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update bookmark note failed:', response.status, errorText);
        throw new Error(`Failed to update bookmark note: ${response.status.toString()} ${errorText}`);
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
      const response = await fetch(API_ENDPOINTS.unbookmarkTerm(termToDelete.term_id), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      window.dispatchEvent(new CustomEvent('bookmarkChanged', { 
        detail: { type: 'glossary', action: 'unbookmark', name: domain } 
      }));

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
          const groupToDelete = workspaceGroups.find(g => g.name === groupName);
          if (groupToDelete) {
            const response = await fetch(API_ENDPOINTS.deleteGroup(groupToDelete.id), {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              throw new Error(`Failed to delete group: ${groupToDelete.name}`);
            }
          }
        }

        // Refresh workspace data to reflect the changes
        await loadWorkspaceData();
        showSuccess(`Successfully deleted ${selectedGroupsForDeletion.length.toString()} group(s)!`);

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
      () => { void deleteAction(); }
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
          description: `Group for organizing terms: ${trimmedName}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      const newGroup = await response.json() as WorkspaceGroup;

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

    const token = localStorage.getItem('accessToken');
    if (!token) {
      showError('Please log in to add terms to groups.');
      return;
    }

    try {
      setLoading(true);

      // Add terms to group via API
      const response = await fetch(API_ENDPOINTS.addTermsToGroup(createdGroupId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          term_ids: selectedTermIds
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add terms to group');
      }

      const result = await response.json() as {
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
        showSuccess(`Successfully added ${result.added_terms.length.toString()} term(s) to the group!`);
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

  const filteredTerms = savedTerms.filter((bookmarkedTerm) => {
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch =
      bookmarkedTerm.term.toLowerCase().includes(searchLower) ||
      bookmarkedTerm.definition.toLowerCase().includes(searchLower) ||
      (bookmarkedTerm.notes && bookmarkedTerm.notes.toLowerCase().includes(searchLower));

    return matchesSearch;
  });

  // Group terms by their group property
  const groupedTerms = useMemo(() => {
    // Create the grouping function inside useMemo to capture current workspaceGroups
    const getGroupForTerm = (termId: string): string => {
      console.log(`🔍 [GROUP DEBUG] Looking for group for term: ${termId}`);
      console.log(`🔍 [GROUP DEBUG] Available workspace groups:`, workspaceGroups.map(g => ({ name: g.name, items: (g.items?.length || 0).toString() })));
      
      for (const group of workspaceGroups) {
        const items = group.items || [];
        console.log(`🔍 [GROUP DEBUG] Checking group "${group.name}" with ${items.length.toString()} items`);
        
        for (const item of items) {
          const itemTermIdStr = item.term_id.toString();
          const termIdStr = termId.toString();
          const match = item.item_type === 'term' && itemTermIdStr === termIdStr;
          console.log(`🔍 [GROUP DEBUG] Comparing item ${itemTermIdStr} with term ${termIdStr}, match: ${match.toString()}`);
          
          if (match) {
            console.log(`✅ [GROUP DEBUG] Found term ${termId} in group "${group.name}"`);
            return group.name;
          }
        }
      }
      console.log(`❌ [GROUP DEBUG] Term ${termId} not found in any group, defaulting to "All Terms"`);
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
      result[groupName] = [];
    });

    // Categorize each term using the local function
    filteredTerms.forEach((term) => {
      const groupName = getGroupForTerm(term.term_id);
      result[groupName].push(term);
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
                                  // Handle view glossary action
                                  console.log('View glossary:', bookmark.domain);
                                  // Navigate to glossary page with selected glossary
                                  void navigate('/glossary', { 
                                    state: { 
                                      selectedGlossaryName: bookmark.domain 
                                    } 
                                  });
                                }}
                                className="create-new-btn"
                                title="View glossary"
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
                onClick={() => { void handleCreateNewGroup(); }}
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
                      onClick={() => { handleTermSelection(term.term_id); }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTermIds.includes(term.term_id)}
                        onChange={() => { handleTermSelection(term.term_id); }}
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
                onClick={() => { void handleAddTermsToGroup(); }}
                disabled={selectedTermIds.length === 0 || loading}
                className={`create-btn ${selectedTermIds.length === 0 || loading ? 'disabled' : ''}`}
              >
                <Plus className="plus-icon" />
                {loading ? 'Adding...' : `Add ${selectedTermIds.length.toString()} Term(s)`}
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
