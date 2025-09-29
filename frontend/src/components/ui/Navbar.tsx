import { useMemo, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../../styles/Navbar.scss';
import { useDarkMode } from './DarkModeComponent.tsx';
import { API_ENDPOINTS } from '../../config.ts';

interface UserProfileApiResponse {
  id: string;
  first_name: string;
  last_name: string;
  role: 'contributor' | 'linguist' | 'admin';
}
interface UserData {
  uuid: string;
  firstName: string;
  lastName: string;
  role?: 'contributor' | 'linguist' | 'admin';
}

const Navbar = () => {
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const [isMainNavbarOpen, setIsMainNavbarOpen] = useState(false);
  const [avatarInitials, setAvatarInitials] = useState('');
  const [userRole, setUserRole] = useState<string>('contributor');
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);

  const allNavItems = useMemo(
    () => [
      {
        name: t('navigation.home'),
        path: '/dashboard',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        name: 'Analytics',
        path: '/analytics',
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
        name: 'Achievements',
        path: '/achievements',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        name: 'Workspace',
        path: '/workspace',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        name: 'Learning Path',
        path: '/learning-path',
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
    ],
    [t],
  );

  const adminSubmenuItems = useMemo(
    () => [
      { id: 'admin', label: 'User Management', path: '/admin' },
      { id: 'feedbackhub', label: 'Feedback Hub', path: '/feedbackhub' },
    ],
    [],
  );

  const navItemsToDisplay = useMemo(
    () => allNavItems.filter((item) => item.roles.includes(userRole)),
    [allNavItems, userRole],
  );

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const stored = localStorage.getItem('userData');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as UserData;
          setUserRole(parsed.role || 'contributor');
          setAvatarInitials(
            parsed.firstName && parsed.lastName
              ? `${parsed.firstName[0]}${parsed.lastName[0]}`.toUpperCase()
              : 'U',
          );
          return;
        } catch {
          localStorage.removeItem('userData');
        }
      }

      try {
        const res = await fetch(API_ENDPOINTS.getMe, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (res.ok) {
          const data: UserProfileApiResponse = await res.json();
          setUserRole(data.role);
          setAvatarInitials(
            `${data.first_name[0]}${data.last_name[0]}`.toUpperCase(),
          );
          localStorage.setItem(
            'userData',
            JSON.stringify({
              uuid: data.id,
              firstName: data.first_name,
              lastName: data.last_name,
              role: data.role,
            }),
          );
        }
      } catch (err) {
        console.error('Navbar fetch error:', err);
      }
    };

    void fetchUserData();
  }, []);

  const toggleAdminDropdown = () => setIsAdminDropdownOpen((prev) => !prev);

  const handleAdminItemClick = () => setIsAdminDropdownOpen(false);

  const handleLinkClick = () => {
    setIsMainNavbarOpen(false);
  };

  return (
    <>
      {/* Hamburger button */}
      <div
        className={`fixed-outer-navbar-toggle ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
      >
        <button
          onClick={() => setIsMainNavbarOpen(!isMainNavbarOpen)}
          type="button"
        >
          {isMainNavbarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Main Navbar */}
      <nav
        className={`main-navbar-dropdown ${isMainNavbarOpen ? 'is-open' : 'is-closed'} ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
      >
        <div className="main-navbar-content"></div>

        {/* Mobile Menu */}
        <div
          className={`mobile-nav-dropdown md:hidden ${
            isMainNavbarOpen ? 'is-open' : 'is-closed'
          }`}
        >
          {navItemsToDisplay.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className="mobile-nav-link"
              onClick={handleLinkClick}
            >
              {item.name}
            </NavLink>
          ))}

          {userRole === 'admin' && (
            <>
              <div
                className="mobile-admin-toggle"
                onClick={toggleAdminDropdown}
              >
                Admin
              </div>
              {isAdminDropdownOpen &&
                adminSubmenuItems.map((sub) => (
                  <NavLink
                    key={sub.id}
                    to={sub.path}
                    className="mobile-admin-submenu-item"
                    onClick={handleAdminItemClick}
                  >
                    {sub.label}
                  </NavLink>
                ))}
            </>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
