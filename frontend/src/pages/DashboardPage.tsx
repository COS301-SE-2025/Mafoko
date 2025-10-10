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
  const { t } = useTranslation();
  const [count, setCount] = useState(1);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let textTimer: NodeJS.Timeout;

    // Start counting animation after a short delay
    const timer = setTimeout(() => {
      let currentCount = 1;
      interval = setInterval(() => {
        setCount(currentCount);
        currentCount += 1;
        if (currentCount > 11) {
          clearInterval(interval);
          // Show the rest of the text after counting is done
          textTimer = setTimeout(() => {
            setShowText(true);
          }, 300);
        }
      }, 250); // Count every 250ms
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      clearTimeout(textTimer);
    };
  }, []);

  return (
    <div className="animated-title">
      <span className="connecting-text">{t('homePage.connecting')}&nbsp;</span>
      <span className="animated-number">{count}</span>
      {showText && (
        <span className="languages-text fade-in">
          {' '}
          {t('homePage.languages')}...
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
  first_name?: string;
  last_name?: string;
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

const DashboardPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [letters, setLetters] = useState<Letter[]>([]);

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

  // Random terms state
  const [randomTerms, setRandomTerms] = useState<RandomTerm[]>([]);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);

  const colors = useMemo(
    () => ['#00CEAF', '#212431', '#F7074D', '#F2D001'],
    [],
  );
  const alphabet = useMemo(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), []);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [avatarInitials, setAvatarInitials] = useState<string>('');
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
      if (cachedTerms && !navigator.onLine) {
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
          if (userData) {
            if (userData.first_name && userData.last_name) {
              setAvatarInitials(
                `${userData.first_name.charAt(0)}${userData.last_name.charAt(0)}`.toUpperCase(),
              );
            } else if (userData.first_name) {
              setAvatarInitials(userData.first_name.charAt(0).toUpperCase());
            } else if (userData.firstName && userData.lastName) {
              setAvatarInitials(
                `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase(),
              );
            }
          } else {
            if (parsedData.first_name && parsedData.last_name) {
              setAvatarInitials(
                `${parsedData.first_name.charAt(0)}${parsedData.last_name.charAt(0)}`.toUpperCase(),
              );
            } else if (parsedData.first_name) {
              setAvatarInitials(parsedData.first_name.charAt(0).toUpperCase());
            } else if (parsedData.firstName && parsedData.lastName) {
              setAvatarInitials(
                `${parsedData.firstName.charAt(0)}${parsedData.lastName.charAt(0)}`.toUpperCase(),
              );
            }
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
              first_name: apiData.first_name,
              last_name: apiData.last_name,
              email: apiData.email,
              profilePictureUrl: apiData.profile_pic_url,
            };
            setUserData(newUserData);

            if (newUserData.first_name && newUserData.last_name) {
              setAvatarInitials(
                `${newUserData.first_name.charAt(0)}${newUserData.last_name.charAt(0)}`.toUpperCase(),
              );
            } else if (newUserData.firstName && newUserData.lastName) {
              setAvatarInitials(
                `${newUserData.firstName.charAt(0)}${newUserData.lastName.charAt(0)}`.toUpperCase(),
              );
            } else {
              setAvatarInitials('');
            }

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
              if (userData.first_name && userData.last_name) {
                setAvatarInitials(
                  `${userData.first_name.charAt(0)}${userData.last_name.charAt(0)}`.toUpperCase(),
                );
              } else if (userData.firstName && userData.lastName) {
                setAvatarInitials(
                  `${userData.firstName.charAt(0)}userData{parsedData.lastName.charAt(0)}`.toUpperCase(),
                );
              } else {
                setAvatarInitials('');
              }
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
            if (userData.first_name && userData.last_name) {
              setAvatarInitials(
                `${userData.first_name.charAt(0)}${userData.last_name.charAt(0)}`.toUpperCase(),
              );
            } else if (userData.firstName && userData.lastName) {
              setAvatarInitials(
                `${userData.firstName.charAt(0)}userData{parsedData.lastName.charAt(0)}`.toUpperCase(),
              );
            } else {
              setAvatarInitials('');
            }
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
          if (userData.first_name && userData.last_name) {
            setAvatarInitials(
              `${userData.first_name.charAt(0)}${userData.last_name.charAt(0)}`.toUpperCase(),
            );
          } else if (userData.firstName && userData.lastName) {
            setAvatarInitials(
              `${userData.firstName.charAt(0)}userData{parsedData.lastName.charAt(0)}`.toUpperCase(),
            );
          } else {
            setAvatarInitials('');
          }
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

      <div className="main-content dashboard-main-content">
        <div className="top-bar">
          <div className="welcome-section"></div>
          {isLoadingUserData ? (
            <div className="profile-section">
              {t('dashboard.loadingProfile')}
            </div>
          ) : (
            <div className="shadow-md rounded-md p-4 flex flex-row gap-7 bg-theme">
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
                <div className="profile-details text-left">
                  <h3
                    style={{
                      color: isDarkMode ? '#f0f0f0' : '#333333',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      void navigate('/profile');
                    }}
                    title={t('dashboard.goToProfile')}
                  >
                    {userData
                      ? `${userData.first_name || ''} ${userData.last_name || ''}`
                      : t('dashboard.userName')}
                  </h3>
                  <p>{userData ? userData.email || 'N/A' : 'N/A'}</p>
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
                  {/*<p>{t('dashboard.aboutMarito.intro')}</p>

                  <p>{t('dashboard.aboutMarito.mission')}</p>*/}

                  <section className="about-mafoko max-w-4xl mx-auto px-4 sm:px-6 py-10 text-[var(--text-theme)] leading-relaxed text-left">
                    <h2 className="!text-3xl font-bold mb-4 text-primary">
                      {t('dashboard.aboutMofoko.title')}
                    </h2>
                    <p className="text-lg mb-6">
                      {t('dashboard.aboutMofoko.content')}
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-3">
                      {t('dashboard.whyMafoko.title')}
                    </h2>
                    <p className="mt-2">{t('dashboard.whyMafoko.content')}</p>
                    <p className="mt-4">{t('dashboard.whyMafoko.content2')}</p>
                    <p className="mt-4">{t('dashboard.whyMafoko.content3')}</p>

                    <h2 className="text-2xl font-semibold mt-8 mb-3">
                      {t('dashboard.whoMafoko.title')}
                    </h2>
                    <p>{t('dashboard.whoMafoko.content')}</p>

                    <h2 className="text-2xl font-semibold mt-8 mb-3">
                      {t('dashboard.howMafoko.title')}
                    </h2>
                    <p className="mt-2">{t('dashboard.howMafoko.content')}</p>
                    <p className="mt-4">
                      {t('dashboard.howMafoko.help')}{' '}
                      <a href="/help" className="!text-[#00ceaf] underline">
                        {t('dashboard.howMafoko.helpLink')}
                      </a>
                      .
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-3">
                      {t('dashboard.behindProject.title')}
                    </h2>
                    <p>{t('dashboard.behindProject.content')}</p>
                  </section>

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
                          <div
                            key={term.id}
                            className="term-card flex flex-col gap-5"
                          >
                            <div className="term-header flex flex-row gap-5 bg-pink">
                              <div>
                                <span className="term-language">
                                  {term.language}
                                </span>
                              </div>
                              <div className="w-full truncate overflow-hidden whitespace-nowrap">
                                <h3 className="term-title w-[80%]">
                                  {term.term}
                                </h3>
                              </div>
                            </div>
                            <p className="term-definition">{term.definition}</p>
                            <div className="flex w-full justify-center items-center">
                              <button
                                type="button"
                                className="term-category w-[90%] truncate overflow-hidden whitespace-nowrap"
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
