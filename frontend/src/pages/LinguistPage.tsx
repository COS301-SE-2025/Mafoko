// frontend/src/pages/LinguistPage.tsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/ui/Navbar';
import LeftNav from '../components/ui/LeftNav';
import { API_ENDPOINTS } from '../config';
import '../styles/LinguistPage.scss';
import { useDarkMode } from '../components/ui/DarkModeComponent';

interface TermApplication {
  id: string;
  term_id: string;
  term: string;
  definition: string;
  language: string;
  domain: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  review?: string;
  crowd_votes_count?: number;
  translations: string[];
  submitted_by_user?: { name: string };
  proposed_content?: {
    term: string;
    definition: string;
    language: string;
    domain: string;
    translations?: string[];
  };
  term_details?: {
    term: string;
    definition: string;
    language: string;
    domain: string;
  };
}

interface TermSchema {
  id: string;
  term: string;
  definition: string;
  domain: string;
  language: string;
  example?: string;
}

const LinguistPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState<
    'review' | 'my' | 'rejected' | 'submit' | 'edit'
  >('review');
  const [applications, setApplications] = useState<TermApplication[]>([]);
  const [mySubmissions, setMySubmissions] = useState<TermApplication[]>([]);
  const [rejectedTerms, setRejectedTerms] = useState<TermApplication[]>([]);
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

  // Form state for submit/edit
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
    setLoading(false);
  };

  const fetchMySubmissions = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  const fetchRejectedTerms = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.getAllTermApplications, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch all applications');
      const data: TermApplication[] = await res.json();
      const myRejected = data.filter((app) => app.status === 'REJECTED');
      setRejectedTerms(myRejected);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchAllAdminVerifiedTerms = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  const fetchEditableTerms = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  useEffect(() => {
    fetchAttributes();
    fetchApplications();
    fetchMySubmissions();
    fetchRejectedTerms();
    fetchAllAdminVerifiedTerms();
    fetchEditableTerms();
  }, []);

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

    if ((mySubmissions.length > 0 || applications.length > 0) && token) {
      fetchAllTranslations();
    }
  }, [mySubmissions, applications, token]);

  const handleVerify = async (id: string) => {
    try {
      const response = await fetch(
        API_ENDPOINTS.linguistVerifyApplication(id),
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        },
      );
      if (!response.ok) throw new Error('Verification failed');
      fetchApplications();
      fetchMySubmissions();
    } catch (err) {
      console.error(err);
      alert('Failed to verify term');
    }
  };

  const handleReject = async () => {
    if (!currentAppId || !reviewText) {
      return alert('Please provide review feedback');
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.linguistRejectApplication(currentAppId),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ review: reviewText }),
        },
      );
      if (!response.ok) throw new Error('Rejection failed');

      setReviewModalOpen(false);
      setReviewText('');
      fetchApplications();
      fetchMySubmissions();
      fetchRejectedTerms();
    } catch (err) {
      console.error(err);
      alert('Failed to reject term');
    }
  };

  const handleDeleteApplication = async () => {
    if (!currentAppId) return;

    try {
      const response = await fetch(
        API_ENDPOINTS.deleteTermApplication(currentAppId),
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete application');
      }

      fetchMySubmissions();
      fetchRejectedTerms();
      setDeleteModalOpen(false);
      setCurrentAppId(null);
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete application: ' + err.message);
    }
  };

  const handleSubmitTerm = async () => {
    if (!newTerm || !definition || !selectedDomain || !selectedLanguage) {
      return alert('Please fill in all required fields');
    }

    const translationsToSend = selectedTranslations.map((t) => t.id);
    const body = {
      term: newTerm,
      definition,
      example,
      domain: selectedDomain,
      language: selectedLanguage,
      translations: translationsToSend,
      ...(termToEditId && { original_term_id: termToEditId }),
    };

    try {
      const response = await fetch(API_ENDPOINTS.submitTerm, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Submission failed');
      }

      setNewTerm('');
      setDefinition('');
      setExample('');
      setSelectedDomain('');
      setSelectedLanguage('');
      setSelectedTranslations([]);
      setTermToEditId(null);

      fetchMySubmissions();
      fetchRejectedTerms();
      setActiveTab('my');
    } catch (err: any) {
      console.error(err);
      alert('Failed to submit term: ' + err.message);
    }
  };

  const handleSelectTranslation = (term: TermSchema) => {
    if (!selectedTranslations.some((t) => t.id === term.id)) {
      setSelectedTranslations([...selectedTranslations, term]);
    }
    setTranslationSearchQuery('');
  };

  const handleRemoveTranslation = (termId: string) => {
    setSelectedTranslations(
      selectedTranslations.filter((t) => t.id !== termId),
    );
  };

  const handleSelectTermToEdit = (term: TermSchema) => {
    setTermToEditId(term.id);
    setEditSearchQuery(`${term.term} (${term.language}) - ${term.domain}`);
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
                        >
                          {`${term.term} (${term.language}) - ${term.domain}`}
                        </li>
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
                              >
                                {`${term.term} (${term.language}) - ${term.domain}`}
                              </li>
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
            activeTab === 'rejected') && (
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
                <tbody>
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
                    applicationsToDisplay.map((app, i) => {
                      const translations =
                        app.proposed_content?.translations
                          ?.map((id) => fetchedTranslations[id])
                          .filter(Boolean) || [];
                      const termToDisplay =
                        app.status === 'ADMIN_APPROVED' && app.term_details
                          ? app.term_details
                          : app.proposed_content;
                      if (!termToDisplay) return null;

                      return (
                        <React.Fragment key={app.id}>
                          <tr className={i % 2 === 0 ? 'even-row' : 'odd-row'}>
                            <td>{termToDisplay.term}</td>
                            <td className="definition-text">
                              {termToDisplay.definition}
                            </td>
                            <td>{termToDisplay.domain}</td>
                            <td>{termToDisplay.language}</td>
                            <td>{app.submitted_by_user?.name || 'Unknown'}</td>
                            <td>{renderStatusBadge(app.status)}</td>
                            <td>{app.crowd_votes_count || 0}</td>
                            <td className="actions">
                              {activeTab === 'review' &&
                                app.status !== 'REJECTED' && (
                                  <>
                                    <button
                                      onClick={() => handleVerify(app.id)}
                                      className="approve-btn"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCurrentAppId(app.id);
                                        setReviewModalOpen(true);
                                      }}
                                      className="reject-btn"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              {(activeTab === 'my' ||
                                activeTab === 'rejected') &&
                                app.status === 'REJECTED' && (
                                  <button
                                    onClick={() => {
                                      setCurrentAppId(app.id);
                                      setDeleteModalOpen(true);
                                    }}
                                    className="delete-btn"
                                  >
                                    Delete
                                  </button>
                                )}
                              {translations.length > 0 && (
                                <button
                                  onClick={() => toggleExpandedDetails(app.id)}
                                >
                                  {expandedAppId === app.id
                                    ? 'Hide'
                                    : `Show (${translations.length})`}
                                </button>
                              )}
                            </td>
                          </tr>
                          {expandedAppId === app.id &&
                            translations.length > 0 && (
                              <tr>
                                <td colSpan={8}>
                                  <div className="expanded-details">
                                    <div className="translations">
                                      <h4>Translations:</h4>
                                      <ul>
                                        {translations.map((t, idx) => (
                                          <li key={t.id || idx}>
                                            <strong>{t.language}:</strong>{' '}
                                            {t.term} - {t.definition}
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
