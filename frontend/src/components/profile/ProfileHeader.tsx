import React, { useState } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface ProfileHeaderProps {
  isMobile: boolean;
  onBackClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  isMobile,
  onBackClick,
}) => {
  const navigate = useNavigate();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const { t } = useTranslation();

  const handleLogoutClick = () => setShowLogoutConfirmation(true);
  const handleCancelLogout = () => setShowLogoutConfirmation(false);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    void navigate('/');
  };

  // --- Mobile layout ---
  if (isMobile) {
    return (
      <div className="profile-header flex items-center justify-between px-4 py-2 border-b border-gray-200 !bg-[var(--bg-tir)]">
        {/* Left: Back arrow */}
        <button
          type="button"
          onClick={onBackClick}
          className="header-button text-theme border-0 hover:!text-[#f00a50]"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Center: Title */}
        <h1 className="header-title text-lg font-semibold">
          {t('profile.title', 'User Profile')}
        </h1>

        {/* Right: Logout */}
        <div className="flex items-center">
          {showLogoutConfirmation ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                {t('profile.logoutConfirmation', 'Sign out?')}
              </span>
              <button
                type="button"
                className="text-theme font-medium hover:underline"
                onClick={handleLogout}
              >
                {t('profile.yes', 'Yes')}
              </button>
              <button
                type="button"
                className="text-gray-500 hover:underline"
                onClick={handleCancelLogout}
              >
                {t('profile.no', 'No')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex items-center text-theme hover:text-[#f00a50] transition"
              onClick={handleLogoutClick}
              title={t('profile.logout', 'Sign out')}
            >
              <LogOut size={22} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Desktop layout ---
  return (
    <div className="desktop-header flex items-center justify-between w-full px-6 py-3 border-b border-gray-200 !bg-[var(--bg-tir)]">
      {/* Left: Back arrow */}
      <button
        type="button"
        onClick={onBackClick}
        className="flex items-center text-theme hover:!text-[#f00a50] "
      >
        <ArrowLeft size={24} />
      </button>

      {/* Center: Page title */}
      <h1 className="page-title text-xl font-semibold text-center flex-1">
        {t('profile.title', 'User Profile')}
      </h1>

      {/* Right: Logout */}
      <div className="flex items-center gap-3">
        {showLogoutConfirmation ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-theme">
              {t('profile.logoutConfirmation', 'Sign out?')}
            </span>
            <button
              type="button"
              className="text-theme font-medium hover:underline"
              onClick={handleLogout}
            >
              {t('profile.yes', 'Yes')}
            </button>
            <button
              type="button"
              className="text-gray-500 hover:underline"
              onClick={handleCancelLogout}
            >
              {t('profile.no', 'No')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="flex items-center gap-1 text-theme hover:text-[#f00a50] transition"
            onClick={handleLogoutClick}
          >
            <LogOut size={22} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
