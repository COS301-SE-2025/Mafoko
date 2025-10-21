import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';
import LsImage from '/LS_image.png';
import { useTranslation } from 'react-i18next';
import DfsiLogo from '/DFSI_Logo.png';
import { API_ENDPOINTS } from '../config';
import { PasswordField } from '../components/ui/PasswordInput.tsx';

interface LoginResponse {
  access_token: string;
  token_type: string;
  detail?: string;
}

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const API_ENDPOINT = API_ENDPOINTS.login;

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (response.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        localStorage.setItem('accessToken', data.access_token);
        await navigate('/dashboard');
      } else {
        console.error('Login failed:', data.detail);
        setErrorMessage(data.detail || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Network or other error during login:', error);
      setErrorMessage(
        'Network error. Please check your connection and try again.',
      );
    }
  };

  const handleGuestLogin = async () => {
    setErrorMessage(null);

    try {
      const response = await fetch(API_ENDPOINTS.guestLogin, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = (await response.json()) as LoginResponse;

      if (response.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        localStorage.setItem('accessToken', data.access_token);
        await navigate('/dashboard');
      } else {
        console.error('Guest login failed:', data.detail);
        setErrorMessage(data.detail || 'Guest login failed. Please try again.');
      }
    } catch (error) {
      console.error('Network or other error during guest login:', error);
      setErrorMessage(
        'Network error. Please check your connection and try again.',
      );
    }
  };

  return (
    <div className="login-page-full-container">
      {/* Left Half - Image */}
      <div className="login-left-half">
        <img
          src={LsImage}
          alt="Marito Login Welcome"
          className="login-hero-image"
        />
      </div>

      {/* Right Half - Form */}
      <div className="login-right-half">
        <div className="auth-page-header">
          <img
            src={DfsiLogo}
            alt={t('loginPage.dsfsiLogoAlt', 'DSFSI Logo')}
            className="dsfsi-logo-auth"
          />
        </div>

        <div className="login-form-content">
          {' '}
          <h1 className="login-header">{t('loginPage.title')}</h1>
          <p
            className="login-subheader"
            style={{ color: errorMessage ? 'red' : '' }}
          >
            {errorMessage || t('loginPage.subtitle')}
          </p>
          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="login-form"
          >
            <div className="form-group">
              {' '}
              <label htmlFor="email">{t('loginPage.emailLabel')}</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder={t('loginPage.emailPlaceholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                required
              />
            </div>

            <PasswordField
              value={password}
              onChange={setPassword}
              label={t('registrationPage.passwordLabel')}
              placeholder={t('registrationPage.passwordPlaceholder')}
            />

            <div className="form-options">
              <div className="remember-me">
                <input type="checkbox" id="rememberMe" name="rememberMe" />{' '}
                <label htmlFor="rememberMe">{t('loginPage.rememberMe')}</label>
              </div>
              <Link to="/forgot-password" className="forgot-password-link">
                {t('loginPage.forgotPassword')}
              </Link>
            </div>

            <button type="submit" className="login-button primary">
              {t('loginPage.loginButton')}
            </button>
          </form>
          <div className="guest-login-section">
            <p className="guest-login-divider">
              {t('loginPage.orContinueAs', 'Or continue as')}
            </p>
            <button
              type="button"
              className="login-button secondary guest-button"
              onClick={() => void handleGuestLogin()}
            >
              {t('loginPage.continueAsGuest', 'Continue as Guest')}
            </button>
          </div>
          <p className="register-link-prompt">
            {t('loginPage.noAccount')}{' '}
            <Link to="/register">{t('loginPage.registerLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
