import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/LeftNav.scss';
import { useDarkMode } from './DarkModeComponent.tsx';
import { Moon, Sun } from 'lucide-react';

interface LeftNavProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const LeftNav: React.FC<LeftNavProps> = ({ activeItem, setActiveItem }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const menuItems = [
    { id: 'dashboard', label: 'Home', path: '/dashboard' },
    { id: 'search', label: 'Dictionary', path: '/search' },
    { id: 'glossary', label: 'Glossary', path: '/glossary' },
    { id: 'saved', label: t('leftPane.savedTerms'), path: '/saved-terms' },
    { id: 'analytics', label: 'Dashboard', path: '/analytics' },
    { id: 'help', label: t('Help'), path: '/help' },
  ];

  const handleItemClick = (itemId: string, path: string) => {
    setActiveItem(itemId);
    void navigate(path);
  };

  return (
    <div className="left-nav">
      {/* Header */}
      <div className="left-nav-header">
        <h2 className="left-nav-app-title">Marito</h2>
        <div className="logo-container">
          <img
            src="./icons/maskable_icon_x512.png"
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
        <div>
          <button
            onClick={toggleDarkMode}
            className="text-theme bg-theme hover:text-accent-pink transition outline-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none"
            type="button"
            aria-label="Toggle dark mode"
          >
            {/*{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}*/}
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default LeftNav;
