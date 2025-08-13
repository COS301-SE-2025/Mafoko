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
  TrendingUp,
  Archive,
} from 'lucide-react';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import '../styles/FeedbackHub.scss';

// Type for feedback object
interface Feedback {
  id: number;
  type: string;
  name: string;
  email: string;
  message: string;
  date: string;
  status: string;
  priority: string;
}

const AdminDashboard = () => {
  // Mock data - in a real app, this would come from your API
  const [feedbackData] = useState<Feedback[]>([
    {
      id: 1,
      type: 'suggestion',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      message:
        'It would be great if you could add a dark mode toggle to the application. Many users prefer dark themes, especially when working late hours.',
      date: '2025-08-10T14:30:00Z',
      status: 'Pending',
      priority: 'medium',
    },
    {
      id: 2,
      type: 'complaint',
      name: 'Mike Chen',
      email: 'mike.chen@email.com',
      message:
        "The checkout process is very slow and sometimes times out. I've experienced this issue multiple times over the past week.",
      date: '2025-08-10T09:15:00Z',
      status: 'in-progress',
      priority: 'high',
    },
    {
      id: 3,
      type: 'compliment',
      name: 'Emily Davis',
      email: 'emily.davis@gmail.com',
      message:
        "Absolutely love the new user interface! It's so much cleaner and easier to navigate. Great job to the design team!",
      date: '2025-08-09T16:45:00Z',
      status: 'resolved',
      priority: 'low',
    },
    {
      id: 4,
      type: 'suggestion',
      name: 'Anonymous',
      email: '',
      message:
        'Consider adding keyboard shortcuts for power users. This would significantly improve productivity.',
      date: '2025-08-09T11:20:00Z',
      status: 'Pending',
      priority: 'low',
    },
    {
      id: 5,
      type: 'complaint',
      name: 'Alex Rodriguez',
      email: 'alex.r@company.com',
      message:
        'Mobile app crashes when trying to upload large files. This is affecting my daily workflow.',
      date: '2025-08-08T13:10:00Z',
      status: 'Pending',
      priority: 'high',
    },
    {
      id: 6,
      type: 'compliment',
      name: 'Lisa Wang',
      email: 'lisa.wang@startup.io',
      message:
        'The customer support team was incredibly helpful and resolved my issue within hours. Excellent service!',
      date: '2025-08-08T10:30:00Z',
      status: 'resolved',
      priority: 'low',
    },
  ]);

  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null,
  );
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state for navigation
  const [activeMenuItem, setActiveMenuItem] = useState('feedbackhub');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Filter and search functionality
  const filteredFeedback = useMemo(() => {
    return feedbackData.filter((item) => {
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesStatus =
        filterStatus === 'all' || item.status === filterStatus;
      const matchesSearch =
        searchQuery === '' ||
        item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [feedbackData, filterType, filterStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = feedbackData.length;
    const suggestions = feedbackData.filter(
      (item) => item.type === 'suggestion',
    ).length;
    const complaints = feedbackData.filter(
      (item) => item.type === 'complaint',
    ).length;
    const compliments = feedbackData.filter(
      (item) => item.type === 'compliment',
    ).length;
    const PendingItems = feedbackData.filter(
      (item) => item.status === 'Pending',
    ).length;
    const inProgress = feedbackData.filter(
      (item) => item.status === 'in-progress',
    ).length;
    const resolved = feedbackData.filter(
      (item) => item.status === 'resolved',
    ).length;

    return {
      total,
      suggestions,
      complaints,
      compliments,
      PendingItems,
      inProgress,
      resolved,
    };
  }, [feedbackData]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'suggestion':
        return <Lightbulb className="h-4 w-4" color="#f2d001" />;
      case 'complaint':
        return <AlertCircle className="h-4 w-4" color="#f00a50" />;
      case 'compliment':
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

  const updateStatus = (id: number, newStatus: string) => {
    // In a real app, this would make an API call
    console.log(`Updating feedback ${id.toString()} status to ${newStatus}`);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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
                <TrendingUp className="stats-card-trend" />
                <span>+12% from last week</span>
              </div>
            </div>

            <div className="stats-card">
              <div className="stats-card-header">
                <div>
                  <p className="stats-card-title">Pending Review</p>
                  <p className="stats-card-value">{stats.PendingItems}</p>
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
                  <option value="Pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
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
                </div>
                <div>
                  {filteredFeedback.map((feedback) => (
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
                                className={`status-tag ${feedback.status.toLowerCase().replace(' ', '-')}`}
                              >
                                {feedback.status
                                  .replace('-', ' ')
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
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
                                {formatDate(feedback.date)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                            updateStatus(selectedFeedback.id, e.target.value);
                          }}
                          className="form-select"
                        >
                          <option value="Pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label className="form-label">Priority</label>
                        <select
                          value={selectedFeedback.priority}
                          onChange={(e) => {
                            // In a real app, this would update the priority in the backend
                            selectedFeedback.priority = e.target.value;
                            // Force update (since selectedFeedback is not state)
                            setSelectedFeedback({ ...selectedFeedback });
                          }}
                          className="form-select"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
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
                          {formatDate(selectedFeedback.date)}
                        </div>
                      </div>

                      <div className="feedback-detail-actions">
                        <button
                          type="button"
                          onClick={() => {
                            updateStatus(selectedFeedback.id, 'resolved');
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
