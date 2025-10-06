import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/LeftNav.scss';
import { useDarkMode } from './DarkModeComponent.tsx';
import { API_ENDPOINTS } from '../../config.ts';
import {
  useProfilePicture,
  handleProfilePictureError,
} from '../../hooks/useProfilePicture';

import {
  Settings,
  Trophy,
  PenTool,
  Briefcase,
  Book,
  Search,
  BookOpen,
  HelpCircle,
  MessageSquare,
  BarChart3,
  Shield,
  ChevronDown,
  House,
  BadgeCheck,
  Plus,
} from 'lucide-react';

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
  const [avatarInitials, setAvatarInitials] = useState('');

  const {
    profilePictureUrl,
    loadingProfilePicture,
    clearProfilePictureCache,
    loadProfilePicture,
  } = useProfilePicture(userData?.uuid);
  const { isDarkMode } = useDarkMode();

  const menuGroups = useMemo(
    () => [
      {
        id: 'main-navigation',
        label: 'Main Navigation',
        items: [
          {
            id: 'dashboard',
            label: t('navigation.home'),
            path: '/dashboard',
            icon: House,
          },
          {
            id: 'analytics',
            label: 'Dashboard',
            path: '/analytics',
            icon: BarChart3,
          },
        ],
      },
      {
        id: 'workspace-tools',
        label: 'Workspace & Tools',
        items: [
          {
            id: 'workspace',
            label: 'Workspace',
            path: '/workspace',
            icon: Briefcase,
          },
          {
            id: 'glossary',
            label: t('navigation.glossary'),
            path: '/glossary',
            icon: Book,
          },
          {
            id: 'search',
            label: t('navigation.dictionary'),
            path: '/search',
            icon: Search,
          },
          {
            id: 'learning-path',
            label: 'Learning Paths',
            path: '/learning-path',
            icon: BookOpen,
          },
          {
            id: 'contributor-page',
            label: 'Term Additions',
            path: '/contributor',
            icon: Plus,
          },
          {
            id: 'linguist-page',
            label: 'Linguist',
            path: '/linguist',
            icon: BadgeCheck,
          },
          ...(userRole === 'admin'
            ? [
                {
                  id: 'admin-page',
                  label: 'Admin',
                  path: '/admin/terms',
                  icon: Shield,
                },
              ]
            : []),
        ],
      },
      {
        id: 'profile-account',
        label: 'Profile & Account',
        items: [
          {
            id: 'settings',
            label: t('navigation.settings'),
            path: '/settings',
            icon: Settings,
          },
          {
            id: 'achievements',
            label: 'Achievements',
            path: '/achievements',
            icon: Trophy,
          },
          {
            id: 'linguist-application',
            label: t('navigation.linguistApplication'),
            path: '/linguist-application',
            icon: PenTool,
          },
        ],
      },
      {
        id: 'support-feedback',
        label: 'Support & Feedback',
        items: [
          {
            id: 'help',
            label: t('navigation.help'),
            path: '/help',
            icon: HelpCircle,
          },
          {
            id: 'feedback',
            label: 'Feedback',
            path: '/feedback',
            icon: MessageSquare,
          },
        ],
      },
    ],
    [t, userRole],
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

  useEffect(() => {
    const parentGroup = menuGroups.find((group) =>
      group.items.some((item) => item.id === activeItem),
    );

    setExpandedGroups(() => {
      const newSet = new Set<string>();
      if (parentGroup) newSet.add(parentGroup.id); // only expand current section
      return newSet;
    });
  }, [activeItem, menuGroups]);

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
        <div className="left-nav-atitle-section">
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
                    onClick={() => handleItemClick(item.id, item.path)}
                    className={`
    flex items-center gap-3 cursor-pointer px-4 py-2 transition-colors duration-150
    border-l-[3px] border-transparent
    hover:bg-[#f00a50]/10 hover:border-[#f00a50]
    dark:hover:bg-[#f00a50]/20 dark:hover:border-[#f00a50]
    ${
      activeItem === item.id
        ? 'bg-[#f00a50]/10 border-l-[3px] border-l-[#f00a50]' +
          ' text-[#f00a50] font-semibold'
        : ''
    }
  `}
                  >
                    {item.icon && (
                      <item.icon
                        size={18}
                        className={`${
                          activeItem === item.id
                            ? 'text-[#f00a50]'
                            : isDarkMode
                              ? 'text-zinc-400'
                              : 'text-zinc-600'
                        }`}
                      />
                    )}
                    <span
                      className={`${
                        activeItem === item.id
                          ? 'text-[#f00a50]'
                          : isDarkMode
                            ? 'text-zinc-400'
                            : 'text-zinc-600'
                      }`}
                    >
                      {item.label}
                    </span>
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

      {userData && (
        <div className="left-nav-footer">
          <div className="flex flex-row gap-5 text-left">
            <div className="profile-info">
              <div className="profile-avatar">
                {loadingProfilePicture ? (
                  <div className="avatar-loading">Loading...</div>
                ) : profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile Picture"
                    onError={() => {
                      if (userData?.uuid) {
                        handleProfilePictureError(
                          userData.uuid,
                          clearProfilePictureCache,
                          loadProfilePicture,
                        );
                      }
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
                <p>{userData.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftNav;
