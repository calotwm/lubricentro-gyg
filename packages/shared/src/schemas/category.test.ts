import { describe, it, expect } from 'vitest';
import { categorySchema, CATEGORY_NAMES } from './category';

describe('categorySchema', () => {
  it('accepts valid category: motor-oil', () => {
    const result = categorySchema.safeParse({ name: 'motor-oil' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('motor-oil');
    }
  });

  it('accepts all valid category names', () => {
    for (const name of CATEGORY_NAMES) {
      const result = categorySchema.safeParse({ name });
      expect(result.success).toBe(true);
    }
  });

  it('accepts category with config', () => {
    const result = categorySchema.safeParse({
      name: 'motor-oil',
      config: { fields: ['viscosity', 'api_grade'], stockTracked: true },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.config?.fields).toEqual(['viscosity', 'api_grade']);
      expect(result.data.config?.stockTracked).toBe(true);
    }
  });

  it('rejects invalid category name', () => {
    const result = categorySchema.safeParse({ name: 'invalid-name' });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const result = categorySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects config with invalid fields type', () => {
    const result = categorySchema.safeParse({
      name: 'general',
      config: { fields: 'not-an-array' },
    });
    expect(result.success).toBe(false);
  });
});
