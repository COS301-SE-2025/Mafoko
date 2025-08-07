// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';
import LsImage from '/LS_image.png';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import DfsiLogo from '/DFSI_Logo.png';
import { CredentialResponse, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { API_ENDPOINTS } from '../config';

const GoogleLogo = () => (
  <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    height="24px"
    width="24px"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    ></path>
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    ></path>
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    ></path>
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    ></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

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

const handleGoogleLogin = async (tokenResponse: CredentialResponse) => {
  console.log('Google token response:', tokenResponse.credential);
  try {
    const response = await fetch(API_ENDPOINTS.loginWithGoogle, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_token: tokenResponse.credential }),
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with backend');
    }

    const data = await response.json();

        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        localStorage.setItem('accessToken', data.access_token);
        await navigate('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    setErrorMessage(t('loginPage.errors.googleLoginFailed'));
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
          <LanguageSwitcher />
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

            <div className="form-group">
              {' '}
              <label htmlFor="password">{t('loginPage.passwordLabel')}</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder={t('loginPage.passwordPlaceholder')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                required
              />
            </div>

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

            <div className="social-login-divider">
              <span>{t('loginPage.orDivider')}</span>
            </div>

            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setErrorMessage(t('loginPage errors googleLoginFailed'))}
            />

          </form>
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
