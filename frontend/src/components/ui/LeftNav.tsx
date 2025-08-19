import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/LeftNav.scss';
import { useDarkMode } from './DarkModeComponent.tsx';
import { API_ENDPOINTS } from '../../config.ts';
import { Sun, Moon } from 'lucide-react';

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
  const location = useLocation();
  const { isDarkMode } = useDarkMode();
  const [userRole, setUserRole] = useState<string>('contributor');

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
        id: 'feedbackhub',
        label: 'Feedback Hub',
        path: '/feedbackhub',
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

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUserRole('contributor');
        return;
      }
      try {
        const response = await fetch(API_ENDPOINTS.getMe, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (response.ok) {
          const apiData = (await response.json()) as UserProfileApiResponse;
          setUserRole(apiData.role);
          const currentPath = location.pathname;
          const currentItem = allMenuItems.find(
            (item) => item.path === currentPath,
          );
          if (currentItem) {
            setActiveItem(currentItem.id);
          }
        } else {
          setUserRole('contributor');
        }
      } catch (error) {
        console.error('LeftNav: Failed to fetch user role.', error);
        setUserRole('contributor');
      }
    };
    void fetchUserRole();
  }, [location.pathname, allMenuItems, setActiveItem]);

  const handleItemClick = (itemId: string, path: string) => {
    setActiveItem(itemId);
    void navigate(path);
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
            onClick={() => {
              handleItemClick(item.id, item.path);
            }}
          >
            <span className="left-nav-menu-label">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Dark Mode Toggle - Bottom of sidebar */}
      <div className="left-nav-footer">
        <div className="dark-mode-toggle">
          <div className="toggle-container">
            {isDarkMode ? (
              <Sun size={18} className="toggle-icon" />
            ) : (
              <Moon size={18} className="toggle-icon" />
            )}
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
