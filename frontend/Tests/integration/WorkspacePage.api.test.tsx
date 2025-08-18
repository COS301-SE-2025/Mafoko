/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { API_ENDPOINTS } from '../../src/config';

describe('WorkspacePage API Integration Tests', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('fetches user bookmarks with authentication', async () => {
    const mockBookmarks = [
      {
        id: '1',
        termId: 'term-1',
        term: 'Agriculture',
        definition: 'The practice of farming',
        domain: 'Agriculture',
        language: 'English',
        createdAt: '2025-01-01T00:00:00Z',
        note: 'Important farming term',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockBookmarks),
    });

    const response = await fetch(API_ENDPOINTS.getBookmarks, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });

    const data = (await response.json()) as typeof mockBookmarks;

    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.getBookmarks,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      }),
    );
    expect(data).toEqual(mockBookmarks);
  });

  test('creates new bookmark', async () => {
    const bookmarkData = {
      termId: 'term-1',
      note: 'Important study term',
    };

    const mockResponse = {
      id: 'bookmark-1',
      termId: 'term-1',
      message: 'Term bookmarked successfully',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const response = await fetch(API_ENDPOINTS.bookmarkTerm, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify(bookmarkData),
    });

    const data = (await response.json()) as typeof mockResponse;

    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.bookmarkTerm,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        }),
        body: JSON.stringify(bookmarkData),
      }),
    );
    expect(data).toEqual(mockResponse);
  });

  test('removes bookmark', async () => {
    const termId = 'term-1';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Bookmark removed successfully' }),
    });

    const response = await fetch(API_ENDPOINTS.unbookmarkTerm(termId), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });

    const data = (await response.json()) as { message: string };

    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.unbookmarkTerm(termId),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      }),
    );
    expect(data.message).toBe('Bookmark removed successfully');
  });

  test('searches bookmarks', async () => {
    const searchQuery = 'agriculture';
    const mockResults = [
      {
        id: '1',
        term: 'Agriculture',
        definition: 'Farming practice',
        domain: 'Agriculture',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    });

    const searchUrl = `${API_ENDPOINTS.searchBookmarks}?q=${encodeURIComponent(searchQuery)}`;
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });

    const data = (await response.json()) as typeof mockResults;

    expect(mockFetch).toHaveBeenCalledWith(
      searchUrl,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      }),
    );
    expect(data).toEqual(mockResults);
  });

  test('creates new group', async () => {
    const groupData = {
      name: 'Study Group 1',
      description: 'Terms for studying',
    };

    const mockResponse = {
      id: 'group-1',
      name: 'Study Group 1',
      description: 'Terms for studying',
      termCount: 0,
      createdAt: '2025-01-01T00:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const response = await fetch(API_ENDPOINTS.createGroup, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify(groupData),
    });

    const data = (await response.json()) as typeof mockResponse;

    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.createGroup,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        }),
        body: JSON.stringify(groupData),
      }),
    );
    expect(data).toEqual(mockResponse);
  });

  test('fetches user groups', async () => {
    const mockGroups = [
      {
        id: 'group-1',
        name: 'Study Group 1',
        description: 'Terms for studying',
        termCount: 5,
        createdAt: '2025-01-01T00:00:00Z',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGroups),
    });

    const response = await fetch(API_ENDPOINTS.getUserGroups, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });

    const data = (await response.json()) as typeof mockGroups;

    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.getUserGroups,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      }),
    );
    expect(data).toEqual(mockGroups);
  });

  test('adds terms to group', async () => {
    const groupId = 'group-1';
    const termsData = {
      termIds: ['term-1', 'term-2'],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ message: 'Terms added to group successfully' }),
    });

    const response = await fetch(API_ENDPOINTS.addTermsToGroup(groupId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify(termsData),
    });

    const data = (await response.json()) as { message: string };

    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.addTermsToGroup(groupId),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        }),
        body: JSON.stringify(termsData),
      }),
    );
    expect(data.message).toBe('Terms added to group successfully');
  });

  test('removes term from group', async () => {
    const groupId = 'group-1';
    const termId = 'term-1';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ message: 'Term removed from group successfully' }),
    });

    const response = await fetch(
      API_ENDPOINTS.removeTermFromGroup(groupId, termId),
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      },
    );

    const data = (await response.json()) as { message: string };

    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.removeTermFromGroup(groupId, termId),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      }),
    );
    expect(data.message).toBe('Term removed from group successfully');
  });

  test('deletes group', async () => {
    const groupId = 'group-1';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Group deleted successfully' }),
    });

    const response = await fetch(API_ENDPOINTS.deleteGroup(groupId), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });

    const data = (await response.json()) as { message: string };

    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.deleteGroup(groupId),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      }),
    );
    expect(data.message).toBe('Group deleted successfully');
  });

  test('bulk deletes groups', async () => {
    const groupIds = ['group-1', 'group-2'];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Groups deleted successfully' }),
    });

    const response = await fetch(API_ENDPOINTS.bulkDeleteGroups, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ groupIds }),
    });

    const data = (await response.json()) as { message: string };

    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.bulkDeleteGroups,
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        }),
        body: JSON.stringify({ groupIds }),
      }),
    );
    expect(data.message).toBe('Groups deleted successfully');
  });

  test('creates note', async () => {
    const noteData = {
      content: 'This is a study note',
      termId: 'term-1',
    };

    const mockResponse = {
      id: 'note-1',
      content: 'This is a study note',
      termId: 'term-1',
      createdAt: '2025-01-01T00:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const response = await fetch(API_ENDPOINTS.createNote, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockToken}`,
      },
      body: JSON.stringify(noteData),
    });

    const data = (await response.json()) as typeof mockResponse;

    expect(mockFetch).toHaveBeenCalledWith(
      API_ENDPOINTS.createNote,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        }),
        body: JSON.stringify(noteData),
      }),
    );
    expect(data).toEqual(mockResponse);
  });

  test('handles unauthorized access', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: 'Not authenticated' }),
    });

    const response = await fetch(API_ENDPOINTS.getBookmarks, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);

    const error = (await response.json()) as { detail: string };
    expect(error.detail).toBe('Not authenticated');
  });

  test('handles server errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    });

    const response = await fetch(API_ENDPOINTS.getBookmarks, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  test('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      fetch(API_ENDPOINTS.getBookmarks, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      }),
    ).rejects.toThrow('Network error');
  });
});
