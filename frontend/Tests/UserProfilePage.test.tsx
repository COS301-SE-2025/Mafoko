import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { DarkModeProvider } from '../src/components/ui/DarkModeComponent';
import UserProfilePage from '../src/pages/UserProfilePage';

const mockNavigate = vi.fn<(path: string | number) => void>();

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

vi.mock('../src/components/ui/LeftNav', () => ({
  __esModule: true,
  default: ({
    activeItem,
    setActiveItem,
  }: {
    activeItem: string;
    setActiveItem: (item: string) => void;
  }) => (
    <div data-testid="left-nav">
      Left Nav - Active: {activeItem}
      <button
        type="button"
        onClick={() => {
          setActiveItem('profile');
        }}
      >
        Profile
      </button>
    </div>
  ),
}));

vi.mock('../src/components/profile/ProfileHeader', () => ({
  __esModule: true,
  default: ({
    onBackClick,
    onSettingsClick,
  }: {
    onBackClick: () => void;
    onSettingsClick: () => void;
  }) => (
    <div data-testid="profile-header">
      <button type="button" onClick={onBackClick} data-testid="back-button">
        Back
      </button>
      <button
        type="button"
        onClick={onSettingsClick}
        data-testid="settings-button"
      >
        Settings
      </button>
    </div>
  ),
}));

vi.mock('../src/components/profile/ProfilePicture', () => ({
  __esModule: true,
  default: ({
    onProfilePictureUpload,
  }: {
    onProfilePictureUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div data-testid="profile-picture">
      <input
        type="file"
        data-testid="profile-picture-input"
        onChange={onProfilePictureUpload}
      />
    </div>
  ),
}));

vi.mock('../src/components/profile/ProfileEditDropdown', () => ({
  __esModule: true,
  default: ({
    firstName,
    lastName,
    email,
    onEditName,
    onEditEmail,
    onEditPassword,
  }: {
    firstName: string;
    lastName: string;
    email: string;
    onEditName: () => void;
    onEditEmail: () => void;
    onEditPassword: () => void;
  }) => (
    <div data-testid="profile-edit-dropdown">
      <div data-testid="user-name">
        {firstName} {lastName}
      </div>
      <div data-testid="user-email">{email}</div>
      <button type="button" onClick={onEditName} data-testid="edit-name-button">
        Edit Name
      </button>
      <button
        type="button"
        onClick={onEditEmail}
        data-testid="edit-email-button"
      >
        Edit Email
      </button>
      <button
        type="button"
        onClick={onEditPassword}
        data-testid="edit-password-button"
      >
        Edit Password
      </button>
    </div>
  ),
}));

vi.mock('../src/components/profile/ProfileEditForms', () => ({
  __esModule: true,
  default: ({
    editMode,
    onUpdateUsername,
    onUpdateEmail,
    onUpdatePassword,
    onCancelEditUsername,
    onCancelEditEmail,
    onCancelEditPassword,
  }: {
    editMode: 'username' | 'email' | 'password' | null;
    onUpdateUsername: () => void;
    onUpdateEmail: () => void;
    onUpdatePassword: () => void;
    onCancelEditUsername: () => void;
    onCancelEditEmail: () => void;
    onCancelEditPassword: () => void;
  }) => {
    if (editMode === 'username') {
      return (
        <div data-testid="username-edit-form">
          <button
            type="button"
            onClick={onUpdateUsername}
            data-testid="update-username-button"
          >
            Update Username
          </button>
          <button
            type="button"
            onClick={onCancelEditUsername}
            data-testid="cancel-username-button"
          >
            Cancel
          </button>
        </div>
      );
    }
    if (editMode === 'email') {
      return (
        <div data-testid="email-edit-form">
          <button
            type="button"
            onClick={onUpdateEmail}
            data-testid="update-email-button"
          >
            Update Email
          </button>
          <button
            type="button"
            onClick={onCancelEditEmail}
            data-testid="cancel-email-button"
          >
            Cancel
          </button>
        </div>
      );
    }
    if (editMode === 'password') {
      return (
        <div data-testid="password-edit-form">
          <button
            type="button"
            onClick={onUpdatePassword}
            data-testid="update-password-button"
          >
            Update Password
          </button>
          <button
            type="button"
            onClick={onCancelEditPassword}
            data-testid="cancel-password-button"
          >
            Cancel
          </button>
        </div>
      );
    }
    return null;
  },
}));

vi.mock('../src/components/profile/ProfileSuccessMessages', () => ({
  __esModule: true,
  default: ({
    uploadSuccess,
    updateUsernameSuccess,
    updateEmailSuccess,
    updatePasswordSuccess,
  }: {
    uploadSuccess: boolean;
    updateUsernameSuccess: boolean;
    updateEmailSuccess: boolean;
    updatePasswordSuccess: boolean;
  }) => (
    <div data-testid="success-messages">
      {uploadSuccess && <div data-testid="upload-success">Upload Success</div>}
      {updateUsernameSuccess && (
        <div data-testid="username-success">Username Updated</div>
      )}
      {updateEmailSuccess && (
        <div data-testid="email-success">Email Updated</div>
      )}
      {updatePasswordSuccess && (
        <div data-testid="password-success">Password Updated</div>
      )}
    </div>
  ),
}));

global.fetch = vi.fn();

const mockProfileData = {
  id: '123',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  role: 'user',
  is_active: true,
  is_verified: true,
  account_locked: false,
  created_at: '2023-01-01T00:00:00Z',
  last_login: '2023-12-01T00:00:00Z',
  profile_pic_url: null,
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  mockNavigate.mockClear();

  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });
});

describe('UserProfilePage', () => {
  test('renders error message when no access token is found', async () => {
    render(
      <Router>
        <DarkModeProvider>
          <UserProfilePage />
        </DarkModeProvider>
      </Router>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('No access token found. Please login first.'),
      ).toBeInTheDocument();
    });
  });

  test('loads and displays profile data successfully', async () => {
    localStorage.setItem('accessToken', 'dummy-token');

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (typeof url === 'string' && url.includes('/api/v1/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProfileData),
          } as Response);
        }
        if (
          typeof url === 'string' &&
          url.includes('/api/v1/linguist-applications/me')
        ) {
          return Promise.resolve({
            ok: false,
            status: 404,
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 404,
        } as Response);
      },
    );

    render(
      <Router>
        <DarkModeProvider>
          <UserProfilePage />
        </DarkModeProvider>
      </Router>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'john.doe@example.com',
      );
      expect(screen.getByText('user')).toBeInTheDocument();
    });
  });

  test('handles back navigation', async () => {
    localStorage.setItem('accessToken', 'dummy-token');

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (typeof url === 'string' && url.includes('/api/v1/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProfileData),
          } as Response);
        }
        if (
          typeof url === 'string' &&
          url.includes('/api/v1/linguist-applications/me')
        ) {
          return Promise.resolve({
            ok: false,
            status: 404,
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 404,
        } as Response);
      },
    );

    render(
      <Router>
        <DarkModeProvider>
          <UserProfilePage />
        </DarkModeProvider>
      </Router>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('back-button'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('enables edit mode for username', async () => {
    localStorage.setItem('accessToken', 'dummy-token');

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (typeof url === 'string' && url.includes('/api/v1/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProfileData),
          } as Response);
        }
        if (
          typeof url === 'string' &&
          url.includes('/api/v1/linguist-applications/me')
        ) {
          return Promise.resolve({
            ok: false,
            status: 404,
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 404,
        } as Response);
      },
    );

    render(
      <Router>
        <DarkModeProvider>
          <UserProfilePage />
        </DarkModeProvider>
      </Router>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('edit-name-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('edit-name-button'));

    await waitFor(() => {
      expect(screen.getByTestId('username-edit-form')).toBeInTheDocument();
      expect(
        screen.queryByTestId('profile-edit-dropdown'),
      ).not.toBeInTheDocument();
    });
  });

  test('enables edit mode for email', async () => {
    localStorage.setItem('accessToken', 'dummy-token');

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (typeof url === 'string' && url.includes('/api/v1/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProfileData),
          } as Response);
        }
        if (
          typeof url === 'string' &&
          url.includes('/api/v1/linguist-applications/me')
        ) {
          return Promise.resolve({
            ok: false,
            status: 404,
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 404,
        } as Response);
      },
    );

    render(
      <Router>
        <DarkModeProvider>
          <UserProfilePage />
        </DarkModeProvider>
      </Router>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('edit-email-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('edit-email-button'));

    await waitFor(() => {
      expect(screen.getByTestId('email-edit-form')).toBeInTheDocument();
      expect(
        screen.queryByTestId('profile-edit-dropdown'),
      ).not.toBeInTheDocument();
    });
  });

  test('enables edit mode for password', async () => {
    localStorage.setItem('accessToken', 'dummy-token');

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (typeof url === 'string' && url.includes('/api/v1/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProfileData),
          } as Response);
        }
        if (
          typeof url === 'string' &&
          url.includes('/api/v1/linguist-applications/me')
        ) {
          return Promise.resolve({
            ok: false,
            status: 404,
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 404,
        } as Response);
      },
    );

    render(
      <Router>
        <DarkModeProvider>
          <UserProfilePage />
        </DarkModeProvider>
      </Router>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('edit-password-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('edit-password-button'));

    await waitFor(() => {
      expect(screen.getByTestId('password-edit-form')).toBeInTheDocument();
      expect(
        screen.queryByTestId('profile-edit-dropdown'),
      ).not.toBeInTheDocument();
    });
  });

  test('displays linguist application status when no application exists', async () => {
    localStorage.setItem('accessToken', 'dummy-token');

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (typeof url === 'string' && url.includes('/api/v1/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProfileData),
          } as Response);
        }
        if (
          typeof url === 'string' &&
          url.includes('/api/v1/linguist-applications/me')
        ) {
          return Promise.resolve({
            ok: false,
            status: 404,
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 404,
        } as Response);
      },
    );

    render(
      <Router>
        <DarkModeProvider>
          <UserProfilePage />
        </DarkModeProvider>
      </Router>,
    );

    await waitFor(() => {
      expect(screen.getByText('Not Applied')).toBeInTheDocument();
      expect(screen.getByText('Apply')).toBeInTheDocument();
    });
  });

  test('displays linguist application status when application exists', async () => {
    localStorage.setItem('accessToken', 'dummy-token');

    const mockApplication = {
      id: 'app-123',
      status: 'pending' as const,
      created_at: '2023-01-01T00:00:00Z',
      reviewed_at: null,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (typeof url === 'string' && url.includes('/api/v1/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProfileData),
          } as Response);
        }
        if (
          typeof url === 'string' &&
          url.includes('/api/v1/linguist-applications/me')
        ) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockApplication),
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 404,
        } as Response);
      },
    );

    render(
      <Router>
        <DarkModeProvider>
          <UserProfilePage />
        </DarkModeProvider>
      </Router>,
    );

    await waitFor(() => {
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.queryByText('Apply')).not.toBeInTheDocument();
    });
  });

  test('handles mobile layout', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    localStorage.setItem('accessToken', 'dummy-token');

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (typeof url === 'string' && url.includes('/api/v1/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockProfileData),
          } as Response);
        }
        if (
          typeof url === 'string' &&
          url.includes('/api/v1/linguist-applications/me')
        ) {
          return Promise.resolve({
            ok: false,
            status: 404,
          } as Response);
        }
        return Promise.resolve({
          ok: false,
          status: 404,
        } as Response);
      },
    );

    render(
      <Router>
        <DarkModeProvider>
          <UserProfilePage />
        </DarkModeProvider>
      </Router>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('left-nav')).not.toBeInTheDocument();
    });
  });

  test('handles profile loading error', async () => {
    localStorage.setItem('accessToken', 'dummy-token');

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 401,
      } as Response);
    });

    render(
      <Router>
        <DarkModeProvider>
          <UserProfilePage />
        </DarkModeProvider>
      </Router>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load profile data'),
      ).toBeInTheDocument();
    });
  });
});
