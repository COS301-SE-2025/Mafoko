import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/DashboardPage.css';

interface LeftPaneProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const LeftPane: React.FC<LeftPaneProps> = ({ activeItem, onItemClick }) => {
  const { t } = useTranslation();

  const menuItems = [
    { id: 'dashboard', label: t('leftPane.dashboard') },
    { id: 'search', label: t('leftPane.search') },
    { id: 'saved', label: t('leftPane.savedTerms') },
    { id: 'analytics', label: t('leftPane.analytics') },
  ];

  return (
    <div className="left-pane">
      {/* Header */}
      <div className="left-pane-header">
        <h2 className="app-title">Mavito</h2>
        <div className="logo-container">
          <img
            src="./icons/maskable_icon_x512.png"
            alt="DFSI Logo"
            className="dfsi-logo"
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="navigation-menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => {
              onItemClick(item.id);
            }}
          >
            <span className="menu-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default LeftPane;
