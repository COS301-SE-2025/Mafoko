import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import { API_ENDPOINTS } from '../config';
import LeftNav from '../components/ui/LeftNav';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfilePicture from '../components/profile/ProfilePicture';
import ProfileEditDropdown from '../components/profile/ProfileEditDropdown';
import ProfileEditForms from '../components/profile/ProfileEditForms';
import ProfileSuccessMessages from '../components/profile/ProfileSuccessMessages';
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

interface LinguistApplication {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
}

type DocumentType = 'idDocument' | 'cv' | 'certifications' | 'researchPapers';

interface SignedUrlResponse {
  upload_url: string;
  gcs_key: string;
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
  const [linguistApplication, setLinguistApplication] =
    useState<LinguistApplication | null>(null);
  const [showLinguistApplication, setShowLinguistApplication] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<{
    [key in DocumentType]?: File;
  }>({});
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [applicationSubmitSuccess, setApplicationSubmitSuccess] =
    useState(false);
  const [loadingApplication, setLoadingApplication] = useState(false);

  const loadProfilePicture = useCallback(async () => {
    if (!profile?.profile_pic_url) {
      setProfilePictureUrl(null);
      return;
    }

    // Check if we have a cached URL in sessionStorage (lasts for browser session)
    const cachedData = sessionStorage.getItem(`profilePic_${profile.id}`);
    if (cachedData) {
      try {
        const { url, timestamp } = JSON.parse(cachedData) as {
          url: string;
          timestamp: number;
        };
        // Cache expires after 1 hour (3600000 ms)
        const isExpired = Date.now() - timestamp > 3600000;
        if (!isExpired) {
          setProfilePictureUrl(url);
          return;
        } else {
          // Remove expired cache
          sessionStorage.removeItem(`profilePic_${profile.id}`);
        }
      } catch {
        // Invalid cache format, remove it
        sessionStorage.removeItem(`profilePic_${profile.id}`);
      }
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

        // Cache in sessionStorage for the browser session with timestamp
        const cacheData = {
          url: data.view_url,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(
          `profilePic_${profile.id}`,
          JSON.stringify(cacheData),
        );
      } else {
        console.log(
          'Profile picture API returned non-OK status:',
          response.status,
        );
        setProfilePictureUrl(null);
      }
    } catch (err) {
      console.error('Error loading profile picture:', err);
      setProfilePictureUrl(null);
    } finally {
      setLoadingProfilePicture(false);
    }
  }, [profile?.profile_pic_url, profile?.id]);

  const loadLinguistApplication = useCallback(async () => {
    setLoadingApplication(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.getMyApplication, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as LinguistApplication;
        setLinguistApplication(data);
      } else if (response.status === 404) {
        setLinguistApplication(null);
      } else {
        setLinguistApplication(null);
      }
    } catch (err) {
      console.error('Error loading linguist application:', err);
      setLinguistApplication(null);
    } finally {
      setLoadingApplication(false);
    }
  }, []);

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

          void loadLinguistApplication();
        } else {
          setError('Failed to load profile data');
        }
      } catch (err) {
        setError('Error loading profile: ' + (err as Error).message);
      }
    };

    void loadProfile();
  }, [loadLinguistApplication]);

  useEffect(() => {
    if (profile) {
      void loadProfilePicture();
    }
  }, [profile, loadProfilePicture]);

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
    console.log('Settings clicked');
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

        // Clear cached profile picture from sessionStorage
        sessionStorage.removeItem(`profilePic_${updatedProfile.id}`);

        // Clear cached profile picture URL to force reload on dashboard
        const storedUserDataString = localStorage.getItem('userData');
        if (storedUserDataString) {
          try {
            const existingUserData = JSON.parse(storedUserDataString) as {
              uuid: string;
              firstName: string;
              lastName: string;
              profilePictureUrl?: string;
            };
            const updatedUserData = {
              ...existingUserData,
              profilePictureUrl: undefined, // Clear cached URL
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
          } catch (error) {
            console.error('Failed to clear cached profile picture URL:', error);
          }
        }

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
      setError('First name and last name are required');
      return;
    }

    if (!usernameForm.current_password) {
      setError('Current password is required');
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
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.email.trim())) {
      setError('Please enter a valid email address');
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
      setError('Current password is required');
      return;
    }

    if (!passwordForm.new_password) {
      setError('New password is required');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match');
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

      console.log('Attempting to update password...');
      const response = await fetch(API_ENDPOINTS.updateMe, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      console.log('Password update response status:', response.status);

      if (response.ok) {
        console.log('Password updated successfully');
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
        const errorText = await response.text();
        console.log('Password update error response:', errorText);
        try {
          const errorData = JSON.parse(errorText) as { detail?: string };
          setError(errorData.detail || 'Failed to update password');
        } catch {
          setError(
            `Failed to update password: ${response.status.toString()} ${response.statusText}`,
          );
        }
      }
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password: ' + (err as Error).message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    docType: DocumentType,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocumentFiles((prev) => ({ ...prev, [docType]: file }));
    }
  };

  const handleSubmitLinguistApplication = async () => {
    if (!documentFiles.idDocument || !documentFiles.cv) {
      setError('ID Document and CV are required for linguist application');
      return;
    }

    setIsSubmittingApplication(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No access token found. Please login first.');
        return;
      }

      const uploadedFileUrls: { [key: string]: string | undefined } = {};
      const filesToUpload = Object.entries(documentFiles).filter(
        (entry): entry is [DocumentType, File] => Boolean(entry[1]),
      );

      for (const [docType, file] of filesToUpload) {
        const signedUrlRes = await fetch(API_ENDPOINTS.generateSignedUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content_type: file.type,
            filename: file.name,
          }),
        });

        if (!signedUrlRes.ok) {
          throw new Error(`Could not get upload URL for ${file.name}.`);
        }

        const signedUrlData = (await signedUrlRes.json()) as SignedUrlResponse;

        const uploadRes = await fetch(signedUrlData.upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name}.`);
        }
        uploadedFileUrls[docType] = signedUrlData.gcs_key;
      }

      const applicationPayload = {
        id_document_url: uploadedFileUrls.idDocument,
        cv_document_url: uploadedFileUrls.cv,
        certifications_document_url: uploadedFileUrls.certifications,
        research_papers_document_url: uploadedFileUrls.researchPapers,
      };

      const appResponse = await fetch(API_ENDPOINTS.createApplication, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(applicationPayload),
      });

      if (!appResponse.ok) {
        const errorData = (await appResponse.json()) as { detail?: string };
        throw new Error(
          errorData.detail || 'Failed to submit linguist application.',
        );
      }

      setApplicationSubmitSuccess(true);
      setTimeout(() => {
        setApplicationSubmitSuccess(false);
      }, 3000);

      setShowLinguistApplication(false);
      setDocumentFiles({});
      void loadLinguistApplication();
    } catch (err) {
      console.error('Error submitting linguist application:', err);
      setError('Failed to submit application: ' + (err as Error).message);
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const getApplicationStatusText = () => {
    if (loadingApplication) return 'Loading...';
    if (!linguistApplication) return 'Not Applied';

    switch (linguistApplication.status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
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

            {applicationSubmitSuccess && (
              <div className="success-message">
                Linguist application submitted successfully!
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="profile-menu">
            {/* Role */}
            <div className="menu-item">
              <span className="menu-label">Role</span>
              <div className="menu-action-container">
                <span className="menu-action">
                  {profile ? profile.role : 'Loading...'}
                </span>
              </div>
            </div>

            {/* Linguist Application Status */}
            <div className="menu-item">
              <span className="menu-label">Linguist Application</span>
              <div className="menu-action-container">
                <span className="menu-action">
                  {getApplicationStatusText()}
                </span>
                {!linguistApplication && (
                  <button
                    type="button"
                    className="dropdown-toggle"
                    onClick={() => {
                      setShowLinguistApplication(!showLinguistApplication);
                    }}
                    disabled={loadingApplication}
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>

            {showLinguistApplication && !linguistApplication && (
              <div className="linguist-application-dropdown">
                <h3>Apply as Linguist</h3>
                <p>Submit your documents to apply for linguist status:</p>

                <div className="form-group">
                  <label htmlFor="idDocument">ID Document (PDF) *</label>
                  <input
                    type="file"
                    id="idDocument"
                    accept="application/pdf"
                    onChange={(e) => {
                      handleFileSelect(e, 'idDocument');
                    }}
                    disabled={isSubmittingApplication}
                  />
                  {documentFiles.idDocument && (
                    <span className="file-selected">
                      {documentFiles.idDocument.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="cv">CV (PDF) *</label>
                  <input
                    type="file"
                    id="cv"
                    accept="application/pdf"
                    onChange={(e) => {
                      handleFileSelect(e, 'cv');
                    }}
                    disabled={isSubmittingApplication}
                  />
                  {documentFiles.cv && (
                    <span className="file-selected">
                      {documentFiles.cv.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="certifications">
                    Certifications (PDF, Optional)
                  </label>
                  <input
                    type="file"
                    id="certifications"
                    accept="application/pdf"
                    onChange={(e) => {
                      handleFileSelect(e, 'certifications');
                    }}
                    disabled={isSubmittingApplication}
                  />
                  {documentFiles.certifications && (
                    <span className="file-selected">
                      {documentFiles.certifications.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="researchPapers">
                    Research Papers (PDF, Optional)
                  </label>
                  <input
                    type="file"
                    id="researchPapers"
                    accept="application/pdf"
                    onChange={(e) => {
                      handleFileSelect(e, 'researchPapers');
                    }}
                    disabled={isSubmittingApplication}
                  />
                  {documentFiles.researchPapers && (
                    <span className="file-selected">
                      {documentFiles.researchPapers.name}
                    </span>
                  )}
                </div>

                <div className="application-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      setShowLinguistApplication(false);
                      setDocumentFiles({});
                      setError('');
                    }}
                    disabled={isSubmittingApplication}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="submit-button"
                    onClick={() => {
                      void handleSubmitLinguistApplication();
                    }}
                    disabled={
                      isSubmittingApplication ||
                      !documentFiles.idDocument ||
                      !documentFiles.cv
                    }
                  >
                    {isSubmittingApplication
                      ? 'Submitting...'
                      : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
