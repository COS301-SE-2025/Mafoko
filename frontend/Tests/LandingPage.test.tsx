import { vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: {
      changeLanguage: () => Promise.resolve(),
      language: 'en',
    },
  }),
}));

vi.mock('../src/components/LanguageSwitcher', () => ({
  __esModule: true,
  default: () => <div data-testid="language-switcher">Language Switcher</div>,
}));

vi.mock('../src/components/auth/AnimatedGreeting', () => ({
  __esModule: true,
  default: () => <div data-testid="animated-greeting">Hello!</div>,
}));

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import LandingPage from '../src/pages/LandingPage';

describe('LandingPage', () => {
  test('renders language switcher and greeting', () => {
    render(
      <Router>
        <LandingPage />
      </Router>,
    );

    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('animated-greeting')).toBeInTheDocument();
  });

  test('renders register and login buttons with links', () => {
    render(
      <Router>
        <LandingPage />
      </Router>,
    );

    const registerBtn = screen.getByRole('link', {
      name: /register/i,
    });
    const loginBtn = screen.getByRole('link', {
      name: /login/i,
    });

    expect(registerBtn).toBeInTheDocument();
    expect(registerBtn).toHaveAttribute('href', '/register');

    expect(loginBtn).toBeInTheDocument();
    expect(loginBtn).toHaveAttribute('href', '/login');
  });

  test('renders footer with current year and app title fallback', () => {
    render(
      <Router>
        <LandingPage />
      </Router>,
    );

    const year = new Date().getFullYear().toString();
    expect(screen.getByText((text) => text.includes(year))).toBeInTheDocument();
    expect(
      screen.getByText((text) => text.includes('Marito Project')),
    ).toBeInTheDocument();
  });
});
