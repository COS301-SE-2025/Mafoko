import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global test setup for integration tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock URL constructor
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Mock fetch globally
global.fetch = vi.fn();

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  localStorageMock.removeItem.mockReset();
  localStorageMock.clear.mockReset();
});

// Mock environment variables for tests
vi.mock('import.meta', () => ({
  env: {
    VITE_AUTH_SERVICE_URL: 'http://localhost:8001',
    VITE_SEARCH_SERVICE_URL: 'http://localhost:8002',
    VITE_ANALYTICS_SERVICE_URL: 'http://localhost:8003',
    VITE_LINGUIST_APP_SERVICE_URL: 'http://localhost:8004',
    VITE_VOTE_SERVICE_URL: 'http://localhost:8005',
    VITE_GLOSSARY_SERVICE_URL: 'http://localhost:8006',
    VITE_TERM_SERVICE_URL: 'http://localhost:8007',
    VITE_COMMENT_SERVICE_URL: 'http://localhost:8008',
    VITE_WORKSPACE_SERVICE_URL: 'http://localhost:8009',
    PROD: false,
  },
}));
