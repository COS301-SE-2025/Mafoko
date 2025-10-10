import { useState, useEffect } from 'react';
import { Lightbulb, Heart, AlertCircle, CheckCircle } from 'lucide-react';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import FeedbackForm from '../components/ui/FeedbackForm';
import { API_ENDPOINTS } from '../config';
import { FeedbackCreate, FeedbackType, Feedback } from '../types/feedback';
import { addPendingFeedback } from '../utils/indexedDB';
import '../styles/FeedbackPage.scss';
import { useTranslation } from 'react-i18next';

interface FormData {
  name: string;
  email: string;
  message: string;
  type: FeedbackType;
}

interface Tab {
  id: FeedbackType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

const FeedbackPage = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('feedback');
  const [activeTab, setActiveTab] = useState<FeedbackType>(
    FeedbackType.SUGGESTION,
  );
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
    type: FeedbackType.SUGGESTION,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const submitFeedback = async (
    feedbackData: FeedbackCreate,
  ): Promise<Feedback> => {
    const token = localStorage.getItem('accessToken');

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(API_ENDPOINTS.submitFeedback, {
        method: 'POST',
        headers,
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to submit feedback: ${response.status.toString()} ${errorData}`,
        );
      }

      return (await response.json()) as Feedback;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      if (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
        errorMessage.includes('ERR_NETWORK') ||
        !navigator.onLine
      ) {
        await addPendingFeedback({
          id: crypto.randomUUID(),
          type: feedbackData.type,
          message: feedbackData.message,
          name: feedbackData.name,
          email: feedbackData.email,
          priority: feedbackData.priority,
          token: token || undefined,
          timestamp: Date.now(),
        });

        // Register background sync
        if (
          'serviceWorker' in navigator &&
          'sync' in window.ServiceWorkerRegistration.prototype
        ) {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('sync-feedback');
          } catch (syncError) {
            console.error('Failed to register background sync:', syncError);
          }
        }

        throw new Error('OFFLINE_QUEUED');
      }

      // Re-throw other errors
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      setSubmitError('Message is required');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const feedbackData: FeedbackCreate = {
        type: formData.type,
        message: formData.message.trim(),
        name: formData.name.trim() || null,
        email: formData.email.trim() || null,
      };

      await submitFeedback(feedbackData);
      setSubmitted(true);

      // Reset form after successful submission
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          name: '',
          email: '',
          message: '',
          type: formData.type,
        });
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);

      if (error instanceof Error && error.message === 'OFFLINE_QUEUED') {
        setSubmitError(
          "You are offline. Your feedback has been saved and will be submitted when you're back online.",
        );
        // Still show success state for offline submissions
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setFormData({
            name: '',
            email: '',
            message: '',
            type: formData.type,
          });
          setSubmitError(null);
        }, 3000);
      } else {
        setSubmitError(
          error instanceof Error
            ? error.message
            : 'Failed to submit feedback. Please try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: Tab[] = [
    {
      id: FeedbackType.SUGGESTION,
      label: t('feedbackTitles.suggestions'),
      icon: Lightbulb,
      color: '#FFD600',
      bg: '#FFFDE7',
    },
    {
      id: FeedbackType.COMPLAINT,
      label: t('feedbackTitles.complaint'),
      icon: AlertCircle,
      color: '#FF5252',
      bg: '#FFEBEE',
    },
    {
      id: FeedbackType.COMPLIMENT,
      label: t('feedbackTitles.compliment'),
      icon: Heart,
      color: '#43A047',
      bg: '#E8F5E9',
    },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (submitted) {
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

          <main className="feedback-main">
            <div className="feedback-success-container">
              <div className="feedback-success-card">
                <CheckCircle className="success-icon" />
                <h2 className="success-title">{t('feedbackPage.thanks')}!</h2>
                <p className="success-message">
                  {t('feedbackPage.your')} {activeTab}{' '}
                  {t('feedbackPage.thanks')}!
                </p>
                <div className="success-progress">
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                  <p className="progress-text">
                    {t('feedbackPage.redirect')}...
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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

        <main className="feedback-main">
          <div className="feedback-container">
            <div className="feedback-header"></div>

            <div className="feedback-card">
              {/* Tab Navigation */}
              <div className="feedback-tabs">
                <nav className="tabs-nav">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setFormData({
                            ...formData,
                            type: tab.id,
                          });
                        }}
                        className={`tab-button  ${
                          activeTab === tab.id ? `active ${tab.id}` : ''
                        }`}
                      >
                        <div
                          className={`tab-content ${
                            activeTab === tab.id ? `active ${tab.id}` : ''
                          }`}
                        >
                          <Icon className="tab-icon" />
                          <span>{tab.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Form Content */}
              <div className="feedback-form-container">
                <div className="form-header">
                  <h2 className={`form-title ${activeTab}`}>
                    {t('feedbackPage.submit')} {activeTabData.label}
                  </h2>
                  <p className="form-description">
                    {activeTab === FeedbackType.SUGGESTION &&
                      `${t('feedbackPage.description')}.`}
                    {activeTab === FeedbackType.COMPLAINT &&
                      `${t('feedbackPage.description2')}.`}
                    {activeTab === FeedbackType.COMPLIMENT &&
                      `${t('feedbackPage.description')}!`}
                  </p>
                </div>

                <FeedbackForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSubmit={(e) => void handleSubmit(e)}
                  activeTab={activeTab}
                  activeTabData={activeTabData}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FeedbackPage;
