// AdminPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Shield,
  Mail,
  Calendar,
  Search,
  Filter,
  Download,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  UserCheck,
} from 'lucide-react';
import Navbar from '../components/ui/Navbar.tsx';
import LeftNav from '../components/ui/LeftNav.tsx';
import '../styles/AdminPage.scss';
import { API_ENDPOINTS } from '../config';

interface LinguistApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  appliedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: ApplicationDocument[];
  languages: string[];
}

interface ApplicationDocument {
  id: string;
  name: string;
  type: 'cv' | 'certificate' | 'id' | 'research';
  size: number;
  uploadedAt: string;
  url: string;
}

interface SystemUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  profile_pic_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  account_locked: boolean;
  created_at: string;
  last_login: string | null;
}

// Add interface for user response
interface UserResponse {
  role: string;
  // Add other properties as needed
}

const AdminPage: React.FC = () => {
  const [allApplications, setAllApplications] = useState<LinguistApplication[]>(
    [],
  );
  const [displayedApplications, setDisplayedApplications] = useState<
    LinguistApplication[]
  >([]);
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<SystemUser[]>([]);
  const [currentView, setCurrentView] = useState<'applications' | 'users'>(
    'applications',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('admin');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedApplication, setSelectedApplication] =
    useState<LinguistApplication | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const pageSize = 5; // Set to 5 entries per page for better scrolling demonstration

  const applyFiltersAndPagination = useCallback(() => {
    if (currentView === 'applications') {
      // Filter applications based on search and status
      const filteredApplications = allApplications.filter((app) => {
        const matchesSearch =
          app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      // Calculate total pages
      const totalPages = Math.ceil(filteredApplications.length / pageSize);
      setTotalPages(totalPages);

      // Reset to page 1 if current page is out of bounds
      const validCurrentPage = currentPage > totalPages ? 1 : currentPage;
      if (validCurrentPage !== currentPage) {
        setCurrentPage(validCurrentPage);
        return;
      }

      // Apply pagination
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedApplications = filteredApplications.slice(
        startIndex,
        endIndex,
      );

      setDisplayedApplications(paginatedApplications);
    } else {
      // Filter users based on search
      const filteredUsers = allUsers.filter((user) => {
        const matchesSearch =
          user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      });

      // Calculate total pages
      const totalPages = Math.ceil(filteredUsers.length / pageSize);
      setTotalPages(totalPages);

      // Reset to page 1 if current page is out of bounds
      const validCurrentPage = currentPage > totalPages ? 1 : currentPage;
      if (validCurrentPage !== currentPage) {
        setCurrentPage(validCurrentPage);
        return;
      }

      // Apply pagination
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      setDisplayedUsers(paginatedUsers);
    }
  }, [
    allApplications,
    allUsers,
    searchTerm,
    statusFilter,
    currentPage,
    pageSize,
    currentView,
  ]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored) setIsDarkMode(stored === 'false');
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const response = await fetch(API_ENDPOINTS.getAll, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const users = (await response.json()) as SystemUser[];
            setAllUsers(users);
          } else {
            console.error('Failed to fetch users:', response.statusText);
            setAllUsers([]);
          }
        } else {
          console.error('No access token found');
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setAllUsers([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [applyFiltersAndPagination]);

  // Reset pagination when switching views
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setStatusFilter('all');
  }, [currentView]);

  useEffect(() => {
    const checkAdminRole = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        const response = await fetch(API_ENDPOINTS.getMe, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setAuthError(
            `Error ${response.status.toString()}: ${response.statusText}`,
          );
          return;
        }

        const user = (await response.json()) as UserResponse;
        if (user.role !== 'admin') {
          setAuthError('Error 403: Forbidden - Admin access required');
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
        setAuthError('Error 500: Unable to verify admin access');
      }
    };

    void checkAdminRole();
  }, []);

  const handleApplicationAction = (applicationId: string, action: string) => {
    const application = allApplications.find((app) => app.id === applicationId);
    if (!application) return;

    switch (action) {
      case 'view':
        setSelectedApplication(application);
        setShowApplicationModal(true);
        break;
      case 'approve':
        setAllApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? {
                  ...app,
                  status: 'approved' as const,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: 'Current Admin',
                }
              : app,
          ),
        );
        break;
      case 'reject':
        setAllApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? {
                  ...app,
                  status: 'rejected' as const,
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: 'Current Admin',
                }
              : app,
          ),
        );
        break;
      default:
        console.log(`Action ${action} on application ${applicationId}`);
    }
  };

  const handleUserAction = async (
    userId: string,
    action: string,
  ): Promise<void> => {
    if (action === 'promote') {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('No access token found');
          return;
        }

        const response = await fetch(
          `${API_ENDPOINTS.updateUserRole(userId)}?new_role=admin`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.ok) {
          const result = (await response.json()) as { message: string };
          console.log('User promoted successfully:', result.message);

          setAllUsers((prev) =>
            prev.map((user) =>
              user.id === userId ? { ...user, role: 'admin' } : user,
            ),
          );
        } else {
          const errorData = (await response.json()) as { message?: string };
          console.error('Failed to promote user:', errorData);
        }
      } catch (error) {
        console.error('Failed to promote user:', error);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (sizeInMB: number) => {
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-pending';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={14} />;
      case 'rejected':
        return <XCircle size={14} />;
      case 'pending':
        return <Clock size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const getDocumentTypeIcon = () => {
    return <FileText size={16} />;
  };

  const getTotalFilteredCount = () => {
    if (currentView === 'applications') {
      return allApplications.filter((app) => {
        const matchesSearch =
          app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
      }).length;
    } else {
      return allUsers.filter((user) => {
        const matchesSearch =
          user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      }).length;
    }
  };

  if (authError) {
    return (
      <div
        className="error-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <h1 style={{ color: '#dc3545' }}>{authError}</h1>
        <button
          type="button"
          onClick={() => (window.location.href = '/Mavito/dashboard')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      className={`admin-page-fixed-background ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      <div className="admin-page-container">
        {isMobile ? (
          <Navbar />
        ) : (
          <LeftNav
            activeItem={activeMenuItem}
            setActiveItem={setActiveMenuItem}
          />
        )}

        <div className="admin-main-content">
          <div className="min-h-screen admin-page pt-16">
            <div className="admin-header">
              <div className="admin-header-content">
                <div className="admin-title-section">
                  <h1 className="admin-page-title">
                    <Shield className="admin-title-icon" />
                    {currentView === 'applications'
                      ? 'Linguist Applications'
                      : 'User Management'}
                  </h1>
                  <p className="admin-subtitle">
                    {currentView === 'applications'
                      ? 'Review and manage linguist role applications'
                      : 'Manage user accounts and admin privileges'}
                  </p>
                </div>

                <div className="admin-stats">
                  {/* View Toggle Buttons */}
                  <button
                    type="button"
                    className={`stat-card ${currentView === 'applications' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('applications');
                    }}
                    style={{
                      cursor: 'pointer',
                      border:
                        currentView === 'applications'
                          ? '2px solid #007bff'
                          : 'none',
                    }}
                  >
                    <FileText size={20} />
                    <span className="stat-number">
                      {allApplications.length}
                    </span>
                    <span className="stat-label">Applications</span>
                  </button>

                  <button
                    type="button"
                    className={`stat-card ${currentView === 'users' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('users');
                    }}
                    style={{
                      cursor: 'pointer',
                      border:
                        currentView === 'users' ? '2px solid #007bff' : 'none',
                    }}
                  >
                    <Users size={20} />
                    <span className="stat-number">{allUsers.length}</span>
                    <span className="stat-label">Users</span>
                  </button>

                  {currentView === 'applications' && (
                    <>
                      <div className="stat-card">
                        <Clock size={20} />
                        <span className="stat-number">
                          {
                            allApplications.filter(
                              (app) => app.status === 'pending',
                            ).length
                          }
                        </span>
                        <span className="stat-label">Pending Review</span>
                      </div>
                      <div className="stat-card">
                        <CheckCircle size={20} />
                        <span className="stat-number">
                          {
                            allApplications.filter(
                              (app) => app.status === 'approved',
                            ).length
                          }
                        </span>
                        <span className="stat-label">Approved</span>
                      </div>
                    </>
                  )}

                  {currentView === 'users' && (
                    <div className="stat-card">
                      <UserCheck size={20} />
                      <span className="stat-number">
                        {
                          allUsers.filter((user) => user.role === 'admin')
                            .length
                        }
                      </span>
                      <span className="stat-label">Admins</span>
                    </div>
                  )}

                  {/* Testing only */}
                  {/* <label>
                    Dark Mode
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={() => {
                        setIsDarkMode((prev) => !prev);
                      }}
                    />
                  </label> */}
                </div>
              </div>
            </div>

            <div className="admin-controls">
              <div className="search-and-filters">
                <div className="search-input-container">
                  <Search className="search-icon" size={20} />
                  <input
                    type="text"
                    placeholder={
                      currentView === 'applications'
                        ? 'Search applications by name or email...'
                        : 'Search users by name or email...'
                    }
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                    }}
                    className="search-input"
                  />
                </div>

                {currentView === 'applications' && (
                  <div className="filter-controls">
                    <div className="filter-group">
                      <Filter size={16} />
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                        }}
                        className="filter-select"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-content">
              {loading ? (
                <div className="loading-state">Loading data...</div>
              ) : (
                <div
                  className="applications-table-container"
                  style={{ height: '400px', overflowY: 'auto' }}
                >
                  {currentView === 'applications' ? (
                    <table className="applications-table">
                      <thead>
                        <tr>
                          <th>Applicant</th>
                          <th>Status</th>
                          <th>Applied</th>
                          <th>Languages</th>
                          <th>Documents</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedApplications.map((application) => (
                          <tr key={application.id} className="application-row">
                            <td className="applicant-info">
                              <div className="applicant-avatar">
                                <User size={20} />
                              </div>
                              <div className="applicant-details">
                                <div className="applicant-name">
                                  {application.applicantName}
                                </div>
                                <div
                                  className="applicant-email"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Mail
                                    size={14}
                                    style={{ marginRight: '4px' }}
                                  />
                                  {application.applicantEmail}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`status-badge ${getStatusColor(application.status)}`}
                              >
                                {getStatusIcon(application.status)}
                                {application.status}
                              </span>
                            </td>
                            <td className="date-cell">
                              <Calendar size={14} />
                              {formatDate(application.appliedAt)}
                            </td>
                            <td className="languages-cell">
                              <div className="languages-list">
                                {application.languages
                                  .slice(0, 3)
                                  .map((lang) => (
                                    <span key={lang} className="language-tag">
                                      {lang}
                                    </span>
                                  ))}
                                {application.languages.length > 3 && (
                                  <span className="language-more">
                                    +{application.languages.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="documents-cell">
                              <div className="documents-list">
                                {application.documents.map((doc) => (
                                  <button
                                    key={doc.id}
                                    type="button"
                                    className="document-item"
                                    title={`Download ${doc.name} (${formatFileSize(doc.size)})`}
                                  >
                                    {getDocumentTypeIcon()}
                                    <span className="document-name">
                                      {doc.name}
                                    </span>
                                    <Download size={12} />
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="actions-cell">
                              <div className="action-buttons">
                                <button
                                  type="button"
                                  className="action-button view-button"
                                  onClick={() => {
                                    handleApplicationAction(
                                      application.id,
                                      'view',
                                    );
                                  }}
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                                {application.status === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      className="action-button approve-button"
                                      onClick={() => {
                                        handleApplicationAction(
                                          application.id,
                                          'approve',
                                        );
                                      }}
                                      title="Approve Application"
                                    >
                                      <CheckCircle size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      className="action-button reject-button"
                                      onClick={() => {
                                        handleApplicationAction(
                                          application.id,
                                          'reject',
                                        );
                                      }}
                                      title="Reject Application"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="applications-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedUsers.map((user) => (
                          <tr key={user.id} className="application-row">
                            <td className="applicant-info">
                              <div className="applicant-avatar">
                                <User size={20} />
                              </div>
                              <div className="applicant-details">
                                <div className="applicant-name">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div
                                  className="applicant-email"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Mail
                                    size={14}
                                    style={{ marginRight: '4px' }}
                                  />
                                  {user.email}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`status-badge ${
                                  user.role === 'admin'
                                    ? 'status-approved'
                                    : 'status-pending'
                                }`}
                              >
                                {user.role === 'admin' ? (
                                  <Shield size={14} />
                                ) : (
                                  <User size={14} />
                                )}
                                {user.role}
                              </span>
                            </td>
                            <td className="date-cell">
                              <Calendar size={14} />
                              {formatDate(user.created_at)}
                            </td>
                            <td className="actions-cell">
                              <div className="action-buttons">
                                {user.role !== 'admin' && (
                                  <button
                                    type="button"
                                    className="action-button approve-button"
                                    onClick={() => {
                                      void handleUserAction(user.id, 'promote');
                                    }}
                                    title="Give Admin Privileges"
                                  >
                                    <UserCheck size={16} />
                                    Make Admin
                                  </button>
                                )}
                                {user.role === 'admin' && (
                                  <span className="admin-badge">
                                    <Shield size={14} />
                                    Admin
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {(currentView === 'applications'
                    ? displayedApplications
                    : displayedUsers
                  ).length === 0 && (
                    <div className="empty-state">
                      {currentView === 'applications' ? (
                        <FileText size={48} className="empty-icon" />
                      ) : (
                        <Users size={48} className="empty-icon" />
                      )}
                      <p>No {currentView} found</p>
                      <p className="empty-subtitle">
                        Try adjusting your search
                        {currentView === 'applications' ? ' or filters' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pagination-controls">
                <div className="pagination-info">
                  Showing {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, getTotalFilteredCount())} of{' '}
                  {getTotalFilteredCount()} entries
                </div>
                <div className="pagination-buttons">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => {
                      handlePageChange(currentPage - 1);
                    }}
                    className="pagination-button"
                  >
                    Previous
                  </button>
                  <span className="pagination-pages">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => {
                      handlePageChange(currentPage + 1);
                    }}
                    className="pagination-button"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Detail Modal */}
      {showApplicationModal && selectedApplication && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowApplicationModal(false);
          }}
        >
          <div
            className="application-modal"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="modal-header">
              <h2>Application Details</h2>
              <button
                type="button"
                className="close-button"
                onClick={() => {
                  setShowApplicationModal(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="applicant-section">
                <h3>{selectedApplication.applicantName}</h3>
                <p>{selectedApplication.applicantEmail}</p>
                <span
                  className={`status-badge ${getStatusColor(selectedApplication.status)}`}
                >
                  {getStatusIcon(selectedApplication.status)}
                  {selectedApplication.status}
                </span>
              </div>

              <div className="documents-section">
                <h4>Documents</h4>
                <div className="documents-grid">
                  {selectedApplication.documents.map((doc) => (
                    <div key={doc.id} className="document-card">
                      <div className="document-info">
                        {getDocumentTypeIcon()}
                        <div>
                          <div className="document-name">{doc.name}</div>
                          <div className="document-meta">
                            {formatFileSize(doc.size)} •{' '}
                            {formatDate(doc.uploadedAt)}
                          </div>
                        </div>
                      </div>
                      <button type="button" className="download-button">
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedApplication.status === 'pending' && (
              <div className="modal-actions">
                <button
                  type="button"
                  className="approve-button"
                  onClick={() => {
                    handleApplicationAction(selectedApplication.id, 'approve');
                    setShowApplicationModal(false);
                  }}
                >
                  <CheckCircle size={16} />
                  Approve Application
                </button>
                <button
                  type="button"
                  className="reject-button"
                  onClick={() => {
                    handleApplicationAction(selectedApplication.id, 'reject');
                    setShowApplicationModal(false);
                  }}
                >
                  <XCircle size={16} />
                  Reject Application
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
