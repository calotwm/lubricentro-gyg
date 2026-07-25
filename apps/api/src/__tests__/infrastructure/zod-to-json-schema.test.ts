import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToJsonSchema } from '../../lib/zod-to-json-schema.js';

describe('zodToJsonSchema', () => {
  it('should convert a string schema', () => {
    const schema = z.string();
    expect(zodToJsonSchema(schema)).toEqual({ type: 'string' });
  });

  it('should convert a string with min/max length', () => {
    const schema = z.string().min(3).max(50);
    expect(zodToJsonSchema(schema)).toEqual({
      type: 'string',
      minLength: 3,
      maxLength: 50,
    });
  });

  it('should convert a string with email format', () => {
    const schema = z.string().email();
    expect(zodToJsonSchema(schema)).toEqual({ type: 'string', format: 'email' });
  });

  it('should convert a number schema', () => {
    const schema = z.number();
    expect(zodToJsonSchema(schema)).toEqual({ type: 'number' });
  });

  it('should convert a number with min/max', () => {
    const schema = z.number().min(0).max(100);
    expect(zodToJsonSchema(schema)).toEqual({
      type: 'number',
      minimum: 0,
      maximum: 100,
    });
  });

  it('should convert an integer schema', () => {
    const schema = z.number().int();
    expect(zodToJsonSchema(schema)).toEqual({ type: 'integer' });
  });

  it('should convert a boolean schema', () => {
    const schema = z.boolean();
    expect(zodToJsonSchema(schema)).toEqual({ type: 'boolean' });
  });

  it('should convert an enum schema', () => {
    const schema = z.enum(['admin', 'employee']);
    expect(zodToJsonSchema(schema)).toEqual({
      type: 'string',
      enum: ['admin', 'employee'],
    });
  });

  it('should convert an array schema', () => {
    const schema = z.array(z.string());
    expect(zodToJsonSchema(schema)).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  it('should convert an object schema with required and optional fields', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().optional(),
      email: z.string(),
    });
    const result = zodToJsonSchema(schema);
    expect(result.type).toBe('object');
    expect(result.properties).toEqual({
      name: { type: 'string' },
      age: { type: 'number' },
      email: { type: 'string' },
    });
    expect(result.required).toEqual(['name', 'email']);
  });

  it('should convert a nested object schema', () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
      }),
    });
    const result = zodToJsonSchema(schema);
    expect(result).toEqual({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      required: ['user'],
    });
  });

  it('should handle nullable types', () => {
    const schema = z.string().nullable();
    expect(zodToJsonSchema(schema)).toEqual({ type: 'string', nullable: true });
  });

  it('should handle default values by unwrapping to inner type', () => {
    const schema = z.string().default('hello');
    expect(zodToJsonSchema(schema)).toEqual({ type: 'string' });
  });

  it('should convert a realistic login schema', () => {
    const loginSchema = z.object({
      username: z.string().min(3).max(50),
      password: z.string().min(8),
    });
    const result = zodToJsonSchema(loginSchema);
    expect(result).toEqual({
      type: 'object',
      properties: {
        username: { type: 'string', minLength: 3, maxLength: 50 },
        password: { type: 'string', minLength: 8 },
      },
      required: ['username', 'password'],
    });
  });
});
