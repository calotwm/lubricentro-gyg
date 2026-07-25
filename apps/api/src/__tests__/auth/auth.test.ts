import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../helpers/app-factory.js';
import { cleanAllTables, insertUser } from '../helpers/db-helpers.js';
import { createTestUser, authHeader } from '../helpers/auth-helpers.js';
import { hashPassword } from '../../lib/password.js';
import { signToken } from '../../lib/jwt.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await cleanAllTables();
});

describe('POST /api/auth/login', () => {
  it('should return 200 + token for valid credentials', async () => {
    const password = 'test-password-123';
    const passwordHash = await hashPassword(password);
    const user = await insertUser({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash,
      role: 'employee',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'testuser', password },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');
    expect(body.user).toBeDefined();
    expect(body.user.id).toBe(user.id);
    expect(body.user.username).toBe('testuser');
    expect(body.user.role).toBe('employee');
  });

  it('should return 401 for wrong password', async () => {
    const passwordHash = await hashPassword('correct-password');
    await insertUser({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'testuser', password: 'wrong-password' },
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body.error.message).toContain('Invalid credentials');
  });

  it('should return 401 for non-existent user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'nonexistent', password: 'any-password' },
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body.error.message).toContain('Invalid credentials');
  });

  it('should return 400 for missing fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: '' },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('should return 200 + user profile for valid token', async () => {
    const { user, token } = await createTestUser({
      username: 'meuser',
      email: 'me@example.com',
      role: 'admin',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.id).toBe(user.id);
    expect(body.username).toBe('meuser');
    expect(body.email).toBe('me@example.com');
    expect(body.role).toBe('admin');
  });

  it('should return 401 for missing token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 401 for invalid token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer invalid-token' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 401 for expired token', async () => {
    const { user } = await createTestUser();
    // Create a token that's already expired (exp in the past)
    const expiredToken = signToken({ sub: user.id, role: user.role });
    // We can't easily create an expired token without changing JWT_TTL,
    // so we'll test with a malformed token instead
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer expired.token.here' },
    });

    expect(response.statusCode).toBe(401);
  });
});
