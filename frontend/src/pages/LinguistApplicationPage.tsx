// frontend/src/pages/LinguistApplicationPage.tsx

import React, { useState, useEffect, DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import '../styles/LinguistApplicationPage.scss';
import '../styles/ProgressTracker.scss';
import {
  FiLink,
  FiUploadCloud,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiLoader,
} from 'react-icons/fi';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface SignedUrlResponse {
  upload_url: string;
  gcs_key: string;
}
interface ApplicationPayload {
  google_scholar_url: string;
  research_papers_gcs_keys: string[];
}
interface LinguistApplication {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  google_scholar_url: string;
  research_papers_gcs_keys: string[];
}
interface ResearchPaper {
  name: string;
  gcs_key: string;
  status: 'uploading' | 'success' | 'error';
}
interface ErrorResponse {
  detail: string;
}

const ProgressTracker: React.FC<{
  application: LinguistApplication;
  onReapply: () => void;
}> = ({ application, onReapply }) => {
  const { t } = useTranslation();
  const currentStatus = application.status;

  const steps = [
    {
      key: 'submitted',
      label: t('linguistApplicationPage.status.submitted'),
      icon: <FiCheckCircle />,
    },
    {
      key: 'pending',
      label: t('linguistApplicationPage.status.underReview'),
      icon: <FiClock />,
    },
    {
      key: 'finalDecision',
      label: t('linguistApplicationPage.status.finalDecision'),
      icon: <FiCheckCircle />,
    },
  ];

  const getStepStatus = (stepKey: string) => {
    if (
      currentStatus === 'approved' ||
      (currentStatus === 'rejected' &&
        (stepKey === 'submitted' || stepKey === 'pending'))
    ) {
      return 'completed';
    }
    if (currentStatus === 'rejected' && stepKey === 'finalDecision') {
      return 'rejected';
    }
    if (currentStatus === 'pending') {
      if (stepKey === 'submitted') return 'completed';
      if (stepKey === 'pending') return 'active';
    }
    return 'inactive';
  };

  const getStatusIcon = (stepKey: string) => {
    if (currentStatus === 'rejected' && stepKey === 'finalDecision') {
      return <FiXCircle />;
    }
    if (currentStatus === 'approved') {
      return <FiCheckCircle />;
    }
    if (stepKey === 'submitted' || stepKey === 'finalDecision') {
      return <FiCheckCircle />;
    }
    if (stepKey === 'pending' && currentStatus === 'pending') {
      return <FiClock />;
    }
    return steps.find((step) => step.key === stepKey)?.icon;
  };

  return (
    <div className="progress-tracker-card animate-fadeIn">
      <div className="progress-bar-container">
        {steps.map((step) => (
          <div key={step.key} className={`section ${getStepStatus(step.key)}`}>
            <div className="status-badge">{getStatusIcon(step.key)}</div>
            <p className="status-text">{step.label}</p>
          </div>
        ))}
      </div>
      <div className="status-message">
        <h3>{t('linguistApplicationPage.status.title')}</h3>
        <p>{t(`linguistApplicationPage.status.${currentStatus}`)}</p>
      </div>
      {application.status === 'rejected' && (
        <button onClick={onReapply} className="reapply-button" type="button">
          {t('linguistApplicationPage.reapplyButton')}
        </button>
      )}
    </div>
  );
};

const LinguistApplicationPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeMenuItem, setActiveMenuItem] = useState('linguist-application');

  const [googleScholarUrl, setGoogleScholarUrl] = useState('');
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [application, setApplication] = useState<LinguistApplication | null>(
    null,
  );
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      const token = getAuthToken();
      if (!token) {
        setCheckingStatus(false);
        return;
      }
      try {
        const response = await fetch(API_ENDPOINTS.getLinguistApplication, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 200) {
          const appData = (await response.json()) as LinguistApplication;
          setApplication(appData);
        } else if (response.status === 404) {
          setApplication(null);
        } else throw new Error('Failed to fetch application status.');
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred.');
        }
        setApplication(null);
      } finally {
        setCheckingStatus(false);
      }
    };
    void fetchApplicationStatus();
  }, []);

  const getAuthToken = (): string | null => localStorage.getItem('accessToken');

  const handleFileUpload = async (files: File[]) => {
    const token = getAuthToken();
    if (!token) {
      setError(t('linguistApplicationPage.errors.loginRequired'));
      return;
    }

    const newPapers = files.map((file) => ({
      name: file.name,
      gcs_key: '',
      status: 'uploading' as const,
    }));
    setResearchPapers((prev) => [...prev, ...newPapers]);

    for (const file of files) {
      try {
        const signedUrlResponse = await fetch(API_ENDPOINTS.generateSignedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename: file.name,
            content_type: file.type,
          }),
        });
        if (!signedUrlResponse.ok) throw new Error('Failed to get signed URL.');
        const { upload_url, gcs_key } =
          (await signedUrlResponse.json()) as SignedUrlResponse;

        const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!uploadResponse.ok) throw new Error('File upload failed.');

        setResearchPapers((prev) =>
          prev.map((paper) =>
            paper.name === file.name && paper.status === 'uploading'
              ? { ...paper, gcs_key, status: 'success' }
              : paper,
          ),
        );
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred during file upload.');
        }
        setResearchPapers((prev) =>
          prev.map((paper) =>
            paper.name === file.name && paper.status === 'uploading'
              ? { ...paper, status: 'error' }
              : paper,
          ),
        );
        break;
      }
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    void handleFileUpload(Array.from(e.dataTransfer.files));
  };

  const renderFileStatusIcon = (status: ResearchPaper['status']) => {
    switch (status) {
      case 'success':
        return <FaCheckCircle />;
      case 'error':
        return <FaTimesCircle />;
      case 'uploading':
        return <FiLoader className="file-status-icon-spinner" />;
      default:
        return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const token = getAuthToken();
    if (!token) {
      setError(t('linguistApplicationPage.errors.loginRequired'));
      setIsLoading(false);
      return;
    }
    const payload: ApplicationPayload = {
      google_scholar_url: googleScholarUrl,
      research_papers_gcs_keys: researchPapers
        .filter((p) => p.gcs_key)
        .map((p) => p.gcs_key),
    };
    try {
      const response = await fetch(API_ENDPOINTS.createApplication, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorResponse = (await response.json()) as ErrorResponse;
        throw new Error(errorResponse.detail || 'Submission failed.');
      }
      const newApplication = (await response.json()) as LinguistApplication;
      setApplication(newApplication);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred during submission.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReapply = () => {
    setApplication(null);
    setGoogleScholarUrl('');
    setResearchPapers([]);
    setError(null);
  };

  const renderContent = () => {
    if (checkingStatus)
      return (
        <div className="loading-state">
          {t('linguistApplicationPage.loadingStatus')}
        </div>
      );
    if (application)
      return (
        <ProgressTracker application={application} onReapply={handleReapply} />
      );

    return (
      <div className="application-form-card animate-fadeIn">
        <h2>{t('linguistApplicationPage.title')}</h2>
        <p>{t('linguistApplicationPage.description')}</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="form-group">
            <label htmlFor="google-scholar-url">
              <FiLink /> {t('linguistApplicationPage.googleScholarUrlLabel')}
            </label>
            <input
              type="url"
              id="google-scholar-url"
              value={googleScholarUrl}
              onChange={(e) => {
                setGoogleScholarUrl(e.target.value);
              }}
              placeholder={t(
                'linguistApplicationPage.googleScholarUrlPlaceholder',
              )}
              required
            />
          </div>
          <div
            className={`file-upload-section ${isDragOver ? 'drag-over' : ''}`}
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => {
              setIsDragOver(false);
            }}
          >
            <label htmlFor="file-upload-input" className="file-upload-label">
              <FiUploadCloud size={32} />
              <p>{t('linguistApplicationPage.researchPapersHelpText')}</p>
            </label>
            <input
              id="file-upload-input"
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) =>
                e.target.files &&
                void handleFileUpload(Array.from(e.target.files))
              }
              hidden
            />
          </div>
          <ul className="uploaded-files-list">
            {researchPapers.map((paper) => (
              <li key={paper.name} className={`file-item ${paper.status}`}>
                <div className="file-status-icon">
                  {renderFileStatusIcon(paper.status)}
                </div>
                <span className="file-name">{paper.name}</span>
              </li>
            ))}
          </ul>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading
              ? t('linguistApplicationPage.submittingButton')
              : t('linguistApplicationPage.submitButton')}
          </button>
        </form>
      </div>
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
      <div className="application-page-content">
        <div className="hero-header">
          <h1>{t('linguistApplicationPage.heroTitle')}</h1>
          <p>{t('linguistApplicationPage.heroDescription')}</p>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default LinguistApplicationPage;
