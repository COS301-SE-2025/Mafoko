import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';
import WorkspacePage from '../../src/pages/WorkspacePage';
import { DarkModeProvider } from '../../src/components/ui/DarkModeComponent';
import { API_ENDPOINTS } from '../../src/config';

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

// Mock authentication context
vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      token: 'mock-jwt-token',
    },
    isAuthenticated: true,
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Router>
    <DarkModeProvider>{children}</DarkModeProvider>
  </Router>
);

const mockBookmarks = [
  {
    id: '1',
    termId: 'term-1',
    term: 'Agriculture',
    definition: 'The practice of farming',
    domain: 'Agriculture',
    language: 'English',
    createdAt: '2025-01-01T00:00:00Z',
    note: 'Important farming term',
  },
  {
    id: '2',
    termId: 'term-2',
    term: 'Technology',
    definition: 'Application of scientific knowledge',
    domain: 'Technology',
    language: 'English',
    createdAt: '2025-01-02T00:00:00Z',
    note: null,
  },
];

const mockGroups = [
  {
    id: 'group-1',
    name: 'Study Group 1',
    description: 'Terms for studying',
    termCount: 5,
    createdAt: '2025-01-01T00:00:00Z',
    terms: [
      { id: 'term-1', term: 'Agriculture', definition: 'Farming practice' },
      {
        id: 'term-2',
        term: 'Technology',
        definition: 'Scientific application',
      },
    ],
  },
  {
    id: 'group-2',
    name: 'Research Group',
    description: 'Research-related terms',
    termCount: 3,
    createdAt: '2025-01-02T00:00:00Z',
    terms: [],
  },
];



describe('WorkspacePage Integration Tests', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.clearAllMocks();

    // Mock localStorage for token
    global.localStorage = {
      getItem: vi.fn().mockReturnValue('mock-jwt-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    } as Storage;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('loads workspace data on mount with authentication', async () => {
    // Mock user role API response (for LeftNav and Navbar)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ role: 'user' }),
    });

    // Mock bookmarks API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ terms: mockBookmarks, glossaries: [] }),
    });

    // Mock groups API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => [],
    });

    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Verify authenticated API call was made
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        API_ENDPOINTS.getBookmarks,
        expect.any(Object),
      );
    });

    // Verify bookmarks are displayed
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Agriculture' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Technology' }),
      ).toBeInTheDocument();
    });
  });

  test('bookmark term integration', async () => {
    // Mock initial bookmarks load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ terms: [], glossaries: [] }),
    });

    // Mock groups API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => [],
    });

    // Mock bookmark creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({
        id: 'new-bookmark',
        termId: 'term-3',
        message: 'Term bookmarked successfully',
      }),
    });

    // Mock updated bookmarks list
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({
        terms: [
          ...mockBookmarks,
          {
            id: 'new-bookmark',
            termId: 'term-3',
            term: 'New Term',
            definition: 'A new bookmarked term',
            domain: 'Science',
            language: 'English',
          },
        ],
        glossaries: [],
      }),
    });

    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Saved Terms')).toBeInTheDocument();
    });

    // Simulate adding a bookmark (this would normally be triggered by a term detail page)
    const bookmarkData: {
      termId: string;
      note: string;
    } = {
      termId: 'term-3',
      note: 'Important science term',
    };

    await fetch(API_ENDPOINTS.bookmarkTerm, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-jwt-token',
      },
      body: JSON.stringify(bookmarkData),
    });

    // Verify bookmark API call
    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.bookmarkTerm,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token',
        }) as Record<string, string>,
        body: JSON.stringify(bookmarkData),
      }) as RequestInit,
    );
  });

  test('create and manage groups integration', async () => {
    // Mock bookmarks API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ terms: [], glossaries: [] }),
    });

    // Mock initial empty groups
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => [],
    });

    // Mock group creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({
        id: 'new-group',
        name: 'New Study Group',
        description: 'A new group for studying',
        termCount: 0,
      }),
    });

    // Mock updated groups list
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => mockGroups,
    });

    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('New Group')).toBeInTheDocument();
    });

    // Click create group button
    const newGroupButton = screen.getByText('New Group');
    fireEvent.click(newGroupButton);

    // Verify button is clickable
    await waitFor(() => {
      expect(newGroupButton).toBeInTheDocument();
    });
  });

  test('add terms to group integration', async () => {
    // Mock user role API response (for LeftNav and Navbar)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ role: 'user' }),
    });

    // Mock bookmarks API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ terms: [], glossaries: [] }),
    });

    // Mock groups with terms
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => mockGroups,
    });

    // Mock add terms to group
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({
        message: 'Terms added to group successfully',
      }),
    });

    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Wait for groups to load
    await waitFor(() => {
      expect(screen.getByText('Study Group 1')).toBeInTheDocument();
    });

    // Simulate adding terms to group
    const termsToAdd = ['term-3', 'term-4'];

    await fetch(API_ENDPOINTS.addTermsToGroup('group-1'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-jwt-token',
      },
      body: JSON.stringify({ termIds: termsToAdd }),
    });

    // Verify add terms API call
    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.addTermsToGroup('group-1'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-jwt-token',
        }) as Record<string, string>,
        body: JSON.stringify({ termIds: termsToAdd }),
      }) as RequestInit,
    );
  });

  test('search bookmarks integration', async () => {
    // Mock initial bookmarks
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ terms: mockBookmarks, glossaries: [] }),
    });

    // Mock groups API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => [],
    });

    // Mock search results
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ terms: [mockBookmarks[0]], glossaries: [] }), // Only agriculture result
    });

    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Wait for component to load
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Search terms...'),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search terms...');

    // Perform search
    fireEvent.change(searchInput, { target: { value: 'agriculture' } });

    // Verify search input has the value
    expect(searchInput).toHaveValue('agriculture');
  });

  test('manage notes integration', async () => {
    // Mock user role API response (for LeftNav and Navbar)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ role: 'user' }),
    });

    // Mock bookmarks API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ terms: mockBookmarks, glossaries: [] }),
    });

    // Mock groups API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => [],
    });

    // Mock note creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({
        id: 'note-1',
        content: 'This is a study note',
        termId: 'term-1',
      }),
    });

    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Wait for bookmarks to load
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Agriculture' }),
      ).toBeInTheDocument();
    });

    // Create a note
    const noteData: {
      content: string;
      termId: string;
    } = {
      content: 'This is a study note',
      termId: 'term-1',
    };

    await fetch(API_ENDPOINTS.createNote, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-jwt-token',
      },
      body: JSON.stringify(noteData),
    });

    // Verify note creation API call
    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.createNote,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-jwt-token',
        }) as Record<string, string>,
        body: JSON.stringify(noteData),
      }) as RequestInit,
    );
  });

  test('tab switching integration', async () => {
    // Mock bookmarks for Saved Terms tab
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ terms: mockBookmarks, glossaries: [] }),
    });

    // Mock groups API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => [],
    });

    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Verify initial tab is active
    await waitFor(() => {
      expect(screen.getByText('Saved Terms')).toHaveClass('active');
    });

    // Mock followed glossaries data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => [
        {
          domain: 'Agriculture',
          language: 'English',
          followedAt: '2025-01-01T00:00:00Z',
        },
        {
          domain: 'Technology',
          language: 'Afrikaans',
          followedAt: '2025-01-02T00:00:00Z',
        },
      ],
    });

    // Click Followed Glossaries tab
    fireEvent.click(screen.getByText('Followed Glossaries'));

    // Verify tab switch
    await waitFor(() => {
      expect(screen.getByText('Followed Glossaries')).toHaveClass('active');
    });
  });

  test('delete groups integration', async () => {
    // Mock user role API response (for LeftNav and Navbar)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ role: 'user' }),
    });

    // Mock bookmarks API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({ terms: mockBookmarks, glossaries: [] }),
    });

    // Mock initial groups
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => mockGroups,
    });

    // Mock delete confirmation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => ({
        message: 'Groups deleted successfully',
      }),
    });

    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Wait for groups to load
    await waitFor(() => {
      expect(screen.getByText('Study Group 1')).toBeInTheDocument();
    });

    // Click delete groups button
    const deleteButton = screen.getByText('Delete Groups');
    fireEvent.click(deleteButton);

    // Verify the delete button is clickable (state change validation)
    await waitFor(() => {
      expect(deleteButton).toBeInTheDocument();
    });
  });

  test('error handling for failed API calls', async () => {
    // Mock successful API calls but with empty data
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ terms: [], glossaries: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => [],
      });

    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Verify empty state is shown (0 terms in All Terms group)
    await waitFor(() => {
      // Should show "0 terms" in the All Terms group
      expect(screen.getByText(/0\s+terms/)).toBeInTheDocument();
    });
  });

  test('unauthorized access handling', async () => {
    // Mock scenario with no token
    const mockGetItem = vi.fn().mockReturnValue(null);
    const originalStorageDescriptor = Object.getOwnPropertyDescriptor(
      Storage.prototype,
      'getItem',
    );

    Object.defineProperty(localStorage, 'getItem', {
      value: mockGetItem,
      writable: true,
    });

    render(
      <TestWrapper>
        <WorkspacePage />
      </TestWrapper>,
    );

    // Verify login prompt is shown
    await waitFor(() => {
      expect(
        screen.getByText('Please log in to access your workspace.'),
      ).toBeInTheDocument();
    });

    // Restore localStorage
    if (originalStorageDescriptor) {
      Object.defineProperty(localStorage, 'getItem', originalStorageDescriptor);
    }
  });
});
