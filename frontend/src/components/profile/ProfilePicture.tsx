import React from 'react';

interface ProfilePictureProps {
  profilePictureUrl: string | null;
  isUploadingProfilePicture: boolean;
  loadingProfilePicture: boolean;
  profileFirstName?: string;
  profileLastName?: string;
  onProfilePictureError?: () => void;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  profileFirstName,
  profileLastName,
}) => {
  return (
    <div className="profile-picture" style={{ position: 'relative' }}>
      <div className="profile-placeholder !text-white">
        {profileFirstName?.charAt(0) || ''}
        {profileLastName?.charAt(0) || ''}
      </div>
    </div>
  );
};

export default ProfilePicture;
