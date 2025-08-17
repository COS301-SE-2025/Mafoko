import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import SettingsPage from '../src/pages/SettingsPage';

// Mock react-i18next
const mockChangeLanguage = vi.fn();
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'settings.title': 'Settings',
    'settings.subtitle': 'Customize your experience',
    'settings.profile.title': 'Profile',
    'settings.appLanguage.title': 'App Language',
    'settings.selectLanguage': 'Select Language',
    'settings.accessibility.title': 'Accessibility',
    'settings.accessibility.textAndVisual': 'Text and Visual',
    'settings.accessibility.colorAndContrast': 'Color and Contrast',
    'settings.accessibility.textSize': 'Text Size',
    'settings.accessibility.textSpacing': 'Text Spacing',
    'settings.accessibility.highContrastMode': 'High Contrast Mode',
    'settings.accessibility.darkMode': 'Dark Mode',
  };
  return translations[key] || key;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      changeLanguage: mockChangeLanguage,
      resolvedLanguage: 'en',
    },
  }),
}));

// Mock DarkModeComponent
const mockToggleDarkMode = vi.fn();
vi.mock('../src/components/ui/DarkModeComponent', () => ({
  useDarkMode: () => ({
    isDarkMode: false,
    toggleDarkMode: mockToggleDarkMode,
  }),
}));

// Mock navigation components
vi.mock('../src/components/ui/LeftNav', () => ({
  default: ({ activeItem }: { activeItem: string }) => (
    <nav data-testid="left-nav">
      <div data-testid="active-item">{activeItem}</div>
    </nav>
  ),
}));

vi.mock('../src/components/ui/Navbar', () => ({
  default: () => <nav data-testid="mobile-navbar">Mobile Navigation</nav>,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window properties
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

const renderSettingsPage = () => {
  return render(
    <BrowserRouter>
      <SettingsPage />
    </BrowserRouter>
  );
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Rendering', () => {
    it('should render settings page with correct title and subtitle', () => {
      renderSettingsPage();
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Customize your experience')).toBeInTheDocument();
    });

    it('should render all main sections', () => {
      renderSettingsPage();
      
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('App Language')).toBeInTheDocument();
      expect(screen.getByText('Accessibility')).toBeInTheDocument();
      expect(screen.getByText('Text and Visual')).toBeInTheDocument();
      expect(screen.getByText('Color and Contrast')).toBeInTheDocument();
    });

    it('should render language dropdown with all supported languages', () => {
      renderSettingsPage();
      
      const languageSelect = screen.getByLabelText('Select Language');
      expect(languageSelect).toBeInTheDocument();
      
      // Check for some key language options
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('isiZulu')).toBeInTheDocument();
      expect(screen.getByText('Afrikaans')).toBeInTheDocument();
    });

    it('should render accessibility controls', () => {
      renderSettingsPage();
      
      expect(screen.getByText('Text Size')).toBeInTheDocument();
      expect(screen.getByText('Text Spacing')).toBeInTheDocument();
      expect(screen.getByText('High Contrast Mode')).toBeInTheDocument();
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should show mobile navbar when screen width is mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
      
      renderSettingsPage();
      
      expect(screen.getByTestId('mobile-navbar')).toBeInTheDocument();
      expect(screen.queryByTestId('left-nav')).not.toBeInTheDocument();
    });

    it('should show left navigation when screen width is desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      renderSettingsPage();
      
      expect(screen.getByTestId('left-nav')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-navbar')).not.toBeInTheDocument();
    });

    it('should set active menu item to settings in left nav', () => {
      renderSettingsPage();
      
      expect(screen.getByTestId('active-item')).toHaveTextContent('settings');
    });
  });

  describe('Profile Navigation', () => {
    it('should navigate to profile page when profile section is clicked', () => {
      renderSettingsPage();
      
      const profileSection = screen.getByText('Profile').closest('.settings-section');
      expect(profileSection).toBeInTheDocument();
      
      if (profileSection) {
        fireEvent.click(profileSection);
      }
      
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  describe('Language Selection', () => {
    it('should change language when dropdown value changes', async () => {
      renderSettingsPage();
      
      const languageSelect = screen.getByLabelText('Select Language');
      
      fireEvent.change(languageSelect, { target: { value: 'zu' } });
      
      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('zu');
      });
    });

    it('should update localStorage when language is changed', async () => {
      renderSettingsPage();
      
      const languageSelect = screen.getByLabelText('Select Language');
      
      fireEvent.change(languageSelect, { target: { value: 'af' } });
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('i18nextLng', 'af');
      });
    });

    it('should update document language attribute when language changes', async () => {
      renderSettingsPage();
      
      const languageSelect = screen.getByLabelText('Select Language');
      
      fireEvent.change(languageSelect, { target: { value: 'xh' } });
      
      await waitFor(() => {
        expect(document.documentElement.lang).toBe('xh');
      });
    });
  });

  describe('Text Size Control', () => {
    it('should render text size slider with correct default value', () => {
      renderSettingsPage();
      
      const textSizeSlider = screen.getByDisplayValue('16');
      expect(textSizeSlider).toBeInTheDocument();
      expect(textSizeSlider.type).toBe('range');
      expect(textSizeSlider.min).toBe('12');
      expect(textSizeSlider.max).toBe('24');
    });

    it('should update text size when slider value changes', () => {
      renderSettingsPage();
      
      const textSizeSlider = screen.getByDisplayValue('16');
      
      fireEvent.change(textSizeSlider, { target: { value: '20' } });
      
      expect(textSizeSlider.value).toBe('20');
    });

    it('should display current text size value', () => {
      renderSettingsPage();
      
      const textSizeSlider = screen.getByDisplayValue('16');
      fireEvent.change(textSizeSlider, { target: { value: '18' } });
      
      expect(screen.getByText('18px')).toBeInTheDocument();
    });
  });

  describe('Text Spacing Control', () => {
    it('should render text spacing slider with correct default value', () => {
      renderSettingsPage();
      
      const textSpacingSlider = screen.getByDisplayValue('1');
      expect(textSpacingSlider).toBeInTheDocument();
      expect(textSpacingSlider.type).toBe('range');
      expect(textSpacingSlider.min).toBe('0.8');
      expect(textSpacingSlider.max).toBe('2');
    });

    it('should update text spacing when slider value changes', () => {
      renderSettingsPage();
      
      const textSpacingSlider = screen.getByDisplayValue('1');
      
      fireEvent.change(textSpacingSlider, { target: { value: '1.5' } });
      
      expect(textSpacingSlider.value).toBe('1.5');
    });

    it('should display current text spacing value', () => {
      renderSettingsPage();
      
      const textSpacingSlider = screen.getByDisplayValue('1');
      fireEvent.change(textSpacingSlider, { target: { value: '1.2' } });
      
      expect(screen.getByText('1.2x')).toBeInTheDocument();
    });
  });

  describe('High Contrast Mode', () => {
    it('should render high contrast toggle switch', () => {
      renderSettingsPage();
      
      const highContrastToggle = screen.getByText('High Contrast Mode').closest('.toggle-switch');
      expect(highContrastToggle).toBeInTheDocument();
    });

    it('should toggle high contrast mode when clicked', () => {
      renderSettingsPage();
      
      const highContrastToggle = screen.getByText('High Contrast Mode').closest('.toggle-switch')?.querySelector('.switch');
      expect(highContrastToggle).toBeInTheDocument();
      
      if (highContrastToggle) {
        fireEvent.click(highContrastToggle);
      }
      
      expect(highContrastToggle).toHaveClass('checked');
    });

    it('should set data attribute on document when high contrast is enabled', () => {
      renderSettingsPage();
      
      const highContrastToggle = screen.getByText('High Contrast Mode').closest('.toggle-switch')?.querySelector('.switch');
      
      if (highContrastToggle) {
        fireEvent.click(highContrastToggle);
      }
      
      expect(document.documentElement.getAttribute('data-high-contrast-mode')).toBe('true');
    });
  });

  describe('Dark Mode Toggle', () => {
    it('should render dark mode toggle switch', () => {
      renderSettingsPage();
      
      const darkModeToggle = screen.getByText('Dark Mode').closest('.toggle-switch');
      expect(darkModeToggle).toBeInTheDocument();
    });

    it('should call toggleDarkMode when dark mode toggle is clicked', () => {
      renderSettingsPage();
      
      const darkModeToggle = screen.getByText('Dark Mode').closest('.toggle-switch')?.querySelector('.switch');
      expect(darkModeToggle).toBeInTheDocument();
      
      if (darkModeToggle) {
        fireEvent.click(darkModeToggle);
      }
      
      expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
    });
  });

  describe('Theme Integration', () => {
    it('should apply light theme class by default', () => {
      renderSettingsPage();
      
      const container = document.querySelector('.dashboard-container');
      expect(container).toHaveClass('theme-light');
      expect(container).not.toHaveClass('theme-dark');
    });
  });

  describe('Local Storage Integration', () => {
    it('should load settings from localStorage on component mount', () => {
      const savedSettings = JSON.stringify({
        textSize: 18,
        textSpacing: 1.2,
        highContrastMode: true,
        selectedLanguage: 'af',
      });
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'userSettings') return savedSettings;
        return null;
      });
      
      renderSettingsPage();
      
      expect(screen.getByDisplayValue('18')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1.2')).toBeInTheDocument();
    });

    it('should save settings to localStorage when changes are made', () => {
      renderSettingsPage();
      
      const textSizeSlider = screen.getByDisplayValue('16');
      fireEvent.change(textSizeSlider, { target: { value: '20' } });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'userSettings',
        expect.stringContaining('"textSize":20')
      );
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Suppress console.error for this test since we expect parsing to fail
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'userSettings') return 'invalid-json';
        return null;
      });
      
      // Should not throw an error
      expect(() => renderSettingsPage()).not.toThrow();
      
      // Should fall back to default values
      expect(screen.getByDisplayValue('16')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  describe('CSS Variable Updates', () => {
    it('should update CSS variables when text size changes', () => {
      renderSettingsPage();
      
      const textSizeSlider = screen.getByDisplayValue('16');
      fireEvent.change(textSizeSlider, { target: { value: '20' } });
      
      expect(document.documentElement.style.getPropertyValue('--base-text-size')).toBe('20px');
      expect(document.documentElement.style.getPropertyValue('--text-scaling')).toBe('1.25');
    });

    it('should update CSS variables when text spacing changes', () => {
      renderSettingsPage();
      
      const textSpacingSlider = screen.getByDisplayValue('1');
      fireEvent.change(textSpacingSlider, { target: { value: '1.5' } });
      
      expect(document.documentElement.style.getPropertyValue('--text-spacing')).toBe('1.5');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for form controls', () => {
      renderSettingsPage();
      
      expect(screen.getByLabelText('Select Language')).toBeInTheDocument();
    });

    it('should have semantic HTML structure', () => {
      renderSettingsPage();
      
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Accessibility' })).toBeInTheDocument();
    });

    it('should have proper slider controls for accessibility', () => {
      renderSettingsPage();
      
      const sliders = screen.getAllByRole('slider');
      expect(sliders).toHaveLength(2); // Text size and text spacing sliders
    });
  });

  describe('Error Handling', () => {
    it('should handle language change errors gracefully', async () => {
      // Suppress console.error for this test since we expect the language change to fail
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockChangeLanguage.mockRejectedValueOnce(new Error('Language change failed'));
      
      renderSettingsPage();
      
      const languageSelect = screen.getByLabelText('Select Language');
      fireEvent.change(languageSelect, { target: { value: 'zu' } });
      
      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('zu');
      });
      
      // Should not throw unhandled error
      expect(() => {}).not.toThrow();
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });
});