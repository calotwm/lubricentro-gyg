import { signToken } from '../../lib/jwt.js';
import { hashPassword } from '../../lib/password.js';
import { insertUser } from './db-helpers.js';

export interface TestUser {
  id: string;
  username: string;
  email: string;
  role: string;
  password: string;
}

/**
 * Create a test user with a known password and return the user + token.
 */
export async function createTestUser(
  overrides: Partial<{ role: string; username: string; email: string }> = {},
): Promise<{ user: TestUser; token: string }> {
  const password = 'test-password-123';
  const passwordHash = await hashPassword(password);

  const userOverrides: Record<string, unknown> = {
    passwordHash,
    role: overrides.role ?? 'employee',
  };
  if (overrides.username !== undefined) userOverrides.username = overrides.username;
  if (overrides.email !== undefined) userOverrides.email = overrides.email;

  const dbUser = await insertUser(userOverrides as any);

  const token = signToken({ sub: dbUser.id, role: dbUser.role });

  return {
    user: {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role,
      password,
    },
    token,
  };
}

/**
 * Create an admin test user.
 */
export async function createAdminUser(): Promise<{ user: TestUser; token: string }> {
  return createTestUser({ role: 'admin' });
}

/**
 * Generate a valid auth header object for Fastify inject.
 */
export function authHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}
