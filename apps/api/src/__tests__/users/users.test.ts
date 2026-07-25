import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../helpers/app-factory.js';
import { cleanAllTables } from '../helpers/db-helpers.js';
import { createTestUser, createAdminUser, authHeader } from '../helpers/auth-helpers.js';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

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

describe('GET /api/users', () => {
  it('should return user list for admin', async () => {
    const { token } = await createAdminUser();
    // Create another user
    await createTestUser({ username: 'employee1' });

    const response = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.length).toBe(2);
    // Should not expose password hashes
    for (const user of body.data) {
      expect(user.passwordHash).toBeUndefined();
      expect(user.username).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.role).toBeDefined();
    }
  });

  it('should return 403 for non-admin users', async () => {
    const { token } = await createTestUser({ role: 'employee' });

    const response = await app.inject({
      method: 'GET',
      url: '/api/users',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users',
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('POST /api/users', () => {
  it('should create a user and return 201', async () => {
    const { token } = await createAdminUser();

    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: authHeader(token),
      payload: {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'secure-password-123',
        role: 'employee',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.username).toBe('newuser');
    expect(body.email).toBe('newuser@example.com');
    expect(body.role).toBe('employee');
    expect(body.isActive).toBe(true);
    // Password hash should NOT be in response
    expect(body.passwordHash).toBeUndefined();
  });

  it('should hash the password before storing', async () => {
    const { token } = await createAdminUser();
    const plainPassword = 'my-secure-password';

    await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: authHeader(token),
      payload: {
        username: 'hashtest',
        email: 'hashtest@example.com',
        password: plainPassword,
        role: 'employee',
      },
    });

    // Check DB — password_hash should NOT be the plain password
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'hashtest'));
    expect(dbUser.passwordHash).not.toBe(plainPassword);
    expect(dbUser.passwordHash.length).toBeGreaterThan(20); // bcrypt hash is long
  });

  it('should return 409 for duplicate username', async () => {
    const { token } = await createAdminUser();
    await createTestUser({ username: 'duplicate' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: authHeader(token),
      payload: {
        username: 'duplicate',
        email: 'different@example.com',
        password: 'secure-password-123',
        role: 'employee',
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it('should return 409 for duplicate email', async () => {
    const { token } = await createAdminUser();
    await createTestUser({ email: 'taken@example.com' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: authHeader(token),
      payload: {
        username: 'newuser2',
        email: 'taken@example.com',
        password: 'secure-password-123',
        role: 'employee',
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it('should return 400 for short password', async () => {
    const { token } = await createAdminUser();

    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: authHeader(token),
      payload: {
        username: 'shortpass',
        email: 'short@example.com',
        password: '123', // too short
        role: 'employee',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 403 for non-admin users', async () => {
    const { token } = await createTestUser({ role: 'employee' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: authHeader(token),
      payload: {
        username: 'forbidden',
        email: 'forbidden@example.com',
        password: 'secure-password-123',
      },
    });

    expect(response.statusCode).toBe(403);
  });
});

describe('PUT /api/users/:id', () => {
  it('should update a user (admin only)', async () => {
    const { token } = await createAdminUser();
    const { user: target } = await createTestUser({ username: 'toupdate' });

    const response = await app.inject({
      method: 'PUT',
      url: `/api/users/${target.id}`,
      headers: authHeader(token),
      payload: {
        role: 'admin',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.role).toBe('admin');
  });

  it('should return 404 for non-existent user', async () => {
    const { token } = await createAdminUser();

    const response = await app.inject({
      method: 'PUT',
      url: '/api/users/00000000-0000-0000-0000-000000000000',
      headers: authHeader(token),
      payload: { role: 'admin' },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /api/users/:id (deactivate)', () => {
  it('should deactivate a user (set isActive=false)', async () => {
    const { token } = await createAdminUser();
    const { user: target } = await createTestUser({ username: 'todeactivate' });

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/users/${target.id}`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.isActive).toBe(false);
  });

  it('should return 403 for non-admin users', async () => {
    const { token } = await createTestUser({ role: 'employee' });
    const { user: target } = await createTestUser({ username: 'target' });

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/users/${target.id}`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(403);
  });
});
