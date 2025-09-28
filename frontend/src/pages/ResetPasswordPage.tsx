import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config';
import '../styles/LoginPage.css';
import LsImage from '/LS_image.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
import DfsiLogo from '/DFSI_Logo.png';

interface ResetPasswordResponse {
  message: string;
}

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setErrorMessage(
        'Invalid or missing reset token. Please request a new password reset.',
      );
      return;
    }
    setToken(resetToken);
  }, [searchParams]);

  const validatePasswords = () => {
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setMessage(null);

    if (!token) {
      setErrorMessage('Invalid reset token.');
      return;
    }

    if (!validatePasswords()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(API_ENDPOINTS.resetPassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: password,
        }),
      });

      const data = (await response.json()) as ResetPasswordResponse;

      if (response.ok) {
        setMessage(data.message);
        // Redirect to login page after successful reset
        setTimeout(() => {
          void navigate('/login');
        }, 3000);
      } else {
        setErrorMessage(data.message || 'An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setErrorMessage(
        'Network error. Please check your connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token && !errorMessage) {
    return <div>Loading...</div>;
  }

  return (
    <div className="login-page-full-container">
      {/* Left Half - Image */}
      <div className="login-left-half">
        <img
          src={LsImage}
          alt="Password Reset Welcome"
          className="login-hero-image"
        />
      </div>

      {/* Right Half - Form */}
      <div className="login-right-half">
        <div className="auth-page-header">
          <LanguageSwitcher />
          <img src={DfsiLogo} alt="DSFSI Logo" className="dsfsi-logo-auth" />
        </div>

        <div className="login-form-content">
          <h1 className="login-header">{t('Reset Your Password')}</h1>
          <p className="login-subheader">
            {t('Enter your new password below.')}
          </p>

          {errorMessage && (
            <div className="error-message" role="alert">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="success-message" role="alert">
              {message}
              <br />
              <small>
                {t(
                  'You will be redirected to the login page in a few seconds.',
                )}
              </small>
            </div>
          )}

          {token && !message && (
            <form className="login-form" onSubmit={(e) => void handleSubmit(e)}>
              <div className="form-group">
                <label htmlFor="password">{t('New Password')}</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  placeholder={t('Enter your new password')}
                  required
                  disabled={isSubmitting}
                  minLength={6}
                />
                <small className="form-help">
                  {t('Password must be at least 6 characters long.')}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  {t('Confirm New Password')}
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                  }}
                  placeholder={t('Confirm your new password')}
                  required
                  disabled={isSubmitting}
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="login-button primary"
                disabled={isSubmitting || !password || !confirmPassword}
              >
                {isSubmitting ? t('Resetting...') : t('Reset Password')}
              </button>
            </form>
          )}

          <div className="register-link-prompt">
            <Link to="/login">{t('Back to Sign In')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
