import React, { useRef, useEffect } from 'react';
import { User, Mail, Lock } from 'lucide-react';

interface ProfileEditDropdownProps {
  firstName: string;
  lastName: string;
  email: string;
  showDropdown: boolean;
  onToggleDropdown: () => void;
  onEditName: () => void;
  onEditEmail: () => void;
  onEditPassword: () => void;
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
}) => {
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
    <div className="profile-display">
      <div className="profile-name-container">
        <h2 className="profile-name">
          {firstName && lastName ? `${firstName} ${lastName}` : 'Loading...'}
        </h2>
        <div className="edit-dropdown-container" ref={dropdownRef}>
          <button
            type="button"
            onClick={onToggleDropdown}
            className="edit-dropdown-button"
            title="Edit profile"
          >
            ⋮
          </button>
          {showDropdown && (
            <div className="edit-dropdown-menu">
              <button
                type="button"
                onClick={onEditName}
                className="dropdown-item"
              >
                <User size={16} />
                <span>Edit Name</span>
              </button>
              <button
                type="button"
                onClick={onEditEmail}
                className="dropdown-item"
              >
                <Mail size={16} />
                <span>Edit Email</span>
              </button>
              <button
                type="button"
                onClick={onEditPassword}
                className="dropdown-item"
              >
                <Lock size={16} />
                <span>Change Password</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="profile-email">{email || 'Loading...'}</p>
    </div>
  );
};

export default ProfileEditDropdown;
