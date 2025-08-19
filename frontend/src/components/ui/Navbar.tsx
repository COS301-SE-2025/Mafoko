import { useMemo, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../../styles/Navbar.scss';
import { useDarkMode } from './DarkModeComponent.tsx';
import { API_ENDPOINTS } from '../../config.ts';

// This should ideally be in a shared config file or environment variable
const USER_API_ENDPOINT = API_ENDPOINTS.getMe;

interface UserProfileApiResponse {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: 'contributor' | 'linguist' | 'admin';
}
interface UserData {
  uuid: string;
  firstName: string;
  lastName: string;
  role?: 'contributor' | 'linguist' | 'admin';
}

const Navbar = () => {
  const location = useLocation();
  const [isMainNavbarOpen, setIsMainNavbarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLinkColor] = useState('var(--navbar-accent-pink)');
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { t } = useTranslation();
  const [avatarInitials, setAvatarInitials] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('contributor'); // Default to contributor

  const accentColors = useMemo(() => ['pink', 'yellow', 'teal'], []);

  const getRandomAccentColor = () => {
    const randomIndex = Math.floor(Math.random() * accentColors.length);
    return `var(--navbar-accent-${accentColors[randomIndex]})`;
  };

  const allNavItems = useMemo(
    () => [
      {
        name: t('navigation.home'),
        path: '/dashboard',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        name: t('navigation.dictionary'),
        path: '/search',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        name: t('navigation.glossary'),
        path: '/glossary',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        name: 'Workspace',
        path: '/workspace',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        name: t('navigation.linguistApplication'),
        path: '/linguist-application',
        roles: ['contributor'],
      },
      {
        name: 'Feedback',
        path: '/feedback',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        name: 'Feedback Hub',
        path: '/feedbackhub',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        name: t('navigation.help'),
        path: '/help',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        name: t('navigation.settings'),
        path: '/settings',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        name: 'Contributor Page',
        path: '/contributor',
        roles: ['contributor'],
      },
      { name: 'Linguist Page', path: '/linguist', roles: ['linguist'] },
      { name: 'Admin Page', path: '/admin/terms', roles: ['admin'] },
      { name: 'Analytics', path: '/analytics', roles: ['admin', 'linguist'] },
    ],
    [t],
  );

  const getFilteredNavItems = (role: string) => {
    return allNavItems.filter((item) => item.roles.includes(role));
  };

  useEffect(() => {
    const fetchAndSetUserData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setAvatarInitials('');
        setUserRole('contributor');
        return;
      }
      const storedUserDataString = localStorage.getItem('userData');
      if (storedUserDataString) {
        try {
          const parsedData = JSON.parse(storedUserDataString) as UserData;
          if (parsedData.firstName && parsedData.lastName) {
            setAvatarInitials(
              `${parsedData.firstName.charAt(0)}${parsedData.lastName.charAt(0)}`.toUpperCase(),
            );
          } else if (parsedData.firstName) {
            setAvatarInitials(parsedData.firstName.charAt(0).toUpperCase());
          } else {
            setAvatarInitials('U');
          }
          if (parsedData.role) {
            setUserRole(parsedData.role);
          }
          return;
        } catch (error) {
          console.error(
            'Navbar: Failed to parse user data from localStorage, fetching from API.',
            error,
          );
          localStorage.removeItem('userData');
        }
      }

      try {
        const response = await fetch(USER_API_ENDPOINT, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (response.ok) {
          const apiData = (await response.json()) as UserProfileApiResponse;
          const newUserData: UserData = {
            uuid: apiData.id,
            firstName: apiData.first_name,
            lastName: apiData.last_name,
            role: apiData.role,
          };
          localStorage.setItem('userData', JSON.stringify(newUserData));
          setAvatarInitials(
            `${newUserData.firstName.charAt(0)}${newUserData.lastName.charAt(0)}`.toUpperCase(),
          );
          setUserRole(newUserData.role || 'contributor');
        } else {
          console.error(
            'Navbar: Failed to fetch user data from API:',
            response.status,
            await response.text(),
          );
          setAvatarInitials('');
          setUserRole('contributor');
        }
      } catch (error) {
        console.error(
          'Navbar: Network or other error fetching user data:',
          error,
        );
        setAvatarInitials('');
        setUserRole('contributor');
      }
    };
    void fetchAndSetUserData();
  }, [location.pathname, accentColors]);

  const handleLinkClick = () => {
    setIsMainNavbarOpen(false);
    setIsMobileMenuOpen(false);
  };

  const navItemsToDisplay = getFilteredNavItems(userRole);

  return (
    <>
      {/* Outer fixed hamburger button (always visible) */}
      <div
        className={`fixed-outer-navbar-toggle ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
      >
        <button
          className="outer-toggle-button"
          onClick={() => {
            setIsMainNavbarOpen(!isMainNavbarOpen);
          }}
          aria-label="Toggle main navigation"
          type="button"
        >
          {isMainNavbarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* The main navbar, which now slides in/out as a dropdown */}
      <nav
        className={`main-navbar-dropdown ${isMainNavbarOpen ? 'is-open' : 'is-closed'} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
      >
        <div className="main-navbar-content">
          <div className="navbar-left-content">
            {/* Logo and Title */}
            <div className="navbar-brand">
              <img
                src="public/DFSI_Logo.png"
                alt="Marito Logo"
                className="navbar-logo"
              />
              <span className="navbar-title">Marito</span>
            </div>
            {/* Inner Hamburger for mobile menu (only visible on small screens) */}
            <button
              className="mobile-menu-toggle md:hidden"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              aria-label="Toggle mobile menu"
              type="button"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className="navbar-right-content">
            {/* User controls (Avatar, Theme Toggle) */}
            <div className="navbar-user-controls">
              <button
                onClick={toggleDarkMode}
                className="navbar-toggle-darkmode"
                type="button"
                aria-label="Toggle dark mode"
              >
                {t('navigation.darkMode')}
              </button>
              <div className="navbar-avatar">{avatarInitials || ''}</div>
            </div>
          </div>
        </div>
        {/* Mobile navigation menu (slides down from inner hamburger) */}
        <div
          className={`mobile-nav-dropdown md:hidden ${isMobileMenuOpen ? 'is-open' : 'is-closed'}`}
        >
          {navItemsToDisplay.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={`mobile-nav-link ${
                location.pathname.startsWith(item.path) ? 'font-semibold' : ''
              }`}
              style={({ isActive }) => ({
                color: isActive ? activeLinkColor : 'inherit',
                '--hover-color': getRandomAccentColor(),
              })}
              onClick={() => {
                handleLinkClick();
              }}
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
