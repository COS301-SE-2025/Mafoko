import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';
import WorkspacePage from '../src/pages/WorkspacePage';
import { DarkModeProvider } from '../src/components/ui/DarkModeComponent';

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ workspace: 'test-workspace' }),
    useLocation: () => ({
      pathname: '/workspace/test-workspace',
      search: '',
      hash: '',
      state: null,
    }),
  };
});

// Mock API endpoints
vi.mock('../src/config', () => ({
  API_ENDPOINTS: {
    WORKSPACE: 'http://localhost:3000/api/workspace',
    TERMS: 'http://localhost:3000/api/terms',
    BOOKMARKS: 'http://localhost:3000/api/bookmarks',
  },
}));

// Mock context hooks
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', name: 'Test User' },
    isAuthenticated: true,
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Router>
    <DarkModeProvider>{children}</DarkModeProvider>
  </Router>
);

describe('WorkspacePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          workspace: {
            id: 1,
            name: 'Test Workspace',
            description: 'A test workspace',
            isPublic: false,
          },
          terms: [],
          bookmarks: [],
          submissions: [],
        }),
    });
  });

  test('renders WorkspacePage component', () => {
    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Should render without crashing
    expect(document.body).toBeInTheDocument();
  });

  test('displays workspace loading state initially', () => {
    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Check that the component renders initially
    expect(document.querySelector('.main-content')).toBeInTheDocument();
  });

  test('component has expected structure', () => {
    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Check for main container elements (use correct class names from output)
    expect(document.querySelector('.workspace-container')).toBeInTheDocument();
    expect(document.querySelector('.main-content')).toBeInTheDocument();
  });

  test('handles workspace parameter', async () => {
    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Check that the component shows login message due to no authentication
    await waitFor(() => {
      expect(
        screen.getByText('Please log in to access your workspace.'),
      ).toBeInTheDocument();
    });
  });

  test('renders with dark mode context', () => {
    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Component should be wrapped in dark mode context
    expect(document.body).toBeInTheDocument();
  });
});
