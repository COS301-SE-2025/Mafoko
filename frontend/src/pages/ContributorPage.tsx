import React, { JSX, useEffect, useState, useCallback } from 'react';
import Navbar from '../components/ui/Navbar';
import LeftNav from '../components/ui/LeftNav';
import { API_ENDPOINTS } from '../config';
import '../styles/ContributorPage.scss';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import { TermApplicationRead, TermApplicationCreate } from '../types/term';
import { v4 as uuidv4 } from 'uuid';
import {
  addPendingTermSubmission,
  addPendingTermVote,
  addPendingTermDelete,
  getTermsByIdsFromDB,
} from '../utils/indexedDB';
import { updateCache } from '../utils/cacheUpdater';
import { GamificationService } from '../utils/gamification';
import { UserData } from '../types/glossaryTypes';
import { Term } from '../types/terms/types';
import { addTerm } from '../utils/indexedDB';
import { refreshAllTermsCache } from '../utils/syncManager';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.tsx';
import { useTranslation } from 'react-i18next';

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
  i: number;
  activeTab: 'submit' | 'my' | 'pending' | 'edit' | 'rejected';
  expandedAppId: string | null;
  fetchedTranslations: { [key: string]: TermSchema };
  renderStatusBadge: (status: string) => JSX.Element;
  toggleExpandedDetails: (id: string) => void;
  handleVote: (id: string) => void;
  handleDeleteApplication: (id: string) => void;
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
  handleVote,
  handleDeleteApplication,
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
      <li className="application-card">
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
              <strong>Votes:</strong> {app.crowd_votes_count || 0}
            </span>
          </div>
        </div>
        <div className="card-footer">
          <div className="card-actions">
            {activeTab === 'pending' && (
              <button onClick={() => handleVote(app.id)} className="vote-btn">
                Vote
              </button>
            )}
            {(activeTab === 'my' || activeTab === 'rejected') && (
              <button
                onClick={() => handleDeleteApplication(app.id)}
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

  if (activeTab === 'rejected') {
    return (
      <tr className={i % 2 === 0 ? 'even-row' : 'odd-row'}>
        <td>{termToDisplay.term}</td>
        <td className="definition-text">{termToDisplay.definition}</td>
        <td>{termToDisplay.domain}</td>
        <td>{termToDisplay.language}</td>
        <td>{app.review || 'No feedback provided'}</td>
        <td className="actions">
          <button
            onClick={() => handleDeleteApplication(app.id)}
            className="delete-btn"
          >
            Delete
          </button>
        </td>
      </tr>
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
        <td>{renderStatusBadge(app.status)}</td>
        <td>{app.crowd_votes_count || 0}</td>
        <td className="actions">
          {activeTab === 'pending' && (
            <button onClick={() => handleVote(app.id)} className="vote-btn">
              Vote
            </button>
          )}
          {activeTab === 'my' && (
            <button
              onClick={() => handleDeleteApplication(app.id)}
              className="delete-btn"
            >
              Delete
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

const ContributorPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeMenuItem, setActiveMenuItem] = useState('contributor-page');
  const [activeTab, setActiveTab] = useState<
    'submit' | 'my' | 'pending' | 'edit' | 'rejected'
  >('submit');
  const [domains, setDomains] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [mySubmissions, setMySubmissions] = useState<TermApplicationRead[]>([]);
  const [pendingTerms, setPendingTerms] = useState<TermApplicationRead[]>([]);
  const [rejectedTerms, setRejectedTerms] = useState<TermApplicationRead[]>([]);
  const [adminTerms, setAdminTerms] = useState<TermSchema[]>([]);
  const [editableTerms, setEditableTerms] = useState<TermSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [fetchedTranslations, setFetchedTranslations] = useState<{
    [key: string]: TermSchema;
  }>({});
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
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);
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
  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        setCurrentUser(JSON.parse(userDataString));
      } catch (e) {
        console.error('Failed to parse user data from localStorage', e);
      }
    }
  }, []);
  const openDeleteModal = (id: string) => {
    setCurrentAppId(id);
    setDeleteModalOpen(true);
  };

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

  const fetchMySubmissions = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.getMySubmittedTerms, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch submissions');
      const data = await res.json();
      setMySubmissions(data || []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchPendingTerms = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.getPendingVerificationTerms, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch pending terms');
      const data = await res.json();
      setPendingTerms(data || []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchRejectedTerms = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.getMySubmittedTerms, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch all applications');
      const data: TermApplicationRead[] = await res.json();
      const myRejected = data.filter((app) => app.status === 'rejected');
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
      fetchMySubmissions(),
      fetchPendingTerms(),
      fetchRejectedTerms(),
      fetchAllAdminVerifiedTerms(),
      fetchEditableTerms(),
    ]).finally(() => setLoading(false));
  }, [
    fetchAttributes,
    fetchMySubmissions,
    fetchPendingTerms,
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
      [...mySubmissions, ...pendingTerms].forEach((app) => {
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
    if (mySubmissions.length > 0 || pendingTerms.length > 0) {
      fetchAllTranslations();
    }
  }, [mySubmissions, pendingTerms, token, isOffline]);

  useEffect(() => {
    if (termToEditId) {
      const term = editableTerms.find((t) => t.id === termToEditId);
      if (term) {
        setNewTerm(term.term);
        setDefinition(term.definition);
        setExample(term.example || '');
        setSelectedDomain(term.domain);
        setSelectedLanguage(term.language);
        setSelectedTranslations([]);
      }
    }
  }, [termToEditId, editableTerms]);

  const handleSubmitTerm = async () => {
    if (
      !newTerm ||
      !definition ||
      !selectedDomain ||
      !selectedLanguage ||
      !token
    ) {
      toast('Submission Failed', {
        description: 'Please fill in all required fields.',
      });
      return;
    }

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

      // 4. Queue XP award for term addition when offline
      if (currentUser?.uuid) {
        await GamificationService.awardTermAdditionXP(currentUser.uuid, tempId);
      }

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

      const submissionData = await response.json();

      Promise.resolve().then(async () => {
        try {
          await GamificationService.awardTermAdditionXP(
            submissionData.submitted_by_user_id,
            submissionData.id,
          );
        } catch (xpError) {
          console.warn('Failed to award XP for term submission:', xpError);
          // XP failure doesn't affect the submission success
        }
      });

      // After a successful online submission, refresh the main terms list
      await refreshAllTermsCache();

      fetchData();
      setActiveTab('my');
    } catch (err: any) {
      toast('Failed to submit term', {
        description: err.message,
      });
    }
  };

  const handleVote = async (id: string) => {
    if (!token) return;
    if (isOffline) {
      await addPendingTermVote({ id: uuidv4(), applicationId: id, token });

      const votedApplication = pendingTerms.find((app) => app.id === id);
      if (votedApplication?.submitted_by_user_id) {
        await GamificationService.awardCrowdVoteXP(
          votedApplication.submitted_by_user_id,
          id,
        );
      }

      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-term-actions');
      toast('Submission Failed', {
        description:
          'Your vote has been queued and will be submitted when you are back online.',
      });
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.voteForTerm(id), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok)
        throw new Error('Vote failed: ' + (await response.json()).detail);

      // Award XP in background - don't block the UI refresh
      const votedApplication = pendingTerms.find((app) => app.id === id);
      if (votedApplication?.submitted_by_user_id) {
        Promise.resolve().then(async () => {
          try {
            await GamificationService.awardCrowdVoteXP(
              votedApplication.submitted_by_user_id,
              id,
            );
          } catch (xpError) {
            console.warn('Failed to award XP for crowd vote:', xpError);
            // XP failure doesn't affect the vote success
          }
        });
      } else {
        console.warn(
          ' No XP awarded - submitted_by_user_id not available for application:',
          id,
        );
      }

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Replace the existing handleDeleteApplication function
  const handleDeleteApplication = async () => {
    if (!token || !currentAppId) return;

    const originalMySubmissions = [...mySubmissions];
    const originalRejectedTerms = [...rejectedTerms];
    const mySubsUrl = API_ENDPOINTS.getMySubmittedTerms;

    const updatedMySubmissions = originalMySubmissions.filter(
      (app) => app.id !== currentAppId,
    );
    const updatedRejectedTerms = originalRejectedTerms.filter(
      (app) => app.id !== currentAppId,
    );
    setMySubmissions(updatedMySubmissions);
    setRejectedTerms(updatedRejectedTerms);
    setDeleteModalOpen(false); // Close the modal

    if (isOffline) {
      updateCache('api-term-actions-cache', mySubsUrl, updatedMySubmissions);
      await addPendingTermDelete({
        id: uuidv4(),
        applicationId: currentAppId,
        token,
      });
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-term-actions');
      toast('Application queued for deletion', {
        description: '',
      });
      setCurrentAppId(null);
      return;
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.deleteTermApplication(currentAppId),
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error('Failed to delete application');
      fetchData();
      toast('Delete Success', {
        description: 'Application deleted successfully',
      });
    } catch (err: any) {
      toast('Failed to delete application', {
        description: err.message,
      });
      setMySubmissions(originalMySubmissions);
      setRejectedTerms(originalRejectedTerms);
    } finally {
      setCurrentAppId(null); // Reset the ID
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

  const toggleExpandedDetails = (id: string) =>
    setExpandedAppId(expandedAppId === id ? null : id);

  const applicationsToDisplay =
    activeTab === 'my'
      ? mySubmissions
      : activeTab === 'pending'
        ? pendingTerms
        : rejectedTerms;

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

  // FIX: This 'tableContent' block was missing. Re-adding it fixes all the "unused variable" and "cannot find name" errors.
  const tableContent = (
    <>
      {!loading && applicationsToDisplay.length === 0 && (
        <tr>
          <td colSpan={8} style={{ textAlign: 'center' }}>
            No items found.
          </td>
        </tr>
      )}
      {applicationsToDisplay.map((app, i) => (
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
          handleVote={handleVote}
          handleDeleteApplication={openDeleteModal}
        />
      ))}
    </>
  );

  return (
    <div
      className={`dashboard-container  !bg-[var(--bg-first)] ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      )}
      <div className="contributor-page-container">
        <div className="contributor-page-content">
          <h1 className="page-title">{t('termAdditions.contributionTitle')}</h1>
          <div className="tabs flex flex-wrap md:flex-nowrap gap-2 md:gap-4 ">
            {[
              { key: 'submit', label: t('contribute.submit') },
              { key: 'edit', label: t('contribute.suggest') },
              { key: 'my', label: t('contribute.submissions') },
              { key: 'pending', label: t('contribute.pending') },
              { key: 'rejected', label: t('contribute.rejected') },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === 'submit') {
                    setTermToEditId(null);
                    setSelectedTranslations([]);
                  }
                }}
                style={{
                  backgroundColor:
                    activeTab === tab.key ? '#f00a50' : 'transparent',
                  color:
                    activeTab === tab.key
                      ? 'white'
                      : isDarkMode
                        ? '#ffffff'
                        : '#212431',
                  border: `2px solid ${activeTab === tab.key ? '#f00a50' : isDarkMode ? '#4b5563' : 'rgba(240, 10, 80, 0.3)'}`,
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'submit' && (
            <div
              className="form-container"
              style={{
                border: '1px solid rgba(0, 206, 175, 0.3)',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                backgroundColor: isDarkMode ? '#232738ff' : '#ffffff',
                maxWidth: '900px',
                width: '100%',
              }}
            >
              <div className="form-group">
                <label style={{ fontSize: '1.125rem', fontWeight: '500' }}>
                  {t('termAdditions.termTitle')}
                </label>
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder={t('termAdditions.termPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '1.125rem', fontWeight: '500' }}>
                  {t('termAdditions.defTitle')}
                </label>
                <textarea
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  placeholder={t('termAdditions.defPlaceholder')}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '1.125rem', fontWeight: '500' }}>
                  {t('termAdditions.exampleTitle')}
                </label>
                <textarea
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  placeholder={t('termAdditions.examplePlaceholder')}
                  rows={2}
                />
              </div>
              <div className="form-row">
                <div className="form-group flex justify-center items-center">
                  <label style={{ fontSize: '1.125rem', fontWeight: '500' }}>
                    {t('termAdditions.domainTitle')}
                  </label>
                  <Select
                    value={selectedDomain}
                    onValueChange={(value) => setSelectedDomain(value)}
                  >
                    <SelectTrigger
                      className="w-[200px]"
                      style={{
                        backgroundColor: '#f00a50',
                        color: 'white',
                        borderColor: '#f00a50',
                      }}
                    >
                      <SelectValue
                        placeholder={t('contributePlaceholder.domain')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-group flex justify-center items-center">
                  <label style={{ fontSize: '1.125rem', fontWeight: '500' }}>
                    {t('termAdditions.languageTitle')}
                  </label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={(value) => setSelectedLanguage(value)}
                  >
                    <SelectTrigger
                      className="w-[200px]"
                      style={{
                        backgroundColor: '#f00a50',
                        color: 'white',
                        borderColor: '#f00a50',
                      }}
                    >
                      <SelectValue
                        placeholder={t('contributePlaceholder.language')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="translations-section">
                <h3>{t('termAdditions.extTransTitle')}</h3>
                <div className="form-group">
                  <label style={{ fontSize: '1.125rem', fontWeight: '500' }}>
                    {t('termAdditions.extContent')}
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
                            !selectedTranslations.some((t) => t.id === term.id),
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
                    <h4>{t('termAdditions.selectTrans')}:</h4>
                    {selectedTranslations.map((translation) => (
                      <div key={translation.id} className="translation-item">
                        <span>{`${translation.term} (${translation.language}) - ${translation.domain}`}</span>
                        <button
                          onClick={() =>
                            handleRemoveTranslation(translation.id)
                          }
                          className="remove-btn"
                        >
                          {t('termAdditions.remove')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSubmitTerm}
                className="submit-btn"
                style={{
                  backgroundColor: '#f00a50',
                  color: 'white',
                  border: 'none',
                }}
                disabled={
                  !newTerm ||
                  !definition ||
                  !selectedDomain ||
                  !selectedLanguage
                }
              >
                {t('termAdditions.submitTerm')}
              </button>
            </div>
          )}
          {activeTab === 'edit' && (
            <div
              className="form-container"
              style={{
                border: '1px solid rgba(0, 206, 175, 0.3)',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                backgroundColor: isDarkMode ? '#232738ff' : '#ffffff',
                maxWidth: '900px',
                width: '100%',
              }}
            >
              <div className="form-group">
                <label style={{ fontSize: '1.125rem', fontWeight: '500' }}>
                  {t('termAdditions.selectToEdit')}
                </label>
                <input
                  type="text"
                  value={editSearchQuery}
                  onChange={(e) => {
                    setEditSearchQuery(e.target.value);
                    setTermToEditId(null);
                  }}
                  placeholder={t('termAdditions.searchPlaceholder')}
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
                    {t('termAdditions.selected')}: {editSearchQuery}
                  </div>
                )}
              </div>
              {termToEditId && (
                <>
                  <div className="form-group">
                    <label style={{ fontSize: '1.125rem', fontWeight: '500' }}>
                      {t('termAdditions.termTitle')}
                    </label>
                    <input
                      type="text"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      placeholder={t('termAdditions.termPlaceholder')}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '1.125rem', fontWeight: '500' }}>
                      {t('termAdditions.defTitle')}
                    </label>
                    <textarea
                      value={definition}
                      onChange={(e) => setDefinition(e.target.value)}
                      placeholder={t('termAdditions.defPlaceholder')}
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '1.125rem', fontWeight: '500' }}>
                      {t('termAdditions.exampleTitle')}
                    </label>
                    <textarea
                      value={example}
                      onChange={(e) => setExample(e.target.value)}
                      placeholder={t('termAdditions.examplePlaceholder')}
                      rows={2}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label
                        style={{ fontSize: '1.125rem', fontWeight: '500' }}
                      >
                        {t('termAdditions.domainTitle')}
                      </label>
                      <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        style={{
                          backgroundColor: '#f00a50',
                          color: 'white',
                          borderColor: '#f00a50',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                        }}
                      >
                        <option
                          value=""
                          style={{
                            backgroundColor: isDarkMode ? '#374151' : 'white',
                            color: isDarkMode ? 'white' : '#212431',
                          }}
                        >
                          {t('contributePlaceholder.domain')}
                        </option>
                        {domains.map((d) => (
                          <option
                            key={d}
                            value={d}
                            style={{
                              backgroundColor: isDarkMode ? '#374151' : 'white',
                              color: isDarkMode ? 'white' : '#212431',
                            }}
                          >
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label
                        style={{ fontSize: '1.125rem', fontWeight: '500' }}
                      >
                        {t('termAdditions.languageTitle')}
                      </label>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        style={{
                          backgroundColor: '#f00a50',
                          color: 'white',
                          borderColor: '#f00a50',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                        }}
                      >
                        <option
                          value=""
                          style={{
                            backgroundColor: isDarkMode ? '#374151' : 'white',
                            color: isDarkMode ? 'white' : '#212431',
                          }}
                        >
                          {t('contributePlaceholder.language')}
                        </option>
                        {languages.map((l) => (
                          <option
                            key={l}
                            value={l}
                            style={{
                              backgroundColor: isDarkMode ? '#374151' : 'white',
                              color: isDarkMode ? 'white' : '#212431',
                            }}
                          >
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="translations-section">
                    <h3>{t('termAdditions.extTransTitle')}</h3>
                    <div className="form-group">
                      <label
                        style={{ fontSize: '1.125rem', fontWeight: '500' }}
                      >
                        {t('termAdditions.content2')}
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
                        <h4>{t('termAdditions.selectTrans')}:</h4>
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
                              {t('termAdditions.remove')}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSubmitTerm}
                    className="submit-btn"
                    style={{
                      backgroundColor: '#f00a50',
                      color: 'white',
                      border: 'none',
                    }}
                    disabled={
                      !newTerm ||
                      !definition ||
                      !selectedDomain ||
                      !selectedLanguage
                    }
                  >
                    {t('termAdditions.submitEdit')}
                  </button>
                </>
              )}
            </div>
          )}

          {(activeTab === 'my' || activeTab === 'pending') &&
            (isMobile ? (
              <ul className="applications-list">{tableContent}</ul>
            ) : (
              <div className="table-wrapper">
                <table className="terms-table">
                  <thead>
                    <tr>
                      <th>{t('termAdditions.termTitle')}</th>
                      <th>{t('termAdditions.defTitle')}</th>
                      <th>{t('termAdditions.domainTitle')}</th>
                      <th>{t('termAdditions.languageTitle')}</th>
                      <th>{t('termAdditions.translation')}</th>
                      <th>{t('termAdditions.status')}</th>
                      <th>{t('termAdditions.votes')}</th>
                      <th>{t('termAdditions.action')}</th>
                    </tr>
                  </thead>
                  <tbody>{tableContent}</tbody>
                </table>
              </div>
            ))}

          {activeTab === 'rejected' &&
            (isMobile ? (
              <ul className="applications-list">{tableContent}</ul>
            ) : (
              <div className="table-wrapper">
                <table className="terms-table">
                  <thead>
                    <tr>
                      <th>{t('termAdditions.termTitle')}</th>
                      <th>{t('termAdditions.defTitle')}</th>
                      <th>{t('termAdditions.domainTitle')}</th>
                      <th>{t('termAdditions.languageTitle')}</th>
                      <th>{t('termAdditions.reviewFeedback')}</th>
                      <th>{t('termAdditions.action')}</th>
                    </tr>
                  </thead>
                  <tbody>{tableContent}</tbody>
                </table>
              </div>
            ))}
        </div>
      </div>
      {deleteModalOpen && (
        <div className="review-modal-backdrop">
          <div className="review-modal">
            <h2>{t('termAdditions.deleteApplication')}</h2>
            <p>{t('termAdditions.deleteContent')}</p>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCurrentAppId(null);
                }}
                className="cancel-btn"
              >
                {t('termAdditions.cancel')}
              </button>
              <button onClick={handleDeleteApplication} className="delete-btn">
                {t('termAdditions.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContributorPage;
