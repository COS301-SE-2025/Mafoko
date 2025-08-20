import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/LeftNav.scss';
import { useDarkMode } from './DarkModeComponent.tsx';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import { API_ENDPOINTS } from '../../config.ts';
interface LeftNavProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

interface UserProfileApiResponse {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: 'contributor' | 'linguist' | 'admin';
}

const LeftNav: React.FC<LeftNavProps> = ({ activeItem, setActiveItem }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('contributor');
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const allMenuItems = useMemo(
    () => [
      {
        id: 'dashboard',
        label: t('navigation.home'),
        path: '/dashboard',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        id: 'search',
        label: t('navigation.dictionary'),
        path: '/search',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        id: 'glossary',
        label: t('navigation.glossary'),
        path: '/glossary',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        id: 'workspace',
        label: 'Workspace',
        path: '/workspace',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        id: 'linguist-application',
        label: t('navigation.linguistApplication'),
        path: '/linguist-application',
        roles: ['contributor'],
      },
      {
        id: 'analytics',
        label: t('navigation.dashboard'),
        path: '/analytics',
        roles: ['admin', 'linguist'],
      },
      {
        id: 'feedback',
        label: 'Feedback',
        path: '/feedback',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        id: 'help',
        label: t('navigation.help'),
        path: '/help',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        id: 'settings',
        label: t('navigation.settings'),
        path: '/settings',
        roles: ['admin', 'contributor', 'linguist'],
      },
      {
        id: 'contributor-page',
        label: 'Contributor',
        path: '/contributor',
        roles: ['contributor'],
      },
      {
        id: 'linguist-page',
        label: 'Linguist',
        path: '/linguist',
        roles: ['linguist'],
      },
      {
        id: 'admin-page',
        label: 'Admin',
        path: '/admin/terms',
        roles: ['admin'],
      },
    ],
    [t],
  );

  const adminSubmenuItems = [
    { id: 'admin', label: 'User Management', path: '/admin' },
    { id: 'feedbackhub', label: 'Feedback Hub', path: '/feedbackhub' },
  ];

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUserRole('contributor');
        return;
      }

      // Try localStorage first
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        try {
          const parsed = JSON.parse(storedUserData);
          if (parsed.role) {
            setUserRole(parsed.role);
            return;
          }
        } catch {
          // fallback to API
        }
      }

      try {
        const response = await fetch(API_ENDPOINTS.getMe, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (response.ok) {
          const userData = (await response.json()) as UserProfileApiResponse;
          setUserRole(userData.role);
          localStorage.setItem('userData', JSON.stringify(userData));
        } else {
          setUserRole('contributor');
        }
      } catch (error) {
        console.error('LeftNav fetch error:', error);
        setUserRole('contributor');
      }
    };

    void fetchUserRole();
  }, []);

  const handleItemClick = (itemId: string, path: string) => {
    setActiveItem(itemId);
    void navigate(path);
  };

  const toggleAdminDropdown = () =>
    setIsAdminDropdownOpen(!isAdminDropdownOpen);

  const handleAdminItemClick = (itemId: string, path: string) => {
    setActiveItem(itemId);
    void navigate(path);
    setIsAdminDropdownOpen(false);
  };

  const menuItemsToDisplay = allMenuItems.filter((item) =>
    item.roles.includes(userRole),
  );

  return (
    <div className={`left-nav ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <div className="left-nav-header">
        <div className="left-nav-title-section">
          <h2 className="left-nav-app-title" style={{ fontSize: '32px' }}>
            Marito
          </h2>
        </div>
        <div className="logo-container">
          <img
            src="/Marito/icons/maskable_icon_x512.png"
            alt="DFSI Logo"
            className="dfsi-logo"
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="left-nav-navigation-menu">
        {menuItemsToDisplay.map((item) => (
          <div
            key={item.id}
            className={`left-nav-menu-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => handleItemClick(item.id, item.path)}
          >
            <span className="left-nav-menu-label">{item.label}</span>
          </div>
        ))}

        {/* Admin Dropdown */}
        {userRole === 'admin' && (
          <div className="left-nav-admin-section">
            <div
              className={`left-nav-menu-item admin-menu-item ${adminSubmenuItems.some((sub) => activeItem === sub.id) ? 'active' : ''}`}
              onClick={toggleAdminDropdown}
            >
              <div className="admin-menu-content">
                <span className="left-nav-menu-label">Admin</span>
                <ChevronDown
                  size={16}
                  className={isAdminDropdownOpen ? 'rotated' : ''}
                />
              </div>
            </div>
            {isAdminDropdownOpen && (
              <div className="admin-submenu">
                {adminSubmenuItems.map((sub) => (
                  <div
                    key={sub.id}
                    className={`admin-submenu-item ${activeItem === sub.id ? 'active' : ''}`}
                    onClick={() => handleAdminItemClick(sub.id, sub.path)}
                  >
                    <span className="submenu-label">{sub.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Dark Mode Toggle */}
      <div className="left-nav-footer">
        <div className="dark-mode-toggle" onClick={toggleDarkMode}>
          <div className="toggle-container">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="toggle-label">
              {isDarkMode
                ? t('navigation.lightMode')
                : t('navigation.darkMode')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftNav;
