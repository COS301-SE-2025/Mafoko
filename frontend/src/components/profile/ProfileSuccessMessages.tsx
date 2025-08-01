import React from 'react';

interface ProfileSuccessMessagesProps {
  uploadSuccess: boolean;
  updateUsernameSuccess: boolean;
  updateEmailSuccess: boolean;
  updatePasswordSuccess: boolean;
}

const ProfileSuccessMessages: React.FC<ProfileSuccessMessagesProps> = ({
  uploadSuccess,
  updateUsernameSuccess,
  updateEmailSuccess,
  updatePasswordSuccess,
}) => {
  return (
    <>
      {uploadSuccess && (
        <p className="upload-success">Profile picture updated successfully!</p>
      )}
      {updateUsernameSuccess && (
        <p className="upload-success">Name updated successfully!</p>
      )}
      {updateEmailSuccess && (
        <p className="upload-success">Email updated successfully!</p>
      )}
      {updatePasswordSuccess && (
        <p className="upload-success">Password updated successfully!</p>
      )}
    </>
  );
};

export default ProfileSuccessMessages;
