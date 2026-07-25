import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema, userResponse } from './user';

describe('createUserSchema', () => {
  it('accepts valid user creation', () => {
    const result = createUserSchema.safeParse({
      username: 'admin_user',
      email: 'admin@lubricentro.com',
      password: 'securePass123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('employee');
    }
  });

  it('accepts admin role', () => {
    const result = createUserSchema.safeParse({
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('admin');
    }
  });

  it('rejects username shorter than 3 characters', () => {
    const result = createUserSchema.safeParse({
      username: 'ab',
      email: 'test@test.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = createUserSchema.safeParse({
      username: 'validuser',
      email: 'test@test.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = createUserSchema.safeParse({
      username: 'validuser',
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = createUserSchema.safeParse({
      username: 'validuser',
      email: 'test@test.com',
      password: 'password123',
      role: 'superadmin',
    });
    expect(result.success).toBe(false);
  });

  it('rejects username with special characters', () => {
    const result = createUserSchema.safeParse({
      username: 'user@name',
      email: 'test@test.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('accepts username with allowed special chars (underscore, hyphen, dot, comma)', () => {
    const result = createUserSchema.safeParse({
      username: 'user_name-test.v1,2',
      email: 'test@test.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects username exceeding 50 characters', () => {
    const result = createUserSchema.safeParse({
      username: 'a'.repeat(51),
      email: 'test@test.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('accepts partial update — isActive only', () => {
    const result = updateUserSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid email in update', () => {
    const result = updateUserSchema.safeParse({ email: 'not-valid' });
    expect(result.success).toBe(false);
  });
});

describe('userResponse', () => {
  it('accepts valid user response', () => {
    const result = userResponse.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      username: 'admin',
      email: 'admin@test.com',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing id', () => {
    const result = userResponse.safeParse({
      username: 'admin',
      email: 'admin@test.com',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
    });
    expect(result.success).toBe(false);
  });
});
