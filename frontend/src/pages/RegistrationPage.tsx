import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/RegistrationPage.css';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import LsImage from '/LS_image.png';
import DfsiLogo from '/DFSI_Logo.png';
import { API_ENDPOINTS } from '../config';

// --- TYPE DEFINITIONS ---
type UserType = 'contributor' | 'linguist';
type DocumentType = 'idDocument' | 'cv' | 'certifications' | 'researchPapers';

interface SignedUrlResponse {
  upload_url: string;
  gcs_key: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  detail?: string;
}

interface LoginSuccessResponse {
  access_token: string;
  token_type: string;
}

interface ApiErrorResponse {
  detail: string;
}

// SVG for Google Logo

const RegistrationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [userType, setUserType] = useState<UserType>('contributor');
  const [documentFiles, setDocumentFiles] = useState<{
    [key in DocumentType]?: File;
  }>({});

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    docType: DocumentType,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocumentFiles((prev) => ({ ...prev, [docType]: file }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('registrationPage.errors.passwordMismatch'));
      return;
    }
    if (!agreedToTerms) {
      setError(t('registrationPage.errors.mustAgreeToTerms'));
      return;
    }
    if (
      userType === 'linguist' &&
      (!documentFiles.idDocument || !documentFiles.cv)
    ) {
      setError(t('registrationPage.errors.idAndCvRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const registerPayload = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password,
      };

      const registerResponse = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerPayload),
      });

      if (!registerResponse.ok) {
        const errorData = (await registerResponse.json()) as ApiErrorResponse;
        throw new Error(errorData.detail || 'Registration failed.');
      }

      const loginResponse = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      if (!loginResponse.ok) {
        const errorData = (await loginResponse.json()) as ApiErrorResponse;
        throw new Error(
          errorData.detail || 'Automatic login failed after registration.',
        );
      }

      const loginData = (await loginResponse.json()) as LoginSuccessResponse;
      const accessToken = loginData.access_token;
      localStorage.setItem('accessToken', accessToken);

      if (userType === 'linguist') {
        const uploadedFileUrls: { [key: string]: string | undefined } = {};
        const filesToUpload = Object.entries(documentFiles).filter(
          (entry): entry is [DocumentType, File] => Boolean(entry[1]),
        );

        for (const [docType, file] of filesToUpload) {
          const signedUrlRes = await fetch(API_ENDPOINTS.generateSignedUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              content_type: file.type,
              filename: file.name,
            }),
          });

          if (!signedUrlRes.ok)
            throw new Error(`Could not get upload URL for ${file.name}.`);

          const signedUrlData =
            (await signedUrlRes.json()) as SignedUrlResponse;

          const uploadRes = await fetch(signedUrlData.upload_url, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });

          if (!uploadRes.ok) throw new Error(`Failed to upload ${file.name}.`);
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
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(applicationPayload),
        });

        if (!appResponse.ok) {
          const errorData = (await appResponse.json()) as ApiErrorResponse;
          throw new Error(
            errorData.detail || 'Failed to submit linguist application.',
          );
        }
      }

      void navigate('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('registrationPage.errors.unexpectedError'));
      }
    } finally {
      setIsLoading(false);
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

      const data = (await response.json()) as LoginResponse;

      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');
      localStorage.setItem('accessToken', data.access_token);
      await navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setError(t('loginPage.errors.googleLoginFailed'));
    }
  };

  const isLinguist = userType === 'linguist';

  return (
    <div className="registration-page-full-container">
      <div className="registration-left-half">
        <img
          src={LsImage}
          alt={t('registrationPage.welcomeImageAlt')}
          className="registration-hero-image"
        />
      </div>

      <div className="registration-right-half">
        <div className="auth-page-header">
          <LanguageSwitcher />
          <img
            src={DfsiLogo}
            alt={t('registrationPage.dsfsiLogoAlt')}
            className="dsfsi-logo-auth"
          />
        </div>

        <div className="registration-form-content">
          <h1 className="registration-header">{t('registrationPage.title')}</h1>
          <p className="registration-subheader">
            {t('registrationPage.subtitle')}
          </p>

          {error && (
            <p
              className="error-message"
              style={{
                color: 'red',
                textAlign: 'center',
                marginBottom: '10px',
              }}
            >
              {error}
            </p>
          )}
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="registration-form"
          >
            <div className="form-row">
              <div className="form-group column">
                <label htmlFor="firstName">
                  {t('registrationPage.firstNameLabel')}
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder={t('registrationPage.firstNamePlaceholder')}
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                  }}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="form-group column">
                <label htmlFor="lastName">
                  {t('registrationPage.lastNameLabel')}
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder={t('registrationPage.lastNamePlaceholder')}
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                  }}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('registrationPage.emailLabel')}</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder={t('registrationPage.emailPlaceholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                {t('registrationPage.passwordLabel')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder={t('registrationPage.passwordPlaceholder')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                {t('registrationPage.confirmPasswordLabel')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder={t('registrationPage.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                }}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="userType">
                {t('registrationPage.registerAsLabel', 'Register As')}
              </label>
              <select
                id="userType"
                value={userType}
                onChange={(e) => {
                  setUserType(e.target.value as UserType);
                }}
                disabled={isLoading}
                className="custom-select"
              >
                <option value="contributor">
                  {t('registrationPage.normalUser', 'Normal User')}
                </option>
                <option value="linguist">
                  {t(
                    'registrationPage.linguistApplicant',
                    'Applying as Linguist',
                  )}
                </option>
              </select>
            </div>

            {isLinguist && (
              <div className="linguist-application-section">
                <div className="form-group">
                  <label htmlFor="idDocument">
                    {t('registrationPage.idDocumentLabel', 'ID Document (PDF)')}
                  </label>
                  <input
                    type="file"
                    id="idDocument"
                    accept="application/pdf"
                    onChange={(e) => {
                      handleFileSelect(e, 'idDocument');
                    }}
                    required={isLinguist}
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cv">
                    {t('registrationPage.cvLabel', 'CV (PDF)')}
                  </label>
                  <input
                    type="file"
                    id="cv"
                    accept="application/pdf"
                    onChange={(e) => {
                      handleFileSelect(e, 'cv');
                    }}
                    required={isLinguist}
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="certifications">
                    {t(
                      'registrationPage.certificationsLabel',
                      'Certifications (PDF, Optional)',
                    )}
                  </label>
                  <input
                    type="file"
                    id="certifications"
                    accept="application/pdf"
                    onChange={(e) => {
                      handleFileSelect(e, 'certifications');
                    }}
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="researchPapers">
                    {t(
                      'registrationPage.researchPapersLabel',
                      'Research Papers (PDF, Optional)',
                    )}
                  </label>
                  <input
                    type="file"
                    id="researchPapers"
                    accept="application/pdf"
                    onChange={(e) => {
                      handleFileSelect(e, 'researchPapers');
                    }}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="form-group terms-checkbox">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                }}
                required
                disabled={isLoading}
              />
              <label htmlFor="terms" className="terms-label">
                {t('registrationPage.agreeToTerms')}{' '}
                <Link to="/terms" target="_blank" rel="noopener noreferrer">
                  {t('registrationPage.termsAndConditionsLink')}
                </Link>
              </label>
            </div>
            <button
              type="submit"
              className="register-button primary"
              disabled={isLoading}
            >
              {isLoading
                ? t('registrationPage.creatingAccountButton')
                : t('registrationPage.createAccountButton')}
            </button>
            <div className="social-login-divider">
              <span>{t('registrationPage.orDivider')}</span>
            </div>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                void handleGoogleLogin(credentialResponse);
              }}
              onError={() => {
                setError(t('RegistrationPage errors googleLoginFailed'));
              }}
            />
          </form>

          <p className="login-link">
            {t('registrationPage.haveAccount')}{' '}
            <Link to="/login">{t('registrationPage.loginLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
