import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Settings, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import { API_ENDPOINTS } from '../config';
import LeftNav from '../components/ui/LeftNav';
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
  const { isDarkMode } = useDarkMode();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );
  const [loadingProfilePicture, setLoadingProfilePicture] = useState(false);
  const [error, setError] = useState('');
  const [activeMenuItem, setActiveMenuItem] = useState('profile');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] =
    useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile picture URL
  const loadProfilePicture = useCallback(async () => {
    if (!profile?.profile_pic_url) {
      setProfilePictureUrl(null);
      return;
    }

    setLoadingProfilePicture(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.getMyProfilePictureUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as { view_url: string };
        setProfilePictureUrl(data.view_url);
      } else {
        setProfilePictureUrl(null);
      }
    } catch (err) {
      console.error('Error loading profile picture:', err);
      setProfilePictureUrl(null);
    } finally {
      setLoadingProfilePicture(false);
    }
  }, [profile?.profile_pic_url]);

  // Load current profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('No access token found. Please login first.');
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
        } else {
          setError('Failed to load profile data');
        }
      } catch (err) {
        setError('Error loading profile: ' + (err as Error).message);
      }
    };

    void loadProfile();
  }, []);

  // Load profile picture when profile changes
  useEffect(() => {
    if (profile) {
      void loadProfilePicture();
    }
  }, [profile, loadProfilePicture]);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleBackClick = () => {
    void navigate(-1);
  };

  const handleSettingsClick = () => {
    // Navigate to settings page when implemented
    console.log('Settings clicked');
  };

  const handleSavedTermsClick = () => {
    void navigate('/saved-terms');
  };

  const handleDownloadsClick = () => {
    // Navigate to downloads page when implemented
    console.log('Downloads clicked');
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setIsUploadingProfilePicture(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No access token found. Please login first.');
        return;
      }

      // Get upload URL
      const uploadPayload = {
        content_type: file.type,
        filename: file.name,
      };

      console.log('Upload URL request payload:', uploadPayload);
      console.log('File details:', {
        type: file.type,
        name: file.name,
        size: file.size,
      });

      const uploadUrlResponse = await fetch(
        API_ENDPOINTS.generateProfilePictureUploadUrl,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(uploadPayload),
        },
      );

      if (!uploadUrlResponse.ok) {
        const errorText = await uploadUrlResponse.text();
        console.error('Upload URL error response:', errorText);
        console.error('Response status:', uploadUrlResponse.status);
        throw new Error(`Failed to get upload URL: ${errorText}`);
      }

      const { upload_url, gcs_key } = (await uploadUrlResponse.json()) as {
        upload_url: string;
        gcs_key: string;
      };

      // Upload file to signed URL
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Update profile with new picture key
      const updateProfileResponse = await fetch(
        API_ENDPOINTS.updateProfilePicture,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_pic_url: gcs_key,
          }),
        },
      );

      if (!updateProfileResponse.ok) {
        throw new Error('Failed to update profile picture');
      }

      // Refresh profile data and picture
      const profileResponse = await fetch(API_ENDPOINTS.getMe, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (profileResponse.ok) {
        const updatedProfile = (await profileResponse.json()) as ProfileData;
        setProfile(updatedProfile);
        // Show success message
        setUploadSuccess(true);
        setTimeout(() => {
          setUploadSuccess(false);
        }, 3000);
        // loadProfilePicture will be called via useEffect
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError('Failed to update profile picture: ' + (err as Error).message);
    } finally {
      setIsUploadingProfilePicture(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        {/* Mobile Header */}
        {isMobile && (
          <div className="profile-header">
            <button
              type="button"
              onClick={handleBackClick}
              className="header-button"
            >
              <ArrowLeft size={24} />
            </button>

            <h1 className="header-title">User Profile</h1>

            <button
              type="button"
              onClick={handleSettingsClick}
              className="header-button"
            >
              <Settings size={24} />
            </button>
          </div>
        )}

        {/* Profile Content */}
        <div className="profile-content">
          {/* Desktop Header */}
          {!isMobile && (
            <div className="desktop-header">
              <h1 className="page-title">User Profile</h1>
              <button
                type="button"
                onClick={handleSettingsClick}
                className="settings-button"
              >
                <Settings size={24} />
                <span>Settings</span>
              </button>
            </div>
          )}

          {/* Profile Picture and Name Section */}
          <div className="profile-info">
            {/* Profile Picture */}
            <div
              className="profile-picture"
              onClick={handleProfilePictureClick}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {isUploadingProfilePicture ? (
                <div className="loading-placeholder">Uploading...</div>
              ) : loadingProfilePicture ? (
                <div className="loading-placeholder">Loading...</div>
              ) : profilePictureUrl ? (
                <>
                  <img
                    src={profilePictureUrl}
                    alt="Profile Picture"
                    onError={() => {
                      setProfilePictureUrl(null);
                    }}
                  />
                  <div className="picture-overlay">
                    <Camera size={24} />
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-placeholder">
                    {profile?.first_name.charAt(0) || '?'}
                  </div>
                  <div className="picture-overlay">
                    <Camera size={24} />
                  </div>
                </>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                handleProfilePictureUpload(e).catch(console.error);
              }}
              style={{ display: 'none' }}
            />

            {/* Username */}
            <h2 className="profile-name">Username</h2>

            <p className="profile-details">
              {profile
                ? `${profile.first_name} ${profile.last_name}`
                : 'Loading...'}
            </p>

            {/* Success Message */}
            {uploadSuccess && (
              <p className="upload-success">
                Profile picture updated successfully!
              </p>
            )}
          </div>

          {/* Menu Items */}
          <div className="profile-menu">
            {/* Saved Terms */}
            <button
              type="button"
              onClick={handleSavedTermsClick}
              className="menu-item"
            >
              <span className="menu-label">Saved Terms</span>
              <span className="menu-action">View All</span>
            </button>

            {/* Downloads */}
            <button
              type="button"
              onClick={handleDownloadsClick}
              className="menu-item"
            >
              <span className="menu-label">Downloads</span>
              <span className="menu-action">View All</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
