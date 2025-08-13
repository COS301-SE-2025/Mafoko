import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
// import { GoogleOAuthProvider } from '@react-oauth/google'; // Not needed directly if GoogleLogin is mocked
import LoginPage from '../src/pages/LoginPage';
import { API_ENDPOINTS } from '../src/config';

// 🧩 Mocks
const mockNavigate = vi.fn();

// Mock react-router-dom's useNavigate hook
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock react-i18next's useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'loginPage.emailLabel': 'Email',
        'loginPage.passwordLabel': 'Password',
        'loginPage.loginButton': 'Login',
        'loginPage.dsfsiLogoAlt': 'DFSI Logo',
        'loginPage.subtitle': 'Please enter your credentials to login.',
        'loginPage.noAccount': "Don't have an account?",
        'loginPage.registerLink': 'Register',
        'loginPage.emailPlaceholder': 'Enter your email address',
        'loginPage.passwordPlaceholder': 'Enter your password',
        'loginPage.rememberMe': 'Remember me',
        'loginPage.forgotPassword': 'Forgot Password?',
        'loginPage.orDivider': 'OR',
      };
      return translations[key] || fallback || key;
    },
    i18n: {
      changeLanguage: () => Promise.resolve(),
      language: 'en',
    },
  }),
}));

// Mock the LanguageSwitcher component
vi.mock('../src/components/LanguageSwitcher', () => ({
  __esModule: true,
  default: () => <div data-testid="language-switcher">Language Switcher</div>,
}));

// 🛠️ ADDED: Mock @react-oauth/google to prevent GoogleOAuthProvider requirement
// We provide a simple mock for GoogleLogin that doesn't need the provider.
vi.mock('@react-oauth/google', () => ({
  // We don't need to mock GoogleOAuthProvider as it's not being used directly in the test setup.
  // We just need to mock GoogleLogin so it doesn't throw the context error.
  GoogleLogin: () => (
    // Fixed: Removed empty object pattern and type annotation
    <button data-testid="mock-google-login-button" type="button">
      Mock Google Login
    </button>
  ),
  // If you had other named exports from @react-oauth/google that LoginPage used,
  // you'd list them here, e.g., useGoogleLogin: vi.fn(),
}));

// Mock global.fetch
global.fetch = vi.fn();

// Clear mocks and localStorage before each test
beforeEach(() => {
  localStorage.clear();
  (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  mockNavigate.mockClear();
});

describe('LoginPage', () => {
  test('renders input fields and buttons', () => {
    render(
      <Router>
        <LoginPage />
      </Router>,
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    // Use the data-testid for the mocked GoogleLogin button
    expect(screen.getByTestId('mock-google-login-button')).toBeInTheDocument();
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });

  test('handles successful login and redirects', async () => {
    const mockResponse = {
      access_token: 'fake_token',
      token_type: 'bearer',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    render(
      <Router>
        <LoginPage />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.login,
        expect.objectContaining({
          method: 'POST',
          // 🛠️ FIX: Match the URLSearchParams object itself, not its stringified version,
          // as that's what's likely passed to the mock.
          body: new URLSearchParams({
            username: 'test@example.com',
            password: 'password123',
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );
      expect(localStorage.getItem('accessToken')).toBe('fake_token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('shows error message on failed login (API error)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Invalid credentials' }),
    } as Response);

    render(
      <Router>
        <LoginPage />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'badpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  test('shows generic error message on network failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Failed to fetch'),
    );

    render(
      <Router>
        <LoginPage />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(
      await screen.findByText(
        /Network error\. Please check your connection and try again\./i,
      ),
    ).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
