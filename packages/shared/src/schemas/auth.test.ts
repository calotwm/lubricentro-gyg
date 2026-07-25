import { describe, it, expect } from 'vitest';
import { loginSchema, tokenPayloadSchema } from './auth';

describe('loginSchema', () => {
  it('accepts valid login credentials', () => {
    const result = loginSchema.safeParse({
      username: 'admin',
      password: 'password123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe('admin');
    }
  });

  it('rejects missing username', () => {
    const result = loginSchema.safeParse({ password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ username: 'admin' });
    expect(result.success).toBe(false);
  });

  it('rejects empty username', () => {
    const result = loginSchema.safeParse({ username: '', password: 'pass' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ username: 'admin', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('tokenPayloadSchema', () => {
  it('accepts valid token payload', () => {
    const result = tokenPayloadSchema.safeParse({
      sub: '550e8400-e29b-41d4-a716-446655440000',
      role: 'admin',
      iat: 1700000000,
      exp: 1700028800,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('admin');
    }
  });

  it('rejects missing sub', () => {
    const result = tokenPayloadSchema.safeParse({
      role: 'admin',
      iat: 1700000000,
      exp: 1700028800,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for sub', () => {
    const result = tokenPayloadSchema.safeParse({
      sub: 'not-a-uuid',
      role: 'admin',
      iat: 1700000000,
      exp: 1700028800,
    });
    expect(result.success).toBe(false);
  });
});
