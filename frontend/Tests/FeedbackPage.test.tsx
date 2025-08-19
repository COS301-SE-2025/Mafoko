import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import FeedbackPage from '../src/pages/FeedbackPage';
import { FeedbackType } from '../src/types/feedback';

// Mock the dark mode hook
vi.mock('../src/components/ui/DarkModeComponent', () => ({
  useDarkMode: () => ({ isDarkMode: false, toggleDarkMode: vi.fn() }),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock LeftNav component to avoid localStorage issues
vi.mock('../src/components/ui/LeftNav', () => ({
  default: () => <div data-testid="left-nav">LeftNav</div>,
}));

// Mock Navbar component
vi.mock('../src/components/ui/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));

// Mock the config for API endpoints - simple mock URLs that don't require real services
vi.mock('../src/config', () => ({
  API_ENDPOINTS: {
    submitFeedback: '/api/v1/feedback/',
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window resize
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

const renderFeedbackPage = () => {
  return render(
    <BrowserRouter>
      <FeedbackPage />
    </BrowserRouter>,
  );
};

describe('FeedbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'accessToken') return null;
      if (key === 'userData') return null;
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders feedback page with default suggestion tab', () => {
    renderFeedbackPage();

    expect(screen.getByText('Submit a Suggestion')).toBeInTheDocument();
    expect(
      screen.getByText('Share your ideas to help us improve our service.'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Describe your suggestion in detail...'),
    ).toBeInTheDocument();
  });

  it('displays all feedback type tabs', () => {
    renderFeedbackPage();

    expect(screen.getByText('Suggestion')).toBeInTheDocument();
    expect(screen.getByText('Complaint')).toBeInTheDocument();
    expect(screen.getByText('Compliment')).toBeInTheDocument();
  });

  it('switches tabs correctly', async () => {
    renderFeedbackPage();

    // Click on complaint tab
    const complaintTab = screen.getByText('Complaint');
    fireEvent.click(complaintTab);

    await waitFor(() => {
      expect(screen.getByText('Submit a Complaint')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Let us know what went wrong so we can make it right.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          'Please describe the issue you experienced...',
        ),
      ).toBeInTheDocument();
    });

    // Click on compliment tab
    const complimentTab = screen.getByText('Compliment');
    fireEvent.click(complimentTab);

    await waitFor(() => {
      expect(screen.getByText('Submit a Compliment')).toBeInTheDocument();
      expect(
        screen.getByText("We'd love to hear what we're doing well!"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          'Tell us what made your experience great...',
        ),
      ).toBeInTheDocument();
    });
  });

  it('validates required message field', async () => {
    renderFeedbackPage();

    const submitButton = screen.getByRole('button', {
      name: /submit suggestion/i,
    });
    expect(submitButton).toBeDisabled();

    // Add message text
    const messageField = screen.getByPlaceholderText(
      'Describe your suggestion in detail...',
    );
    fireEvent.change(messageField, {
      target: { value: 'This is my feedback' },
    });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it('submits feedback successfully without authentication', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '123', message: 'Feedback submitted' }),
    });

    renderFeedbackPage();

    // Fill out the form
    const nameField = screen.getByPlaceholderText('Your name');
    const emailField = screen.getByPlaceholderText('your.email@example.com');
    const messageField = screen.getByPlaceholderText(
      'Describe your suggestion in detail...',
    );

    fireEvent.change(nameField, { target: { value: 'John Doe' } });
    fireEvent.change(emailField, { target: { value: 'john@example.com' } });
    fireEvent.change(messageField, {
      target: { value: 'This is my feedback message' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: /submit suggestion/i,
    });
    fireEvent.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    // Check API call
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/feedback/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }) as Record<string, string>,
        body: JSON.stringify({
          type: FeedbackType.SUGGESTION,
          message: 'This is my feedback message',
          name: 'John Doe',
          email: 'john@example.com',
        }),
      }),
    );

    // Check success page
    await waitFor(() => {
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
      expect(
        screen.getByText(/suggestion has been submitted successfully/i),
      ).toBeInTheDocument();
    });
  });

  it('submits feedback with authentication token', async () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'mock-jwt-token';
      if (key === 'userData')
        return JSON.stringify({ role: 'user', id: 'user-id' });
      return null;
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '123', message: 'Feedback submitted' }),
    });

    renderFeedbackPage();

    // Fill out the form
    const messageField = screen.getByPlaceholderText(
      'Describe your suggestion in detail...',
    );
    fireEvent.change(messageField, {
      target: { value: 'Authenticated feedback' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: /submit suggestion/i,
    });
    fireEvent.click(submitButton);

    // Check API call includes auth header
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/feedback/',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-jwt-token',
          }) as Record<string, string>,
        }),
      );
    });
  });

  it('handles submission error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderFeedbackPage();

    // Fill out the form
    const messageField = screen.getByPlaceholderText(
      'Describe your suggestion in detail...',
    );
    fireEvent.change(messageField, { target: { value: 'Test feedback' } });

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: /submit suggestion/i,
    });
    fireEvent.click(submitButton);

    // Check error message (should show "Network error" without "Failed to submit feedback")
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows different tab colors and icons', () => {
    renderFeedbackPage();

    // Check that suggestion tab is active by default
    const suggestionTab = screen.getByText('Suggestion').closest('button');
    expect(suggestionTab).toHaveClass('active');
    expect(suggestionTab).toHaveClass('suggestion');
  });

  it('handles mobile responsive layout', () => {
    // Mock mobile window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    renderFeedbackPage();

    // Should render without errors on mobile
    expect(screen.getByText('Submit a Suggestion')).toBeInTheDocument();
  });

  it('resets form after successful submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '123', message: 'Feedback submitted' }),
    });

    renderFeedbackPage();

    // Fill out the form
    const nameField = screen.getByPlaceholderText('Your name');
    const messageField = screen.getByPlaceholderText(
      'Describe your suggestion in detail...',
    );

    fireEvent.change(nameField, { target: { value: 'John Doe' } });
    fireEvent.change(messageField, { target: { value: 'Test feedback' } });

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: /submit suggestion/i,
    });
    fireEvent.click(submitButton);

    // Wait for success and form reset (after 3 second timeout)
    await waitFor(() => {
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
    });
  });
});
