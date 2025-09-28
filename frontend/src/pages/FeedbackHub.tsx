import { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  Lightbulb,
  AlertCircle,
  Heart,
  Filter,
  Search,
  Calendar,
  User,
  Mail,
  Eye,
  CheckCircle,
  Clock,
  Archive,
  RefreshCw,
} from 'lucide-react';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { AdminErrorBoundary } from '../components/AdminErrorBoundary';
import { API_ENDPOINTS } from '../config';
import {
  FeedbackAdmin,
  FeedbackStats,
  FeedbackType,
  FeedbackStatus,
  FeedbackPriority,
  FeedbackUpdate,
} from '../types/feedback';
import { addPendingFeedbackUpdate } from '../utils/indexedDB';
import '../styles/FeedbackHub.scss';

const AdminDashboard = () => {
  const { authError, isLoading } = useAdminAuth();

  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL LOGIC
  // Real API state
  const [feedbackData, setFeedbackData] = useState<FeedbackAdmin[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(
    null,
  );
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const [selectedFeedback, setSelectedFeedback] =
    useState<FeedbackAdmin | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // UI state for navigation
  const [activeMenuItem, setActiveMenuItem] = useState('feedbackhub');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { isDarkMode } = useDarkMode();

  // API Functions
  const fetchFeedbackData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setFeedbackError(null);

      // Fetch all feedback for admin
      const feedbackResponse = await fetch(API_ENDPOINTS.getAllFeedback, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!feedbackResponse.ok) {
        throw new Error(
          `Failed to fetch feedback: ${String(feedbackResponse.status)}`,
        );
      }

      const feedbackList = (await feedbackResponse.json()) as FeedbackAdmin[];
      setFeedbackData(feedbackList);

      // Fetch feedback statistics
      const statsResponse = await fetch(API_ENDPOINTS.getFeedbackStats, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (statsResponse.ok) {
        const stats = (await statsResponse.json()) as FeedbackStats;
        setFeedbackStats(stats);
      }
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      setFeedbackError(
        error instanceof Error ? error.message : 'Failed to load feedback data',
      );
    }
  };

  const updateFeedbackStatus = async (
    feedbackId: string,
    updates: FeedbackUpdate,
  ) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(API_ENDPOINTS.updateFeedback(feedbackId), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update feedback: ${String(response.status)}`,
        );
      }

      // Refresh data after update
      await fetchFeedbackData();
    } catch (error) {
      console.error('Error updating feedback:', error);

      // Check if this is a network error (offline)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update feedback';
      if (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
        errorMessage.includes('ERR_NETWORK') ||
        !navigator.onLine
      ) {
        // Queue the update for offline sync
        await addPendingFeedbackUpdate({
          id: crypto.randomUUID(),
          feedbackId,
          updates,
          token,
          timestamp: Date.now(),
        });

        // Register background sync
        if (
          'serviceWorker' in navigator &&
          'sync' in window.ServiceWorkerRegistration.prototype
        ) {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('sync-feedback-updates');
          } catch (syncError) {
            console.error(
              'Failed to register background sync for feedback updates:',
              syncError,
            );
          }
        }

        setFeedbackError(
          "You are offline. Your changes have been saved and will sync when you're back online.",
        );

        // Update local state optimistically
        setFeedbackData((prevData) =>
          prevData.map((item) =>
            item.id === feedbackId ? { ...item, ...updates } : item,
          ),
        );

        // Update selected feedback if it's the one being modified
        if (selectedFeedback && selectedFeedback.id === feedbackId) {
          setSelectedFeedback((prev) =>
            prev ? { ...prev, ...updates } : null,
          );
        }
      } else {
        setFeedbackError(errorMessage);
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch data when component mounts and auth is successful
  useEffect(() => {
    if (!isLoading && !authError) {
      void fetchFeedbackData();
    }
  }, [isLoading, authError]);

  // Filter and search functionality
  const filteredFeedback = useMemo(() => {
    return feedbackData.filter((item) => {
      const matchesType =
        filterType === 'all' || item.type === (filterType as FeedbackType);
      const matchesStatus =
        filterStatus === 'all' ||
        item.status === (filterStatus as FeedbackStatus);
      const matchesPriority =
        filterPriority === 'all' ||
        item.priority === (filterPriority as FeedbackPriority);
      const matchesSearch =
        searchQuery === '' ||
        item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.name &&
          item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.email &&
          item.email.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesType && matchesStatus && matchesPriority && matchesSearch;
    });
  }, [feedbackData, filterType, filterStatus, filterPriority, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterStatus, filterPriority, searchQuery]);

  // Use API stats if available, otherwise calculate from local data
  const stats = useMemo(() => {
    const inProgress = feedbackData.filter(
      (item) => item.status === FeedbackStatus.IN_PROGRESS,
    ).length;
    const closed = feedbackData.filter(
      (item) => item.status === FeedbackStatus.CLOSED,
    ).length;

    if (feedbackStats) {
      return {
        total: feedbackStats.total_feedback,
        suggestions: feedbackStats.by_type[FeedbackType.SUGGESTION] || 0,
        complaints: feedbackStats.by_type[FeedbackType.COMPLAINT] || 0,
        compliments: feedbackStats.by_type[FeedbackType.COMPLIMENT] || 0,
        openItems: feedbackStats.open_feedback,
        inProgress, // Use local calculation
        resolved: feedbackStats.resolved_feedback,
        closed, // Use local calculation
      };
    }

    // Fallback to local calculation
    const total = feedbackData.length;
    const suggestions = feedbackData.filter(
      (item) => item.type === FeedbackType.SUGGESTION,
    ).length;
    const complaints = feedbackData.filter(
      (item) => item.type === FeedbackType.COMPLAINT,
    ).length;
    const compliments = feedbackData.filter(
      (item) => item.type === FeedbackType.COMPLIMENT,
    ).length;
    const openItems = feedbackData.filter(
      (item) => item.status === FeedbackStatus.OPEN,
    ).length;
    const resolved = feedbackData.filter(
      (item) => item.status === FeedbackStatus.RESOLVED,
    ).length;

    return {
      total,
      suggestions,
      complaints,
      compliments,
      openItems,
      inProgress,
      resolved,
      closed,
    };
  }, [feedbackData, feedbackStats]);

  const getTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.SUGGESTION:
        return <Lightbulb className="h-4 w-4" color="#f2d001" />;
      case FeedbackType.COMPLAINT:
        return <AlertCircle className="h-4 w-4" color="#f00a50" />;
      case FeedbackType.COMPLIMENT:
        return <Heart className="h-4 w-4" color="#00ceaf" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const updateStatus = (id: string, newStatus: FeedbackStatus) => {
    void updateFeedbackStatus(id, { status: newStatus });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
        }}
      >
        Loading admin authentication...
      </div>
    );
  }

  // Show error if not admin
  if (authError) {
    return <AdminErrorBoundary authError={authError} />;
  }

  return (
    <div
      className={`dashboard-container ${isMobileMenuOpen ? 'mobile-menu-is-open' : ''} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
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
          <div className="top-bar feedback-top-bar">
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

        <div className={`feedback-hub-content${isMobile ? ' pt-16' : ''}`}>
          {/* Error Display */}
          {feedbackError && (
            <div
              className="feedback-error-banner"
              style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '20px',
                border: '1px solid #f5c6cb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <AlertCircle size={16} />
                <span>{feedbackError}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFeedbackError(null);
                  void fetchFeedbackData();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#721c24',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="stats-cards">
            <div className="stats-card">
              <div className="stats-card-header">
                <div>
                  <p className="stats-card-title">Total Feedback</p>
                  <p className="stats-card-value">{stats.total}</p>
                </div>
                <MessageSquare className="stats-card-icon" />
              </div>
              <div className="stats-card-footer">
                <span>All feedback submissions</span>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-card-header">
                <div>
                  <p className="stats-card-title">Pending Review</p>
                  <p className="stats-card-value">{stats.openItems}</p>
                </div>
                <Clock className="stats-card-icon" />
              </div>
              <div className="stats-card-footer">
                <span>Needs attention</span>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-card-header">
                <div>
                  <p className="stats-card-title">In Progress</p>
                  <p className="stats-card-value">{stats.inProgress}</p>
                </div>
                <Eye className="stats-card-icon" />
              </div>
              <div className="stats-card-footer">
                <span>Being addressed</span>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-card-header">
                <div>
                  <p className="stats-card-title">Resolved</p>
                  <p className="stats-card-value">{stats.resolved}</p>
                </div>
                <CheckCircle className="stats-card-icon" />
              </div>
              <div className="stats-card-footer">
                <span>Successfully handled</span>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-card-header">
                <div>
                  <p className="stats-card-title">Closed</p>
                  <p className="stats-card-value">{stats.closed}</p>
                </div>
                <Archive className="stats-card-icon" />
              </div>
              <div className="stats-card-footer">
                <span>Archived items</span>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="filters-search">
            <div className={`filters-container ${isMobile ? 'mobile' : ''}`}>
              <div className={`filters-left ${isMobile ? 'mobile' : ''}`}>
                <div className="filter-group">
                  <Filter className="filter-icon" />
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                    }}
                    className="filter-select"
                  >
                    <option value="all">All Types</option>
                    <option value="suggestion">Suggestions</option>
                    <option value="complaint">Complaints</option>
                    <option value="compliment">Compliments</option>
                  </select>
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                  }}
                  className="filter-select"
                >
                  <option value="all">All Statuses</option>
                  <option value={FeedbackStatus.OPEN}>Open</option>
                  <option value={FeedbackStatus.IN_PROGRESS}>
                    In Progress
                  </option>
                  <option value={FeedbackStatus.RESOLVED}>Resolved</option>
                  <option value={FeedbackStatus.CLOSED}>Closed</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => {
                    setFilterPriority(e.target.value);
                  }}
                  className="filter-select"
                >
                  <option value="all">All Priorities</option>
                  <option value={FeedbackPriority.CRITICAL}>Critical</option>
                  <option value={FeedbackPriority.HIGH}>High</option>
                  <option value={FeedbackPriority.MEDIUM}>Medium</option>
                  <option value={FeedbackPriority.LOW}>Low</option>
                </select>
              </div>

              <div className="search-group">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search feedback..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  className={`search-input ${isMobile ? 'mobile' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className={`main-grid ${isMobile ? 'mobile' : ''}`}>
            {/* Feedback List */}
            <div>
              <div className="feedback-list-panel">
                <div className="feedback-list-header">
                  <h2 className="feedback-list-title">
                    Feedback Items ({filteredFeedback.length})
                  </h2>
                  <div className="pagination-info">
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, filteredFeedback.length)} of{' '}
                    {filteredFeedback.length}
                  </div>
                </div>
                <div className="feedback-list-container">
                  {paginatedFeedback.map((feedback) => (
                    <div
                      key={feedback.id}
                      onClick={() => {
                        setSelectedFeedback(feedback);
                      }}
                      className={`feedback-list-item ${isDarkMode ? 'dark-mode' : ''}`}
                    >
                      <div className="feedback-list-item-layout">
                        <div className="feedback-list-item-main">
                          <div
                            className={`feedback-icon-container ${feedback.type}`}
                          >
                            {getTypeIcon(feedback.type)}
                          </div>
                          <div className="feedback-list-item-body">
                            <div className="feedback-list-item-tags">
                              <span
                                className={`feedback-list-item-tag ${feedback.type}`}
                              >
                                {feedback.type.charAt(0).toUpperCase() +
                                  feedback.type.slice(1)}
                              </span>
                              <span
                                className={`status-tag ${feedback.status.replace('_', '-')}`}
                              >
                                {feedback.status.charAt(0).toUpperCase() +
                                  feedback.status.slice(1).replace('_', ' ')}
                              </span>
                              <span
                                className={`priority-tag ${feedback.priority}`}
                              >
                                {feedback.priority.charAt(0).toUpperCase() +
                                  feedback.priority.slice(1)}{' '}
                                Priority
                              </span>
                            </div>
                            <p className="feedback-message">
                              {feedback.message}
                            </p>
                            <div className="feedback-meta">
                              <div className="meta-item">
                                <User className="meta-icon" />
                                {feedback.name || 'Anonymous'}
                              </div>
                              <div className="meta-item">
                                <Calendar className="meta-icon" />
                                {formatDate(feedback.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage(currentPage - 1);
                      }}
                    >
                      Previous
                    </button>

                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            type="button"
                            key={page}
                            className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                            onClick={() => {
                              setCurrentPage(page);
                            }}
                          >
                            {page}
                          </button>
                        ),
                      )}
                    </div>

                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage(currentPage + 1);
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Detail Panel */}
            <div>
              <div
                className={`feedback-detail-panel ${isMobile ? 'mobile' : ''}`}
              >
                {selectedFeedback ? (
                  <div className="feedback-detail-content">
                    <div className="feedback-detail-header">
                      <h3 className="feedback-detail-title">
                        Feedback Details
                      </h3>
                      <span
                        className={`feedback-detail-tag ${selectedFeedback.type}`}
                      >
                        {selectedFeedback.type.charAt(0).toUpperCase() +
                          selectedFeedback.type.slice(1)}
                      </span>
                    </div>

                    <div className="feedback-detail-fields">
                      <div className="form-field">
                        <label className="form-label">Status</label>
                        <select
                          value={selectedFeedback.status}
                          onChange={(e) => {
                            updateStatus(
                              selectedFeedback.id,
                              e.target.value as FeedbackStatus,
                            );
                          }}
                          className="form-select"
                        >
                          <option value={FeedbackStatus.OPEN}>Open</option>
                          <option value={FeedbackStatus.IN_PROGRESS}>
                            In Progress
                          </option>
                          <option value={FeedbackStatus.RESOLVED}>
                            Resolved
                          </option>
                          <option value={FeedbackStatus.CLOSED}>Closed</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label className="form-label">Priority</label>
                        <select
                          value={selectedFeedback.priority}
                          onChange={(e) => {
                            void updateFeedbackStatus(selectedFeedback.id, {
                              priority: e.target.value as FeedbackPriority,
                            });
                          }}
                          className="form-select"
                        >
                          <option value={FeedbackPriority.CRITICAL}>
                            Critical
                          </option>
                          <option value={FeedbackPriority.HIGH}>High</option>
                          <option value={FeedbackPriority.MEDIUM}>
                            Medium
                          </option>
                          <option value={FeedbackPriority.LOW}>Low</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label className="form-label">Message</label>
                        <div
                          className={`message-display ${isDarkMode ? 'dark' : 'light'}`}
                        >
                          {selectedFeedback.message}
                        </div>
                      </div>

                      <div className="form-field">
                        <label className="form-label">Submitted By</label>
                        <div className="user-info">
                          <div className="user-detail">
                            <User className="detail-icon" />
                            {selectedFeedback.name || 'Anonymous'}
                          </div>
                          {selectedFeedback.email && (
                            <div className="user-detail">
                              <Mail className="detail-icon" />
                              {selectedFeedback.email}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="form-field">
                        <label className="form-label">Submitted On</label>
                        <div className="date-display">
                          <Calendar className="detail-icon" />
                          {formatDate(selectedFeedback.created_at)}
                        </div>
                      </div>

                      <div className="feedback-detail-actions">
                        <button
                          type="button"
                          onClick={() => {
                            updateStatus(
                              selectedFeedback.id,
                              FeedbackStatus.RESOLVED,
                            );
                          }}
                          className="action-button"
                        >
                          Mark as Resolved
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="feedback-detail-empty">
                    <Archive className="feedback-detail-empty-icon" />
                    <p style={{ margin: 0 }}>
                      Select a feedback item to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
