import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../config';
import '../styles/LoginPage.css';
import LsImage from '/LS_image.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
import DfsiLogo from '/DFSI_Logo.png';

interface ForgotPasswordResponse {
  message: string;
}

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(API_ENDPOINTS.forgotPassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = (await response.json()) as ForgotPasswordResponse;

      if (response.ok) {
        setMessage(data.message);
        setEmail(''); // Clear the form
      } else {
        setErrorMessage(data.message || 'An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setErrorMessage(
        'Network error. Please check your connection and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {t(
              "Enter your email address and we'll send you a link to reset your password.",
            )}
          </p>

          {errorMessage && (
            <div className="error-message" role="alert">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="success-message" role="alert">
              {message}
            </div>
          )}

          <form className="login-form" onSubmit={(e) => void handleSubmit(e)}>
            <div className="form-group">
              <label htmlFor="email">{t('Email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder={t('Enter your email address')}
                required
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="login-button primary"
              disabled={isSubmitting || !email.trim()}
            >
              {isSubmitting ? t('Sending...') : t('Send Reset Link')}
            </button>
          </form>

          <div className="register-link-prompt">
            {t('Remember your password?')}{' '}
            <Link to="/login">{t('Sign in')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
