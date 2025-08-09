import React from 'react';
import { useTranslation } from 'react-i18next';

interface UsernameForm {
  first_name: string;
  last_name: string;
  current_password: string;
}

interface EmailForm {
  email: string;
  current_password: string;
}

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface ProfileEditFormsProps {
  editMode: 'username' | 'email' | 'password' | null;
  usernameForm: UsernameForm;
  emailForm: EmailForm;
  passwordForm: PasswordForm;
  isUpdatingUsername: boolean;
  isUpdatingEmail: boolean;
  isUpdatingPassword: boolean;
  onUsernameFormChange: (field: string, value: string) => void;
  onEmailFormChange: (field: string, value: string) => void;
  onPasswordFormChange: (field: string, value: string) => void;
  onUpdateUsername: () => void;
  onUpdateEmail: () => void;
  onUpdatePassword: () => void;
  onCancelEditUsername: () => void;
  onCancelEditEmail: () => void;
  onCancelEditPassword: () => void;
}

const ProfileEditForms: React.FC<ProfileEditFormsProps> = ({
  editMode,
  usernameForm,
  emailForm,
  passwordForm,
  isUpdatingUsername,
  isUpdatingEmail,
  isUpdatingPassword,
  onUsernameFormChange,
  onEmailFormChange,
  onPasswordFormChange,
  onUpdateUsername,
  onUpdateEmail,
  onUpdatePassword,
  onCancelEditUsername,
  onCancelEditEmail,
  onCancelEditPassword,
}) => {
  const { t } = useTranslation();
  if (editMode === 'username') {
    return (
      <div className="edit-form">
        <h2 className="profile-name">
          {t('profile.forms.editName', 'Edit Name')}
        </h2>
        <div className="form-group">
          <label htmlFor="first_name">
            {t('profile.forms.firstName', 'First Name')}
          </label>
          <input
            id="first_name"
            type="text"
            value={usernameForm.first_name}
            onChange={(e) => {
              onUsernameFormChange('first_name', e.target.value);
            }}
            placeholder={t(
              'profile.forms.firstNamePlaceholder',
              'Enter first name',
            )}
            disabled={isUpdatingUsername}
          />
        </div>
        <div className="form-group">
          <label htmlFor="last_name">
            {t('profile.forms.lastName', 'Last Name')}
          </label>
          <input
            id="last_name"
            type="text"
            value={usernameForm.last_name}
            onChange={(e) => {
              onUsernameFormChange('last_name', e.target.value);
            }}
            placeholder={t(
              'profile.forms.lastNamePlaceholder',
              'Enter last name',
            )}
            disabled={isUpdatingUsername}
          />
        </div>
        <div className="form-group">
          <label htmlFor="current_password">
            {t('profile.forms.currentPassword', 'Current Password')}
          </label>
          <input
            id="current_password"
            type="password"
            value={usernameForm.current_password}
            onChange={(e) => {
              onUsernameFormChange('current_password', e.target.value);
            }}
            placeholder={t(
              'profile.forms.currentPasswordPlaceholder',
              'Enter current password',
            )}
            disabled={isUpdatingUsername}
          />
        </div>
        <div className="form-actions">
          <button
            type="button"
            onClick={onUpdateUsername}
            disabled={isUpdatingUsername}
            className="save-button"
          >
            {isUpdatingUsername
              ? t('profile.forms.saving', 'Saving...')
              : t('profile.forms.save', 'Save')}
          </button>
          <button
            type="button"
            onClick={onCancelEditUsername}
            disabled={isUpdatingUsername}
            className="cancel-button"
          >
            {t('profile.forms.cancel', 'Cancel')}
          </button>
        </div>
      </div>
    );
  }

  if (editMode === 'email') {
    return (
      <div className="edit-form">
        <h2 className="profile-name">
          {t('profile.forms.editEmail', 'Edit Email')}
        </h2>
        <div className="form-group">
          <label htmlFor="email">
            {t('profile.forms.emailAddress', 'Email Address')}
          </label>
          <input
            id="email"
            type="email"
            value={emailForm.email}
            onChange={(e) => {
              onEmailFormChange('email', e.target.value);
            }}
            placeholder={t(
              'profile.forms.emailAddressPlaceholder',
              'Enter email address',
            )}
            disabled={isUpdatingEmail}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email_current_password">
            {t('profile.forms.currentPassword', 'Current Password')}
          </label>
          <input
            id="email_current_password"
            type="password"
            value={emailForm.current_password}
            onChange={(e) => {
              onEmailFormChange('current_password', e.target.value);
            }}
            placeholder={t(
              'profile.forms.currentPasswordPlaceholder',
              'Enter current password',
            )}
            disabled={isUpdatingEmail}
          />
        </div>
        <div className="form-actions">
          <button
            type="button"
            onClick={onUpdateEmail}
            disabled={isUpdatingEmail}
            className="save-button"
          >
            {isUpdatingEmail
              ? t('profile.forms.saving', 'Saving...')
              : t('profile.forms.save', 'Save')}
          </button>
          <button
            type="button"
            onClick={onCancelEditEmail}
            disabled={isUpdatingEmail}
            className="cancel-button"
          >
            {t('profile.forms.cancel', 'Cancel')}
          </button>
        </div>
      </div>
    );
  }

  if (editMode === 'password') {
    return (
      <div className="edit-form">
        <h2 className="profile-name">
          {t('profile.forms.changePassword', 'Change Password')}
        </h2>
        <div className="form-group">
          <label htmlFor="current_password_change">
            {t('profile.forms.currentPassword', 'Current Password')}
          </label>
          <input
            id="current_password_change"
            type="password"
            value={passwordForm.current_password}
            onChange={(e) => {
              onPasswordFormChange('current_password', e.target.value);
            }}
            placeholder={t(
              'profile.forms.currentPasswordPlaceholder',
              'Enter current password',
            )}
            disabled={isUpdatingPassword}
          />
        </div>
        <div className="form-group">
          <label htmlFor="new_password">
            {t('profile.forms.newPassword', 'New Password')}
          </label>
          <input
            id="new_password"
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => {
              onPasswordFormChange('new_password', e.target.value);
            }}
            placeholder={t(
              'profile.forms.newPasswordPlaceholder',
              'Enter new password',
            )}
            disabled={isUpdatingPassword}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm_password">
            {t('profile.forms.confirmNewPassword', 'Confirm New Password')}
          </label>
          <input
            id="confirm_password"
            type="password"
            value={passwordForm.confirm_password}
            onChange={(e) => {
              onPasswordFormChange('confirm_password', e.target.value);
            }}
            placeholder={t(
              'profile.forms.confirmNewPasswordPlaceholder',
              'Confirm new password',
            )}
            disabled={isUpdatingPassword}
          />
        </div>
        <div className="form-actions">
          <button
            type="button"
            onClick={onUpdatePassword}
            disabled={isUpdatingPassword}
            className="save-button"
          >
            {isUpdatingPassword
              ? t('profile.forms.saving', 'Saving...')
              : t('profile.forms.save', 'Save')}
          </button>
          <button
            type="button"
            onClick={onCancelEditPassword}
            disabled={isUpdatingPassword}
            className="cancel-button"
          >
            {t('profile.forms.cancel', 'Cancel')}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ProfileEditForms;
