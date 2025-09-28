import '@testing-library/jest-dom';
import { vi } from 'vitest';
import 'fake-indexeddb/auto';

// Global test setup for all tests

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

// Mock URL constructor
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Mock crypto for UUID generation and other crypto operations
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => '12345678-1234-1234-1234-123456789012'),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock useProfilePicture hook
vi.mock('../src/hooks/useProfilePicture', () => ({
  useProfilePicture: vi.fn(() => ({
    profilePictureUrl: null,
    loadingProfilePicture: false,
    loadProfilePicture: vi.fn(),
    clearProfilePictureCache: vi.fn(),
    uploadProfilePicture: vi.fn(),
    getPendingUploadCount: vi.fn(() => Promise.resolve(0)),
  })),
  handleProfilePictureError: vi.fn(),
}));
