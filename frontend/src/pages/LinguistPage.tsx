import React, { useState, useEffect, useCallback, JSX } from 'react';
import Navbar from '../components/ui/Navbar';
import LeftNav from '../components/ui/LeftNav';
import { API_ENDPOINTS } from '../config';
import '../styles/LinguistPage.scss';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import {
  TermApplicationRead,
  TermApplicationCreate,
  TermSchema,
} from '../types/term';
import { v4 as uuidv4 } from 'uuid';
import {
  addPendingTermApproval,
  addPendingTermRejection,
  addPendingTermSubmission,
  addPendingTermDelete,
  getTermsByIdsFromDB,
} from '../utils/indexedDB';
import { updateCache } from '../utils/cacheUpdater';
import { Term } from '../types/terms/types';
import { addTerm } from '../utils/indexedDB';
import { refreshAllTermsCache } from '../utils/syncManager';
import { GamificationService } from '../utils/gamification';
interface AppRowProps {
  app: TermApplicationRead;
  isMobile: boolean;
  i: number;
  activeTab: 'review' | 'my' | 'rejected' | 'submit' | 'edit';
  expandedAppId: string | null;
  fetchedTranslations: { [key: string]: TermSchema };
  renderStatusBadge: (status: string) => JSX.Element;
  toggleExpandedDetails: (id: string) => void;
  handleVerify: (id: string) => void;
  openReviewModal: (id: string) => void;
  openDeleteModal: (id: string) => void;
}

const ApplicationRowOrCard: React.FC<AppRowProps> = ({
  app,
  isMobile,
  i,
  activeTab,
  expandedAppId,
  fetchedTranslations,
  renderStatusBadge,
  toggleExpandedDetails,
  handleVerify,
  openReviewModal,
  openDeleteModal,
}) => {
  const translations =
    app.proposed_content?.translations
      ?.map((id) => fetchedTranslations[id])
      .filter(Boolean) || [];
  const termToDisplay =
    app.status === 'ADMIN_APPROVED' && app.term_details
      ? app.term_details
      : app.proposed_content;
  if (!termToDisplay) return null;

  if (isMobile) {
    return (
      <li className="application-card ">
        <div className="card-header">
          <span className="card-term">{termToDisplay.term}</span>
          {renderStatusBadge(app.status)}
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
              {app.submitted_by_user?.first_name +
                ' ' +
                app.submitted_by_user?.last_name || 'Unknown'}
            </span>
            <span>
              <strong>Votes:</strong> {app.crowd_votes_count || 0}
            </span>
          </div>
        </div>
        <div className="card-footer">
          <div className="card-actions">
            {activeTab === 'review' && app.status !== 'REJECTED' && (
              <>
                <button
                  onClick={() => handleVerify(app.id)}
                  className="approve-btn"
                >
                  Approve
                </button>
                <button
                  onClick={() => openReviewModal(app.id)}
                  className="reject-btn"
                >
                  Reject
                </button>
              </>
            )}
            {(activeTab === 'my' || activeTab === 'rejected') &&
              app.status === 'REJECTED' && (
                <button
                  onClick={() => openDeleteModal(app.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              )}
          </div>
          {translations.length > 0 && (
            <button
              onClick={() => toggleExpandedDetails(app.id)}
              className="translations-btn"
            >
              {expandedAppId === app.id
                ? 'Hide'
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
                      <strong>{t.language}:</strong> {t.term} - {t.definition}
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
          {app.submitted_by_user?.first_name +
            ' ' +
            app.submitted_by_user?.last_name || 'Unknown'}
        </td>
        <td>{renderStatusBadge(app.status)}</td>
        <td>{app.crowd_votes_count || 0}</td>
        <td className="actions">
          {activeTab === 'review' && app.status !== 'REJECTED' && (
            <>
              <button
                onClick={() => handleVerify(app.id)}
                className="approve-btn"
              >
                Approve
              </button>
              <button
                onClick={() => openReviewModal(app.id)}
                className="reject-btn"
              >
                Reject
              </button>
            </>
          )}
          {(activeTab === 'my' || activeTab === 'rejected') &&
            app.status === 'REJECTED' && (
              <button
                onClick={() => openDeleteModal(app.id)}
                className="delete-btn"
              >
                Delete
              </button>
            )}
          {translations.length > 0 && (
            <button
              onClick={() => toggleExpandedDetails(app.id)}
              className="translations-btn"
            >
              {expandedAppId === app.id
                ? 'Hide'
                : `Show (${translations.length})`}
            </button>
          )}
        </td>
      </tr>
      {expandedAppId === app.id && translations.length > 0 && (
        <tr>
          <td colSpan={8}>
            <div className="expanded-details">
              <div className="translations">
                <h4>Translations:</h4>
                <ul>
                  {translations.map((t, idx) => (
                    <li key={t.id || idx}>
                      <strong>{t.language}:</strong> {t.term} - {t.definition}
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

const LinguistPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState<
    'review' | 'my' | 'rejected' | 'submit' | 'edit'
  >('review');
  const [applications, setApplications] = useState<TermApplicationRead[]>([]);
  const [mySubmissions, setMySubmissions] = useState<TermApplicationRead[]>([]);
  const [rejectedTerms, setRejectedTerms] = useState<TermApplicationRead[]>([]);
  const [adminTerms, setAdminTerms] = useState<TermSchema[]>([]);
  const [editableTerms, setEditableTerms] = useState<TermSchema[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [fetchedTranslations, setFetchedTranslations] = useState<{
    [key: string]: TermSchema;
  }>({});
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [activeMenuItem, setActiveMenuItem] = useState('linguist-application');
  const [newTerm, setNewTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedTranslations, setSelectedTranslations] = useState<
    TermSchema[]
  >([]);
  const [termToEditId, setTermToEditId] = useState<string | null>(null);
  const [translationSearchQuery, setTranslationSearchQuery] = useState('');
  const [editSearchQuery, setEditSearchQuery] = useState('');
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
    try {
      const res = await fetch(API_ENDPOINTS.getLinguistReviewSubmissions, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApplications(data || []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchMySubmissions = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.getMySubmittedTerms, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch submissions');
      const data = await res.json();
      setMySubmissions(data || []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchRejectedTerms = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.getAllTermApplications, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch all applications');
      const data: TermApplicationRead[] = await res.json();
      const myRejected = data.filter((app) => app.status === 'REJECTED');
      setRejectedTerms(myRejected);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchAllAdminVerifiedTerms = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.getAllAdminVerifiedTerms, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch admin terms');
      const data = await res.json();
      setAdminTerms(data || []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchEditableTerms = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.getEditableTerms, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch editable terms');
      const data = await res.json();
      setEditableTerms(data || []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchAttributes(),
      fetchApplications(),
      fetchMySubmissions(),
      fetchRejectedTerms(),
      fetchAllAdminVerifiedTerms(),
      fetchEditableTerms(),
    ]).finally(() => setLoading(false));
  }, [
    fetchAttributes,
    fetchApplications,
    fetchMySubmissions,
    fetchRejectedTerms,
    fetchAllAdminVerifiedTerms,
    fetchEditableTerms,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchAllTranslations = async () => {
      const allTranslationIds = new Set<string>();
      [...mySubmissions, ...applications].forEach((app) => {
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
          if (!res.ok) throw new Error('Failed to fetch translations');
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
    if (mySubmissions.length > 0 || applications.length > 0) {
      fetchAllTranslations();
    }
  }, [mySubmissions, applications, token, isOffline]);

  const handleVerify = async (id: string) => {
    if (!token) return;
    const url = API_ENDPOINTS.getLinguistReviewSubmissions;
    const originalApplications = [...applications];

    const application = originalApplications.find((app) => app.id === id);

    const updatedApplications = originalApplications.filter(
      (app) => app.id !== id,
    );
    setApplications(updatedApplications);

    if (isOffline) {
      updateCache('api-term-actions-cache', url, updatedApplications);
      await addPendingTermApproval({
        id: uuidv4(),
        applicationId: id,
        role: 'linguist',
        token,
      });

      const application = applications.find((app) => app.id === id);
      if (application?.submitted_by_user_id) {
        await GamificationService.awardLinguistVerificationXP(
          application.submitted_by_user_id,
          id,
        );
      }

      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-term-actions');
      return;
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.linguistVerifyApplication(id),
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error('Verification failed');

      if (application?.submitted_by_user_id) {
        Promise.resolve().then(async () => {
          try {
            await GamificationService.awardLinguistVerificationXP(
              application.submitted_by_user_id,
              id,
            );
          } catch (xpError) {
            console.warn(
              'Failed to award XP for linguist verification:',
              xpError,
            );
            // XP failure doesn't affect the verification success
          }
        });
      }

      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to verify term');
      setApplications(originalApplications);
    }
  };

  const openReviewModal = (id: string) => {
    setCurrentAppId(id);
    setReviewModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setCurrentAppId(id);
    setDeleteModalOpen(true);
  };

  const handleReject = async () => {
    if (!currentAppId || !reviewText || !token)
      return alert('Please provide review feedback');

    const url = API_ENDPOINTS.getLinguistReviewSubmissions;
    const originalApplications = [...applications];

    const updatedApplications = originalApplications.filter(
      (app) => app.id !== currentAppId,
    );
    setApplications(updatedApplications);
    setReviewModalOpen(false);
    setReviewText('');

    if (isOffline) {
      updateCache('api-term-actions-cache', url, updatedApplications);
      await addPendingTermRejection({
        id: uuidv4(),
        applicationId: currentAppId,
        role: 'linguist',
        body: { review: reviewText },
        token,
      });
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-term-actions');
      return;
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.linguistRejectApplication(currentAppId),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ review: reviewText }),
        },
      );
      if (!response.ok) throw new Error('Rejection failed');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to reject term');
      setApplications(originalApplications);
    }
  };

  const handleDeleteApplication = async () => {
    if (!currentAppId || !token) return;

    const originalMySubmissions = [...mySubmissions];
    const originalRejectedTerms = [...rejectedTerms];
    const mySubsUrl = API_ENDPOINTS.getMySubmittedTerms;

    const updatedMySubmissions = mySubmissions.filter(
      (app) => app.id !== currentAppId,
    );
    const updatedRejectedTerms = rejectedTerms.filter(
      (app) => app.id !== currentAppId,
    );
    setMySubmissions(updatedMySubmissions);
    setRejectedTerms(updatedRejectedTerms);
    setDeleteModalOpen(false);
    setCurrentAppId(null);

    if (isOffline) {
      updateCache('api-term-actions-cache', mySubsUrl, updatedMySubmissions);
      await addPendingTermDelete({
        id: uuidv4(),
        applicationId: currentAppId,
        token,
      });
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-term-actions');
      return;
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.deleteTermApplication(currentAppId),
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error('Failed to delete application');
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete application: ' + err.message);
      setMySubmissions(originalMySubmissions);
      setRejectedTerms(originalRejectedTerms);
    }
  };

  const handleSubmitTerm = async () => {
    if (
      !newTerm ||
      !definition ||
      !selectedDomain ||
      !selectedLanguage ||
      !token
    )
      return alert('Please fill in all required fields');

    const translationsToSend = selectedTranslations.map((t) => t.id);
    const body: TermApplicationCreate = {
      term: newTerm,
      definition,
      example,
      domain: selectedDomain,
      language: selectedLanguage,
      translations: translationsToSend,
      ...(termToEditId && { original_term_id: termToEditId }),
    };

    if (isOffline) {
      const tempId = uuidv4();

      // 1. Create a temporary Term object for the main 'terms' store
      const optimisticTerm: Term = {
        id: tempId,
        term: newTerm,
        definition,
        language: selectedLanguage,
        domain: selectedDomain,
        status: 'DRAFT',
        upvotes: 0,
        downvotes: 0,
        user_vote: null,
      };
      // Save it to IndexedDB to make it searchable immediately
      await addTerm(optimisticTerm);

      // 2. Create a TermApplication object for the "My Submissions" list
      const optimisticSubmission: TermApplicationRead = {
        id: tempId,
        term_id: tempId,
        submitted_by_user_id: '', // This will be filled by the server later
        proposed_content: body,
        status: 'DRAFT',
        submitted_at: new Date().toISOString(),
        crowd_votes_count: 0,
      };
      // Update the UI state so it appears in "My Submissions"
      setMySubmissions((prev) => [optimisticSubmission, ...prev]);

      // 3. Queue the action for the service worker
      await addPendingTermSubmission({ id: tempId, body, token });
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-term-actions');

      // Reset form and switch to the submissions tab
      setActiveTab('my');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.submitTerm, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Submission failed');
      }

      // After a successful online submission, refresh the main terms list
      await refreshAllTermsCache();

      fetchData(); // This re-fetches the component's own lists
      setActiveTab('my');
    } catch (err: any) {
      console.error(err);
      alert('Failed to submit term: ' + err.message);
    }
  };

  const handleSelectTranslation = (term: TermSchema) => {
    if (!selectedTranslations.some((t) => t.id === term.id))
      setSelectedTranslations([...selectedTranslations, term]);
    setTranslationSearchQuery('');
  };
  const handleRemoveTranslation = (termId: string) =>
    setSelectedTranslations(
      selectedTranslations.filter((t) => t.id !== termId),
    );
  const handleSelectTermToEdit = (term: TermSchema) => {
    setTermToEditId(term.id);
    setEditSearchQuery(`${term.term} (${term.language}) - ${term.domain}`);
  };
  const toggleExpandedDetails = (id: string) =>
    setExpandedAppId(expandedAppId === id ? null : id);

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

  const filteredAdminTerms = adminTerms.filter(
    (term) =>
      term.term.toLowerCase().includes(translationSearchQuery.toLowerCase()) ||
      term.language
        .toLowerCase()
        .includes(translationSearchQuery.toLowerCase()) ||
      term.domain.toLowerCase().includes(translationSearchQuery.toLowerCase()),
  );
  const filteredEditableTerms = editableTerms.filter(
    (term) =>
      term.term.toLowerCase().includes(editSearchQuery.toLowerCase()) ||
      term.language.toLowerCase().includes(editSearchQuery.toLowerCase()) ||
      term.domain.toLowerCase().includes(editSearchQuery.toLowerCase()),
  );
  const applicationsToDisplay =
    activeTab === 'my'
      ? mySubmissions
      : activeTab === 'rejected'
        ? rejectedTerms
        : applications;

  const tableContent = (
    <>
      {loading && (
        <tr>
          <td colSpan={8} style={{ textAlign: 'center' }}>
            Loading...
          </td>
        </tr>
      )}
      {!loading && applicationsToDisplay.length === 0 && (
        <tr>
          <td colSpan={8} style={{ textAlign: 'center' }}>
            No{' '}
            {activeTab === 'review'
              ? 'applications to review'
              : activeTab === 'my'
                ? 'submissions'
                : 'rejected terms'}{' '}
            found
          </td>
        </tr>
      )}
      {!loading &&
        applicationsToDisplay.map((app, i) => (
          <ApplicationRowOrCard
            key={app.id}
            app={app}
            isMobile={isMobile}
            i={i}
            activeTab={activeTab}
            expandedAppId={expandedAppId}
            fetchedTranslations={fetchedTranslations}
            renderStatusBadge={renderStatusBadge}
            toggleExpandedDetails={toggleExpandedDetails}
            handleVerify={handleVerify}
            openReviewModal={() => openReviewModal(app.id)}
            openDeleteModal={() => openDeleteModal(app.id)}
          />
        ))}
    </>
  );

  return (
    <div
      className={`dashboard-container !bg-[var(--bg-first)] ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      )}
      <div className="linguist-page-container">
        <div className="linguist-page-content">
          <h1 className="page-title">Linguist Dashboard</h1>
          <div className="tabs">
            <button
              className={activeTab === 'review' ? 'active-tab' : ''}
              onClick={() => setActiveTab('review')}
            >
              Review Submissions
            </button>
            <button
              className={activeTab === 'submit' ? 'active-tab' : ''}
              onClick={() => {
                setActiveTab('submit');
                setTermToEditId(null);
                setSelectedTranslations([]);
              }}
            >
              Submit Term
            </button>
            <button
              className={activeTab === 'edit' ? 'active-tab' : ''}
              onClick={() => setActiveTab('edit')}
            >
              Suggest Edit
            </button>
            <button
              className={activeTab === 'my' ? 'active-tab' : ''}
              onClick={() => setActiveTab('my')}
            >
              My Submissions
            </button>
            <button
              className={activeTab === 'rejected' ? 'active-tab' : ''}
              onClick={() => setActiveTab('rejected')}
            >
              Rejected Terms
            </button>
          </div>

          {(activeTab === 'submit' || activeTab === 'edit') && (
            <div className="form-container">
              {activeTab === 'edit' && (
                <div className="form-group">
                  <label>Select Term to Edit*</label>
                  <input
                    type="text"
                    value={editSearchQuery}
                    onChange={(e) => {
                      setEditSearchQuery(e.target.value);
                      setTermToEditId(null);
                    }}
                    placeholder="Search for an editable term..."
                  />
                  {editSearchQuery && (
                    <ul className="search-results">
                      {filteredEditableTerms.map((term) => (
                        <li
                          key={term.id}
                          onClick={() => handleSelectTermToEdit(term)}
                        >{`${term.term} (${term.language}) - ${term.domain}`}</li>
                      ))}
                    </ul>
                  )}
                  {termToEditId && (
                    <div className="selected-item">
                      Selected: {editSearchQuery}
                    </div>
                  )}
                </div>
              )}
              {(activeTab === 'submit' || termToEditId) && (
                <>
                  <div className="form-group">
                    <label>Term*</label>
                    <input
                      type="text"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      placeholder="Enter term"
                    />
                  </div>
                  <div className="form-group">
                    <label>Definition*</label>
                    <textarea
                      value={definition}
                      onChange={(e) => setDefinition(e.target.value)}
                      placeholder="Enter definition"
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Example</label>
                    <textarea
                      value={example}
                      onChange={(e) => setExample(e.target.value)}
                      placeholder="Enter example usage"
                      rows={2}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Domain*</label>
                      <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                      >
                        <option value="">Select Domain</option>
                        {domains.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Language*</label>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                      >
                        <option value="">Select Language</option>
                        {languages.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="translations-section">
                    <h3>Existing Translations</h3>
                    <div className="form-group">
                      <label>
                        Select related admin-verified terms to add as
                        translations:
                      </label>
                      <input
                        type="text"
                        value={translationSearchQuery}
                        onChange={(e) => {
                          setTranslationSearchQuery(e.target.value);
                        }}
                        placeholder="Search for a term..."
                      />
                      {translationSearchQuery && (
                        <ul className="search-results">
                          {filteredAdminTerms
                            .filter(
                              (term) =>
                                !selectedTranslations.some(
                                  (t) => t.id === term.id,
                                ),
                            )
                            .map((term) => (
                              <li
                                key={term.id}
                                onClick={() => handleSelectTranslation(term)}
                              >{`${term.term} (${term.language}) - ${term.domain}`}</li>
                            ))}
                        </ul>
                      )}
                    </div>
                    {selectedTranslations.length > 0 && (
                      <div className="selected-translations">
                        <h4>Selected Translations:</h4>
                        {selectedTranslations.map((translation) => (
                          <div
                            key={translation.id}
                            className="translation-item"
                          >
                            <span>{`${translation.term} (${translation.language}) - ${translation.domain}`}</span>
                            <button
                              onClick={() =>
                                handleRemoveTranslation(translation.id)
                              }
                              className="remove-btn"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSubmitTerm}
                    className="submit-btn"
                    disabled={
                      !newTerm ||
                      !definition ||
                      !selectedDomain ||
                      !selectedLanguage
                    }
                  >
                    {activeTab === 'submit' ? 'Submit Term' : 'Submit Edit'}
                  </button>
                </>
              )}
            </div>
          )}

          {(activeTab === 'review' ||
            activeTab === 'my' ||
            activeTab === 'rejected') &&
            (isMobile ? (
              <ul className="applications-list">{tableContent}</ul>
            ) : (
              <div className="table-wrapper">
                <table className="applications-table">
                  <thead>
                    <tr>
                      <th>Term</th>
                      <th>Definition</th>
                      <th>Domain</th>
                      <th>Language</th>
                      <th>Submitted By</th>
                      <th>Status</th>
                      <th>Votes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>{tableContent}</tbody>
                </table>
              </div>
            ))}
        </div>
      </div>

      {reviewModalOpen && (
        <div className="review-modal-backdrop">
          <div className="review-modal">
            <h2>Reject Application</h2>
            <p>Please provide feedback for the rejection:</p>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Enter review feedback (required)"
              rows={5}
            />
            <div className="modal-actions">
              <button
                onClick={() => {
                  setReviewModalOpen(false);
                  setReviewText('');
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!reviewText}
                className="submit-btn"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteModalOpen && (
        <div className="review-modal-backdrop">
          <div className="review-modal">
            <h2>Delete Application</h2>
            <p>
              Are you sure you want to delete this submission? This action
              cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCurrentAppId(null);
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button onClick={handleDeleteApplication} className="delete-btn">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinguistPage;
