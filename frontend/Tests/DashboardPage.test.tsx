import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import DashboardPage from '../src/pages/DashboardPage';
import { DarkModeProvider } from '../src/components/ui/DarkModeComponent';

// Mock the LeftNav component since we're only testing DashboardPage
vi.mock('../src/components/ui/LeftNav.tsx', () => ({
  default: () => (
    <div data-testid="mock-leftnav">LeftNav Mock</div>
  )
}));

describe('DashboardPage', () => {
  const renderDashboardPage = () => {
    return render(
      <DarkModeProvider>
        <DashboardPage />
      </DarkModeProvider>
    );
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    // Mock window.innerHeight which is used in the falling letters animation
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000
    });
  });

  describe('Rendering', () => {
    it('renders the main components', () => {
      renderDashboardPage();
      
      // Check for main structural elements
      expect(screen.getByText('Unite Through Words')).toBeInTheDocument();
      expect(screen.getByText(/The term 'Marito' originates from Xitsonga/)).toBeInTheDocument();
      expect(screen.getByText('Meet Mari - Your Voice Assistant')).toBeInTheDocument();
    });

    it('renders the LeftNav component', () => {
      renderDashboardPage();
      expect(screen.getByTestId('mock-leftnav')).toBeInTheDocument();
    });

    it('renders the voice assistant section', () => {
      renderDashboardPage();
      expect(screen.getByRole('button', { name: 'Toggle voice assistant' })).toBeInTheDocument();
      expect(screen.getByText('Navigate pages, lookup terms and search glossaries using voice commands')).toBeInTheDocument();
    });

    it('renders the CTA button with correct link', () => {
      renderDashboardPage();
      const ctaButton = screen.getByRole('link', { name: /learn more about dsfsi/i });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveAttribute('href', 'https://www.dsfsi.co.za/');
      expect(ctaButton).toHaveAttribute('target', '_blank');
      expect(ctaButton).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Falling Letters Animation', () => {
    it('initializes with falling letters container', () => {
      renderDashboardPage();
      const abstractBg = screen.getByRole('complementary', { name: 'falling-letters' });
      expect(abstractBg).toHaveClass('abstract-bg');
    });
  });

  describe('Voice Assistant Interaction', () => {
    it('toggles microphone button state on click', () => {
      renderDashboardPage();
      const micButton = screen.getByRole('button', { name: 'Toggle voice assistant' });
      
      fireEvent.click(micButton);
      expect(micButton).toHaveClass('listening');
      
      fireEvent.click(micButton);
      expect(micButton).not.toHaveClass('listening');
    });

    it('displays ripple elements', () => {
      renderDashboardPage();
      const ripples = screen.getAllByRole('presentation');
      expect(ripples).toHaveLength(3);
      ripples.forEach(ripple => {
        expect(ripple).toHaveClass(/ripple\d/);
      });
    });
  });

  describe('Dark Mode Integration', () => {
    it('renders with the correct theme class', () => {
      renderDashboardPage();
      const container = screen.getByRole('main');
      expect(container).toHaveClass('dashboard-container');
      expect(container).toHaveClass('theme-light');
    });
  });

  describe('Accessibility', () => {
    it('has interactive elements', () => {
      renderDashboardPage();
      const micButton = screen.getByRole('button');
      const ctaLink = screen.getByRole('link', { name: /learn more about dsfsi/i });
      
      expect(micButton).toBeInTheDocument();
      expect(ctaLink).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      renderDashboardPage();
      expect(screen.getByRole('heading', { level: 1, name: 'Unite Through Words' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Meet Mari - Your Voice Assistant' })).toBeInTheDocument();
    });
  });
});
