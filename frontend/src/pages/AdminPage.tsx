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
} from 'lucide-react';
import Navbar from '../components/ui/Navbar.tsx';
import LeftNav from '../components/ui/LeftNav.tsx';
import '../styles/AdminPage.scss';

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

const AdminPage: React.FC = () => {
  const [allApplications, setAllApplications] = useState<LinguistApplication[]>(
    [],
  );
  const [displayedApplications, setDisplayedApplications] = useState<
    LinguistApplication[]
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('admin');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const pageSize = 6;

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

  const applyFiltersAndPagination = useCallback(() => {
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
  }, [allApplications, searchTerm, statusFilter, currentPage, pageSize]);

  const fetchApplications = useCallback(() => {
    setLoading(true);
    try {
      // Mock data for linguist applications
      const mockApplications: LinguistApplication[] = [
        {
          id: '1',
          applicantName: 'test',
          applicantEmail: 'test@email.com',
          appliedAt: '2025-06-20T14:30:00Z',
          status: 'pending',
          languages: ['English', 'Spanish'],
          documents: [
            {
              id: 'd1',
              name: 'CV.pdf',
              type: 'cv',
              size: 2.4,
              uploadedAt: '2025-06-20T14:30:00Z',
              url: '/documents/cv.pdf',
            },
            {
              id: 'd2',
              name: 'PhD_Certificate.pdf',
              type: 'certificate',
              size: 1.2,
              uploadedAt: '2025-06-20T14:32:00Z',
              url: '/id.pdf',
            },
            {
              id: 'd3',
              name: 'Research.pdf',
              type: 'research',
              size: 8.7,
              uploadedAt: '2025-06-20T14:35:00Z',
              url: '/documents/research_sarah.pdf',
            },
          ],
        },
      ];

      setAllApplications(mockApplications);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [applyFiltersAndPagination]);

  const handleApplicationAction = (applicationId: string, action: string) => {
    const application = allApplications.find((app) => app.id === applicationId);
    if (!application) return;

    switch (action) {
      case 'view':
        break;
      case 'approve':
        // Update application status
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
        // Update application status
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleDocumentDownload = (document: ApplicationDocument) => {
    console.log(`Downloading document: ${document.name}`);
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
    return allApplications.filter((app) => {
      const matchesSearch =
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).length;
  };

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
                    Linguist Applications
                  </h1>
                  <p className="admin-subtitle">
                    Review and manage linguist role applications
                  </p>
                </div>

                <div className="admin-stats">
                  <div className="stat-card">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Total Applications</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Pending Review</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Approved</span>
                  </div>
                  {/* Testing only */}
                  <label>
                    Dark Mode
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={() => {
                        setIsDarkMode((prev) => !prev);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="admin-controls">
              <div className="search-and-filters">
                <div className="search-input-container">
                  <Search className="search-icon" size={20} />
                  <input
                    type="text"
                    placeholder="Search applications by name or email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                    }}
                    className="search-input"
                  />
                </div>

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
              </div>
            </div>

            <div className="admin-content">
              {loading ? (
                <div className="loading-state">Loading applications...</div>
              ) : (
                <div
                  className="applications-table-container"
                  style={{ height: '400px', overflowY: 'auto' }}
                >
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
                              {application.languages.slice(0, 3).map((lang) => (
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
                                  onClick={() => {
                                    handleDocumentDownload(doc);
                                  }}
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
                    disabled={currentPage >= totalPages}
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
