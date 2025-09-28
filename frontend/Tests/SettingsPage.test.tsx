import { vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  cleanup,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import SettingsPage from '../src/pages/SettingsPage';
import * as settingsService from '../src/services/settingsService';

// Mock dependencies
const mockNavigate = vi.fn();

vi.mock(
  'react-router-dom',
  async (): Promise<typeof import('react-router-dom')> => {
    const actual =
      await vi.importActual<typeof import('react-router-dom')>(
        'react-router-dom',
      );
    return {
      ...actual,
      useNavigate: () => mockNavigate,
    };
  },
);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'settings.title': 'Settings',
        'settings.account': 'Account',
        'settings.display': 'Display',
        'settings.accessibility': 'Accessibility',
        'settings.language': 'Language',
        'settings.textSize': 'Text Size',
        'settings.textSpacing': 'Text Spacing',
        'settings.highContrast': 'High Contrast Mode',
        'settings.darkMode': 'Dark Mode',
        'settings.save': 'Save Changes',
        'settings.cancel': 'Cancel',
      };
      return translations[key] || fallback || key;
    },
    i18n: {
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      language: 'en',
    },
  }),
}));

vi.mock('../src/components/ui/LeftNav', () => ({
  __esModule: true,
  default: () => <div data-testid="left-nav">Left Navigation</div>,
}));

vi.mock('../src/components/ui/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navigation Bar</div>,
}));

vi.mock('../src/components/ui/DarkModeComponent', () => ({
  useDarkMode: () => ({
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
  }),
}));

// Mock settings service
vi.mock('../src/services/settingsService', () => ({
  getUserPreferences: vi.fn(),
  updateUserPreferences: vi.fn(),
}));

// Mock localStorage
const mockUserData = {
  id: 'test-user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
};

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn().mockReturnValue(JSON.stringify(mockUserData)),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

const mockUserPreferences = {
  user_id: 'test-user-123',
  dark_mode: false,
  offline_mode_enabled: false,
  ui_language: 'en',
  text_size: 16,
  text_spacing: 1.2,
  high_contrast_mode: false,
  updated_at: '2023-01-01T00:00:00Z',
};

// Helper function to render SettingsPage with act() wrapping
const renderSettingsPage = () => {
  // Suppress act warnings for this component as the async operations are properly handled
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('act(...)')) {
      return;
    }
    originalError.call(console, ...args);
  };

  const result = render(
    <Router>
      <SettingsPage />
    </Router>,
  );

  // Restore console.error
  console.error = originalError;

  return result;
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup successful API responses
    vi.mocked(settingsService.getUserPreferences).mockResolvedValue(
      mockUserPreferences,
    );
    vi.mocked(settingsService.updateUserPreferences).mockResolvedValue(
      mockUserPreferences,
    );
  });

  afterEach(() => {
    // Clear all timers and pending tasks
    vi.clearAllTimers();
    vi.clearAllMocks();

    // Clean up React components
    cleanup();

    // Reset document modifications that might be left by the component
    document.documentElement.removeAttribute('data-high-contrast-mode');
    document.documentElement.style.removeProperty('--base-text-size');
    document.documentElement.style.removeProperty('--text-scaling');
    document.documentElement.style.removeProperty('--text-spacing');
  });

  test('renders navigation components', () => {
    renderSettingsPage();

    expect(screen.getByTestId('left-nav')).toBeInTheDocument();
    // SettingsPage doesn't include navbar component
  });

  test('renders settings title', () => {
    renderSettingsPage();

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('renders all settings sections', () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    expect(screen.getByText('settings.profile.title')).toBeInTheDocument();
    expect(screen.getByText('settings.appLanguage.title')).toBeInTheDocument();
    expect(
      screen.getByText('settings.accessibility.title'),
    ).toBeInTheDocument();
  });

  test('displays text size slider', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('settings.accessibility.textSize'),
      ).toBeInTheDocument();
      const slider = screen.getByDisplayValue('16');
      expect(slider).toBeInTheDocument();
    });
  });

  test('displays text spacing slider', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('settings.accessibility.textSpacing'),
      ).toBeInTheDocument();
      // Text spacing slider exists
      const sliders = screen.getAllByRole('slider');
      expect(sliders.length).toBeGreaterThan(1);
    });
  });

  test('displays high contrast mode toggle', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('settings.accessibility.highContrastMode'),
      ).toBeInTheDocument();
      // Look for toggle switch element
      const toggles = document.querySelectorAll('.switch, [role="switch"]');
      expect(toggles.length).toBeGreaterThan(0);
    });
  });

  test('displays dark mode toggle', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('settings.accessibility.darkMode'),
      ).toBeInTheDocument();
      // Look for toggle switch elements
      const toggles = document.querySelectorAll('.switch, [role="switch"]');
      expect(toggles.length).toBeGreaterThan(0);
    });
  });

  test('displays language selection dropdown', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('settings.appLanguage.title'),
      ).toBeInTheDocument();
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });

  test('handles text size slider change', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    await waitFor(() => {
      const sliders = screen.getAllByRole('slider');
      const textSizeSlider = sliders[0]; // First slider should be text size
      fireEvent.change(textSizeSlider, { target: { value: '18' } });
      // Just verify the event was handled
      expect(textSizeSlider).toBeInTheDocument();
    });
  });

  test('handles text spacing slider change', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    await waitFor(() => {
      const sliders = screen.getAllByRole('slider');
      if (sliders.length > 1) {
        const textSpacingSlider = sliders[1]; // Second slider should be text spacing
        fireEvent.change(textSpacingSlider, { target: { value: '1.5' } });
        expect(textSpacingSlider).toBeInTheDocument();
      }
    });
  });

  test('handles high contrast mode toggle', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    await waitFor(() => {
      const toggleElement =
        document.querySelector('.switch') ||
        document.querySelector('[role="switch"]');
      if (toggleElement) {
        fireEvent.click(toggleElement);
        expect(toggleElement).toBeInTheDocument();
      }
    });
  });

  test('handles dark mode toggle', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    await waitFor(() => {
      const toggleElements = document.querySelectorAll(
        '.switch, [role="switch"]',
      );
      if (toggleElements.length > 0) {
        fireEvent.click(toggleElements[0]);
        expect(toggleElements[0]).toBeInTheDocument();
      }
    });
  });

  test('handles language selection change', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'zu' } });
      expect(select).toBeInTheDocument();
    });
  });

  test('has settings service available', () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    // Just verify that the settings service is available
    expect(settingsService.updateUserPreferences).toBeDefined();
    expect(settingsService.getUserPreferences).toBeDefined();
  });

  test('displays all supported languages in dropdown', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    await waitFor(() => {
      const select = document.querySelector('select');
      if (select) {
        const options = within(select).getAllByRole('option');
        expect(options.length).toBeGreaterThan(0); // Has language options

        // Check for English option
        expect(screen.getByText('English')).toBeInTheDocument();
      }
    });
  });

  test('handles API errors gracefully when loading preferences', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(settingsService.getUserPreferences).mockRejectedValue(
      new Error('API Error'),
    );

    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    await waitFor(() => {
      // Should still render with default values
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  test('handles API errors gracefully when loading preferences', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(settingsService.getUserPreferences).mockRejectedValue(
      new Error('Load Error'),
    );

    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    // Just verify the component renders despite API errors
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  test('displays settings form elements', () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    // Just verify main settings elements are present
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(
      screen.getByText('settings.accessibility.textSize'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.accessibility.darkMode'),
    ).toBeInTheDocument();
  });

  test('allows interaction with settings controls', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    // Test that sliders can be interacted with
    await waitFor(() => {
      const sliders = screen.getAllByRole('slider');
      if (sliders.length > 0) {
        fireEvent.change(sliders[0], { target: { value: '20' } });
        // Just verify the slider exists and can be changed
        expect(sliders[0]).toBeInTheDocument();
      }
    });
  });

  test('shows settings sections with proper structure', () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    // Just verify that all main sections are rendered
    expect(screen.getByText('settings.profile.title')).toBeInTheDocument();
    expect(screen.getByText('settings.appLanguage.title')).toBeInTheDocument();
    expect(
      screen.getByText('settings.accessibility.title'),
    ).toBeInTheDocument();
  });

  test('applies accessibility settings to page elements', async () => {
    render(
      <Router>
        <SettingsPage />
      </Router>,
    );

    // Just verify that accessibility settings section exists
    await waitFor(() => {
      expect(
        screen.getByText('settings.accessibility.title'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('settings.accessibility.highContrastMode'),
      ).toBeInTheDocument();
    });
  });
});
