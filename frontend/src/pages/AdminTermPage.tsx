// frontend/src/pages/AdminTermPage.tsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/ui/Navbar';
import LeftNav from '../components/ui/LeftNav';
import { TermApplicationRead } from '../types/term';
import { API_ENDPOINTS } from '../config';
import '../styles/AdminTermPage.scss';
import { useDarkMode } from '../components/ui/DarkModeComponent';

interface TermSchema {
  id: string;
  term: string;
  definition: string;
  domain: string;
  language: string;
  example?: string;
}

const AdminTermPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeMenuItem, setActiveMenuItem] = useState('admin-page');
  const [applications, setApplications] = useState<TermApplicationRead[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    TermApplicationRead[]
  >([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [fetchedTranslations, setFetchedTranslations] = useState<{
    [key: string]: TermSchema;
  }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [currentReviewId, setCurrentReviewId] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState<string>('');

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAttributes = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.getAttributes, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch attributes');
      const data = await res.json();
      setDomains(data.domains || []);
      setLanguages(data.languages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const url =
        activeTab === 'pending'
          ? API_ENDPOINTS.getAdminApplicationsForApproval
          : API_ENDPOINTS.getAllTermApplications;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      console.log('Fetched applications:', data);
      setApplications(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttributes();
    fetchApplications();
  }, [activeTab]);

  useEffect(() => {
    // Fetch translations for all applications
    const fetchAllTranslations = async () => {
      const allTranslationIds = new Set<string>();
      applications.forEach((app) => {
        if (app.proposed_content?.translations) {
          app.proposed_content.translations.forEach((id) =>
            allTranslationIds.add(id),
          );
        }
      });

      if (allTranslationIds.size === 0) return;

      try {
        const res = await fetch(`${API_ENDPOINTS.getTermsByIds}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ term_ids: Array.from(allTranslationIds) }),
        });

        if (!res.ok) throw new Error('Failed to fetch translations');
        const data: TermSchema[] = await res.json();
        const translationsMap = data.reduce(
          (acc: { [key: string]: TermSchema }, term: TermSchema) => {
            acc[term.id] = term;
            return acc;
          },
          {},
        );
        setFetchedTranslations(translationsMap);
      } catch (err) {
        console.error('Error fetching translations:', err);
      }
    };

    if (applications.length > 0 && token) {
      fetchAllTranslations();
    }
  }, [applications, token]);

  useEffect(() => {
    setFilteredApplications(
      applications.filter(
        (app) =>
          (!selectedDomain || app.proposed_content.domain === selectedDomain) &&
          (!selectedLanguage ||
            app.proposed_content.language === selectedLanguage),
      ),
    );
  }, [applications, selectedDomain, selectedLanguage]);

  const handleApprove = async (id: string) => {
    try {
      await fetch(API_ENDPOINTS.adminApproveApplication(id), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  const openReviewModal = (id: string) => {
    setCurrentReviewId(id);
    setReviewText('');
    setReviewModalOpen(true);
  };

  const handleReject = async () => {
    if (!reviewText || reviewText.length < 10)
      return alert('Review must be at least 10 characters.');
    if (!currentReviewId) return;
    try {
      await fetch(API_ENDPOINTS.adminRejectApplication(currentReviewId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ review: reviewText }),
      });
      setReviewModalOpen(false);
      fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpandedDetails = (id: string) => {
    setExpandedAppId(expandedAppId === id ? null : id);
  };

  const renderStatusBadge = (status: string) => {
    const statusMap: Record<string, { class: string; text: string }> = {
      PENDING_VERIFICATION: {
        class: 'pending_verification',
        text: 'Pending Verification',
      },
      REJECTED: { class: 'rejected', text: 'Rejected' },
      CROWD_VERIFIED: { class: 'crowd_verified', text: 'Crowd Verified' },
      LINGUIST_VERIFIED: {
        class: 'linguist_verified',
        text: 'Linguist Verified',
      },
      ADMIN_APPROVED: { class: 'admin_approved', text: 'Approved' },
    };

    const statusInfo = statusMap[status] || { class: '', text: status };
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <div
      className={`dashboard-container ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      )}

      <div className="admin-page-container">
        <div className="admin-term-page-content">
          <h1 className="page-title">Admin Term Applications</h1>

          <div className="tabs">
            <button
              className={activeTab === 'pending' ? 'active-tab' : ''}
              onClick={() => setActiveTab('pending')}
            >
              Pending Applications
            </button>
            <button
              className={activeTab === 'all' ? 'active-tab' : ''}
              onClick={() => setActiveTab('all')}
            >
              All Applications
            </button>
          </div>

          <div className="filters">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              <option value="">All Domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="">All Languages</option>
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {loading && <p>Loading applications...</p>}

          {!loading && (
            <div className="table-wrapper">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Definition</th>
                    <th>Domain</th>
                    <th>Language</th>
                    <th>Translations</th>
                    <th>Submitted By</th>
                    <th>Submitted At</th>
                    <th>Reviewed At</th>
                    {activeTab === 'pending' && <th>Actions</th>}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.length === 0 && (
                    <tr>
                      <td
                        colSpan={activeTab === 'pending' ? 10 : 9}
                        style={{ textAlign: 'center' }}
                      >
                        No applications found.
                      </td>
                    </tr>
                  )}
                  {filteredApplications.map((app, i) => {
                    const translations =
                      app.proposed_content?.translations
                        ?.map((id) => fetchedTranslations[id])
                        .filter(Boolean) || [];
                    const termToDisplay =
                      app.status === 'ADMIN_APPROVED' && app.term_details
                        ? app.term_details
                        : app.proposed_content;

                    return (
                      <React.Fragment key={app.id}>
                        <tr className={i % 2 === 0 ? 'even-row' : 'odd-row'}>
                          <td>{termToDisplay.term}</td>
                          <td className="definition-text">
                            {termToDisplay.definition}
                          </td>
                          <td>{termToDisplay.domain}</td>
                          <td>{termToDisplay.language}</td>
                          <td>
                            {translations.length > 0 ? (
                              <button
                                onClick={() => toggleExpandedDetails(app.id)}
                                className="translations-btn"
                              >
                                {expandedAppId === app.id
                                  ? 'Hide'
                                  : `Show (${translations.length})`}
                              </button>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            {app.submitted_by_user?.first_name +
                              ' ' +
                              app.submitted_by_user?.last_name}
                          </td>
                          <td>{new Date(app.submitted_at).toLocaleString()}</td>
                          <td>
                            {app.reviewed_at
                              ? new Date(app.reviewed_at).toLocaleString()
                              : '-'}
                          </td>
                          {activeTab === 'pending' && (
                            <td className="actions">
                              <button
                                className="approve-btn"
                                onClick={() => handleApprove(app.id)}
                              >
                                Approve
                              </button>
                              <button
                                className="reject-btn"
                                onClick={() => openReviewModal(app.id)}
                              >
                                Reject
                              </button>
                            </td>
                          )}
                          <td>
                            {renderStatusBadge(
                              app.status || 'PENDING_VERIFICATION',
                            )}
                          </td>
                        </tr>
                        {expandedAppId === app.id &&
                          translations.length > 0 && (
                            <tr>
                              <td colSpan={activeTab === 'pending' ? 10 : 9}>
                                <div className="expanded-details">
                                  <div className="translations">
                                    <h4>Translations:</h4>
                                    <ul>
                                      {translations.map((t, idx) => (
                                        <li key={t.id || idx}>
                                          <strong>{t.language}</strong>
                                          <div className="translation-term">
                                            {t.term}
                                          </div>
                                          <div className="translation-definition">
                                            {t.definition}
                                          </div>
                                          {t.example && (
                                            <div className="translation-example">
                                              <em>Example: {t.example}</em>
                                            </div>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  {app.review && (
                                    <div className="feedback">
                                      <h4>Feedback:</h4>
                                      <p>{app.review}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {reviewModalOpen && (
            <div className="review-modal-backdrop">
              <div className="review-modal">
                <h2>Reject Application</h2>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Enter review (min 10 chars)"
                  rows={5}
                />
                <div className="modal-actions">
                  <button onClick={handleReject}>Submit</button>
                  <button onClick={() => setReviewModalOpen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTermPage;
