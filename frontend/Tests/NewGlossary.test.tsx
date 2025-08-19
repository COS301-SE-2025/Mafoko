import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';
import NewGlossary from '../src/pages/NewGlossary';
import { DarkModeProvider } from '../src/components/ui/DarkModeComponent';

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ category: undefined }),
    useLocation: () => ({
      pathname: '/glossary',
      search: '',
      hash: '',
      state: null,
    }),
  };
});

// Mock API endpoints
vi.mock('../src/config', () => ({
  API_ENDPOINTS: {
    GLOSSARY: 'http://localhost:3000/api/glossary',
    SEARCH: 'http://localhost:3000/api/search',
  },
}));

// Mock export utils
vi.mock('../src/utils/exportUtils', () => ({
  downloadData: vi.fn(),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Router>
    <DarkModeProvider>{children}</DarkModeProvider>
  </Router>
);

describe('NewGlossary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  test('renders NewGlossary component', () => {
    render(
      <TestWrapper>
        <NewGlossary />
      </TestWrapper>,
    );

    // Should render without crashing
    expect(document.body).toBeInTheDocument();
  });

  test('displays search input', () => {
    render(
      <TestWrapper>
        <NewGlossary />
      </TestWrapper>,
    );

    // Check for search input
    expect(
      screen.getByPlaceholderText('Search glossaries...'),
    ).toBeInTheDocument();
  });

  test('handles search input changes', () => {
    render(
      <TestWrapper>
        <NewGlossary />
      </TestWrapper>,
    );

    const searchInput = screen.getByPlaceholderText('Search glossaries...');
    fireEvent.change(searchInput, { target: { value: 'agriculture' } });

    expect(searchInput).toHaveValue('agriculture');
  });

  test('displays empty state message', async () => {
    render(
      <TestWrapper>
        <NewGlossary />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('No glossaries found.')).toBeInTheDocument();
    });
  });

  test('component has expected structure', () => {
    render(
      <TestWrapper>
        <NewGlossary />
      </TestWrapper>,
    );

    // Check for main container
    expect(document.querySelector('.dashboard-container')).toBeInTheDocument();
    expect(document.querySelector('.main-content')).toBeInTheDocument();
    expect(document.querySelector('.glossary-content')).toBeInTheDocument();
  });
});
