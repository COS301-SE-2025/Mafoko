import { vi } from 'vitest';

const mockNavigate = vi.fn<(path: string) => void>();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: () => Promise.resolve(), language: 'en' },
  }),
}));

vi.mock('../src/components/LanguageSwitcher', () => ({
  __esModule: true,
  default: () => <div data-testid="language-switcher">Language Switcher</div>,
}));

vi.mock('../src/components/dashboard/LeftPane', () => ({
  __esModule: true,
  default: ({ onItemClick }: { onItemClick: (item: string) => void }) => (
    <div data-testid="left-pane">
      Left Pane
      <button type="button" onClick={() => { onItemClick('search'); }}>Search</button>
    </div>
  ),
}));


import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import DashboardPage from '../src/pages/DashboardPage';

global.fetch = vi.fn();

beforeEach(() => {
  localStorage.clear();
  (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  mockNavigate.mockClear();
});

test('renders fallback username when no user data exists', async () => {
  localStorage.setItem('accessToken', 'dummy');

  (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('nope'));

  render(
    <Router>
      <DashboardPage />
    </Router>
  );

  expect(await screen.findByText((text) => text.includes('dashboard.userName'))).toBeInTheDocument();
});

test('shows recent terms after toggle and successful fetch', async () => {
  localStorage.setItem('accessToken', 'dummy');

  (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    if (url.includes('recentTerms')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: '1',
              term: 'Mock Term 1',
              language: 'Zulu',
              definition: 'Definition 1',
              lastViewed: '1 hour ago',
              translation: 'Trans 1',
            },
          ]),
      } as Response);
    }
    if (url.includes('communityActivity')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: '1',
              user: 'UserX',
              action: 'added',
              term: 'TestTerm',
              language: 'Zulu',
              timestamp: '1h ago',
            },
          ]),
      } as Response);
    }
    return Promise.reject(new Error('bad'));
  });

  render(
    <Router>
      <DashboardPage />
    </Router>
  );

  const button = await screen.findByRole('button', {
    name: 'dashboard.viewAll',
  });

  fireEvent.click(button);

  expect(await screen.findByText('Mock Term 1')).toBeInTheDocument();
});

test('shows fallback terms like Agroforestry on fetch failure', async () => {
  localStorage.setItem('accessToken', 'dummy');

  (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));

  render(
    <Router>
      <DashboardPage />
    </Router>
  );

  const toggleBtn = await screen.findByRole('button', {
    name: 'dashboard.viewAll',
  });

  fireEvent.click(toggleBtn);

  expect(await screen.findByText('Agroforestry')).toBeInTheDocument();
});
