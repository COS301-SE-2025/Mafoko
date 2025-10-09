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
  CheckCircle,
  XCircle,
  Clock,
  Users,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import Navbar from '../components/ui/Navbar.tsx';
import LeftNav from '../components/ui/LeftNav.tsx';
import { useDarkMode } from '../components/ui/DarkModeComponent.tsx';
import '../styles/AdminPage.scss';
import { API_ENDPOINTS } from '../config';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { AdminErrorBoundary } from '../components/AdminErrorBoundary';

interface LinguistApplicationWithUserRead {
  google_scholar_url: string;
  research_papers_gcs_keys: string[];
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  user: {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    profile_pic_url: string;
    id: string;
    is_active: boolean;
    is_verified: boolean;
    account_locked: boolean;
    created_at: string;
    last_login: string | null;
  };
}

interface ApplicationDocument {
  id: string;
  name: string;
  type: 'cv' | 'certificate' | 'id' | 'research';
  size: number;
  uploadedAt: string;
  url: string;
  gcsKey?: string;
}

interface UserUpload {
  gcs_key: string;
  filename: string;
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

const AdminPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const [allApplications, setAllApplications] = useState<
    LinguistApplicationWithUserRead[]
  >([]);

  const [displayedApplications, setDisplayedApplications] = useState<
    LinguistApplicationWithUserRead[]
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
  const [documentsLoading, setDocumentsLoading] = useState<
    Record<string, boolean>
  >({});
  const [activeMenuItem, setActiveMenuItem] = useState('admin');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { authError, isLoading } = useAdminAuth();
  const pageSize = 5;

  const applyFiltersAndPagination = useCallback(() => {
    if (currentView === 'applications') {
      // Filter applications based on search and status
      const filteredApplications = allApplications.filter((app) => {
        const applicantName = `${app.user.first_name} ${app.user.last_name}`;
        const matchesSearch =
          applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      // Calculate total pages
      const totalPages = Math.ceil(filteredApplications.length / pageSize);
      setTotalPages(totalPages);

      // Fix page bounds checking
      let validCurrentPage = currentPage;
      if (currentPage > totalPages && totalPages > 0) {
        validCurrentPage = 1;
        setCurrentPage(1);
      } else if (currentPage < 1) {
        validCurrentPage = 1;
        setCurrentPage(1);
      }

      // Apply pagination with the valid page
      const startIndex = (validCurrentPage - 1) * pageSize;
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

      // Fix page bounds checking
      let validCurrentPage = currentPage;
      if (currentPage > totalPages && totalPages > 0) {
        validCurrentPage = 1;
        setCurrentPage(1);
      } else if (currentPage < 1) {
        validCurrentPage = 1;
        setCurrentPage(1);
      }

      // Apply pagination with the valid page
      const startIndex = (validCurrentPage - 1) * pageSize;
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

  const fetchUserDocuments = async (
    userId: string,
    token: string,
  ): Promise<ApplicationDocument[]> => {
    try {
      const uploadsResponse = await fetch(
        API_ENDPOINTS.getUserUploads(userId),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (uploadsResponse.ok) {
        const uploads = (await uploadsResponse.json()) as UserUpload[];

        const documents: ApplicationDocument[] = await Promise.all(
          uploads.map(async (upload, index) => {
            // Get signed download URL
            let downloadUrl = '';
            try {
              const downloadResponse = await fetch(
                API_ENDPOINTS.getSignedDownloadUrl(upload.gcs_key),
                {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              if (downloadResponse.ok) {
                // Backend returns plain string, not JSON
                downloadUrl = await downloadResponse.text();
              }
            } catch (error) {
              console.error(
                'Failed to get download URL for',
                upload.gcs_key,
                error,
              );
            }

            // Determine document type based on filename
            const getDocumentType = (
              filename: string | undefined,
            ): 'cv' | 'certificate' | 'id' | 'research' => {
              if (!filename) return 'research';
              const lower = filename.toLowerCase();
              if (lower.includes('cv') || lower.includes('resume')) return 'cv';
              if (lower.includes('cert') || lower.includes('certificate'))
                return 'certificate';
              if (lower.includes('id') || lower.includes('identity'))
                return 'id';
              return 'research';
            };

            return {
              id: `doc-${userId}-${index.toString()}`,
              name: upload.filename,
              type: getDocumentType(upload.filename),
              size: 0,
              uploadedAt: new Date().toISOString(),
              url: downloadUrl,
              gcsKey: upload.gcs_key,
            };
          }),
        );

        return documents;
      } else {
        console.error(
          `Failed to fetch uploads for user ${userId}:`,
          uploadsResponse.statusText,
        );
        return [];
      }
    } catch (error) {
      console.error(`Error fetching documents for user ${userId}:`, error);
      return [];
    }
  };

  const fetchDocumentsForUser = useCallback(async (userId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return [];

    setDocumentsLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const documents = await fetchUserDocuments(userId, token);

      setAllApplications((prev) =>
        prev.map((app) =>
          app.user_id === userId ? { ...app, documents } : app,
        ),
      );

      return documents;
    } catch (error) {
      console.error(`Failed to fetch documents for user ${userId}:`, error);
      return [];
    } finally {
      setDocumentsLoading((prev) => ({ ...prev, [userId]: false }));
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async (): Promise<void> => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.error('No access token found');
          window.location.href = '/login';
          return;
        }

        const [usersResponse, applicationsResponse] = await Promise.all([
          fetch(API_ENDPOINTS.getAll, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(API_ENDPOINTS.getAllApplications, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
        ]);

        if (usersResponse.ok) {
          const users = (await usersResponse.json()) as SystemUser[];
          setAllUsers(users);
        } else {
          console.error('Failed to fetch users:', usersResponse.statusText);
          setAllUsers([]);
        }

        if (applicationsResponse.ok) {
          const applications =
            (await applicationsResponse.json()) as LinguistApplicationWithUserRead[];
          setAllApplications(applications);
        } else {
          console.error(
            'Failed to fetch applications:',
            applicationsResponse.statusText,
          );
          setAllApplications([]);
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        setAllUsers([]);
        setAllApplications([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchInitialData();
  }, []);

  useEffect(() => {
    if (
      currentView === 'applications' &&
      displayedApplications.length > 0 &&
      !loading
    ) {
      displayedApplications.forEach((app) => {
        if (
          app.research_papers_gcs_keys.length === 0 &&
          !documentsLoading[app.user_id]
        ) {
          void fetchDocumentsForUser(app.user_id);
        }
      });
    }
  }, [
    displayedApplications,
    currentView,
    fetchDocumentsForUser,
    documentsLoading,
    loading,
  ]);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [applyFiltersAndPagination]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setStatusFilter('all');
  }, [currentView]);

  const handleDocumentOpen = async (gcsKey: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No access token found');
        return;
      }

      const response = await fetch(API_ENDPOINTS.getSignedDownloadUrl(gcsKey), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const downloadUrl = await response.text();
        if (downloadUrl) {
          const cleanUrl = downloadUrl.replace(/^"+|"+$/g, '');
          window.open(cleanUrl, '_blank');
        } else {
          console.error('Empty download URL received');
        }
      } else {
        console.error(
          'Failed to get download URL:',
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error('Error opening document:', error);
    }
  };

  const handleApplicationAction = async (
    applicationId: string,
    action: string,
  ) => {
    const application = allApplications.find((app) => app.id === applicationId);
    if (!application) return;

    switch (action) {
      case 'approve':
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            console.error('No access token found');
            return;
          }

          const updateApplicationResponse = await fetch(
            API_ENDPOINTS.ApproveApplicationStatus(applicationId),
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (updateApplicationResponse.ok) {
            const updateUserResponse = await fetch(
              `${API_ENDPOINTS.updateUserRole(application.user_id)}?new_role=linguist`,
              {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              },
            );

            if (updateUserResponse.ok) {
              const result = (await updateUserResponse.json()) as {
                message: string;
              };
              console.log(
                'User promoted to linguist successfully:',
                result.message,
              );

              setAllApplications((prev) =>
                prev.map((app) =>
                  app.id === applicationId
                    ? {
                        ...app,
                        status: 'approved' as const,
                        reviewed_at: new Date().toISOString(),
                      }
                    : app,
                ),
              );

              setAllUsers((prev) =>
                prev.map((user) =>
                  user.id === application.user_id
                    ? { ...user, role: 'linguist' }
                    : user,
                ),
              );
            } else {
              const errorData = (await updateUserResponse.json()) as {
                message?: string;
              };
              console.error('Failed to promote user to linguist:', errorData);
            }
          } else {
            console.error('Failed to update application status');
          }
        } catch (error) {
          console.error('Failed to approve application:', error);
        }
        break;

      case 'reject':
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            console.error('No access token found');
            return;
          }

          const response = await fetch(
            API_ENDPOINTS.RejectApplicationStatus(applicationId),
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (response.ok) {
            setAllApplications((prev) =>
              prev.map((app) =>
                app.id === applicationId
                  ? {
                      ...app,
                      status: 'rejected' as const,
                      reviewed_at: new Date().toISOString(),
                    }
                  : app,
              ),
            );
          } else {
            console.error('Failed to reject application');
          }
        } catch (error) {
          console.error('Failed to reject application:', error);
        }
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
        const applicantName = `${app.user.first_name} ${app.user.last_name}`;
        const matchesSearch =
          applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.user.email.toLowerCase().includes(searchTerm.toLowerCase());
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (authError) {
    return <AdminErrorBoundary authError={authError} />;
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

                <div className="admin-right-section">
                  <div className="admin-stats">
                    {currentView === 'applications' && (
                      <>
                        <div className="stat-card">
                          <FileText size={20} />
                          <span className="stat-number">
                            {allApplications.length}
                          </span>
                          <span className="stat-label">Applications</span>
                        </div>

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
                      <>
                        <div className="stat-card">
                          <Users size={20} />
                          <span className="stat-number">{allUsers.length}</span>
                          <span className="stat-label">Users</span>
                        </div>

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
                      </>
                    )}
                  </div>

                  <div className="view-toggle-container">
                    <button
                      type="button"
                      className={`view-toggle-btn ${currentView === 'applications' ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentView('applications');
                      }}
                    >
                      <FileText size={20} />
                      <span className="toggle-label">Applications</span>
                    </button>

                    <button
                      type="button"
                      className={`view-toggle-btn ${currentView === 'users' ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentView('users');
                      }}
                    >
                      <Users size={20} />
                      <span className="toggle-label">Users</span>
                    </button>
                  </div>
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
                <div className="loading-state">
                  Loading users and applications...
                </div>
              ) : (
                <div className="applications-table-container">
                  {currentView === 'applications' ? (
                    <table className="applications-table">
                      <thead>
                        <tr>
                          <th>Applicant</th>
                          <th>Status</th>
                          <th>Submitted</th>
                          <th>Google Scholar</th>
                          <th>Research Papers</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedApplications.map((application) => (
                          <tr key={application.id} className="application-row">
                            <td className="applicant-info">
                              <div>
                                <div className="applicant-avatar">
                                  <User size={20} />
                                </div>
                                <div className="applicant-details">
                                  <div className="applicant-name">
                                    {application.user.first_name}{' '}
                                    {application.user.last_name}
                                  </div>
                                  <div className="applicant-email">
                                    <Mail size={14} />
                                    {application.user.email}
                                  </div>
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
                              {formatDate(application.submitted_at)}
                            </td>
                            <td className="google-scholar-cell">
                              <a
                                href={application.google_scholar_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="google-scholar-link"
                              >
                                <ExternalLink size={14} />
                                Google Scholar Profile
                              </a>
                            </td>
                            <td className="documents-cell">
                              <div className="documents-list">
                                {documentsLoading[application.user_id] ? (
                                  <div className="loading-documents">
                                    Loading...
                                  </div>
                                ) : application.research_papers_gcs_keys
                                    .length > 0 ? (
                                  application.research_papers_gcs_keys.map(
                                    (gcsKey, index) => (
                                      <button
                                        key={`research-${gcsKey}`}
                                        type="button"
                                        className="document-item"
                                        title={`Download research paper ${String(index + 1)}`}
                                        onClick={() => {
                                          void handleDocumentOpen(gcsKey);
                                        }}
                                      >
                                        {getDocumentTypeIcon()}
                                        <span className="document-name">
                                          Research Paper {index + 1}
                                        </span>
                                        <Download size={12} />
                                      </button>
                                    ),
                                  )
                                ) : (
                                  <span className="no-documents">
                                    No research papers
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="actions-cell">
                              <div className="action-buttons">
                                {application.status === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      className="action-button approve-button"
                                      onClick={() => {
                                        void handleApplicationAction(
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
                                        void handleApplicationAction(
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
                                {application.status !== 'pending' && (
                                  <span className="review-info">
                                    {application.reviewed_at && (
                                      <small>
                                        Reviewed:{' '}
                                        {formatDate(application.reviewed_at)}
                                      </small>
                                    )}
                                  </span>
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
                                <div className="applicant-email">
                                  <Mail size={14} />
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
    </div>
  );
};

export default AdminPage;
