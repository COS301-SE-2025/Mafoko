import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import RegistrationPage from '../src/pages/RegistrationPage';
import '@testing-library/jest-dom';

// Mocks
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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
        'registrationPage.creatingAccountButton': 'Creating Account...',
        'registrationPage.errors.passwordMismatch': 'Passwords do not match',
        'registrationPage.errors.mustAgreeToTerms':
          'You must agree to the terms and conditions.',
        'registrationPage.errors.registrationFailed': 'Registration failed',
        'registrationPage.errors.unexpectedError': 'Unexpected error occurred',
        'registrationPage.loginLink': 'Log in',
        'registrationPage.haveAccount': 'Already have an account?',
        'registrationPage.orDivider': 'or',
      };
      return translations[key] || key;
    },
    i18n: { changeLanguage: () => Promise.resolve(), language: 'en' },
  }),
}));

vi.mock('../src/components/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher">Lang Switcher</div>,
}));

global.fetch = vi.fn();

beforeEach(() => {
  localStorage.clear();
  (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  mockNavigate.mockClear();
});

describe('RegistrationPage', () => {
  const clientId = 'fake-client-id-for-testing'; // Dummy client ID for GoogleOAuthProvider
  test('displays error if passwords do not match', async () => {
    render(
      <GoogleOAuthProvider clientId={clientId}>
        <BrowserRouter>
          <RegistrationPage />
        </BrowserRouter>
      </GoogleOAuthProvider>,
    );

    // Fill in required fields to ensure form submission proceeds to password validation
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password456' }, // Mismatch
    });
    fireEvent.click(screen.getByLabelText(/i agree to the terms/i)); // Agree to terms for password mismatch test

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(
      await screen.findByText(/Passwords do not match/i),
    ).toBeInTheDocument();
  });

  test('displays error if terms are not agreed to', async () => {
    render(
      <GoogleOAuthProvider clientId={clientId}>
        <BrowserRouter>
          <RegistrationPage />
        </BrowserRouter>
      </GoogleOAuthProvider>,
    );

    // Fill in required fields to ensure form submission proceeds
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    });
    // Do NOT click the terms checkbox, so it's not agreed to.

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    // Now, expect the custom error message for not agreeing to terms
    expect(
      await screen.findByText(/You must agree to the terms and conditions./i),
    ).toBeInTheDocument();
  });

  test('handles successful registration and redirects', async () => {
    // Mock successful registration response
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          // Fixed: Removed 'async' keyword
          message: 'User registered successfully',
        }),
    } as Response);

    // Mock successful login response after registration
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          // Fixed: Removed 'async' keyword
          access_token: 'fake_token',
          token_type: 'bearer',
        }),
    } as Response);

    render(
      <GoogleOAuthProvider clientId={clientId}>
        <BrowserRouter>
          <RegistrationPage />
        </BrowserRouter>
      </GoogleOAuthProvider>,
    );

    // Fill out the form
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
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/i agree to the terms/i));

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    // Wait for the asynchronous operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(localStorage.getItem('accessToken')).toBe('fake_token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('displays API error on registration failure', async () => {
    // Mock a failed registration response
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Email already registered' }), // Fixed: Removed 'async' keyword
    } as Response);

    render(
      <GoogleOAuthProvider clientId={clientId}>
        <BrowserRouter>
          <RegistrationPage />
        </BrowserRouter>
      </GoogleOAuthProvider>,
    );

    // Fill out the form
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
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/i agree to the terms/i));

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    // Check if the error message is displayed
    expect(
      await screen.findByText('Email already registered'),
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
