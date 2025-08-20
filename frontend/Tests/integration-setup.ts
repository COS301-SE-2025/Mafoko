import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Integration test specific setup

// Mock environment variables for integration tests
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

// Mock fetch for integration tests
global.fetch = vi.fn();

// Mock console methods to reduce noise in integration tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
