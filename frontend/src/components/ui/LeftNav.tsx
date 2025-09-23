import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/LeftNav.scss';
import { useDarkMode } from './DarkModeComponent.tsx';
import { ChevronDown, BookOpen } from 'lucide-react';
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

interface UserData {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
}

const LeftNav: React.FC<LeftNavProps> = ({ activeItem, setActiveItem }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('contributor');
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['main-navigation']),
  );
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );
  const [avatarInitials, setAvatarInitials] = useState('');
  const { isDarkMode } = useDarkMode();
  const allMenuItems = useMemo(
    () => [
      {
        id: 'dashboard',
        label: t('navigation.home'),
        path: '/dashboard',
        roles: ['admin', 'contributor', 'linguist'],
        group: 'main-navigation',
      },
      {
        id: 'analytics',
        label: 'Dashboard',
        path: '/analytics',
        roles: ['admin', 'contributor', 'linguist'],
        group: 'main-navigation',
      },
      {
        id: 'search',
        label: t('navigation.dictionary'),
        path: '/search',
        roles: ['admin', 'contributor', 'linguist'],
        group: 'main-navigation',
      },
      {
        id: 'glossary',
        label: t('navigation.glossary'),
        path: '/glossary',
        roles: ['admin', 'contributor', 'linguist'],
        group: 'main-navigation',
      },
      {
        id: 'achievements',
        label: 'Achievements',
        path: '/achievements',
        roles: ['admin', 'contributor', 'linguist'],
        group: 'main-navigation',
      },
      {
        id: 'workspace',
        label: 'Workspace',
        path: '/workspace',
        roles: ['admin', 'contributor', 'linguist'],
        group: 'work-tools',
      },
      {
        id: 'learning-path',
        label: 'Learning Path',
        path: '/learning-path',
        roles: ['admin', 'contributor', 'linguist'],
        group: 'work-tools',
        icon: BookOpen,
      },
      {
        id: 'linguist-application',
        label: t('navigation.linguistApplication'),
        path: '/linguist-application',
        roles: ['contributor'],
        group: 'work-tools',
      },
      {
        id: 'contributor-page',
        label: 'Contributor',
        path: '/contributor',
        roles: ['contributor'],
        group: 'work-tools',
      },
      {
        id: 'linguist-page',
        label: 'Linguist',
        path: '/linguist',
        roles: ['linguist'],
        group: 'work-tools',
      },
      {
        id: 'feedback',
        label: 'Feedback',
        path: '/feedback',
        roles: ['admin', 'contributor', 'linguist'],
        group: 'support-feedback',
      },
      {
        id: 'help',
        label: t('navigation.help'),
        path: '/help',
        roles: ['admin', 'contributor', 'linguist'],
        group: 'support-feedback',
      },
      {
        id: 'settings',
        label: t('navigation.settings'),
        path: '/settings',
        roles: ['admin', 'contributor', 'linguist'],
        group: 'account',
      },
      {
        id: 'admin-page',
        label: 'Admin',
        path: '/admin/terms',
        roles: ['admin'],
        group: 'work-tools',
      },
    ],
    [t],
  );

  const menuGroups = useMemo(
    () => [
      {
        id: 'main-navigation',
        label: 'Main Navigation',
        items: allMenuItems.filter(
          (item) =>
            item.group === 'main-navigation' && item.roles.includes(userRole),
        ),
      },
      {
        id: 'work-tools',
        label: 'Work & Tools',
        items: allMenuItems.filter(
          (item) =>
            item.group === 'work-tools' && item.roles.includes(userRole),
        ),
      },
      {
        id: 'support-feedback',
        label: 'Support & Feedback',
        items: allMenuItems.filter(
          (item) =>
            item.group === 'support-feedback' && item.roles.includes(userRole),
        ),
      },
      {
        id: 'account',
        label: 'Account',
        items: allMenuItems.filter(
          (item) => item.group === 'account' && item.roles.includes(userRole),
        ),
      },
    ],
    [allMenuItems, userRole],
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
          const parsed = JSON.parse(storedUserData) as UserData;
          if (parsed.uuid) {
            setUserData(parsed);
            setAvatarInitials(
              `${parsed.firstName.charAt(0)}${parsed.lastName.charAt(0)}`.toUpperCase(),
            );
          }
          if (parsed.firstName && 'role' in parsed) {
            setUserRole((parsed as any).role);
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
          const newUserData: UserData = {
            uuid: userData.id,
            firstName: userData.first_name,
            lastName: userData.last_name,
            email: userData.email || 'N/A',
          };
          setUserData(newUserData);
          setAvatarInitials(
            `${newUserData.firstName.charAt(0)}${newUserData.lastName.charAt(0)}`.toUpperCase(),
          );
          localStorage.setItem(
            'userData',
            JSON.stringify({ ...userData, role: userData.role }),
          );
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

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      return newExpanded;
    });
  };

  const toggleAdminDropdown = () =>
    setIsAdminDropdownOpen(!isAdminDropdownOpen);

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
        {menuGroups.map((group) => (
          <div key={group.id} className="nav-group">
            <div
              className="nav-group-header"
              onClick={() => toggleGroup(group.id)}
            >
              <span className="nav-group-label">{group.label}</span>
              <ChevronDown
                size={16}
                className={`nav-group-chevron ${expandedGroups.has(group.id) ? 'rotated' : ''}`}
              />
            </div>
            {expandedGroups.has(group.id) && (
              <div className="nav-group-items">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className={`left-nav-menu-item ${activeItem === item.id ? 'active' : ''}`}
                    onClick={() => handleItemClick(item.id, item.path)}
                  >
                    <span className="left-nav-menu-label">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
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

      {/* Profile Section */}
      {userData && (
        <div className="left-nav-footer">
          <div className="profile-section">
            <div className="profile-info">
              <div className="profile-avatar">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile Picture"
                    onError={() => {
                      setProfilePictureUrl(null);
                    }}
                  />
                ) : (
                  avatarInitials
                )}
              </div>
              <div className="profile-details">
                <h3
                  onClick={() => {
                    void navigate('/profile');
                  }}
                  title="Go to Profile"
                >
                  {userData.firstName} {userData.lastName}
                </h3>
                <p>Email: {userData.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftNav;
