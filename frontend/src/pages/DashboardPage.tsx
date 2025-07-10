import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LeftNav from '../components/ui/LeftNav.tsx';
import Navbar from '../components/ui/Navbar.tsx';
import '../styles/DashboardPage.scss';
import { API_ENDPOINTS } from '../config';
import { useDarkMode } from '../components/ui/DarkModeComponent.tsx';

interface RecentTerm {
  id: string;
  term: string;
  language: string;
  definition: string;
  lastViewed: string;
  translation: string;
}

interface CommunityActivity {
  id: string;
  user: string;
  action: string;
  term: string;
  language: string;
  timestamp: string;
}

interface UserProfileApiResponse {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  // Add other fields if needed, e.g., profile_pic_url, role
}
interface UserData {
  uuid: string;
  firstName: string;
  lastName: string;
}

const DashboardPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [recentTerms, setRecentTerms] = useState<RecentTerm[]>([]);
  const [communityActivities, setCommunityActivities] = useState<
    CommunityActivity[]
  >([]);
  const [showRecentTerms, setShowRecentTerms] = useState(false);
  const [showCommunityActivity, setShowCommunityActivity] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [avatarInitials, setAvatarInitials] = useState<string>('U');
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      void navigate('/login');
      return;
    }

    const fetchAndSetUserData = async () => {
      setIsLoadingUserData(true);
      // Try to load from localStorage first
      const storedUserDataString = localStorage.getItem('userData');
      if (storedUserDataString) {
        try {
          const parsedData = JSON.parse(storedUserDataString) as UserData;
          setUserData(parsedData);
          if (parsedData.firstName && parsedData.lastName) {
            setAvatarInitials(
              `${parsedData.firstName.charAt(0)}${parsedData.lastName.charAt(0)}`.toUpperCase(),
            );
          } else if (parsedData.firstName) {
            setAvatarInitials(parsedData.firstName.charAt(0).toUpperCase());
          }
          setIsLoadingUserData(false);
          return; // Found in localStorage, no need to fetch from API immediately
        } catch (error) {
          console.error(
            'Failed to parse user data from localStorage, fetching from API.',
            error,
          );
          localStorage.removeItem('userData'); // Clear corrupted data
        }
      }

      // If not in localStorage or parsing failed, fetch from API
      try {
        const response = await fetch(API_ENDPOINTS.getMe, {
          // <-- Use the new endpoint
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.indexOf('application/json') !== -1) {
            const apiData = (await response.json()) as UserProfileApiResponse;
            const newUserData: UserData = {
              uuid: apiData.id,
              firstName: apiData.first_name,
              lastName: apiData.last_name,
            };
            setUserData(newUserData);
            localStorage.setItem('userData', JSON.stringify(newUserData));
            setAvatarInitials(
              `${newUserData.firstName.charAt(0)}${newUserData.lastName.charAt(0)}`.toUpperCase(),
            );
          } else {
            const textResponse = await response.text();
            console.error(
              'Failed to fetch user data: Expected JSON, but received non-JSON response.',
              textResponse,
            );
            // Potentially navigate to login or show an error message
            void navigate('/login');
          }
        } else {
          console.error('Failed to fetch user data from API:', response.status);
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          localStorage.removeItem('accessToken'); // Token might be invalid
          localStorage.removeItem('userData');
          void navigate('/login');
        }
      } catch (error) {
        console.error('Network or other error fetching user data:', error);
        void navigate('/login'); // Fallback to login on critical error
      } finally {
        setIsLoadingUserData(false);
      }
    };

    const loadDashboardWidgetsData = async () => {
      try {
        // Load recent terms
        const recentTermsResponse = await fetch(
          '/Mavito/Mock_Data/recentTerms.json',
        );
        console.log('Recent terms response:', recentTermsResponse.status);

        if (!recentTermsResponse.ok) {
          throw new Error(
            `Failed to fetch recent terms: ${String(recentTermsResponse.status)}`,
          );
        }

        const recentTermsData =
          (await recentTermsResponse.json()) as RecentTerm[];
        console.log('Recent terms data:', recentTermsData);
        setRecentTerms(recentTermsData);

        // Load community activities
        const communityActivitiesResponse = await fetch(
          '/Mavito/Mock_Data/communityActivity.json', // Updated path
        );
        console.log(
          'Community activities response:',
          communityActivitiesResponse.status,
        );

        if (!communityActivitiesResponse.ok) {
          throw new Error(
            `Failed to fetch community activities: ${String(communityActivitiesResponse.status)}`,
          );
        }

        const communityActivitiesData =
          (await communityActivitiesResponse.json()) as CommunityActivity[];
        console.log('Community activities data:', communityActivitiesData);
        setCommunityActivities(communityActivitiesData);
      } catch (error) {
        console.error('Error loading data:', error);

        // Fallback data in case fetch fails
        setRecentTerms([
          {
            id: '1',
            term: 'Agroforestry',
            language: 'Zulu',
            definition:
              'Land use management system that combines trees with crops or livestock on the same land.',
            lastViewed: '2 hours ago',
            translation: 'Izolimo zamahlathi',
          },
          {
            id: '2',
            term: 'Aquaculture',
            language: 'Xhosa',
            definition:
              'Cultivation of aquatic organisms under controlled conditions.',
            lastViewed: '5 hours ago',
            translation: 'Ukukhulisa izilwanyana zasemanzini',
          },
          {
            id: '3',
            term: 'Biodynamic farming',
            language: 'Sesotho',
            definition:
              'Ecological farming approach that treats farms as unified organisms.',
            lastViewed: '1 day ago',
            translation: 'Temo ea tlhaho',
          },
          {
            id: '4',
            term: 'Cover crop',
            language: 'Northern Sotho',
            definition:
              'Crop planted to manage soil erosion, fertility, quality, and biodiversity.',
            lastViewed: '2 days ago',
            translation: 'Peo ya go sireletsa',
          },
        ]);

        setCommunityActivities([
          {
            id: '1',
            user: 'LinguistMara',
            action: 'added new term',
            term: 'Indaba',
            language: 'Zulu',
            timestamp: '30 minutes ago',
          },
          {
            id: '2',
            user: 'SALanguageExpert',
            action: 'updated definition for',
            term: 'Braai',
            language: 'Afrikaans',
            timestamp: '2 hours ago',
          },
          {
            id: '3',
            user: 'TsongaScribe',
            action: 'contributed translation for',
            term: 'Vutomi',
            language: 'Tsonga',
            timestamp: '5 hours ago',
          },
          {
            id: '4',
            user: 'XhosaWords',
            action: 'verified term',
            term: 'Enkosi',
            language: 'Xhosa',
            timestamp: '1 day ago',
          },
        ]);
      }
    };

    // Fetch user data first, then other dashboard content
    fetchAndSetUserData()
      .then(() => {
        void loadDashboardWidgetsData();
      })
      .catch(console.error);
  }, [navigate]);

  // Responsive navigation effect
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleQuickAction = (action: string) => {
    console.log(`Quick action clicked: ${action}`);
  };

  return (
    <div
      className={`dashboard-container ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      {/* Navigation - using same pattern as GlossaryPage and HelpPage */}
      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      )}

      <div className="main-content">
        <div className="top-bar">
          <div className="welcome-section">
            <h1 className="welcome-title">
              {userData
                ? `${t('dashboard.welcomeBack')}, ${userData.firstName}${userData.lastName ? ' ' + userData.lastName : ''}`
                : t('dashboard.welcome')}
            </h1>
          </div>
          {isLoadingUserData ? (
            <div className="profile-section">Loading profile...</div>
          ) : (
            <div className="profile-section">
              <div className="profile-info">
                <div className="profile-avatar">{avatarInitials}</div>
                <div className="profile-details">
                  <h3
                    style={{
                      color: isDarkMode ? '#f0f0f0' : '#333333', // or your own theme colors
                    }}
                  >
                    {userData
                      ? `${userData.firstName} ${userData.lastName}`
                      : t('dashboard.userName')}
                  </h3>
                  <p>
                    {t('dashboard.userId')}: {userData ? userData.uuid : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="three-column-layout">
          <div className="middle-column">
            <div className="quick-actions-section">
              {' '}
              <h2 className="section-title">{t('dashboard.quickActions')}</h2>
              <div className="quick-actions-grid">
                <div
                  className="action-card primary"
                  onClick={() => {
                    handleQuickAction('search');
                  }}
                >
                  <div className="action-icon">🔍</div>
                  <h3>{t('dashboard.searchNow')}</h3>
                  <p>{t('dashboard.searchDescription')}</p>
                </div>
                <div
                  className="action-card secondary"
                  onClick={() => {
                    handleQuickAction('download');
                  }}
                >
                  <div className="action-icon">📥</div>
                  <h3>{t('dashboard.downloadResources')}</h3>
                  <p>{t('dashboard.downloadDescription')}</p>
                </div>
                <div
                  className="action-card tertiary"
                  onClick={() => {
                    handleQuickAction('contribute');
                  }}
                >
                  <div className="action-icon">✍️</div>
                  <h3>{t('dashboard.contributeTerm')}</h3>
                  <p>{t('dashboard.contributeDescription')}</p>
                </div>
              </div>
            </div>

            <div className="recent-terms-section">
              <div className="section-card">
                {' '}
                <h2 className="section-title">{t('dashboard.recentTerms')}</h2>
                {showRecentTerms && (
                  <div className="recent-terms-list">
                    {recentTerms.map((term) => (
                      <div key={term.id} className="term-item">
                        <div className="term-header">
                          <h4 className="term-name">{term.term}</h4>
                          <span className="term-language">{term.language}</span>
                        </div>
                        <p className="term-definition">{term.definition}</p>
                        <span className="term-timestamp">
                          {term.lastViewed}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="view-all-btn"
                  onClick={() => {
                    setShowRecentTerms((prev) => !prev);
                  }}
                >
                  {showRecentTerms
                    ? t('dashboard.hideTerms')
                    : t('dashboard.viewAll')}
                </button>
              </div>
            </div>
          </div>

          <div className="right-column">
            <div className="section-card">
              {' '}
              <h2 className="section-title">
                {t('dashboard.communityActivity')}
              </h2>
              {showCommunityActivity && (
                <div className="activity-feed">
                  {communityActivities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-avatar">
                        {activity.user.charAt(0).toUpperCase()}
                      </div>
                      <div className="activity-content">
                        <p className="activity-text">
                          <strong>{activity.user}</strong> {activity.action}
                          <span className="activity-term">
                            "{activity.term}"
                          </span>
                          in{' '}
                          <span className="activity-language">
                            {activity.language}
                          </span>
                        </p>
                        <span className="activity-timestamp">
                          {activity.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="view-all-activity-btn"
                onClick={() => {
                  setShowCommunityActivity((prev) => !prev);
                }}
              >
                {showCommunityActivity
                  ? t('dashboard.hideActivity')
                  : t('dashboard.viewAllActivity')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
