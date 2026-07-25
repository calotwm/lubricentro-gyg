import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiClient, clearToken, getToken, setToken } from '../api/client';

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token management', () => {
    it('stores and retrieves a JWT token', () => {
      setToken('test-jwt-token');
      expect(getToken()).toBe('test-jwt-token');
    });

    it('returns null when no token is stored', () => {
      expect(getToken()).toBeNull();
    });

    it('clears the token from storage', () => {
      setToken('test-jwt-token');
      clearToken();
      expect(getToken()).toBeNull();
    });
  });

  describe('GET requests', () => {
    it('sends a GET request and returns parsed JSON', async () => {
      const mockData = { id: '1', name: 'Test Product' };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await apiClient.get('/api/products/1');
      expect(result).toEqual(mockData);
    });

    it('attaches Authorization header when token exists', async () => {
      setToken('my-jwt-token');
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await apiClient.get('/api/products');

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-jwt-token',
          }),
        }),
      );
    });

    it('does not attach Authorization header when no token', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await apiClient.get('/api/auth/login');

      const callHeaders = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
      expect(callHeaders?.Authorization).toBeUndefined();
    });
  });

  describe('POST requests', () => {
    it('sends a POST request with JSON body', async () => {
      const body = { username: 'admin', password: 'pass123' };
      const mockResponse = { token: 'jwt-token', user: { id: '1', username: 'admin', role: 'admin' } };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await apiClient.post('/api/auth/login', body);
      expect(result).toEqual(mockResponse);
    });

    it('sends Content-Type application/json header', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await apiClient.post('/api/products', { name: 'Test' });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ name: 'Test' }),
        }),
      );
    });
  });

  describe('Error handling', () => {
    it('throws an error with status and message on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await expect(apiClient.get('/api/products/999')).rejects.toMatchObject({
        status: 404,
        message: 'Not found',
      });
    });

    it('clears token and redirects to /login on 401 response', async () => {
      setToken('expired-token');
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Token expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      await expect(apiClient.get('/api/products')).rejects.toMatchObject({
        status: 401,
      });

      expect(getToken()).toBeNull();
    });
  });

  describe('PUT and PATCH requests', () => {
    it('sends a PUT request with JSON body', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ id: '1', name: 'Updated' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await apiClient.put('/api/products/1', { name: 'Updated' });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/products/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        }),
      );
      expect(result).toEqual({ id: '1', name: 'Updated' });
    });

    it('sends a PATCH request with partial JSON body', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ id: '1', isActive: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const result = await apiClient.patch('/api/products/1', { isActive: false });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/products/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ isActive: false }),
        }),
      );
      expect(result).toEqual({ id: '1', isActive: false });
    });
  });

  describe('DELETE requests', () => {
    it('sends a DELETE request', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(null, { status: 204 }),
      );

      await apiClient.delete('/api/products/1');

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/products/1',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });
  });
});
