import React, { JSX, useEffect, useState, useCallback } from 'react';
import Navbar from '../components/ui/Navbar';
import LeftNav from '../components/ui/LeftNav';
import { TermApplicationRead } from '../types/term';
import { API_ENDPOINTS } from '../config';
import '../styles/AdminTermPage.scss';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import { Listbox } from '@headlessui/react';
import { CheckIcon } from 'lucide-react';
import { ChevronsUpDownIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  addPendingTermApproval,
  addPendingTermRejection,
  getTermsByIdsFromDB,
} from '../utils/indexedDB';
import { updateCache } from '../utils/cacheUpdater';

interface TermSchema {
  id: string;
  term: string;
  definition: string;
  domain: string;
  language: string;
  example?: string;
}

interface AppRowProps {
  app: TermApplicationRead;
  isMobile: boolean;
  activeTab: 'pending' | 'all';
  i: number;
  expandedAppId: string | null;
  fetchedTranslations: { [key: string]: TermSchema };
  renderStatusBadge: (status: string) => JSX.Element;
  toggleExpandedDetails: (id: string) => void;
  handleApprove: (id: string) => void;
  openReviewModal: (id: string) => void;
}

const ApplicationRowOrCard: React.FC<AppRowProps> = ({
  app,
  isMobile,
  activeTab,
  i,
  expandedAppId,
  fetchedTranslations,
  renderStatusBadge,
  toggleExpandedDetails,
  handleApprove,
  openReviewModal,
}) => {
  const translations =
    app.proposed_content?.translations
      ?.map((id) => fetchedTranslations[id])
      .filter(Boolean) || [];
  const termToDisplay =
    app.status === 'ADMIN_APPROVED' && app.term_details
      ? app.term_details
      : app.proposed_content;

  if (isMobile) {
    return (
      <li className="application-card">
        <div className="card-header">
          <span className="card-term">{termToDisplay.term}</span>
          {renderStatusBadge(app.status || 'PENDING_VERIFICATION')}
        </div>
        <div className="card-body">
          <p className="card-definition">{termToDisplay.definition}</p>
          <div className="card-meta">
            <span>
              <strong>Domain:</strong> {termToDisplay.domain}
            </span>
            <span>
              <strong>Language:</strong> {termToDisplay.language}
            </span>
            <span>
              <strong>Submitter:</strong>{' '}
              {`${app.submitted_by_user?.first_name} ${app.submitted_by_user?.last_name}`}
            </span>
          </div>
        </div>
        <div className="card-footer">
          {activeTab === 'pending' && (
            <div className="card-actions">
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
            </div>
          )}
          {translations.length > 0 && (
            <button
              onClick={() => toggleExpandedDetails(app.id)}
              className="translations-btn"
            >
              {expandedAppId === app.id
                ? 'Hide Translations'
                : `Show (${translations.length})`}
            </button>
          )}
        </div>
        {expandedAppId === app.id && (
          <div className="expanded-details">
            {translations.length > 0 && (
              <div className="translations">
                <h4>Translations:</h4>
                <ul>
                  {translations.map((t, idx) => (
                    <li key={t.id || idx}>
                      <strong>{t.language}</strong>
                      <div className="translation-term">{t.term}</div>
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
            )}
            {app.review && (
              <div className="feedback">
                <h4>Feedback:</h4>
                <p>{app.review}</p>
              </div>
            )}
          </div>
        )}
      </li>
    );
  }

  return (
    <React.Fragment>
      <tr className={i % 2 === 0 ? 'even-row' : 'odd-row'}>
        <td>{termToDisplay.term}</td>
        <td className="definition-text">{termToDisplay.definition}</td>
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
        <td>{`${app.submitted_by_user?.first_name} ${app.submitted_by_user?.last_name}`}</td>
        <td>{new Date(app.submitted_at).toLocaleString()}</td>
        <td>
          {app.reviewed_at ? new Date(app.reviewed_at).toLocaleString() : '-'}
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
        <td>{renderStatusBadge(app.status || 'PENDING_VERIFICATION')}</td>
      </tr>
      {expandedAppId === app.id && translations.length > 0 && (
        <tr>
          <td colSpan={activeTab === 'pending' ? 10 : 9}>
            <div className="expanded-details">
              <div className="translations">
                <h4>Translations:</h4>
                <ul>
                  {translations.map((t, idx) => (
                    <li key={t.id || idx}>
                      <strong>{t.language}</strong>
                      <div className="translation-term">{t.term}</div>
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
};

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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const fetchAttributes = useCallback(async () => {
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
  }, [token]);

  const fetchApplications = useCallback(async () => {
    if (!token) return;
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
      setApplications(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [activeTab, token]);

  const fetchData = useCallback(() => {
    fetchAttributes();
    fetchApplications();
  }, [fetchAttributes, fetchApplications]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
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
        let data: TermSchema[];
        if (isOffline) {
          data = await getTermsByIdsFromDB(Array.from(allTranslationIds));
        } else {
          const res = await fetch(`${API_ENDPOINTS.getTermsByIds}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ term_ids: Array.from(allTranslationIds) }),
          });
          if (!res.ok)
            throw new Error('Failed to fetch translations from network');
          data = await res.json();
        }
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
    if (applications.length > 0) {
      fetchAllTranslations();
    }
  }, [applications, token, isOffline]);

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
    if (!token) return alert('Authentication required.');
    const url = API_ENDPOINTS.getAdminApplicationsForApproval;
    const originalApplications = [...applications];

    const updatedApplications = originalApplications.filter(
      (app) => app.id !== id,
    );
    setApplications(updatedApplications);

    if (isOffline) {
      updateCache('api-term-actions-cache', url, updatedApplications);
      await addPendingTermApproval({
        id: uuidv4(),
        applicationId: id,
        role: 'admin',
        token,
      });
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-term-actions');
      return;
    }

    try {
      await fetch(API_ENDPOINTS.adminApproveApplication(id), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData(); // Re-fetch all data to ensure consistency
    } catch (err) {
      console.error(err);
      setApplications(originalApplications); // Revert on error
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
    if (!currentReviewId || !token) return;

    const url = API_ENDPOINTS.getAdminApplicationsForApproval;
    const originalApplications = [...applications];

    const updatedApplications = originalApplications.filter(
      (app) => app.id !== currentReviewId,
    );
    setApplications(updatedApplications);
    setReviewModalOpen(false);

    if (isOffline) {
      updateCache('api-term-actions-cache', url, updatedApplications);
      await addPendingTermRejection({
        id: uuidv4(),
        applicationId: currentReviewId,
        role: 'admin',
        body: { review: reviewText },
        token,
      });
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-term-actions');
      return;
    }

    try {
      await fetch(API_ENDPOINTS.adminRejectApplication(currentReviewId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ review: reviewText }),
      });
      fetchData(); // Re-fetch all data to ensure consistency
    } catch (err) {
      console.error(err);
      setApplications(originalApplications); // Revert
    }
  };

  const toggleExpandedDetails = (id: string) => {
    setExpandedAppId(expandedAppId === id ? null : id);
  };

  const renderStatusBadge = (status: string) => {
    const normalizedStatus = status ? status.toUpperCase() : '';
    const statusMap: Record<string, { class: string; text: string }> = {
      PENDING_VERIFICATION: { class: 'pending_verification', text: 'Pending' },
      REJECTED: { class: 'rejected', text: 'Rejected' },
      CROWD_VERIFIED: { class: 'crowd_verified', text: 'Crowd Verified' },
      LINGUIST_VERIFIED: {
        class: 'linguist_verified',
        text: 'Linguist Verified',
      },
      ADMIN_APPROVED: { class: 'admin_approved', text: 'Approved' },
    };
    const statusInfo = statusMap[normalizedStatus] || {
      class: 'unknown',
      text: status,
    };
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
            <Listbox value={selectedDomain} onChange={setSelectedDomain}>
              <div className="filter-wrapper">
                <Listbox.Button className="custom-select">
                  <span>{selectedDomain || 'All Domains'}</span>
                  <span className="custom-select-icon">
                    <ChevronsUpDownIcon />
                  </span>
                </Listbox.Button>
                <Listbox.Options className="custom-options">
                  <Listbox.Option className="custom-option" value={null}>
                    All Domains
                  </Listbox.Option>
                  {domains.map((domain) => (
                    <Listbox.Option
                      key={domain}
                      className="custom-option"
                      value={domain}
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                          >
                            {domain}
                          </span>
                          {selected ? (
                            <span className="custom-option-check">
                              <CheckIcon />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>

            <Listbox value={selectedLanguage} onChange={setSelectedLanguage}>
              <div className="filter-wrapper">
                <Listbox.Button className="custom-select">
                  <span>{selectedLanguage || 'All Languages'}</span>
                  <span className="custom-select-icon">
                    <ChevronsUpDownIcon />
                  </span>
                </Listbox.Button>
                <Listbox.Options className="custom-options">
                  <Listbox.Option className="custom-option" value={null}>
                    All Languages
                  </Listbox.Option>
                  {languages.map((language) => (
                    <Listbox.Option
                      key={language}
                      className="custom-option"
                      value={language}
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                          >
                            {language}
                          </span>
                          {selected ? (
                            <span className="custom-option-check">
                              <CheckIcon />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
          {loading && <p>Loading applications...</p>}
          {!loading &&
            (isMobile ? (
              <ul className="applications-list">
                {filteredApplications.map((app, i) => (
                  <ApplicationRowOrCard
                    key={app.id}
                    app={app}
                    isMobile={isMobile}
                    activeTab={activeTab}
                    i={i}
                    expandedAppId={expandedAppId}
                    fetchedTranslations={fetchedTranslations}
                    renderStatusBadge={renderStatusBadge}
                    toggleExpandedDetails={toggleExpandedDetails}
                    handleApprove={handleApprove}
                    openReviewModal={openReviewModal}
                  />
                ))}
              </ul>
            ) : (
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
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td
                          colSpan={activeTab === 'pending' ? 10 : 9}
                          style={{ textAlign: 'center' }}
                        >
                          No applications found.
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app, i) => (
                        <ApplicationRowOrCard
                          key={app.id}
                          app={app}
                          isMobile={isMobile}
                          activeTab={activeTab}
                          i={i}
                          expandedAppId={expandedAppId}
                          fetchedTranslations={fetchedTranslations}
                          renderStatusBadge={renderStatusBadge}
                          toggleExpandedDetails={toggleExpandedDetails}
                          handleApprove={handleApprove}
                          openReviewModal={openReviewModal}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ))}
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
                  <button
                    onClick={() => setReviewModalOpen(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button onClick={handleReject} className="submit-btn">
                    Submit
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
