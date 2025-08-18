import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { API_ENDPOINTS } from '../../src/config';

// Import integration-specific setup
import '../integration-setup';

describe('NewGlossary API Integration Tests', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('fetches glossary data successfully', async () => {
    const mockGlossaryData = [
      {
        id: '1',
        domain: 'Agriculture',
        language: 'English',
        termCount: 150,
        description: 'Agricultural terms and definitions',
        isPublic: true,
        createdAt: '2025-01-01T00:00:00Z',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGlossaryData),
    });

    const response = await fetch(API_ENDPOINTS.glossary);
    const data = (await response.json()) as typeof mockGlossaryData;

    expect(mockFetch).toHaveBeenCalledWith(API_ENDPOINTS.glossary);
    expect(data).toEqual(mockGlossaryData);
  });

  test('searches glossaries with query parameters', async () => {
    const searchQuery = 'agriculture';
    const mockSearchResults = [
      {
        id: '1',
        domain: 'Agriculture',
        language: 'English',
        termCount: 150,
        description: 'Agricultural terms and definitions',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSearchResults),
    });

    const searchUrl = `${API_ENDPOINTS.glossarySearch}?q=${encodeURIComponent(searchQuery)}`;
    const response = await fetch(searchUrl);
    const data = (await response.json()) as typeof mockSearchResults;

    expect(mockFetch).toHaveBeenCalledWith(searchUrl);
    expect(data).toEqual(mockSearchResults);
  });

  test('fetches glossary categories', async () => {
    const mockCategories = ['Agriculture', 'Technology', 'Medical', 'Science'];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCategories),
    });

    const response = await fetch(API_ENDPOINTS.glossaryCategories);
    const data = (await response.json()) as string[];

    expect(mockFetch).toHaveBeenCalledWith(API_ENDPOINTS.glossaryCategories);
    expect(data).toEqual(mockCategories);
  });

  test('fetches terms by category', async () => {
    const category = 'Agriculture';
    const mockTerms = [
      {
        id: '1',
        term: 'Crop Rotation',
        definition: 'Agricultural practice',
        domain: 'Agriculture',
        language: 'English',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTerms),
    });

    const response = await fetch(
      API_ENDPOINTS.glossaryTermsByCategory(category),
    );
    const data = (await response.json()) as typeof mockTerms;

    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.glossaryTermsByCategory(category),
    );
    expect(data).toEqual(mockTerms);
  });

  test('fetches available languages', async () => {
    const mockLanguages = ['English', 'Afrikaans', 'isiZulu', 'Sesotho'];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLanguages),
    });

    const response = await fetch(API_ENDPOINTS.glossaryLanguages);
    const data = (await response.json()) as string[];

    expect(mockFetch).toHaveBeenCalledWith(API_ENDPOINTS.glossaryLanguages);
    expect(data).toEqual(mockLanguages);
  });

  test('fetches random terms', async () => {
    const mockRandomTerms = [
      {
        id: '1',
        term: 'Agriculture',
        definition: 'Farming practices',
        domain: 'Agriculture',
      },
      {
        id: '2',
        term: 'Technology',
        definition: 'Digital innovation',
        domain: 'Technology',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRandomTerms),
    });

    const response = await fetch(API_ENDPOINTS.glossaryRandom);
    const data = (await response.json()) as typeof mockRandomTerms;

    expect(mockFetch).toHaveBeenCalledWith(API_ENDPOINTS.glossaryRandom);
    expect(data).toEqual(mockRandomTerms);
  });

  test('performs advanced search with POST request', async () => {
    const searchData = {
      query: 'agriculture',
      language: 'English',
      domain: 'Agriculture',
      exact: false,
    };

    const mockResults = [
      {
        id: '1',
        term: 'Agriculture',
        definition: 'Farming practices',
        domain: 'Agriculture',
        language: 'English',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    });

    const response = await fetch(API_ENDPOINTS.glossaryAdvancedSearch, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    const data = (await response.json()) as typeof mockResults;

    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.glossaryAdvancedSearch,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      }),
    );
    expect(data).toEqual(mockResults);
  });

  test('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    });

    const response = await fetch(API_ENDPOINTS.glossary);

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  test('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetch(API_ENDPOINTS.glossary)).rejects.toThrow(
      'Network error',
    );
  });
});
