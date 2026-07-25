import { describe, it, expect } from 'vitest';
import { productPriceSchema, createPriceInput } from './price';

const validPrice = {
  productId: '550e8400-e29b-41d4-a716-446655440000',
  priceType: 'list' as const,
  price: 150.5,
  effectiveFrom: '2024-01-01T00:00:00Z',
};

describe('productPriceSchema', () => {
  it('accepts valid price entry', () => {
    const result = productPriceSchema.safeParse(validPrice);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(150.5);
      expect(result.data.priceType).toBe('list');
    }
  });

  it('accepts price with discount percentage', () => {
    const result = productPriceSchema.safeParse({
      ...validPrice,
      discountPct: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discountPct).toBe(10);
    }
  });

  it('accepts price with effective_to date', () => {
    const result = productPriceSchema.safeParse({
      ...validPrice,
      effectiveTo: '2024-12-31T23:59:59Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all valid price types', () => {
    for (const priceType of ['list', 'cost', 'mechanic', 'card']) {
      const result = productPriceSchema.safeParse({ ...validPrice, priceType });
      expect(result.success).toBe(true);
    }
  });

  it('rejects zero price', () => {
    const result = productPriceSchema.safeParse({ ...validPrice, price: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = productPriceSchema.safeParse({ ...validPrice, price: -10 });
    expect(result.success).toBe(false);
  });

  it('rejects discount_pct above 100', () => {
    const result = productPriceSchema.safeParse({
      ...validPrice,
      discountPct: 101,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative discount_pct', () => {
    const result = productPriceSchema.safeParse({
      ...validPrice,
      discountPct: -5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing productId', () => {
    const { productId, ...rest } = validPrice;
    const result = productPriceSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects invalid priceType', () => {
    const result = productPriceSchema.safeParse({
      ...validPrice,
      priceType: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing effectiveFrom', () => {
    const { effectiveFrom, ...rest } = validPrice;
    const result = productPriceSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('coerces string date to Date object', () => {
    const result = productPriceSchema.safeParse(validPrice);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.effectiveFrom).toBeInstanceOf(Date);
    }
  });

  it('accepts discount_pct at boundary 0', () => {
    const result = productPriceSchema.safeParse({
      ...validPrice,
      discountPct: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts discount_pct at boundary 100', () => {
    const result = productPriceSchema.safeParse({
      ...validPrice,
      discountPct: 100,
    });
    expect(result.success).toBe(true);
  });
});

describe('createPriceInput', () => {
  it('does not require productId', () => {
    const result = createPriceInput.safeParse({
      priceType: 'list',
      price: 100,
      effectiveFrom: '2024-01-01',
    });
    expect(result.success).toBe(true);
  });
});
