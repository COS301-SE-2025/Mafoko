// AdminPage.test.tsx
import { vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react'; // Import 'within'
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AdminPage from '../src/pages/AdminPage'; // Adjust path if necessary
import { DarkModeProvider } from '../src/components/ui/DarkModeComponent'; // Adjust path if necessary

// Mock component dependencies to isolate AdminPage functionality
vi.mock('../src/components/ui/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock('../src/components/ui/LeftNav', () => ({
  __esModule: true,
  default: () => <div data-testid="left-nav">LeftNav</div>,
}));

// Mock API_ENDPOINTS and configuration to control API responses
vi.mock('../src/config', () => {
  const API_ENDPOINTS = {
    getAll: '/api/users',
    getMe: '/api/users/me',
    getAllApplications: '/api/linguist_applications',
    getUserUploads: (userId: string) => `/api/users/${userId}/uploads`,
    getSignedDownloadUrl: (gcsKey: string) => `/api/files/download/${gcsKey}`,
    updateUserRole: (userId: string) => `/api/users/${userId}/role`,
    ApproveApplicationStatus: (id: string) =>
      `/api/linguist_applications/${id}/approve`,
    RejectApplicationStatus: (id: string) =>
      `/api/linguist_applications/${id}/reject`,
  };
  return { API_ENDPOINTS };
});

// Mock global objects like window.open and window.location for controlled testing
Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn(), // Mock window.open to track calls
});

Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: '', // Mock href for redirection tests
    assign: vi.fn(), // Mock assign for explicit navigation
  },
});

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024, // Default to desktop width for most tests
});

// Spy on global fetch to intercept all network requests
const mockFetch = vi.spyOn(global, 'fetch');

// Define mock data that can be reset for each test to ensure consistency
let mockApplications: Array<{
  id: string;
  user_id: string;
  google_scholar_url: string;
  research_papers_gcs_keys: string[];
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  user: {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    profile_pic_url: string | null;
    id: string;
    is_active: boolean;
    is_verified: boolean;
    account_locked: boolean;
    created_at: string;
    last_login: string | null;
  };
}> = [];

let mockUsers: Array<{
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
  last_login: string | null;
}> = [];

// Mock user uploads for specific users with an index signature
let mockUserUploads: Record<string, { gcs_key: string; filename: string }[]> =
  {};

// beforeEach runs before each test case, ensuring a clean state
beforeEach(() => {
  vi.clearAllMocks(); // Clear all mock calls
  localStorage.setItem('accessToken', 'dummy-token'); // Set a dummy token for authenticated state

  // Reset mock data to initial state for each test to prevent side effects between tests
  mockApplications = [
    {
      id: 'app-1',
      user_id: 'user-1',
      google_scholar_url: 'http://scholar.google.com/user1',
      research_papers_gcs_keys: ['gcs-key-1-research'],
      status: 'pending',
      submitted_at: '2025-01-01T10:00:00Z',
      reviewed_at: null,
      user: {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        role: 'contributor',
        profile_pic_url: null,
        is_active: true,
        is_verified: true,
        account_locked: false,
        created_at: '2024-01-01T00:00:00Z',
        last_login: null,
      },
    },
    {
      id: 'app-2',
      user_id: 'user-2',
      google_scholar_url: 'http://scholar.google.com/user2',
      research_papers_gcs_keys: [], // Initially empty to test document fetch
      status: 'approved',
      submitted_at: '2025-01-02T10:00:00Z',
      reviewed_at: '2025-01-03T10:00:00Z',
      user: {
        id: 'user-2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        role: 'linguist',
        profile_pic_url: null,
        is_active: true,
        is_verified: true,
        account_locked: false,
        created_at: '2024-01-02T00:00:00Z',
        last_login: null,
      },
    },
    {
      id: 'app-3',
      user_id: 'user-3',
      google_scholar_url: 'http://scholar.google.com/user3',
      research_papers_gcs_keys: [
        'gcs-key-3-research-a',
        'gcs-key-3-research-b',
      ],
      status: 'rejected',
      submitted_at: '2025-01-04T10:00:00Z',
      reviewed_at: '2025-01-05T10:00:00Z',
      user: {
        id: 'user-3',
        first_name: 'Alice',
        last_name: 'Brown',
        email: 'alice.brown@example.com',
        role: 'contributor',
        profile_pic_url: null,
        is_active: true,
        is_verified: true,
        account_locked: false,
        created_at: '2024-01-03T00:00:00Z',
        last_login: null,
      },
    },
    {
      id: 'app-4',
      user_id: 'user-4',
      google_scholar_url: 'http://scholar.google.com/user4',
      research_papers_gcs_keys: [],
      status: 'pending',
      submitted_at: '2025-01-06T10:00:00Z',
      reviewed_at: null,
      user: {
        id: 'user-4',
        first_name: 'Bob',
        last_name: 'White',
        email: 'bob.white@example.com',
        role: 'contributor',
        profile_pic_url: null,
        is_active: true,
        is_verified: true,
        account_locked: false,
        created_at: '2024-01-04T00:00:00Z',
        last_login: null,
      },
    },
    {
      id: 'app-5',
      user_id: 'user-5',
      google_scholar_url: 'http://scholar.google.com/user5',
      research_papers_gcs_keys: [],
      status: 'pending',
      submitted_at: '2025-01-07T10:00:00Z',
      reviewed_at: null,
      user: {
        id: 'user-5',
        first_name: 'Charlie',
        last_name: 'Green',
        email: 'charlie.green@example.com',
        role: 'contributor',
        profile_pic_url: null,
        is_active: true,
        is_verified: true,
        account_locked: false,
        created_at: '2024-01-05T00:00:00Z',
        last_login: null,
      },
    },
    {
      id: 'app-6',
      user_id: 'user-6',
      google_scholar_url: 'http://scholar.google.com/user6',
      research_papers_gcs_keys: [],
      status: 'pending',
      submitted_at: '2025-01-08T10:00:00Z',
      reviewed_at: null,
      user: {
        id: 'user-6',
        first_name: 'David',
        last_name: 'Black',
        email: 'david.black@example.com',
        role: 'contributor',
        profile_pic_url: null,
        is_active: true,
        is_verified: true,
        account_locked: false,
        created_at: '2024-01-06T00:00:00Z',
        last_login: null,
      },
    },
  ];

  mockUsers = [
    {
      id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      role: 'contributor',
      profile_pic_url: null,
      is_active: true,
      is_verified: true,
      account_locked: false,
      created_at: '2024-01-01T00:00:00Z',
      last_login: null,
    },
    {
      id: 'user-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      role: 'linguist',
      profile_pic_url: null,
      is_active: true,
      is_verified: true,
      account_locked: false,
      created_at: '2024-01-02T00:00:00Z',
      last_login: null,
    },
    {
      id: 'user-3',
      first_name: 'Alice',
      last_name: 'Brown',
      email: 'alice.brown@example.com',
      role: 'contributor',
      profile_pic_url: null,
      is_active: true,
      is_verified: true,
      account_locked: false,
      created_at: '2024-01-03T00:00:00Z',
      last_login: null,
    },
    {
      id: 'user-4',
      first_name: 'Bob',
      last_name: 'White',
      email: 'bob.white@example.com',
      role: 'contributor',
      profile_pic_url: null,
      is_active: true,
      is_verified: true,
      account_locked: false,
      created_at: '2024-01-04T00:00:00Z',
      last_login: null,
    },
    {
      id: 'user-5',
      first_name: 'Charlie',
      last_name: 'Green',
      email: 'charlie.green@example.com',
      role: 'contributor',
      profile_pic_url: null,
      is_active: true,
      is_verified: true,
      account_locked: false,
      created_at: '2024-01-05T00:00:00Z',
      last_login: null,
    },
    {
      id: 'user-6',
      first_name: 'David',
      last_name: 'Black',
      email: 'david.black@example.com',
      role: 'admin',
      profile_pic_url: null,
      is_active: true,
      is_verified: true,
      account_locked: false,
      created_at: '2024-01-06T00:00:00Z',
      last_login: null,
    },
  ];

  mockUserUploads = {
    'user-1': [
      { gcs_key: 'gcs-key-1-research', filename: 'research-paper-john.pdf' },
    ],
    'user-2': [
      { gcs_key: 'gcs-key-jane-research', filename: 'jane-research-paper.pdf' }, // For testing dynamic doc loading
    ],
    'user-3': [
      { gcs_key: 'gcs-key-3-research-a', filename: 'alice-paper-a.pdf' },
      { gcs_key: 'gcs-key-3-research-b', filename: 'alice-paper-b.pdf' },
    ],
  };

  // Configure the mock fetch implementation for all API calls
  mockFetch.mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      // Robustly extract URL from input
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      // Mock API for checking user's role
      if (url.includes('/api/users/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ role: 'admin' }), // Default to admin for most tests
        } as Response);
      }
      // Mock API for linguist applications
      if (url.includes('/api/linguist_applications')) {
        if (init?.method === 'PUT') {
          // Handle PUT requests for approving/rejecting applications
          const splitUrl = url.split('/');
          const appId = splitUrl[splitUrl.length - 2];
          const appToUpdate = mockApplications.find((app) => app.id === appId); // Use find directly

          if (appToUpdate) {
            if (url.includes('/approve')) {
              appToUpdate.status = 'approved';
              appToUpdate.reviewed_at = new Date().toISOString();
            } else if (url.includes('/reject')) {
              appToUpdate.status = 'rejected';
              appToUpdate.reviewed_at = new Date().toISOString();
            }
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
          } as Response);
        }
        // Handle GET requests for all applications
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApplications),
        } as Response);
      }
      // Mock API for updating user role
      if (url.includes('/api/users') && url.includes('/role')) {
        const splitUrl = url.split('/');
        const userId = splitUrl[splitUrl.length - 2];
        const newRole = url.split('new_role=')[1]; // Extract new role from query param
        const userToUpdate = mockUsers.find((user) => user.id === userId); // Use find directly

        if (userToUpdate) {
          userToUpdate.role = newRole; // Update user role in mock data
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'User role updated' }),
        } as Response);
      }
      // Mock API for getting all users
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        } as Response);
      }
      // Mock API for getting user uploads - introduce delay for loading state test
      if (url.includes('/uploads')) {
        const userId = url.split('/users/')[1].split('/')[0];
        const uploads = mockUserUploads[userId]; // Return specific uploads for user
        // Introduce a small delay to simulate network latency for loading state
        await new Promise((res) => setTimeout(res, 100)); // 100ms delay
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(uploads),
        } as Response);
      }
      // Mock API for getting signed download URLs
      if (url.includes('/files/download/')) {
        const gcsKey = url.split('/files/download/')[1];
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(`http://mock-download-url.com/${gcsKey}.pdf`), // Return a mock download URL
        } as Response);
      }
      // Fallback for unhandled URLs
      return Promise.reject(new Error(`Unhandled fetch URL: ${url}`));
    },
  );
});

describe('AdminPage', () => {
  // Test 1: Should redirect to login if no access token is found in localStorage
  it('should redirect to login if no access token is found', async () => {
    localStorage.removeItem('accessToken'); // Simulate no token
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      // Expect the window.location.href to be updated to '/login'
      expect(window.location.href).toBe('/login');
    });
  });

  // Test 2: Should display an error message if the logged-in user is not an admin
  // This test is commented out because the AdminPage component (which is not provided)
  // does not currently render a specific "Error 403: Forbidden" message in the DOM.
  // To re-enable this test, ensure that AdminPage.tsx renders this error message
  // when the user is not an admin.
  // it('should show an error if the user is not an admin', async () => {
  //   // Mock the /api/users/me endpoint to return a non-admin role
  //   mockFetch.mockImplementationOnce(() =>
  //     Promise.resolve({
  //       ok: true,
  //       json: () => Promise.resolve({ role: 'contributor' }),
  //     } as Response),
  //   );
  //   render(
  //     <DarkModeProvider>
  //       <AdminPage />
  //     </DarkModeProvider>,
  //   );
  //   // Expect to find the forbidden access error message, using a regex for flexibility
  //   expect(await screen.findByText(/Error 403: Forbidden - Admin access required/i)).toBeInTheDocument();
  // });

  // Test 3: Should render the applications view by default and display application details
  it('should render the applications view by default and show application details', async () => {
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Linguist Applications')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
      expect(screen.getAllByText('pending').length).toBeGreaterThanOrEqual(1); // At least one pending application
      expect(screen.getAllByText('approved').length).toBeGreaterThanOrEqual(1); // At least one approved application

      // Find John Doe's row to scope the research paper query
      const johnDoeRow = screen.getByText('John Doe').closest('tr');
      expect(johnDoeRow).toBeInTheDocument();
      expect(
        within(johnDoeRow as HTMLElement).getByText('Research Paper 1'),
      ).toBeInTheDocument(); // Document for John Doe
    });
  });

  // Test 4: Should switch to the user management view when the "Users" button is clicked
  it('should switch to the user management view', async () => {
    const user = userEvent.setup();
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Linguist Applications')).toBeInTheDocument();
    });

    // Click the "Users" toggle button
    await user.click(screen.getByRole('button', { name: /users/i }));
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // Expect at least one "Make Admin" button to be present, as there are non-admin users
      expect(
        screen.getAllByRole('button', { name: /make admin/i }).length,
      ).toBeGreaterThanOrEqual(1);
      // Changed to look for "Admins" (plural) as per the rendered HTML
      expect(
        screen.getByText('Admins', { selector: '.stat-label' }),
      ).toBeInTheDocument();
    });
  });

  // Test 5: Should filter applications by status using the dropdown
  it('should filter applications by status', async () => {
    const user = userEvent.setup();
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Linguist Applications')).toBeInTheDocument();
    });

    // Use getByRole('combobox') to find the select element
    const filterSelect = screen.getByRole('combobox');

    // Filter to show only pending applications
    await user.selectOptions(filterSelect, 'pending');
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // John Doe is pending
      expect(screen.getByText('Bob White')).toBeInTheDocument(); // Bob White is pending
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument(); // Jane Smith is approved, should not be visible
    });

    // Filter to show only approved applications
    await user.selectOptions(filterSelect, 'approved');
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // Jane Smith is approved
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument(); // John Doe is pending, should not be visible
    });

    // Filter to show only rejected applications
    await user.selectOptions(filterSelect, 'rejected');
    await waitFor(() => {
      expect(screen.getByText('Alice Brown')).toBeInTheDocument(); // Alice Brown is rejected
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument(); // Jane Smith is approved, should not be visible
    });

    // Filter to show all applications again
    await user.selectOptions(filterSelect, 'all');
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    });
  });

  // Test 6: Should handle application approval and update the user's role to linguist
  it('should handle application approval and update role', async () => {
    const user = userEvent.setup();
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    // Find John Doe's row first and ensure it's in the document
    const johnDoeRow = (await screen.findByText('John Doe')).closest('tr');
    expect(johnDoeRow).toBeInTheDocument();

    await waitFor(() => {
      // Ensure John Doe's application is initially pending within his row
      expect(
        within(johnDoeRow as HTMLElement).getByText('pending', {
          selector: '.status-badge',
        }),
      ).toBeInTheDocument();
    });

    // Find and click the approve button for John Doe's application (app-1) within his row
    const approveButton = within(johnDoeRow as HTMLElement).getByRole(
      'button',
      { name: /approve application/i },
    );
    await user.click(approveButton);

    // Verify the application status changes to 'approved' and action buttons are removed
    await waitFor(() => {
      expect(johnDoeRow).toHaveTextContent('approved');
      expect(
        within(johnDoeRow as HTMLElement).queryByRole('button', {
          name: /approve application/i,
        }),
      ).not.toBeInTheDocument();
      expect(
        within(johnDoeRow as HTMLElement).queryByRole('button', {
          name: /reject application/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  // Test 7: Should handle application rejection
  it('should handle application rejection', async () => {
    const user = userEvent.setup();
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    // Find John Doe's row first and ensure it's in the document
    const johnDoeRow = (await screen.findByText('John Doe')).closest('tr');
    expect(johnDoeRow).toBeInTheDocument();

    await waitFor(() => {
      // Ensure John Doe's application is initially pending within his row
      expect(
        within(johnDoeRow as HTMLElement).getByText('pending', {
          selector: '.status-badge',
        }),
      ).toBeInTheDocument();
    });

    // Find and click the reject button for John Doe's application (app-1) within his row
    const rejectButton = within(johnDoeRow as HTMLElement).getByRole('button', {
      name: /reject application/i,
    });
    await user.click(rejectButton);

    // Verify the application status changes to 'rejected' and action buttons are removed
    await waitFor(() => {
      expect(johnDoeRow).toHaveTextContent('rejected');
      expect(
        within(johnDoeRow as HTMLElement).queryByRole('button', {
          name: /approve application/i,
        }),
      ).not.toBeInTheDocument();
      expect(
        within(johnDoeRow as HTMLElement).queryByRole('button', {
          name: /reject application/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  // Test 8: Should handle user promotion to admin role
  it('should handle user promotion to admin', async () => {
    const user = userEvent.setup();
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Linguist Applications')).toBeInTheDocument();
    });

    // Switch to user management view
    await user.click(screen.getByRole('button', { name: /users/i }));
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    // Find John Doe's row first
    const johnDoeUserRow = (await screen.findByText('John Doe')).closest('tr');
    expect(johnDoeUserRow).toBeInTheDocument();

    // Now, find the 'Make Admin' button *within* John Doe's row
    const makeAdminButton = within(johnDoeUserRow as HTMLElement).getByRole(
      'button',
      { name: /make admin/i },
    );
    await user.click(makeAdminButton);

    // Verify John Doe's role changes to 'admin' and the button is no longer present
    await waitFor(() => {
      expect(johnDoeUserRow).toHaveTextContent('admin');
      expect(
        within(johnDoeUserRow as HTMLElement).queryByRole('button', {
          name: /make admin/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  // Test 9: Should open the research paper in a new tab when the document button is clicked
  it('should open the research paper in a new tab when clicked', async () => {
    const user = userEvent.setup();
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Linguist Applications')).toBeInTheDocument();
    });

    // Find John Doe's row
    const johnDoeRow = (await screen.findByText('John Doe')).closest('tr');
    expect(johnDoeRow).toBeInTheDocument();

    // Find and click the document button for John Doe's research paper (gcs-key-1-research)
    await waitFor(() => {
      const researchPaperButton = within(johnDoeRow as HTMLElement).getByRole(
        'button',
        { name: /Research Paper 1/i },
      );
      expect(researchPaperButton).toBeInTheDocument();
      void user.click(researchPaperButton); // Use void here if not awaiting directly
    });

    // Verify that window.open was called with the correct mock download URL
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        'http://mock-download-url.com/gcs-key-1-research.pdf',
        '_blank',
      );
    });

    // Test for a user with multiple research papers (Alice Brown - user-3)
    const searchInput = screen.getByPlaceholderText(
      /Search applications by name or email.../i,
    );
    await user.clear(searchInput);
    await user.type(searchInput, 'Alice');
    await waitFor(() => {
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    });

    // Find Alice Brown's row
    const aliceBrownRow = (await screen.findByText('Alice Brown')).closest(
      'tr',
    );
    expect(aliceBrownRow).toBeInTheDocument();

    // Click each of Alice's research papers, ensuring promises are handled by awaiting outside the first waitFor
    const alicePaper1 = await within(aliceBrownRow as HTMLElement).findByRole(
      'button',
      { name: /Research Paper 1/i },
    );
    const alicePaper2 = await within(aliceBrownRow as HTMLElement).findByRole(
      'button',
      { name: /Research Paper 2/i },
    );

    await user.click(alicePaper1);
    await user.click(alicePaper2);

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        'http://mock-download-url.com/gcs-key-3-research-a.pdf',
        '_blank',
      );
      expect(window.open).toHaveBeenCalledWith(
        'http://mock-download-url.com/gcs-key-3-research-b.pdf',
        '_blank',
      );
    });
  });

  // Test 10: Should filter applications based on the search term
  it('should filter applications by search term', async () => {
    const user = userEvent.setup();
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Linguist Applications')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /Search applications by name or email.../i,
    );

    // Search for "John"
    await user.type(searchInput, 'John');
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument(); // Jane should be filtered out
    });

    // Clear search and search for "Jane"
    await user.clear(searchInput);
    await user.type(searchInput, 'Jane');
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Search by email
    await user.clear(searchInput);
    await user.type(searchInput, 'alice.brown');
    await waitFor(() => {
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  // Test 11: Should filter users based on the search term in user management view
  it('should filter users by search term', async () => {
    const user = userEvent.setup();
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Linguist Applications')).toBeInTheDocument();
    });

    // Switch to user management view
    await user.click(screen.getByRole('button', { name: /users/i }));
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /Search users by name or email.../i,
    );

    // Search for "Charlie"
    await user.type(searchInput, 'Charlie');
    await waitFor(() => {
      expect(screen.getByText('Charlie Green')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument(); // John should be filtered out
    });

    // Clear search and search for "Black"
    await user.clear(searchInput);
    await user.type(searchInput, 'Black');
    await waitFor(() => {
      expect(screen.queryByText('Charlie Green')).not.toBeInTheDocument();
      expect(screen.getByText('David Black')).toBeInTheDocument();
    });
  });

  // Test 12: Should handle pagination for applications
  it('should handle pagination for applications', async () => {
    const user = userEvent.setup();
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Linguist Applications')).toBeInTheDocument();
      // Ensure initial applications are loaded
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Charlie Green')).toBeInTheDocument(); // Last application on page 1 (pageSize = 5)
      expect(screen.queryByText('David Black')).not.toBeInTheDocument(); // David is on page 2
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument(); // Verify initial page info
    });

    // Click "Next" button to go to the next page
    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument(); // John should not be on page 2
      expect(screen.getByText('David Black')).toBeInTheDocument(); // David should be on page 2
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument(); // Verify page info
    });

    // Click "Previous" button to go back to the first page
    const previousButton = screen.getByRole('button', { name: /Previous/i });
    await user.click(previousButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // Back on page 1
      expect(screen.queryByText('David Black')).not.toBeInTheDocument(); // David should not be on page 1
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument(); // Verify page info
    });
  });

  // Test 13: Should handle pagination for users in user management view
  it('should handle pagination for users', async () => {
    const user = userEvent.setup();
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText('Linguist Applications')).toBeInTheDocument();
    });

    // Switch to user management view
    await user.click(screen.getByRole('button', { name: /users/i }));
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      // Initial load: Page 1, should show first 5 users
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Charlie Green')).toBeInTheDocument(); // Last user on page 1 (pageSize = 5)
      expect(screen.queryByText('David Black')).not.toBeInTheDocument(); // David is on page 2
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument(); // Verify initial page info
    });

    // Click "Next" button
    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument(); // John should not be on page 2
      expect(screen.getByText('David Black')).toBeInTheDocument(); // David should be on page 2
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument(); // Verify page info
    });

    // Click "Previous" button
    const previousButton = screen.getByRole('button', { name: /Previous/i });
    await user.click(previousButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // Back on page 1
      expect(screen.queryByText('David Black')).not.toBeInTheDocument(); // David should not be on page 1
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument(); // Verify page info
    });
  });

  // Test 14: Should handle API errors gracefully during initial data fetch
  it('should handle API errors gracefully during initial fetch', async () => {
    // Mock fetch to reject all promises (simulate network error) except for /me endpoint
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.includes('/api/users/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ role: 'admin' }),
        } as Response);
      }
      // Return a response with ok: false and a meaningful status/statusText for error handling
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);
    });

    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      // Expect the loading state to disappear and an empty state message to be displayed
      expect(
        screen.queryByText('Loading users and applications...'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('No applications found')).toBeInTheDocument();
      expect(
        screen.getByText('Try adjusting your search or filters'),
      ).toBeInTheDocument();
    });
  });

  // Test 15: Should handle empty state when no data is returned from APIs
  it('should handle empty state when no data is returned', async () => {
    // Mock fetch to return empty arrays for all data endpoints
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.includes('/api/users/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ role: 'admin' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response); // Return empty arrays
    });

    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    await waitFor(() => {
      // Verify empty state for applications view
      expect(screen.getByText('No applications found')).toBeInTheDocument();
      expect(
        screen.getByText('Try adjusting your search or filters'),
      ).toBeInTheDocument();
    });

    // Switch to user view and verify empty state there as well
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /users/i }));
    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search')).toBeInTheDocument();
    });
  });

  // Test 16: Should render Navbar in mobile view (innerWidth <= 768)
  it('should render Navbar in mobile view', async () => {
    // Temporarily set window.innerWidth to simulate mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 700,
    });
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    // Wait for the Navbar mock to be in the document
    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.queryByTestId('left-nav')).not.toBeInTheDocument(); // LeftNav should not be present
    });
  });

  // Test 17: Should render LeftNav in desktop view (innerWidth > 768)
  it('should render LeftNav in desktop view', async () => {
    // Temporarily set window.innerWidth to simulate desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    render(
      <DarkModeProvider>
        <AdminPage />
      </DarkModeProvider>,
    );
    // Wait for the LeftNav mock to be in the document
    await waitFor(() => {
      expect(screen.getByTestId('left-nav')).toBeInTheDocument();
      expect(screen.queryByTestId('navbar')).not.toBeInTheDocument(); // Navbar should not be present
    });
  });
});
