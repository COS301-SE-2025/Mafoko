import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/LeftNav.scss';
import { useDarkMode } from './DarkModeComponent.tsx';
// import LanguageSwitcher from '../../components/LanguageSwitcher';

interface LeftNavProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const LeftNav: React.FC<LeftNavProps> = ({ activeItem, setActiveItem }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

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
    { id: 'feedbackhub', label: 'Feedback Hub', path: '/feedbackhub' },
    { id: 'help', label: t('navigation.help'), path: '/help' },
    { id: 'settings', label: t('navigation.settings'), path: '/settings' },
  ];

  const handleItemClick = (itemId: string, path: string) => {
    setActiveItem(itemId);
    void navigate(path);
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
        {menuItems.map((item) => (
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
