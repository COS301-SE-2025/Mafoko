import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/LeftNav.scss';
import { useDarkMode } from './DarkModeComponent.tsx';
import { ChevronDown } from 'lucide-react';
import { API_ENDPOINTS } from '../../config.ts';

interface LeftNavProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const LeftNav: React.FC<LeftNavProps> = ({ activeItem, setActiveItem }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const [userRole, setUserRole] = useState<string>('');
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: t('navigation.home'), path: '/dashboard' },
    { id: 'search', label: t('navigation.dictionary'), path: '/search' },
    { id: 'glossary', label: t('navigation.glossary'), path: '/glossary' },
    { id: 'workspace', label: 'Workspace', path: '/workspace' },
    {
      id: 'linguist-application',
      label: t('navigation.linguistApplication'),
      path: '/linguist-application',
    },
    { id: 'analytics', label: t('navigation.dashboard'), path: '/analytics' },
    { id: 'feedback', label: 'Feedback', path: '/feedback' },
    { id: 'help', label: t('navigation.help'), path: '/help' },
    { id: 'settings', label: t('navigation.settings'), path: '/settings' },
  ];

  const adminSubmenuItems = [
    { id: 'admin', label: 'User Management', path: '/admin' },
    { id: 'feedbackhub', label: 'Feedback Hub', path: '/feedbackhub' },
  ];

  // Fetch user role on component mount
  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUserRole('');
        return;
      }

      // First check localStorage
      const storedUserDataString = localStorage.getItem('userData');
      if (storedUserDataString) {
        try {
          const parsedData = JSON.parse(storedUserDataString) as {
            role?: string;
          };
          if (parsedData.role) {
            setUserRole(parsedData.role);
            return;
          }
        } catch (error) {
          console.error(
            'LeftNav: Failed to parse user data from localStorage',
            error,
          );
        }
      }

      // Fetch from API if not in localStorage
      try {
        const response = await fetch(API_ENDPOINTS.getMe, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (response.ok) {
          const userData = (await response.json()) as { role?: string };
          setUserRole(userData.role || '');

          // Update localStorage with role
          if (storedUserDataString) {
            try {
              const existingData = JSON.parse(storedUserDataString);
              const updatedData = { ...existingData, role: userData.role };
              localStorage.setItem('userData', JSON.stringify(updatedData));
            } catch (error) {
              console.error(
                'LeftNav: Failed to update localStorage with role',
                error,
              );
            }
          }
        } else {
          console.error('LeftNav: Failed to fetch user data');
          setUserRole('');
        }
      } catch (error) {
        console.error('LeftNav: Error fetching user role', error);
        setUserRole('');
      }
    };

    void fetchUserRole();
  }, []);

  const handleItemClick = (itemId: string, path: string) => {
    setActiveItem(itemId);
    void navigate(path);
  };

  const toggleAdminDropdown = () => {
    setIsAdminDropdownOpen(!isAdminDropdownOpen);
  };

  const handleAdminItemClick = (itemId: string, path: string) => {
    setActiveItem(itemId);
    void navigate(path);
    setIsAdminDropdownOpen(false);
  };

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
        {menuItems
          .filter((item) => {
            // Hide regular Feedback item for admin users since they have admin dropdown access
            if (item.id === 'feedback' && userRole === 'admin') {
              return false;
            }
            return true;
          })
          .map((item) => (
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

        {/* Admin Menu Item with Dropdown */}
        {userRole === 'admin' && (
          <div className="left-nav-admin-section">
            <div
              className={`left-nav-menu-item admin-menu-item ${
                adminSubmenuItems.some((subItem) => activeItem === subItem.id)
                  ? 'active'
                  : ''
              }`}
              onClick={toggleAdminDropdown}
            >
              <div className="admin-menu-content">
                <span className="left-nav-menu-label">Admin</span>
                <ChevronDown
                  size={16}
                  className={`admin-chevron ${isAdminDropdownOpen ? 'rotated' : ''}`}
                />
              </div>
            </div>

            {/* Admin Submenu */}
            {isAdminDropdownOpen && (
              <div className="admin-submenu">
                {adminSubmenuItems.map((subItem) => (
                  <div
                    key={subItem.id}
                    className={`admin-submenu-item ${activeItem === subItem.id ? 'active' : ''}`}
                    onClick={() => {
                      handleAdminItemClick(subItem.id, subItem.path);
                    }}
                  >
                    <span className="submenu-label">{subItem.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Dark Mode Toggle - Bottom of sidebar */}
      {/* <div className="left-nav-footer">
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
            <ToggleSwitch
              label=""
              checked={isDarkMode}
              onChange={toggleDarkMode}
            />
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default LeftNav;
