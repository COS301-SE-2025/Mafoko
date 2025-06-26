// src/pages/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AnimatedGreeting from '../components/auth/AnimatedGreeting';
import LanguageSwitcher from '../components/LanguageSwitcher';
import '../styles/LandingPage.css';
import DfsiLogo from '/DFSI_Logo.png';

const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="landing-page-container">
      <nav className="landing-nav">
        <div className="nav-left">
          <img src={DfsiLogo} alt="DSFSI Logo" className="nav-logo" />
          <span className="nav-title">{t('appTitle', 'Marito')}</span>
        </div>
        <div className="nav-right">
          <LanguageSwitcher />
          <Link to="/login" className="btn-landing btn-nav-login">
            {t('landingPage.loginButton', 'Login')}
          </Link>
          <Link to="/register" className="btn-landing btn-nav-register">
            {t('landingPage.registerButton', 'Register')}
          </Link>
        </div>
      </nav>

      <main className="hero-content">
        <AnimatedGreeting />
      </main>

      <footer className="landing-footer">
        <p>
          &copy; {new Date().getFullYear()} {t('appTitle', 'Marito Project')}
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
