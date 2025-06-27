import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from '../src/pages/AdminPage';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  profile_pic_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  account_locked: boolean;
  created_at: string;
  last_login: string;
}

interface Upload {
  gcs_key: string;
  filename: string;
}

vi.mock('../src/components/ui/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}));

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
          setActiveItem('admin');
        }}
      >
        Admin
      </button>
    </div>
  ),
}));

vi.mock('../src/config', () => ({
  API_ENDPOINTS: {
    getAll: '/api/users',
    getMe: '/api/users/me',
    getUsersWithUploads: () => '/api/users/with-uploads',
    getUserUploads: (userId: string) => `/api/users/${userId}/uploads`,
    getSignedDownloadUrl: (gcsKey: string) => `/api/files/download/${gcsKey}`,
    updateUserRole: (userId: string) => `/api/users/${userId}/role`,
  },
}));

Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: '',
  },
});

global.fetch = vi.fn();

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

const mockUsers: User[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    role: 'contributor',
    profile_pic_url: null,
    is_active: true,
    is_verified: true,
    account_locked: false,
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    role: 'admin',
    profile_pic_url: null,
    is_active: true,
    is_verified: true,
    account_locked: false,
    created_at: '2024-01-02T00:00:00Z',
    last_login: '2024-01-14T00:00:00Z',
  },
];

const mockUsersWithUploads: User[] = [mockUsers[0]];

const mockUploads: Upload[] = [
  {
    gcs_key: 'uploads/cv-john-doe.pdf',
    filename: 'john-doe-cv.pdf',
  },
  {
    gcs_key: 'uploads/certificate-john.pdf',
    filename: 'john-certificate.pdf',
  },
];

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('accessToken', 'dummy-token');
  (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  (window.open as ReturnType<typeof vi.fn>).mockClear();
  window.location.href = '';
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AdminPage', () => {
  test('renders admin page with applications view by default', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url.includes('/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ role: 'admin' }),
          } as Response);
        }
        if (url.includes('/users/with-uploads')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersWithUploads),
          } as Response);
        }
        if (url.includes('/users/') && url.includes('/uploads')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUploads),
          } as Response);
        }
        if (url.includes('/users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsers),
          } as Response);
        }
        return Promise.reject(new Error('Not found'));
      },
    );

    render(<AdminPage />);

    expect(
      await screen.findByText('Linguist Applications'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Review and manage linguist role applications'),
    ).toBeInTheDocument();
  });

  test('redirects to login when no access token exists', async () => {
    localStorage.removeItem('accessToken');

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ role: 'admin' }),
      } as Response),
    );

    render(<AdminPage />);

    await waitFor(() => {
      expect(window.location.href).toBe('/login');
    });
  });

  test('shows error when user is not admin', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url.includes('/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ role: 'contributor' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      },
    );

    render(<AdminPage />);

    expect(await screen.findByText(/Error 403: Forbidden/)).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
  });

  test('switches between applications and users view', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url.includes('/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ role: 'admin' }),
          } as Response);
        }
        if (url.includes('/users/with-uploads')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersWithUploads),
          } as Response);
        }
        if (url.includes('/users/') && url.includes('/uploads')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUploads),
          } as Response);
        }
        if (url.includes('/users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsers),
          } as Response);
        }
        return Promise.reject(new Error('Not found'));
      },
    );

    render(<AdminPage />);
    await screen.findByText('Linguist Applications');

    fireEvent.click(screen.getByRole('button', { name: /Users/ }));
    expect(await screen.findByText('User Management')).toBeInTheDocument();
  });

  test('filters applications by search term', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url.includes('/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ role: 'admin' }),
          } as Response);
        }
        if (url.includes('/users/with-uploads')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersWithUploads),
          } as Response);
        }
        if (url.includes('/users/') && url.includes('/uploads')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUploads),
          } as Response);
        }
        if (url.includes('/users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsers),
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      },
    );

    render(<AdminPage />);
    await screen.findByText('John Doe');

    const searchInput = screen.getByPlaceholderText(/Search applications/);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('filters applications by status', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url.includes('/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ role: 'admin' }),
          } as Response);
        }
        if (url.includes('/users/with-uploads')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersWithUploads),
          } as Response);
        }
        if (url.includes('/users/') && url.includes('/uploads')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUploads),
          } as Response);
        }
        if (url.includes('/users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsers),
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      },
    );

    render(<AdminPage />);
    await screen.findByText('John Doe');

    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'pending' } });

    expect(statusFilter).toHaveValue('pending');
  });

  test('shows empty state when no data', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url.includes('/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ role: 'admin' }),
          } as Response);
        }
        if (url.includes('/users/with-uploads')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url.includes('/users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          } as Response);
        }
        return Promise.reject(new Error('Unknown URL'));
      },
    );

    render(<AdminPage />);
    expect(
      await screen.findByText('No applications found'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Try adjusting your search or filters'),
    ).toBeInTheDocument();
  });

  test('handles mobile view', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 600 });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ role: 'admin' }),
    } as Response);

    render(<AdminPage />);
    fireEvent(window, new Event('resize'));
    expect(await screen.findByTestId('navbar')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url.includes('/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ role: 'admin' }),
          } as Response);
        }
        return Promise.reject(new Error('API Error'));
      },
    );

    render(<AdminPage />);
    expect(
      await screen.findByText('Linguist Applications'),
    ).toBeInTheDocument();
  });
});
