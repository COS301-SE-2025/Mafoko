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
  BarChart3,
  TrendingUp,
  Archive,
} from 'lucide-react';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import '../styles/AnalyticsPage.scss';

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
      status: 'new',
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
      status: 'new',
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
      status: 'new',
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
    const newItems = feedbackData.filter(
      (item) => item.status === 'new',
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
      newItems,
      inProgress,
      resolved,
    };
  }, [feedbackData]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'suggestion':
        return <Lightbulb className="h-4 w-4" />;
      case 'complaint':
        return <AlertCircle className="h-4 w-4" />;
      case 'compliment':
        return <Heart className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'suggestion':
        return 'text-blue-600 bg-blue-50';
      case 'complaint':
        return 'text-red-600 bg-red-50';
      case 'compliment':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'text-orange-600 bg-orange-50';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50';
      case 'resolved':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
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

        <div
          className={`feedback-hub-content ${isMobile ? 'pt-16' : ''}`}
          style={{
            backgroundColor: 'var(--page-bg)',
            color: 'var(--text-color)',
            minHeight: '100vh',
            padding: isMobile ? '1rem' : '2rem',
          }}
        >
          {/* FeedbackHub Header */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '2rem',
              padding: '1rem 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <BarChart3
                style={{
                  height: '2rem',
                  width: '2rem',
                  color: '#3AB0FF',
                }}
              />
              <h1
                style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'var(--text-color)',
                  margin: 0,
                }}
              >
                FeedbackHub Admin
              </h1>
            </div>
            <p
              style={{
                color: 'var(--text-color-secondary)',
                fontSize: '1rem',
                margin: 0,
              }}
            >
              Manage customer feedback
            </p>
          </div>
          {/* Stats Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--text-color-secondary)',
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    Total Feedback
                  </p>
                  <p
                    style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: 'var(--text-color)',
                      margin: 0,
                    }}
                  >
                    {stats.total}
                  </p>
                </div>
                <MessageSquare
                  style={{
                    height: '2rem',
                    width: '2rem',
                    color: '#3AB0FF',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  color: '#10B981',
                }}
              >
                <TrendingUp
                  style={{
                    height: '1rem',
                    width: '1rem',
                    marginRight: '0.25rem',
                  }}
                />
                <span>+12% from last week</span>
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--text-color-secondary)',
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    Pending Review
                  </p>
                  <p
                    style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: 'var(--text-color)',
                      margin: 0,
                    }}
                  >
                    {stats.newItems}
                  </p>
                </div>
                <Clock
                  style={{
                    height: '2rem',
                    width: '2rem',
                    color: '#F59E0B',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '1rem',
                  fontSize: '0.875rem',
                  color: '#F59E0B',
                }}
              >
                <span>Needs attention</span>
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--text-color-secondary)',
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    In Progress
                  </p>
                  <p
                    style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: 'var(--text-color)',
                      margin: 0,
                    }}
                  >
                    {stats.inProgress}
                  </p>
                </div>
                <Eye
                  style={{
                    height: '2rem',
                    width: '2rem',
                    color: '#3B82F6',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '1rem',
                  fontSize: '0.875rem',
                  color: '#3B82F6',
                }}
              >
                <span>Being addressed</span>
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--color-border)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--text-color-secondary)',
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    Resolved
                  </p>
                  <p
                    style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: 'var(--text-color)',
                      margin: 0,
                    }}
                  >
                    {stats.resolved}
                  </p>
                </div>
                <CheckCircle
                  style={{
                    height: '2rem',
                    width: '2rem',
                    color: '#10B981',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '1rem',
                  fontSize: '0.875rem',
                  color: '#10B981',
                }}
              >
                <span>Successfully handled</span>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--color-border)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '1rem',
                alignItems: isMobile ? 'stretch' : 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Filter
                    style={{
                      height: '1rem',
                      width: '1rem',
                      color: 'var(--text-color-secondary)',
                    }}
                  />
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                    }}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      background: 'var(--bg-card)',
                      color: 'var(--text-color)',
                    }}
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
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-color)',
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Search
                  style={{
                    height: '1rem',
                    width: '1rem',
                    color: 'var(--text-color-secondary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search feedback..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-color)',
                    width: isMobile ? '100%' : '16rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
              gap: '1.5rem',
            }}
          >
            {/* Feedback List */}
            <div>
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div
                  style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <h2
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: 'var(--text-color)',
                      margin: 0,
                    }}
                  >
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
                      style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          isDarkMode
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.02)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          'transparent';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              padding: '0.5rem',
                              borderRadius: '50%',
                              backgroundColor: getTypeColor(
                                feedback.type,
                              ).includes('blue')
                                ? 'rgba(59, 130, 246, 0.1)'
                                : getTypeColor(feedback.type).includes('red')
                                  ? 'rgba(239, 68, 68, 0.1)'
                                  : 'rgba(34, 197, 94, 0.1)',
                              color: getTypeColor(feedback.type).includes(
                                'blue',
                              )
                                ? '#3B82F6'
                                : getTypeColor(feedback.type).includes('red')
                                  ? '#EF4444'
                                  : '#22C55E',
                            }}
                          >
                            {getTypeIcon(feedback.type)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  backgroundColor: getTypeColor(
                                    feedback.type,
                                  ).includes('blue')
                                    ? 'rgba(59, 130, 246, 0.1)'
                                    : getTypeColor(feedback.type).includes(
                                          'red',
                                        )
                                      ? 'rgba(239, 68, 68, 0.1)'
                                      : 'rgba(34, 197, 94, 0.1)',
                                  color: getTypeColor(feedback.type).includes(
                                    'blue',
                                  )
                                    ? '#3B82F6'
                                    : getTypeColor(feedback.type).includes(
                                          'red',
                                        )
                                      ? '#EF4444'
                                      : '#22C55E',
                                }}
                              >
                                {feedback.type.charAt(0).toUpperCase() +
                                  feedback.type.slice(1)}
                              </span>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  backgroundColor: getStatusColor(
                                    feedback.status,
                                  ).includes('orange')
                                    ? 'rgba(249, 115, 22, 0.1)'
                                    : getStatusColor(feedback.status).includes(
                                          'blue',
                                        )
                                      ? 'rgba(59, 130, 246, 0.1)'
                                      : 'rgba(34, 197, 94, 0.1)',
                                  color: getStatusColor(
                                    feedback.status,
                                  ).includes('orange')
                                    ? '#F97316'
                                    : getStatusColor(feedback.status).includes(
                                          'blue',
                                        )
                                      ? '#3B82F6'
                                      : '#22C55E',
                                }}
                              >
                                {feedback.status
                                  .replace('-', ' ')
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </span>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  backgroundColor: getPriorityColor(
                                    feedback.priority,
                                  ).includes('red')
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : getPriorityColor(
                                          feedback.priority,
                                        ).includes('yellow')
                                      ? 'rgba(245, 158, 11, 0.1)'
                                      : 'rgba(34, 197, 94, 0.1)',
                                  color: getPriorityColor(
                                    feedback.priority,
                                  ).includes('red')
                                    ? '#EF4444'
                                    : getPriorityColor(
                                          feedback.priority,
                                        ).includes('yellow')
                                      ? '#F59E0B'
                                      : '#22C55E',
                                }}
                              >
                                {feedback.priority.charAt(0).toUpperCase() +
                                  feedback.priority.slice(1)}{' '}
                                Priority
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-color)',
                                marginBottom: '0.5rem',
                                lineHeight: '1.4',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {feedback.message}
                            </p>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '0.75rem',
                                color: 'var(--text-color-secondary)',
                                gap: '1rem',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <User
                                  style={{
                                    height: '0.75rem',
                                    width: '0.75rem',
                                  }}
                                />
                                {feedback.name || 'Anonymous'}
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <Calendar
                                  style={{
                                    height: '0.75rem',
                                    width: '0.75rem',
                                  }}
                                />
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
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  position: isMobile ? 'static' : 'sticky',
                  top: isMobile ? 'auto' : '1.5rem',
                }}
              >
                {selectedFeedback ? (
                  <div style={{ padding: '1.5rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: 'var(--text-color)',
                          margin: 0,
                        }}
                      >
                        Feedback Details
                      </h3>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: getTypeColor(
                            selectedFeedback.type,
                          ).includes('blue')
                            ? 'rgba(59, 130, 246, 0.1)'
                            : getTypeColor(selectedFeedback.type).includes(
                                  'red',
                                )
                              ? 'rgba(239, 68, 68, 0.1)'
                              : 'rgba(34, 197, 94, 0.1)',
                          color: getTypeColor(selectedFeedback.type).includes(
                            'blue',
                          )
                            ? '#3B82F6'
                            : getTypeColor(selectedFeedback.type).includes(
                                  'red',
                                )
                              ? '#EF4444'
                              : '#22C55E',
                        }}
                      >
                        {selectedFeedback.type.charAt(0).toUpperCase() +
                          selectedFeedback.type.slice(1)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--text-color)',
                            display: 'block',
                            marginBottom: '0.25rem',
                          }}
                        >
                          Status
                        </label>
                        <select
                          value={selectedFeedback.status}
                          onChange={(e) => {
                            updateStatus(selectedFeedback.id, e.target.value);
                          }}
                          style={{
                            width: '100%',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.375rem',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            background: 'var(--bg-card)',
                            color: 'var(--text-color)',
                          }}
                        >
                          <option value="new">New</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--text-color)',
                            display: 'block',
                            marginBottom: '0.25rem',
                          }}
                        >
                          Message
                        </label>
                        <div
                          style={{
                            padding: '0.75rem',
                            backgroundColor: isDarkMode
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(0, 0, 0, 0.02)',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            color: 'var(--text-color)',
                            lineHeight: '1.5',
                          }}
                        >
                          {selectedFeedback.message}
                        </div>
                      </div>

                      <div>
                        <label
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--text-color)',
                            display: 'block',
                            marginBottom: '0.25rem',
                          }}
                        >
                          Submitted By
                        </label>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '0.875rem',
                              color: 'var(--text-color)',
                              gap: '0.5rem',
                            }}
                          >
                            <User
                              style={{
                                height: '1rem',
                                width: '1rem',
                                color: 'var(--text-color-secondary)',
                              }}
                            />
                            {selectedFeedback.name || 'Anonymous'}
                          </div>
                          {selectedFeedback.email && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '0.875rem',
                                color: 'var(--text-color)',
                                gap: '0.5rem',
                              }}
                            >
                              <Mail
                                style={{
                                  height: '1rem',
                                  width: '1rem',
                                  color: 'var(--text-color-secondary)',
                                }}
                              />
                              {selectedFeedback.email}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--text-color)',
                            display: 'block',
                            marginBottom: '0.25rem',
                          }}
                        >
                          Submitted On
                        </label>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            color: 'var(--text-color)',
                            gap: '0.5rem',
                          }}
                        >
                          <Calendar
                            style={{
                              height: '1rem',
                              width: '1rem',
                              color: 'var(--text-color-secondary)',
                            }}
                          />
                          {formatDate(selectedFeedback.date)}
                        </div>
                      </div>

                      <div
                        style={{
                          paddingTop: '1rem',
                          borderTop: '1px solid var(--color-border)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            updateStatus(selectedFeedback.id, 'resolved');
                          }}
                          style={{
                            width: '100%',
                            backgroundColor: '#3B82F6',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLElement
                            ).style.backgroundColor = '#2563EB';
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLElement
                            ).style.backgroundColor = '#3B82F6';
                          }}
                        >
                          Mark as Resolved
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '1.5rem',
                      textAlign: 'center',
                      color: 'var(--text-color-secondary)',
                    }}
                  >
                    <Archive
                      style={{
                        height: '3rem',
                        width: '3rem',
                        margin: '0 auto 1rem auto',
                        color: 'var(--text-color-muted)',
                      }}
                    />
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
