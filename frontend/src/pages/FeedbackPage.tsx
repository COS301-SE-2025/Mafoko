import { useState, useEffect } from 'react';
import { Lightbulb, Heart, AlertCircle, CheckCircle } from 'lucide-react';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import FeedbackForm from '../components/ui/FeedbackForm';
import '../styles/FeedbackPage.scss';

interface FormData {
  name: string;
  email: string;
  message: string;
  category: string;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

const FeedbackPage = () => {
  const { isDarkMode } = useDarkMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('feedback');
  const [activeTab, setActiveTab] = useState('suggestion');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
    category: 'suggestion',
  });
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitted:', { ...formData, category: activeTab });
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '', category: activeTab });
    }, 3000);
  };

  const tabs: Tab[] = [
    {
      id: 'suggestion',
      label: 'Suggestion',
      icon: Lightbulb,
      color: '#FFD600',
      bg: '#FFFDE7',
    },
    {
      id: 'complaint',
      label: 'Complaint',
      icon: AlertCircle,
      color: '#FF5252',
      bg: '#FFEBEE',
    },
    {
      id: 'compliment',
      label: 'Compliment',
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
                <h2 className="success-title">Thank You!</h2>
                <p className="success-message">
                  Your {activeTab} has been submitted successfully. We
                  appreciate your feedback!
                </p>
                <div className="success-progress">
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                  <p className="progress-text">Redirecting...</p>
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
                          setFormData({ ...formData, category: tab.id });
                        }}
                        className={`tab-button ${
                          activeTab === tab.id ? `active ${tab.id}` : ''
                        }`}
                      >
                        <div className="tab-content">
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
                    Submit a {activeTabData.label}
                  </h2>
                  <p className="form-description">
                    {activeTab === 'suggestion' &&
                      'Share your ideas to help us improve our service.'}
                    {activeTab === 'complaint' &&
                      'Let us know what went wrong so we can make it right.'}
                    {activeTab === 'compliment' &&
                      "We'd love to hear what we're doing well!"}
                  </p>
                </div>

                <FeedbackForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  activeTab={activeTab}
                  activeTabData={activeTabData}
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
