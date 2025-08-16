import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LeftNav from '../components/ui/LeftNav.tsx';
import Navbar from '../components/ui/Navbar.tsx';
import '../styles/DashboardPage.scss';
import { API_ENDPOINTS } from '../config';
import { useDarkMode } from '../components/ui/DarkModeComponent.tsx';

interface UserProfileApiResponse {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  profile_pic_url?: string;
  role?: string;
}
interface UserData {
  uuid: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
}

interface Letter {
  id: number;
  char: string;
  color: string;
  left: number;
  top: number;
  speed: number;
}

const DashboardPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [letters, setLetters] = useState<Letter[]>([]);

  const colors = useMemo(
    () => ['#00CEAF', '#212431', '#F7074D', '#F2D001'],
    [],
  );
  const alphabet = useMemo(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), []);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [avatarInitials, setAvatarInitials] = useState<string>('U');
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );
  const [loadingProfilePicture, setLoadingProfilePicture] = useState(false);

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

          // Always try to load profile picture since localStorage might not have the latest data
          void loadProfilePictureForUser(parsedData);

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
              profilePictureUrl: apiData.profile_pic_url,
            };
            setUserData(newUserData);
            setAvatarInitials(
              `${newUserData.firstName.charAt(0)}${newUserData.lastName.charAt(0)}`.toUpperCase(),
            );

            // Load profile picture directly here
            if (newUserData.profilePictureUrl) {
              void loadProfilePictureForUser(newUserData);
            }
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

    // Fetch user data
    void fetchAndSetUserData().catch(console.error);
  }, [navigate]);

  // Load profile picture for a specific user
  const loadProfilePictureForUser = async (user: UserData) => {
    if (!user.uuid) return;

    // Check if we have a cached URL in sessionStorage (lasts for browser session)
    const cachedData = sessionStorage.getItem(`profilePic_${user.uuid}`);
    if (cachedData) {
      try {
        const { url, timestamp } = JSON.parse(cachedData) as {
          url: string;
          timestamp: number;
        };
        // Cache expires after 1 hour (3600000 ms)
        const isExpired = Date.now() - timestamp > 3600000;
        if (!isExpired) {
          setProfilePictureUrl(url);
          return;
        } else {
          // Remove expired cache
          sessionStorage.removeItem(`profilePic_${user.uuid}`);
        }
      } catch {
        // Invalid cache format, remove it
        sessionStorage.removeItem(`profilePic_${user.uuid}`);
      }
    }

    setLoadingProfilePicture(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.getMyProfilePictureUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as { view_url: string };

        setProfilePictureUrl(data.view_url);

        // Cache in sessionStorage for the browser session with timestamp
        const cacheData = {
          url: data.view_url,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(
          `profilePic_${user.uuid}`,
          JSON.stringify(cacheData),
        );

        // Cache the profile picture URL in localStorage
        const existingUserDataString = localStorage.getItem('userData');
        if (existingUserDataString) {
          try {
            const existingUserData = JSON.parse(
              existingUserDataString,
            ) as UserData;
            const updatedUserData = {
              ...existingUserData,
              profilePictureUrl: user.profilePictureUrl,
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            setUserData(updatedUserData);
          } catch (error) {
            console.error('Failed to cache profile picture URL:', error);
          }
        }
      } else {
        setProfilePictureUrl(null);
      }
    } catch (err) {
      console.error('Error loading profile picture:', err);
      setProfilePictureUrl(null);
    } finally {
      setLoadingProfilePicture(false);
    }
  };

  // Load profile picture URL
  const loadProfilePicture = useCallback(async () => {
    if (!userData?.uuid) return;

    // Check if we have a cached URL in sessionStorage (lasts for browser session)
    const cachedData = sessionStorage.getItem(`profilePic_${userData.uuid}`);
    if (cachedData) {
      try {
        const { url, timestamp } = JSON.parse(cachedData) as {
          url: string;
          timestamp: number;
        };
        // Cache expires after 1 hour (3600000 ms)
        const isExpired = Date.now() - timestamp > 3600000;
        if (!isExpired) {
          setProfilePictureUrl(url);
          return;
        } else {
          // Remove expired cache
          sessionStorage.removeItem(`profilePic_${userData.uuid}`);
        }
      } catch {
        // Invalid cache format, remove it
        sessionStorage.removeItem(`profilePic_${userData.uuid}`);
      }
    }

    setLoadingProfilePicture(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.getMyProfilePictureUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as { view_url: string };

        setProfilePictureUrl(data.view_url);

        // Cache in sessionStorage for the browser session with timestamp
        const cacheData = {
          url: data.view_url,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(
          `profilePic_${userData.uuid}`,
          JSON.stringify(cacheData),
        );

        // Cache the profile picture URL in localStorage
        const existingUserDataString = localStorage.getItem('userData');
        if (existingUserDataString) {
          try {
            const existingUserData = JSON.parse(
              existingUserDataString,
            ) as UserData;
            const updatedUserData = {
              ...existingUserData,
              profilePictureUrl: data.view_url,
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            setUserData(updatedUserData);
          } catch (error) {
            console.error('Failed to cache profile picture URL:', error);
          }
        }
      } else {
        setProfilePictureUrl(null);
      }
    } catch (err) {
      console.error('Error loading profile picture:', err);
      setProfilePictureUrl(null);
    } finally {
      setLoadingProfilePicture(false);
    }
  }, [userData?.uuid]);

  // Load profile picture when userData is available
  useEffect(() => {
    if (userData?.uuid) {
      // Always load from API since profile_pic_url is just a storage key, not a viewable URL
      void loadProfilePicture();
    }
  }, [userData?.uuid, loadProfilePicture]);

  // Falling letters animation
  useEffect(() => {
    const createLetter = () => {
      return {
        id: Math.random(),
        char: alphabet[Math.floor(Math.random() * alphabet.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 85,
        top: -100,
        speed: Math.random() * 1.5 + 0.5,
      };
    };

    const initialLetters = Array.from({ length: 20 }, createLetter);
    setLetters(initialLetters);

    const animate = () => {
      setLetters((prevLetters) => {
        const newLetters = prevLetters
          .map((letter) => ({
            ...letter,
            top: letter.top + letter.speed,
          }))
          .filter((letter) => letter.top < window.innerHeight + 100);

        if (Math.random() < 0.4 && newLetters.length < 25) {
          newLetters.push(createLetter());
        }

        if (newLetters.length < 20) {
          newLetters.push(
            ...Array.from({ length: 20 - newLetters.length }, createLetter),
          );
        }

        return newLetters;
      });
    };

    const interval = setInterval(animate, 60);
    return () => {
      clearInterval(interval);
    };
  }, [alphabet, colors]);

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
          <div className="welcome-section"></div>
          {isLoadingUserData ? (
            <div className="profile-section">Loading profile...</div>
          ) : (
            <div className="profile-section">
              <div className="profile-info">
                <div className="profile-avatar">
                  {loadingProfilePicture ? (
                    <div className="loading-placeholder">...</div>
                  ) : profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt="Profile Picture"
                      onError={() => {
                        // Clear cached URL and reload profile picture when image fails to load
                        if (userData?.uuid) {
                          localStorage.removeItem(
                            `profilePic_${userData.uuid}`,
                          );
                          setProfilePictureUrl(null);
                          void loadProfilePicture();
                        }
                      }}
                    />
                  ) : (
                    avatarInitials
                  )}
                </div>
                <div className="profile-details">
                  <h3
                    style={{
                      color: isDarkMode ? '#f0f0f0' : '#333333',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                    onClick={() => {
                      void navigate('/profile');
                    }}
                    title="Go to profile page"
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

        <div
          role="complementary"
          aria-label="falling-letters"
          className="abstract-bg"
        >
          {letters.map((letter) => (
            <div
              key={letter.id}
              className="falling-letter"
              style={{
                left: `${String(letter.left)}%`,
                top: `${String(letter.top)}px`,
                color: letter.color,
                opacity: '0.1',
                transform: `rotate(${String(letter.top)}deg)`,
              }}
            >
              {letter.char}
            </div>
          ))}
        </div>

        <div className="main-content-body">
          <div className="content-wrapper">
            <div className="content-layout">
              <div className="content-side">
                <h1 className="title">Unite Through Words</h1>
                <br />
                <div className="intro-text">
                  <p>
                    The term 'Marito' originates from Xitsonga, translating to
                    'words' or 'names'. This is a progressive web application
                    that bridges the gap between South Africa's rich linguistic
                    heritage and modern digital accessibility. Language
                    enthusiasts, NLP researchers, and linguists can use Marito
                    as a unified platform to explore, contribute to, and
                    preserve multilingual glossaries, dictionaries, and
                    terminology banks across 11 of South Africa's official
                    languages.
                  </p>

                  <p>
                    Marito works seamlessly both offline and online, empowering
                    communities to access comprehensive language resources,
                    submit feedback, and collaborate on robust lexicons for
                    low-resource languages. This platform is part of an ongoing
                    initiative by DSFSI (Data Science for Social Impact) at the
                    University of Pretoria to democratize linguistic resources
                    and advance natural language processing research for African
                    languages.
                  </p>

                  <p className="team-credit">Proudly developed by Velox</p>
                </div>

                <div className="cta-section">
                  <a
                    href="https://www.dsfsi.co.za/"
                    className="cta-button primary-cta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more about DSFSI
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
