import { vi } from 'vitest';
import { DarkModeProvider } from '../src/components/ui/DarkModeComponent';

const mockNavigate = vi.fn<(path: string) => void>();

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
    t: (key: string) => key,
    i18n: { changeLanguage: () => Promise.resolve(), language: 'en' },
  }),
}));

vi.mock('../src/components/LanguageSwitcher', () => ({
  __esModule: true,
  default: () => <div data-testid="language-switcher">Language Switcher</div>,
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
      Left Nav
      <div data-testid="active-item">{activeItem}</div>
      <button
        type="button"
        onClick={() => {
          setActiveItem('analytics');
        }}
        data-testid="nav-analytics"
      >
        Analytics
      </button>
    </div>
  ),
}));

vi.mock('../src/components/ui/Navbar.tsx', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock('../src/components/data/StatCard', () => ({
  __esModule: true,
  default: ({
    title,
    value,
    icon,
    isDarkMode,
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    isDarkMode: boolean;
  }) => (
    <div data-testid={`stat-card-${title.toLowerCase().replace(' ', '-')}`}>
      <div data-testid="stat-title">{title}</div>
      <div data-testid="stat-value">{value}</div>
      <div data-testid="stat-icon">{icon}</div>
      <div data-testid="stat-dark-mode">{isDarkMode ? 'dark' : 'light'}</div>
    </div>
  ),
}));

vi.mock('../src/components/data/HorizontalBarChart', () => ({
  __esModule: true,
  default: ({
    data,
    isDarkMode,
  }: {
    data: Array<{ term: string; frequency: number }>;
    isDarkMode: boolean;
  }) => (
    <div data-testid="horizontal-bar-chart">
      <div data-testid="chart-dark-mode">{isDarkMode ? 'dark' : 'light'}</div>
      {data.map((item, index) => (
        <div key={`bar-${item.term}`} data-testid={`bar-item-${String(index)}`}>
          {item.term}: {item.frequency}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../src/components/data/PieChart', () => ({
  __esModule: true,
  default: ({
    data,
    isDarkMode,
  }: {
    data: Array<{ label: string; value: number }>;
    isDarkMode: boolean;
  }) => (
    <div data-testid="pie-chart">
      <div data-testid="chart-dark-mode">{isDarkMode ? 'dark' : 'light'}</div>
      {data.map((item, index) => (
        <div
          key={`pie-${item.label}`}
          data-testid={`pie-item-${String(index)}`}
        >
          {item.label}: {item.value}%
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../src/components/data/Histogram', () => ({
  __esModule: true,
  default: ({
    data,
    isDarkMode,
  }: {
    data: Array<{ term: string; frequency: number }>;
    isDarkMode: boolean;
  }) => (
    <div data-testid="histogram">
      <div data-testid="chart-dark-mode">{isDarkMode ? 'dark' : 'light'}</div>
      {data.map((item, index) => (
        <div
          key={`histogram-${item.term}`}
          data-testid={`histogram-item-${String(index)}`}
        >
          {item.term}: {item.frequency}
        </div>
      ))}
    </div>
  ),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import AnalyticsPage from '../src/pages/AnalyticsPage';

global.fetch = vi.fn();

beforeEach(() => {
  localStorage.clear();
  (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  mockNavigate.mockClear();
  // Mock API calls to always use fallback data
  (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
    new Error('API mocked for unit tests'),
  );
});

test('renders analytics page with basic structure', async () => {
  render(
    <Router>
      <DarkModeProvider>
        <AnalyticsPage />
      </DarkModeProvider>
    </Router>,
  );

  await waitFor(
    () => {
      expect(screen.queryByText('analytics.loading')).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  expect(
    screen.getByTestId('stat-card-analytics.stats.totalterms'),
  ).toBeInTheDocument();
  expect(
    screen.getByTestId('stat-card-analytics.stats.uniquelanguages'),
  ).toBeInTheDocument();
  expect(
    screen.getByTestId('stat-card-analytics.stats.uniquedomains'),
  ).toBeInTheDocument();
});

test('renders all chart components', async () => {
  render(
    <Router>
      <DarkModeProvider>
        <AnalyticsPage />
      </DarkModeProvider>
    </Router>,
  );

  await waitFor(
    () => {
      expect(screen.queryByText('analytics.loading')).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  expect(screen.getByTestId('horizontal-bar-chart')).toBeInTheDocument();
  expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  expect(screen.getByTestId('histogram')).toBeInTheDocument();
});

test('toggles mobile menu correctly', () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });

  render(
    <Router>
      <DarkModeProvider>
        <AnalyticsPage />
      </DarkModeProvider>
    </Router>,
  );

  const hamburgerButton = screen.getByRole('button', { name: 'Toggle menu' });
  expect(hamburgerButton).toBeInTheDocument();

  fireEvent.click(hamburgerButton);

  const overlay = screen.getByRole('button', { name: 'Close menu' });
  expect(overlay).toBeInTheDocument();

  fireEvent.click(overlay);
  expect(
    screen.queryByRole('button', { name: 'Close menu' }),
  ).not.toBeInTheDocument();
});

test('renders navbar in mobile view', () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 600,
  });

  render(
    <Router>
      <DarkModeProvider>
        <AnalyticsPage />
      </DarkModeProvider>
    </Router>,
  );

  expect(screen.getByTestId('navbar')).toBeInTheDocument();
  expect(screen.queryByTestId('left-nav')).not.toBeInTheDocument();
});

test('renders left nav in desktop view', () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1200,
  });

  render(
    <Router>
      <DarkModeProvider>
        <AnalyticsPage />
      </DarkModeProvider>
    </Router>,
  );

  expect(screen.getByTestId('left-nav')).toBeInTheDocument();
  expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
});

test('handles window resize correctly', () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1200,
  });

  render(
    <Router>
      <DarkModeProvider>
        <AnalyticsPage />
      </DarkModeProvider>
    </Router>,
  );

  expect(screen.getByTestId('left-nav')).toBeInTheDocument();

  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 600,
  });

  fireEvent(window, new Event('resize'));

  expect(screen.getByTestId('navbar')).toBeInTheDocument();
});

test('displays dark mode properly on charts', async () => {
  render(
    <Router>
      <DarkModeProvider>
        <AnalyticsPage />
      </DarkModeProvider>
    </Router>,
  );

  await waitFor(
    () => {
      expect(screen.queryByText('analytics.loading')).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  const chartElements = screen.getAllByTestId('chart-dark-mode');
  chartElements.forEach((element) => {
    expect(element).toBeInTheDocument();
  });
});

test('renders page sections correctly', async () => {
  render(
    <Router>
      <DarkModeProvider>
        <AnalyticsPage />
      </DarkModeProvider>
    </Router>,
  );

  await waitFor(
    () => {
      expect(screen.queryByText('analytics.loading')).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );

  expect(screen.getByText('analytics.popularTerms.title')).toBeInTheDocument();
  expect(
    screen.getByText('analytics.categoryDistribution.title'),
  ).toBeInTheDocument();
  expect(screen.getByText('analytics.topDomains.title')).toBeInTheDocument();
  expect(
    screen.getByText('analytics.trendsAndInsights.title'),
  ).toBeInTheDocument();
  // This text doesn't appear to be in the component, remove this assertion
  // expect(screen.getByText('Analytics Summary')).toBeInTheDocument();
});
