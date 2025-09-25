import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import { API_ENDPOINTS } from '../config';
import LeftNav from '../components/ui/LeftNav';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfilePicture from '../components/profile/ProfilePicture';
import ProfileEditDropdown from '../components/profile/ProfileEditDropdown';
import ProfileEditForms from '../components/profile/ProfileEditForms';
import ProfileSuccessMessages from '../components/profile/ProfileSuccessMessages';
import {
  useProfilePicture,
  handleProfilePictureError,
} from '../hooks/useProfilePicture';
import '../styles/UserProfilePage.scss';

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  account_locked: boolean;
  created_at: string;
  last_login: string | null;
  profile_pic_url: string | null;
}

const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const {
    profilePictureUrl,
    loadingProfilePicture,
    clearProfilePictureCache,
    loadProfilePicture,
    uploadProfilePicture,
    getPendingUploadCount,
  } = useProfilePicture(profile?.id);
  const [error, setError] = useState('');
  const [activeMenuItem, setActiveMenuItem] = useState('profile');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] =
    useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const [usernameForm, setUsernameForm] = useState({
    first_name: '',
    last_name: '',
    current_password: '',
  });
  const [emailForm, setEmailForm] = useState({
    email: '',
    current_password: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [updateUsernameSuccess, setUpdateUsernameSuccess] = useState(false);
  const [updateEmailSuccess, setUpdateEmailSuccess] = useState(false);
  const [updatePasswordSuccess, setUpdatePasswordSuccess] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError(
            t(
              'profile.errors.noToken',
              'No access token found. Please login first.',
            ),
          );
          return;
        }

        const response = await fetch(API_ENDPOINTS.getMe, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const data = (await response.json()) as ProfileData;
          setProfile(data);
          setUsernameForm({
            first_name: data.first_name,
            last_name: data.last_name,
            current_password: '',
          });
          setEmailForm({
            email: data.email,
            current_password: '',
          });
          setPasswordForm({
            current_password: '',
            new_password: '',
            confirm_password: '',
          });
        } else {
          setError(
            t('profile.errors.loadFailed', 'Failed to load profile data'),
          );
        }
      } catch (err) {
        setError('Error loading profile: ' + (err as Error).message);
      }
    };

    void loadProfile();
  }, [t]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      try {
        const pendingCount = await getPendingUploadCount();

        if (pendingCount > 0) {
          setError(
            t(
              'profile.syncingUploads',
              'Back online! Syncing queued profile picture uploads...',
            ),
          );

          setTimeout(() => {
            setError('');
          }, 3000);
        }
      } catch (error) {
        console.error('Error checking pending uploads:', error);
      }
    };

    const handleOnlineWrapper = () => void handleOnline();
    window.addEventListener('online', handleOnlineWrapper);
    return () => {
      window.removeEventListener('online', handleOnlineWrapper);
    };
  }, [getPendingUploadCount, t]);

  const handleBackClick = () => {
    void navigate(-1);
  };

  const handleSettingsClick = () => {
    void navigate('/settings');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    void navigate('/');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleConfirmLogout = () => {
    handleLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  const handleToggleDropdown = () => {
    setShowEditDropdown(!showEditDropdown);
  };

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(
        t('profile.errors.invalidImage', 'Please select a valid image file'),
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(
        t('profile.errors.fileTooLarge', 'File size must be less than 5MB'),
      );
      return;
    }

    setIsUploadingProfilePicture(true);
    setError('');

    try {
      const result = await uploadProfilePicture(file);

      if (result.success) {
        if (result.wasQueued) {
          // File was queued for offline upload
          setError(
            t(
              'profile.offlineUpload',
              "You are offline. Your profile picture upload has been queued and will sync when you're back online.",
            ),
          );
        } else {
          // Refresh profile data
          const token = localStorage.getItem('accessToken');
          if (token) {
            const profileResponse = await fetch(API_ENDPOINTS.getMe, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            });

            if (profileResponse.ok) {
              const updatedProfile =
                (await profileResponse.json()) as ProfileData;
              setProfile(updatedProfile);
            }
          }

          setUploadSuccess(true);
          setTimeout(() => {
            setUploadSuccess(false);
          }, 3000);
        }
      } else {
        setError(result.error || 'Failed to upload profile picture');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError('Failed to update profile picture: ' + (err as Error).message);
    } finally {
      setIsUploadingProfilePicture(false);
    }
  };

  const handleEditUsernameClick = () => {
    setIsEditingUsername(true);
    setShowEditDropdown(false);
    setError('');
  };

  const handleCancelEditUsername = () => {
    setIsEditingUsername(false);
    // Reset form to current profile data
    if (profile) {
      setUsernameForm({
        first_name: profile.first_name,
        last_name: profile.last_name,
        current_password: '',
      });
    }
    setError('');
  };

  const handleUsernameFormChange = (field: string, value: string) => {
    setUsernameForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateUsername = async () => {
    if (!profile) return;

    if (!usernameForm.first_name.trim() || !usernameForm.last_name.trim()) {
      setError(
        t(
          'profile.errors.nameRequired',
          'First name and last name are required',
        ),
      );
      return;
    }

    if (!usernameForm.current_password) {
      setError(
        t('profile.errors.passwordRequired', 'Current password is required'),
      );
      return;
    }

    setIsUpdatingUsername(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No access token found. Please login first.');
        return;
      }

      const response = await fetch(API_ENDPOINTS.updateMe, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: usernameForm.first_name.trim(),
          last_name: usernameForm.last_name.trim(),
          current_password: usernameForm.current_password,
        }),
      });

      if (response.ok) {
        const updatedProfile = (await response.json()) as ProfileData;
        setProfile(updatedProfile);

        // Update localStorage to sync with dashboard
        const storedUserDataString = localStorage.getItem('userData');
        if (storedUserDataString) {
          try {
            const existingUserData = JSON.parse(storedUserDataString) as {
              uuid: string;
              firstName: string;
              lastName: string;
            };
            const updatedUserData = {
              ...existingUserData,
              firstName: updatedProfile.first_name,
              lastName: updatedProfile.last_name,
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
          } catch (error) {
            console.error('Failed to update localStorage userData:', error);
          }
        }

        setIsEditingUsername(false);
        setUpdateUsernameSuccess(true);
        setTimeout(() => {
          setUpdateUsernameSuccess(false);
        }, 3000);
        // Reset password field
        setUsernameForm((prev) => ({
          ...prev,
          current_password: '',
        }));
      } else {
        const errorData = (await response.json()) as { detail?: string };
        setError(errorData.detail || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile: ' + (err as Error).message);
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleEditEmailClick = () => {
    setIsEditingEmail(true);
    setShowEditDropdown(false);
    setError('');
  };

  const handleCancelEditEmail = () => {
    setIsEditingEmail(false);
    // Reset form to current profile data
    if (profile) {
      setEmailForm({
        email: profile.email,
        current_password: '',
      });
    }
    setError('');
  };

  const handleEmailFormChange = (field: string, value: string) => {
    setEmailForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateEmail = async () => {
    if (!profile) return;

    if (!emailForm.email.trim()) {
      setError(t('profile.errors.emailRequired', 'Email is required'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.email.trim())) {
      setError(
        t('profile.errors.emailInvalid', 'Please enter a valid email address'),
      );
      return;
    }

    if (!emailForm.current_password) {
      setError('Current password is required');
      return;
    }

    setIsUpdatingEmail(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No access token found. Please login first.');
        return;
      }

      const response = await fetch(API_ENDPOINTS.updateMe, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailForm.email.trim(),
          current_password: emailForm.current_password,
        }),
      });

      if (response.ok) {
        const updatedProfile = (await response.json()) as ProfileData;
        setProfile(updatedProfile);

        setIsEditingEmail(false);
        setUpdateEmailSuccess(true);
        setTimeout(() => {
          setUpdateEmailSuccess(false);
        }, 3000);
        // Reset password field
        setEmailForm((prev) => ({
          ...prev,
          current_password: '',
        }));
      } else {
        const errorData = (await response.json()) as { detail?: string };
        setError(errorData.detail || 'Failed to update email');
      }
    } catch (err) {
      console.error('Error updating email:', err);
      setError('Failed to update email: ' + (err as Error).message);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleEditPasswordClick = () => {
    setIsEditingPassword(true);
    setShowEditDropdown(false);
    setError('');
  };

  const handleCancelEditPassword = () => {
    setIsEditingPassword(false);
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
    setError('');
  };

  const handlePasswordFormChange = (field: string, value: string) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.current_password) {
      setError(
        t('profile.errors.passwordRequired', 'Current password is required'),
      );
      return;
    }

    if (!passwordForm.new_password) {
      setError(
        t('profile.errors.newPasswordRequired', 'New password is required'),
      );
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError(
        t('profile.errors.passwordMismatch', 'New passwords do not match'),
      );
      return;
    }

    setIsUpdatingPassword(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No access token found. Please login first.');
        return;
      }

      const response = await fetch(API_ENDPOINTS.updateMe, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          password: passwordForm.new_password,
        }),
      });

      if (response.ok) {
        setIsEditingPassword(false);
        setUpdatePasswordSuccess(true);
        setTimeout(() => {
          setUpdatePasswordSuccess(false);
        }, 3000);
        // Reset form
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        const errorData = (await response.json()) as { detail?: string };
        setError(errorData.detail || 'Failed to update password');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password: ' + (err as Error).message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (error && !profile) {
    return (
      <div
        className={`profile-container ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
      >
        <div className="profile-error">{error}</div>
      </div>
    );
  }

  return (
    <div
      className={`dashboard-container ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      {/* Navigation - only show on desktop */}
      {!isMobile && (
        <LeftNav
          activeItem={activeMenuItem}
          setActiveItem={setActiveMenuItem}
        />
      )}

      <div className="main-content">
        <ProfileHeader
          isMobile={isMobile}
          onBackClick={handleBackClick}
          onSettingsClick={handleSettingsClick}
        />

        {/* Profile Content */}
        <div className="profile-content">
          {/* Error Display */}
          {error && <div className="error-message">{error}</div>}

          {/* Profile Picture and Name Section */}
          <div className="profile-info">
            <ProfilePicture
              profilePictureUrl={profilePictureUrl}
              isUploadingProfilePicture={isUploadingProfilePicture}
              loadingProfilePicture={loadingProfilePicture}
              profileFirstName={profile?.first_name}
              onProfilePictureUpload={(e) => {
                handleProfilePictureUpload(e).catch(console.error);
              }}
              onProfilePictureError={() => {
                // Use the hook's error handling method
                if (profile?.id) {
                  handleProfilePictureError(
                    profile.id,
                    clearProfilePictureCache,
                    loadProfilePicture,
                  );
                }
              }}
            />

            <ProfileEditForms
              editMode={
                isEditingUsername
                  ? 'username'
                  : isEditingEmail
                    ? 'email'
                    : isEditingPassword
                      ? 'password'
                      : null
              }
              usernameForm={usernameForm}
              emailForm={emailForm}
              passwordForm={passwordForm}
              isUpdatingUsername={isUpdatingUsername}
              isUpdatingEmail={isUpdatingEmail}
              isUpdatingPassword={isUpdatingPassword}
              onUsernameFormChange={handleUsernameFormChange}
              onEmailFormChange={handleEmailFormChange}
              onPasswordFormChange={handlePasswordFormChange}
              onUpdateUsername={() => {
                void handleUpdateUsername();
              }}
              onUpdateEmail={() => {
                void handleUpdateEmail();
              }}
              onUpdatePassword={() => {
                void handleUpdatePassword();
              }}
              onCancelEditUsername={handleCancelEditUsername}
              onCancelEditEmail={handleCancelEditEmail}
              onCancelEditPassword={handleCancelEditPassword}
            />

            {!isEditingUsername && !isEditingEmail && !isEditingPassword && (
              <ProfileEditDropdown
                firstName={profile?.first_name || ''}
                lastName={profile?.last_name || ''}
                email={profile?.email || ''}
                showDropdown={showEditDropdown}
                onToggleDropdown={handleToggleDropdown}
                onEditName={handleEditUsernameClick}
                onEditEmail={handleEditEmailClick}
                onEditPassword={handleEditPasswordClick}
              />
            )}

            <ProfileSuccessMessages
              uploadSuccess={uploadSuccess}
              updateUsernameSuccess={updateUsernameSuccess}
              updateEmailSuccess={updateEmailSuccess}
              updatePasswordSuccess={updatePasswordSuccess}
            />
          </div>

          {/* Menu Items */}
          <div className="profile-menu">
            {/* Role */}
            <div className="menu-item">
              <span className="menu-label">{t('profile.role', 'Role')}</span>
              <div className="menu-action-container">
                <span className="menu-action">
                  {profile ? profile.role : t('profile.loading', 'Loading...')}
                </span>
              </div>
            </div>

            {/* Logout */}
            <div className="menu-item">
              {showLogoutConfirmation ? (
                <>
                  <span className="menu-label">
                    {t('profile.logoutConfirmation', 'Sign out?')}
                  </span>
                  <div className="menu-action-container">
                    <div className="logout-buttons">
                      <button
                        type="button"
                        className="dropdown-toggle"
                        onClick={handleConfirmLogout}
                      >
                        {t('profile.yes', 'Yes')}
                      </button>
                      <button
                        type="button"
                        className="dropdown-toggle"
                        onClick={handleCancelLogout}
                      >
                        {t('profile.no', 'No')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span className="menu-label">
                    {t('profile.logout', 'Sign out')}
                  </span>
                  <div className="menu-action-container">
                    <button
                      type="button"
                      className="dropdown-toggle"
                      onClick={handleLogoutClick}
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
