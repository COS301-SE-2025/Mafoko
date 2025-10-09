import React, { useRef, useEffect } from 'react';
import { User, Mail, Lock, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProfileEditDropdownProps {
  firstName: string;
  lastName: string;
  email: string;
  showDropdown: boolean;
  onToggleDropdown: () => void;
  onEditName: () => void;
  onEditEmail: () => void;
  onEditPassword: () => void;
  role: string | null;
}

const ProfileEditDropdown: React.FC<ProfileEditDropdownProps> = ({
  firstName,
  lastName,
  email,
  showDropdown,
  onToggleDropdown,
  onEditName,
  onEditEmail,
  onEditPassword,
  role,
}) => {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        showDropdown
      ) {
        onToggleDropdown();
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, onToggleDropdown]);

  return (
    <div className="profile-display flex flex-col items-start gap-1 text-theme">
      {/* Name + Edit Button row */}
      <div className="flex items-center justify-between w-full">
        <h2 className="profile-name text-lg font-semibold">
          {firstName && lastName
            ? `${firstName} ${lastName}`
            : t('common.loading', 'Loading...')}
        </h2>

        {/* Edit Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={onToggleDropdown}
            className="p-1 text-theme hover:text-[#f00a50]"
            title={t('profile.editProfile', 'Edit profile')}
          >
            <MoreVertical size={20} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-[var(--bg-tir)] shadow-lg border border-gray-200 rounded-md z-50">
              <button
                type="button"
                onClick={onEditName}
                className="dropdown-item flex items-center gap-2 px-3 py-2 w-full text-left"
              >
                <User size={16} />
                <span>{t('profile.editName', 'Edit Name')}</span>
              </button>
              <button
                type="button"
                onClick={onEditEmail}
                className="dropdown-item flex items-center gap-2 px-3 py-2 w-full text-left"
              >
                <Mail size={16} />
                <span>{t('profile.editEmail', 'Edit Email')}</span>
              </button>
              <button
                type="button"
                onClick={onEditPassword}
                className="dropdown-item flex items-center gap-2 px-3 py-2  w-full text-left"
              >
                <Lock size={16} />
                <span>{t('profile.changePassword', 'Change Password')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="profile-email text-[14px] !font-bold text-gray-500">
        <span className="font-medium text-theme">
          {t('loginPage.emailLabel', 'Email')}:{' '}
        </span>
        {email || t('common.loading', 'Loading...')}
      </p>

      <p className="text-[14px] text-[#f00a50] font-bold flex items-center gap-1">
        <span className="font-medium text-theme">
          {t('profile.role', 'Role')}:{' '}
        </span>
        <span>{role || t('profile.loading', 'Loading...')}</span>
      </p>
    </div>
  );
};

export default ProfileEditDropdown;
