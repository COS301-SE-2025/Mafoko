import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';

interface ProfileHeaderProps {
  isMobile: boolean;
  onBackClick: () => void;
  onSettingsClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  isMobile,
  onBackClick,
  onSettingsClick,
}) => {
  if (isMobile) {
    return (
      <div className="profile-header">
        <button type="button" onClick={onBackClick} className="header-button">
          <ArrowLeft size={24} />
        </button>

        <h1 className="header-title">User Profile</h1>

        <button
          type="button"
          onClick={onSettingsClick}
          className="header-button"
        >
          <Settings size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="desktop-header">
      <h1 className="page-title">User Profile</h1>
      <button
        type="button"
        onClick={onSettingsClick}
        className="settings-button"
      >
        <Settings size={24} />
        <span>Settings</span>
      </button>
    </div>
  );
};

export default ProfileHeader;
