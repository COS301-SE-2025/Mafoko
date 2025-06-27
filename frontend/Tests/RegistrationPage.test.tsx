import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegistrationPage from '../src/pages/RegistrationPage';
import '@testing-library/jest-dom';

// Mocks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'registrationPage.title': 'Register',
        'registrationPage.subtitle': 'Create an account',
        'registrationPage.firstNameLabel': 'First Name',
        'registrationPage.lastNameLabel': 'Last Name',
        'registrationPage.emailLabel': 'Email',
        'registrationPage.passwordLabel': 'Password',
        'registrationPage.confirmPasswordLabel': 'Confirm Password',
        'registrationPage.agreeToTerms': 'I agree to the terms',
        'registrationPage.termsAndConditionsLink': 'Terms and Conditions',
        'registrationPage.createAccountButton': 'Create Account',
        'registrationPage.errors.passwordMismatch': 'Passwords do not match',
      };
      return translations[key] || key;
    },
    i18n: { changeLanguage: () => Promise.resolve(), language: 'en' },
  }),
}));

vi.mock('../src/components/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher">Lang Switcher</div>,
}));

describe('RegistrationPage', () => {
  test('displays error if passwords do not match', async () => {
    render(
      <BrowserRouter>
        <RegistrationPage />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Alice' },
    });

    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Smith' },
    });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'alice@example.com' },
    });

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password456' },
    });

    fireEvent.click(screen.getByLabelText(/i agree to the terms/i));

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      await screen.findByText('Passwords do not match'),
    ).toBeInTheDocument();
  });
  test('displays error if passwords do not match', async () => {
    render(
      <BrowserRouter>
        <RegistrationPage />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Alice' },
    });

    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Smith' },
    });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'alice@example.com' },
    });

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password456' },
    });

    fireEvent.click(screen.getByLabelText(/i agree to the terms/i));

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      await screen.findByText('Passwords do not match'),
    ).toBeInTheDocument();
  });
});
