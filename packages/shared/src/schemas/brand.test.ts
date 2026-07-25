import { describe, it, expect } from 'vitest';
import { brandSchema, createBrandInput, updateBrandInput } from './brand.js';

describe('brandSchema', () => {
  it('accepts valid brand with name only', () => {
    const result = brandSchema.safeParse({ name: 'Castrol' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Castrol');
    }
  });

  it('accepts valid brand with name and notes', () => {
    const result = brandSchema.safeParse({
      name: 'Mobil',
      notes: 'Premium brand',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('Premium brand');
    }
  });

  it('rejects missing name', () => {
    const result = brandSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = brandSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 100 characters', () => {
    const result = brandSchema.safeParse({ name: 'x'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('accepts name at exactly 100 characters', () => {
    const result = brandSchema.safeParse({ name: 'x'.repeat(100) });
    expect(result.success).toBe(true);
  });

  it('rejects non-string name', () => {
    const result = brandSchema.safeParse({ name: 123 });
    expect(result.success).toBe(false);
  });
});

describe('createBrandInput', () => {
  it('is equivalent to brandSchema', () => {
    const data = { name: 'Valvoline', notes: 'Synthetic oils' };
    const r1 = brandSchema.safeParse(data);
    const r2 = createBrandInput.safeParse(data);
    expect(r1.success).toBe(r2.success);
  });
});

describe('updateBrandInput', () => {
  it('accepts partial data — name only', () => {
    const result = updateBrandInput.safeParse({ name: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('accepts partial data — notes only', () => {
    const result = updateBrandInput.safeParse({ notes: 'New notes' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateBrandInput.safeParse({});
    expect(result.success).toBe(true);
  });
});
