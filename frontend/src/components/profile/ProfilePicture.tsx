import React, { useRef } from 'react';
import { Camera } from 'lucide-react';

interface ProfilePictureProps {
  profilePictureUrl: string | null;
  isUploadingProfilePicture: boolean;
  loadingProfilePicture: boolean;
  profileFirstName?: string;
  onProfilePictureUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  profilePictureUrl,
  isUploadingProfilePicture,
  loadingProfilePicture,
  profileFirstName,
  onProfilePictureUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
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
              onError={(e) => {
                console.error(
                  'Profile picture failed to load:',
                  profilePictureUrl,
                );
                // Hide the broken image and show placeholder instead
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="picture-overlay">
              <Camera size={24} />
            </div>
          </>
        ) : (
          <>
            <div className="profile-placeholder">
              {profileFirstName?.charAt(0) || '?'}
            </div>
            <div className="picture-overlay">
              <Camera size={24} />
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onProfilePictureUpload}
        style={{ display: 'none' }}
      />
    </>
  );
};

export default ProfilePicture;
