import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LeftNav from '../components/ui/LeftNav.tsx';
import Navbar from '../components/ui/Navbar.tsx';
import SouthAfricaMap from '../components/dashboard/SouthAfricaMap.tsx';
import '../styles/DashboardPage.scss';
import { API_ENDPOINTS } from '../config';
import { useDarkMode } from '../components/ui/DarkModeComponent.tsx';
import {
  cacheRandomTerms,
  getCachedRandomTerms,
  cacheUserProfile,
  getCachedUserProfile,
  RandomTermsCache,
  UserProfileCache,
} from '../utils/indexedDB';

// Animated Language Counter Component
const AnimatedLanguageCounter: React.FC = () => {
  const [count, setCount] = useState(1);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Start counting animation after a short delay
    const timer = setTimeout(() => {
      let currentCount = 1;
      const interval = setInterval(() => {
        setCount(currentCount);
        currentCount += 1;
        if (currentCount > 11) {
          clearInterval(interval);
          // Show the rest of the text after counting is done
          const textTimer = setTimeout(() => {
            setShowText(true);
          }, 300);

          // Return a cleanup function for this nested timeout
          return () => {
            clearTimeout(textTimer);
          };
        }
      }, 250); // Count every 250ms

      return () => {
        clearInterval(interval);
      };
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="animated-title">
      <span className="connecting-text">Connecting&nbsp;</span>
      <span className="animated-number">{count}</span>
      {showText && (
        <span className="languages-text fade-in">
          {' '}
          South African languages...
        </span>
      )}
    </div>
  );
};

interface RandomTerm {
  id: string;
  term: string;
  definition: string;
  language: string;
  category: string;
}

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
  email?: string;
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

// Mock data for random terms
const MOCK_TERMS: RandomTerm[] = [
  {
    id: '1',
    term: 'Ubuntu',
    definition:
      'A philosophy emphasizing the interconnectedness of humanity - "I am because we are"',
    language: 'isiZulu',
    category: 'Philosophy',
  },
  {
    id: '2',
    term: 'Lekgotla',
    definition:
      'A traditional meeting or gathering place where important decisions are made',
    language: 'Sesotho',
    category: 'Culture',
  },
  {
    id: '3',
    term: 'Vukuzenzele',
    definition:
      'Wake up and do it for yourself - a call for self-reliance and empowerment',
    language: 'isiZulu',
    category: 'Motivation',
  },
  {
    id: '4',
    term: 'Khongolose',
    definition: 'To protect, preserve, or take care of something precious',
    language: 'isiXhosa',
    category: 'Action',
  },
  {
    id: '5',
    term: 'Sawubona',
    definition:
      'A greeting meaning "I see you" - acknowledging the whole person',
    language: 'isiZulu',
    category: 'Greeting',
  },
  {
    id: '6',
    term: 'Thokoza',
    definition: 'An expression of gratitude, praise, or acknowledgment',
    language: 'isiZulu',
    category: 'Expression',
  },
  {
    id: '7',
    term: 'Indaba',
    definition:
      'A meeting, discussion, or conference to address important matters',
    language: 'isiZulu',
    category: 'Communication',
  },
  {
    id: '8',
    term: 'Bophelo',
    definition:
      'Life in its fullest sense - encompassing vitality and existence',
    language: 'Sesotho',
    category: 'Life',
  },
  {
    id: '9',
    term: 'Harambee',
    definition:
      'Let us all pull together - a call for collective effort and unity',
    language: 'Swahili',
    category: 'Unity',
  },
  {
    id: '10',
    term: 'Mamlambo',
    definition:
      'River goddess in Zulu mythology, associated with prosperity and fortune',
    language: 'isiZulu',
    category: 'Mythology',
  },
];

const DashboardPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [letters, setLetters] = useState<Letter[]>([]);

  // Random terms state
  const [randomTerms, setRandomTerms] = useState<RandomTerm[]>([]);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);

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

  // Function to get random terms from API with offline support
  const getRandomTerms = useCallback(async () => {
    setIsLoadingTerms(true);

    try {
      // First, try to get cached data
      const cachedTerms = await getCachedRandomTerms();
      if (cachedTerms && navigator.onLine === false) {
        console.log('Using cached random terms (offline)');
        setRandomTerms(cachedTerms.terms);
        setIsLoadingTerms(false);
        return;
      }

      // If online, fetch fresh data
      const response = await fetch(`${API_ENDPOINTS.glossaryRandom}?count=3`);

      if (!response.ok) {
        throw new Error('Failed to fetch random terms');
      }

      const data = (await response.json()) as RandomTerm[];
      setRandomTerms(data);

      // Cache the fresh data
      const cacheData: RandomTermsCache = {
        id: 'latest',
        terms: data,
        timestamp: Date.now(),
      };
      await cacheRandomTerms(cacheData);
    } catch (error) {
      console.error('Error fetching random terms:', error);
      
      // Try cached data first if available
      const cachedTerms = await getCachedRandomTerms();
      if (cachedTerms) {
        console.log('Using cached random terms (fallback)');
        setRandomTerms(cachedTerms.terms);
      } else {
        // Fallback to mock data if no cache available
        const shuffled = [...MOCK_TERMS].sort(() => Math.random() - 0.5);
        setRandomTerms(shuffled.slice(0, 3));
      }
    } finally {
      setIsLoadingTerms(false);
    }
  }, []);

  // Function to handle category click
  const handleCategoryClick = useCallback(
    (categoryName: string) => {
      console.log('Navigating to glossary with category:', categoryName);

      // Navigate to the dynamic glossary route
      // Convert category name to URL-friendly format (lowercase, spaces to hyphens)
      const urlFriendlyCategory = categoryName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') // Remove duplicate hyphens
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      void navigate(`/glossary/${urlFriendlyCategory}`);
    },
    [navigate],
  );

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      void navigate('/login');
      return;
    }

    const fetchAndSetUserData = async () => {
      setIsLoadingUserData(true);
      
      // Try to get cached data first if offline
      if (!navigator.onLine) {
        const cachedProfile = await getCachedUserProfile();
        if (cachedProfile) {
          console.log('Using cached user profile (offline)');
          const userData: UserData = {
            uuid: cachedProfile.userData.id,
            firstName: cachedProfile.userData.first_name,
            lastName: cachedProfile.userData.last_name,
            email: cachedProfile.userData.email,
            profilePictureUrl: cachedProfile.userData.profile_pic_url,
          };
          setUserData(userData);
          setAvatarInitials(
            `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase(),
          );
          if (userData.profilePictureUrl) {
            void loadProfilePictureForUser(userData);
          }
          setIsLoadingUserData(false);
          return;
        }
      }

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
              email: apiData.email,
              profilePictureUrl: apiData.profile_pic_url,
            };
            setUserData(newUserData);
            setAvatarInitials(
              `${newUserData.firstName.charAt(0)}${newUserData.lastName.charAt(0)}`.toUpperCase(),
            );

            // Cache the fresh user data
            const cacheData: UserProfileCache = {
              id: 'latest',
              userData: apiData,
              timestamp: Date.now(),
            };
            await cacheUserProfile(cacheData);

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
            // Try cached data as fallback
            const cachedProfile = await getCachedUserProfile();
            if (cachedProfile) {
              console.log('Using cached user profile (fallback)');
              const userData: UserData = {
                uuid: cachedProfile.userData.id,
                firstName: cachedProfile.userData.first_name,
                lastName: cachedProfile.userData.last_name,
                email: cachedProfile.userData.email,
                profilePictureUrl: cachedProfile.userData.profile_pic_url,
              };
              setUserData(userData);
              setAvatarInitials(
                `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase(),
              );
            } else {
              void navigate('/login');
            }
          }
        } else {
          console.error('Failed to fetch user data from API:', response.status);
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          
          // Try cached data as fallback before navigating to login
          const cachedProfile = await getCachedUserProfile();
          if (cachedProfile) {
            console.log('Using cached user profile (API error fallback)');
            const userData: UserData = {
              uuid: cachedProfile.userData.id,
              firstName: cachedProfile.userData.first_name,
              lastName: cachedProfile.userData.last_name,
              email: cachedProfile.userData.email,
              profilePictureUrl: cachedProfile.userData.profile_pic_url,
            };
            setUserData(userData);
            setAvatarInitials(
              `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase(),
            );
          } else {
            localStorage.removeItem('accessToken'); // Token might be invalid
            localStorage.removeItem('userData');
            void navigate('/login');
          }
        }
      } catch (error) {
        console.error('Network or other error fetching user data:', error);
        
        // Try cached data as fallback before navigating to login
        const cachedProfile = await getCachedUserProfile();
        if (cachedProfile) {
          console.log('Using cached user profile (network error fallback)');
          const userData: UserData = {
            uuid: cachedProfile.userData.id,
            firstName: cachedProfile.userData.first_name,
            lastName: cachedProfile.userData.last_name,
            email: cachedProfile.userData.email,
            profilePictureUrl: cachedProfile.userData.profile_pic_url,
          };
          setUserData(userData);
          setAvatarInitials(
            `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase(),
          );
        } else {
          void navigate('/login'); // Fallback to login on critical error
        }
      } finally {
        setIsLoadingUserData(false);
      }
    };

    // Fetch user data
    void fetchAndSetUserData().catch(console.error);
  }, [navigate]);

  // Load random terms on component mount
  useEffect(() => {
    void getRandomTerms();
  }, [getRandomTerms]);

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
            <div className="profile-section">
              {t('dashboard.loadingProfile')}
            </div>
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
                    title={t('dashboard.goToProfile')}
                  >
                    {userData
                      ? `${userData.firstName} ${userData.lastName}`
                      : t('dashboard.userName')}
                  </h3>
                  <p>
                    {t('dashboard.userEmail')}:{' '}
                    {userData ? userData.email || 'N/A' : 'N/A'}
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
                <AnimatedLanguageCounter />

                {/* South Africa Map */}
                <div className="map-container">
                  <SouthAfricaMap width={600} height={400} />
                </div>

                <div className="intro-text">
                  <p>{t('dashboard.aboutMarito.intro')}</p>

                  <p>{t('dashboard.aboutMarito.mission')}</p>

                  <p className="team-credit">
                    {t('dashboard.aboutMarito.teamCredit')}
                  </p>
                </div>

                <div className="cta-section">
                  <a
                    href="https://www.dsfsi.co.za/"
                    className="cta-button primary-cta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('dashboard.aboutMarito.learnMoreDSFSI')}
                  </a>
                </div>
              </div>

              {/* Random Terms Section - Right Side */}
              <div className="sidebar-content">
                <div className="random-terms-section">
                  <div className="section-header">
                    <h2>{t('dashboard.discoverRandomTerms')}</h2>
                    <button
                      type="button"
                      className="refresh-terms-btn"
                      onClick={() => void getRandomTerms()}
                      disabled={isLoadingTerms}
                      title={t('dashboard.getNewTerms')}
                    >
                      {isLoadingTerms ? '⟳' : '↻'}
                    </button>
                  </div>

                  {isLoadingTerms ? (
                    <div className="terms-loading">
                      <p>{t('dashboard.loadingTerms')}</p>
                    </div>
                  ) : (
                    <div className="terms-grid">
                      {Array.isArray(randomTerms) &&
                        randomTerms.map((term) => (
                          <div key={term.id} className="term-card">
                            <div className="term-header">
                              <h3 className="term-title">{term.term}</h3>
                              <span className="term-language">
                                {term.language}
                              </span>
                            </div>
                            <p className="term-definition">{term.definition}</p>
                            <button
                              type="button"
                              className="term-category"
                              onClick={() => {
                                handleCategoryClick(term.category);
                              }}
                              title={t('dashboard.browseCategoryGlossary', {
                                category: term.category,
                              })}
                            >
                              {term.category}
                            </button>
                          </div>
                        ))}
                      {!Array.isArray(randomTerms) && (
                        <p>{t('dashboard.noTermsAvailable')}</p>
                      )}
                    </div>
                  )}
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
