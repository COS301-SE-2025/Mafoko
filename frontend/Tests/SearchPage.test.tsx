import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchPage from '../src/pages/SearchPage';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';
import { DarkModeProvider } from '../src/components/ui/DarkModeComponent';


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
    <div
      data-testid="leftnav"
      onClick={() => {
        setActiveItem('search');
      }}
    >
      LeftNav - {activeItem}
    </div>
  ),
}));

vi.mock('../src/components/ui/SearchBar', () => ({
  __esModule: true,
  default: ({ onSearch }: { onSearch: (term: string) => void }) => (
    <div>
      <input
        placeholder="Search"
        onChange={(e) => {
          onSearch((e.target as HTMLInputElement).value);
        }}
      />
    </div>
  ),
}));

vi.mock('../src/components/ui/DropdownFilter', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <div>{label}</div>,
}));

vi.mock('../src/components/ui/ToggleSwtich', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <div>{label}</div>,
}));

vi.mock('../src/components/ui/TermCard', () => ({
  __esModule: true,
  default: ({ term }: { term: string }) => <div>{term}</div>,
}));

vi.mock('../src/utils/indexedDB', () => ({
  storeTerms: vi.fn(),
  getAllTerms: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/config', () => ({
  API_ENDPOINTS: {
    search: '/mock/search',
    suggest: '/mock/suggest',
  },
}));

global.fetch = vi.fn();

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders SearchPage with key UI elements', () => {
    render(
      <Router>
        <DarkModeProvider>
          <SearchPage />
        </DarkModeProvider>
      </Router>,
    );

    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Domain')).toBeInTheDocument();
    expect(screen.getByText('AI Search')).toBeInTheDocument();
    expect(screen.getByText('Fuzzy Search')).toBeInTheDocument();
  });

  test('handles no results message after searching', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => ({ items: [], total: 0 }),
    });

    render(
      <Router>
        <DarkModeProvider>
          <SearchPage />
        </DarkModeProvider>
      </Router>,
    );

    fireEvent.change(screen.getByPlaceholderText('Search'), {
      target: { value: 'nonexistent' },
    });

    await waitFor(() => {
      expect(screen.getByText(/No results found for/)).toBeInTheDocument();
    });
  });

  test('renders SearchPage with key UI elements', () => {
    render(
      <Router>
        <DarkModeProvider>
          <SearchPage />
        </DarkModeProvider>
      </Router>,
    );

    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Domain')).toBeInTheDocument();
    expect(screen.getByText('AI Search')).toBeInTheDocument();
    expect(screen.getByText('Fuzzy Search')).toBeInTheDocument();
  });
});
