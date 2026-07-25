import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { type FastifyInstance } from 'fastify';

/**
 * Infrastructure tests: healthcheck with DB ping + rate limiting on auth endpoints.
 *
 * These tests verify:
 * 1. GET /api/health returns { status, db, timestamp } with DB connectivity check
 * 2. Rate limiting protects auth endpoints from brute-force attacks
 */

describe('Healthcheck endpoint', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    const { buildApp } = await import('../../app.js');
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return valid health response with status, db, and timestamp', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    // status must be either 'ok' (db connected) or 'degraded' (db unreachable)
    expect(['ok', 'degraded']).toContain(body.status);
    // db must be either 'connected' or 'disconnected'
    expect(['connected', 'disconnected']).toContain(body.db);
    // status and db must be consistent
    if (body.db === 'connected') {
      expect(body.status).toBe('ok');
    } else {
      expect(body.status).toBe('degraded');
    }
    // Timestamp must be a valid ISO string
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it('should return recent timestamp in health response', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    const body = response.json();
    // Timestamp must be recent (within last 5 seconds)
    const timestamp = new Date(body.timestamp);
    const now = new Date();
    expect(now.getTime() - timestamp.getTime()).toBeLessThan(5000);
  });
});

describe('Rate limiting on auth endpoints', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    const { buildApp } = await import('../../app.js');
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should allow initial login attempts within rate limit', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'test', password: 'test' },
    });

    // Should not be rate-limited on first attempt (may be 401 for bad credentials, but NOT 429)
    expect(response.statusCode).not.toBe(429);
  });

  it('should return 429 after exceeding rate limit on login', async () => {
    // Send many requests to trigger rate limit
    const responses = [];
    for (let i = 0; i < 20; i++) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { username: `attacker-${i}`, password: 'wrong-password' },
      });
      responses.push(response.statusCode);
    }

    // At least one response should be 429 (Too Many Requests)
    const hasRateLimit = responses.some((status) => status === 429);
    expect(hasRateLimit).toBe(true);
  });

  it('should include rate limit headers in response', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'test', password: 'test' },
    });

    // Rate limit headers should be present
    const headers = response.headers;
    const hasRateLimitHeader =
      headers['x-ratelimit-limit'] !== undefined ||
      headers['ratelimit-limit'] !== undefined;
    expect(hasRateLimitHeader).toBe(true);
  });
});
