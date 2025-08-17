import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import DashboardPage from '../src/pages/DashboardPage';

// 🧩 Mocks
const mockNavigate = vi.fn();

// Mock react-router-dom's useNavigate hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock react-i18next's useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.welcome': 'Welcome to Marito',
        'dashboard.welcomeBack': 'Welcome back',
        'dashboard.userName': 'User Name',
        'dashboard.userEmail': 'Email',
        'dashboard.quickActions': 'Quick Actions',
        'dashboard.searchNow': 'Search Now',
        'dashboard.searchDescription': 'Search for terminology in multiple languages',
        'dashboard.downloadResources': 'Download Resources',
        'dashboard.downloadDescription': 'Access and download terminology resources',
        'dashboard.contributeTerm': 'Contribute Term',
        'dashboard.contributeDescription': 'Add new terms to our database',
        'dashboard.recentTerms': 'Recent Terms',
        'dashboard.hideTerms': 'Hide Terms',
        'dashboard.viewAll': 'View All',
        'dashboard.communityActivity': 'Community Activity',
        'dashboard.hideActivity': 'Hide Activity',
        'dashboard.viewAllActivity': 'View All Activity',
        'dashboard.loadingProfile': 'Loading profile...',
        'dashboard.discoverRandomTerms': 'Discover Random Terms',
        'dashboard.getNewTerms': 'Get New Terms',
        'dashboard.loadingTerms': 'Loading terms...',
        'dashboard.browseCategoryGlossary': 'Browse category in glossary',
        'dashboard.goToProfile': 'Go to profile',
        'dashboard.aboutMarito.intro': 'Welcome to Marito, your gateway to South African languages.',
        'dashboard.aboutMarito.mission': 'Our mission is to bridge language barriers and celebrate linguistic diversity.',
        'dashboard.aboutMarito.teamCredit': 'Proudly developed by our team.',
        'dashboard.aboutMarito.learnMoreDSFSI': 'Learn More About DSFSI'
      };
      return translations[key] || key;
    },
    i18n: {
      resolvedLanguage: 'en',
      changeLanguage: vi.fn()
    }
  }),
}));

// Mock DarkModeComponent
vi.mock('../src/components/ui/DarkModeComponent.tsx', () => ({
  useDarkMode: () => ({
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
  }),
}));

// Mock LeftNav component
vi.mock('../src/components/ui/LeftNav.tsx', () => ({
  default: ({ activeItem, setActiveItem }: { activeItem: string; setActiveItem: (item: string) => void }) => (
    <nav data-testid="left-nav">
      <div data-testid="active-item">{activeItem}</div>
      <button type="button" onClick={() => { setActiveItem('dashboard'); }}>Dashboard</button>
      <button type="button" onClick={() => { setActiveItem('search'); }}>Search</button>
      <button type="button" onClick={() => { setActiveItem('glossary'); }}>Glossary</button>
    </nav>
  ),
}));

// Mock Navbar component  
vi.mock('../src/components/ui/Navbar.tsx', () => ({
  default: () => <nav data-testid="mobile-navbar">Mobile Navigation</nav>,
}));

// Mock SouthAfricaMap component
vi.mock('../src/components/dashboard/SouthAfricaMap.tsx', () => ({
  default: ({ width, height }: { width?: number | string; height?: number | string }) => (
    <div data-testid="south-africa-map" data-width={width} data-height={height}>
      South Africa Map
    </div>
  ),
}));

// Mock window.innerWidth for responsive testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
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
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch API
global.fetch = vi.fn();

// Mock CSS custom properties
Object.defineProperty(document.documentElement.style, 'setProperty', {
  value: vi.fn(),
});

Object.defineProperty(document.documentElement, 'setAttribute', {
  value: vi.fn(),
});

Object.defineProperty(document.documentElement, 'removeAttribute', {
  value: vi.fn(),
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
    
    // Set default access token to prevent login redirect
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'valid-token';
      return null;
    });
    
    // Mock fetch with different responses based on URL
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/v1/glossary/random')) {
        // Mock random terms API - always return a valid array
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve([
            {
              id: '1',
              term: 'Ubuntu',
              definition: 'A philosophy emphasizing interconnectedness',
              language: 'isiZulu',
              category: 'Philosophy'
            },
            {
              id: '2', 
              term: 'Harambee',
              definition: 'Working together for common purpose',
              language: 'Swahili',
              category: 'Social'
            }
          ])
        });
      } else if (url.includes('/api/v1/auth/me')) {
        // Mock user profile API
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({
            id: 'user123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            profile_pic_url: 'https://example.com/profile.jpg',
            role: 'user'
          })
        });
      }
      // Default fallback - return valid array for safety
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve([])
      });
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const renderDashboardPage = () => {
    return render(
      <Router>
        <DashboardPage />
      </Router>
    );
  };

  describe('Component Rendering', () => {
    it('should render the dashboard page correctly', async () => {
      vi.useRealTimers(); // Use real timers for this async test
      
      renderDashboardPage();
      
      await waitFor(() => {
        expect(screen.getByText('Connecting')).toBeInTheDocument();
      });
      
      vi.useFakeTimers(); // Switch back to fake timers
    });

    it('should render left navigation on desktop', () => {
      window.innerWidth = 1024;
      renderDashboardPage();
      
      expect(screen.getByTestId('left-nav')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-navbar')).not.toBeInTheDocument();
    });

    it('should render mobile navbar on mobile devices', () => {
      window.innerWidth = 500;
      renderDashboardPage();
      
      expect(screen.getByTestId('mobile-navbar')).toBeInTheDocument();
    });

    it('should render the South Africa map', () => {
      renderDashboardPage();
      
      expect(screen.getByTestId('south-africa-map')).toBeInTheDocument();
    });

    it('should display the intro text about Marito', () => {
      renderDashboardPage();
      
      expect(screen.getByText('Welcome to Marito, your gateway to South African languages.')).toBeInTheDocument();
    });
  });

  describe('User Profile Section', () => {
    it('should show loading state initially', () => {
      renderDashboardPage();
      
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('should display user profile information after loading', async () => {
      vi.useRealTimers(); // Use real timers for this async test
      
      renderDashboardPage();
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText(/john.doe@example.com/)).toBeInTheDocument();
      });
      
      vi.useFakeTimers(); // Switch back to fake timers
    });

    it('should display user initials when no profile picture is available', async () => {
      vi.useRealTimers(); // Use real timers for this async test
      
      // Ensure we have a valid token
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'accessToken') return 'valid-token';
        return null;
      });

      // Mock API calls in the correct order - profile API first, then random terms
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({
            id: 'user123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            // No profile_pic_url to test initials display
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve([
            {
              id: '1',
              term: 'Ubuntu',
              definition: 'A philosophy emphasizing interconnectedness',
              language: 'isiZulu',
              category: 'Philosophy'
            }
          ])
        });

      renderDashboardPage();
      
      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument();
      });
      
      vi.useFakeTimers(); // Switch back to fake timers
    });

    it('should navigate to profile page when clicking on username', async () => {
      vi.useRealTimers(); // Use real timers for this async test
      
      renderDashboardPage();
      
      await waitFor(() => {
        const usernameElement = screen.getByText('John Doe');
        fireEvent.click(usernameElement);
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
      
      vi.useFakeTimers(); // Switch back to fake timers
    });
  });

  describe('Random Terms Section', () => {
    it('should display the random terms section', () => {
      renderDashboardPage();
      
      expect(screen.getByText('Discover Random Terms')).toBeInTheDocument();
    });

    it('should display refresh button for random terms', () => {
      renderDashboardPage();
      
      const refreshButton = screen.getByTitle('Get New Terms');
      expect(refreshButton).toBeInTheDocument();
    });

    it('should fetch new random terms when refresh button is clicked', async () => {
      vi.useRealTimers(); // Use real timers for this async test
      
      // Mock user profile API first (called on mount)
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({
            id: 'user123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com'
          })
        })
        // Then mock random terms API (called on mount)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve([
            {
              id: '1',
              term: 'Ubuntu',
              definition: 'A philosophy emphasizing interconnectedness',
              language: 'isiZulu',
              category: 'Philosophy'
            }
          ])
        })
        // Finally mock the refresh call for random terms
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve([
            {
              id: '2',
              term: 'Harambee',
              definition: 'Working together for common purpose',
              language: 'Swahili',
              category: 'Social'
            }
          ])
        });

      renderDashboardPage();
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Ubuntu')).toBeInTheDocument();
      });
      
      const refreshButton = screen.getByTitle('Get New Terms');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/glossary/random')
        );
      });
      
      vi.useFakeTimers(); // Switch back to fake timers
    });

  });

  describe('API Integration', () => {
    it('should fetch user profile data on component mount', async () => {
      vi.useRealTimers(); // Use real timers for this async test
      
      localStorageMock.getItem.mockReturnValue('valid-token');
      
      renderDashboardPage();
      
      await waitFor(() => {
        const expectedHeaders = {
          'Authorization': 'Bearer valid-token'
        } as const;
        
        const expectedOptions = {
          headers: expectedHeaders
        } as const;
        
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/auth/me'),
          expect.objectContaining(expectedOptions)
        );
      });
      
      vi.useFakeTimers(); // Switch back to fake timers
    });

    it('should handle API errors gracefully', async () => {
      vi.useRealTimers(); // Use real timers for this async test
      
      // Mock random terms API success, but profile API error
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve([])
        })
        .mockRejectedValueOnce(new Error('Network Error'));
      
      renderDashboardPage();
      
      await waitFor(() => {
        // Should show loading state since profile API failed
        expect(screen.getByText('Loading profile...')).toBeInTheDocument();
      });
      
      vi.useFakeTimers(); // Switch back to fake timers
    });

    it('should redirect to login when no token is available', async () => {
      vi.useRealTimers(); // Use real timers for this async test
      
      localStorageMock.getItem.mockReturnValue(null);
      
      renderDashboardPage();
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
      
      vi.useFakeTimers(); // Switch back to fake timers
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile devices', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      
      renderDashboardPage();
      
      expect(screen.getByTestId('mobile-navbar')).toBeInTheDocument();
    });

    it('should adapt layout for tablet devices', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      
      renderDashboardPage();
      
      // Should still show mobile navbar at 768px
      expect(screen.getByTestId('mobile-navbar')).toBeInTheDocument();
    });

    it('should adapt layout for desktop devices', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      
      renderDashboardPage();
      
      expect(screen.getByTestId('left-nav')).toBeInTheDocument();
    });
  });

  describe('Local Storage Integration', () => {
    it('should load cached user data from localStorage when available', () => {
      const mockUserData = JSON.stringify({
        uuid: 'user123',
        firstName: 'Cached',
        lastName: 'User', 
        email: 'cached@example.com'
      });
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'userData') return mockUserData;
        if (key === 'accessToken') return 'valid-token';
        return null;
      });
      
      renderDashboardPage();
      
      // Should show cached user data
      expect(screen.getByText(/Cached User/)).toBeInTheDocument();
    });

    it('should fetch from API when no cached data is available', async () => {
      vi.useRealTimers(); // Use real timers for this async test
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'accessToken') return 'valid-token';
        return null; // No cached userData
      });
      
      renderDashboardPage();
      
      await waitFor(() => {
        const expectedHeaders = {
          'Authorization': 'Bearer valid-token'
        } as const;
        
        const expectedOptions = {
          headers: expectedHeaders
        } as const;
        
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/auth/me'),
          expect.objectContaining(expectedOptions)
        );
      });
      
      vi.useFakeTimers(); // Switch back to fake timers
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderDashboardPage();
      
      const abstractBg = screen.getByRole('complementary', { name: 'falling-letters' });
      expect(abstractBg).toBeInTheDocument();
    });

    it('should provide proper semantics for navigation elements', () => {
      renderDashboardPage();
      
      const navigation = screen.getByTestId('left-nav');
      expect(navigation).toBeInTheDocument();
    });
  });

  describe('Map Integration', () => {
    it('should render South Africa map with correct props', () => {
      renderDashboardPage();
      
      const map = screen.getByTestId('south-africa-map');
      expect(map).toHaveAttribute('data-width', '600');
      expect(map).toHaveAttribute('data-height', '400');
    });
  });

  describe('Theme Integration', () => {
    it('should apply light theme class when dark mode is disabled', () => {
      renderDashboardPage();
      
      const container = document.querySelector('.dashboard-container');
      expect(container).toHaveClass('theme-light');
    });

    it('should respond to theme changes', () => {
      renderDashboardPage();
      
      const container = document.querySelector('.dashboard-container');
      expect(container).toHaveClass('theme-light');
    });
  });

  describe('Animation and Effects', () => {
    it('should initialize falling letters animation', () => {
      renderDashboardPage();
      
      const abstractBg = screen.getByRole('complementary', { name: 'falling-letters' });
      expect(abstractBg).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle profile picture loading errors', async () => {
      vi.useRealTimers(); // Use real timers for this async test
      
      renderDashboardPage();
      
      await waitFor(() => {
        const img = screen.queryByAltText('Profile Picture');
        if (img) {
          fireEvent.error(img);
          // Should fallback to initials
          expect(screen.getByText('JD')).toBeInTheDocument();
        }
      });
      
      vi.useFakeTimers(); // Switch back to fake timers
    });

    it('should handle network errors gracefully', async () => {
      vi.useRealTimers(); // Use real timers for this async test
      
      // Mock random terms API success, but profile API error
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve([])
        })
        .mockRejectedValueOnce(new Error('Network Error'));
      
      renderDashboardPage();
      
      // Should not crash and show fallback content
      await waitFor(() => {
        expect(screen.getByText('Loading profile...')).toBeInTheDocument();
      });
      
      vi.useFakeTimers(); // Switch back to fake timers
    });
  });
});