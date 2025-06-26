import { vi } from 'vitest';

// 🧩 Mocks
const mockNavigate = vi.fn();

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

// 📦 Actual test logic
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import LoginPage from '../src/pages/LoginPage';

global.fetch = vi.fn();

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

    expect(screen.getByLabelText('loginPage.emailLabel')).toBeInTheDocument();
    expect(
      screen.getByLabelText('loginPage.passwordLabel'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'loginPage.loginButton' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'loginPage.loginWithGoogle' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
  });

  test('handles successful login and redirects', async () => {
    const mockResponse = {
      access_token: 'fake_token',
      token_type: 'bearer',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => {
        await Promise.resolve();
        return mockResponse;
      },
    } as Response);

    render(
      <Router>
        <LoginPage />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText('loginPage.emailLabel'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText('loginPage.passwordLabel'), {
      target: { value: 'password123' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'loginPage.loginButton' }),
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(localStorage.getItem('accessToken')).toBe('fake_token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('shows error message on failed login', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => {
        await Promise.resolve();
        return { detail: 'Invalid credentials' };
      },
    } as Response);

    render(
      <Router>
        <LoginPage />
      </Router>,
    );

    fireEvent.change(screen.getByLabelText('loginPage.emailLabel'), {
      target: { value: 'wrong@example.com' },
    });

    fireEvent.change(screen.getByLabelText('loginPage.passwordLabel'), {
      target: { value: 'badpassword' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'loginPage.loginButton' }),
    );

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
});
