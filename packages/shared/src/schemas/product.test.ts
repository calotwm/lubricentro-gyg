import { describe, it, expect } from 'vitest';
import {
  baseProductSchema,
  createProductInput,
  updateProductInput,
  productFilterSchema,
  crossRefSchema,
  specificationsSchema,
} from './product';

const validOilProduct = {
  brandId: '550e8400-e29b-41d4-a716-446655440000',
  categoryId: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Castrol GTX 20W-50',
  productType: 'motor-oil' as const,
  viscosity: '20W-50',
  capacity: '1L',
};

const validFilterProduct = {
  brandId: '550e8400-e29b-41d4-a716-446655440000',
  categoryId: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Fram PH8A',
  productType: 'filter' as const,
  crossRefs: [{ brand: 'Fram', code: 'PH8A' }],
};

const validBatteryProduct = {
  brandId: '550e8400-e29b-41d4-a716-446655440000',
  categoryId: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Bosch S4 60Ah',
  productType: 'battery' as const,
  specifications: { cca: 540, voltage: 12, ah: 60 },
};

describe('baseProductSchema', () => {
  it('accepts valid motor oil product', () => {
    const result = baseProductSchema.safeParse(validOilProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.viscosity).toBe('20W-50');
      expect(result.data.isActive).toBe(true);
      expect(result.data.currentStock).toBe(0);
    }
  });

  it('accepts valid filter product with cross-refs', () => {
    const result = baseProductSchema.safeParse(validFilterProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.crossRefs).toHaveLength(1);
      expect(result.data.crossRefs![0].brand).toBe('Fram');
    }
  });

  it('accepts valid battery product with specifications', () => {
    const result = baseProductSchema.safeParse(validBatteryProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.specifications?.cca).toBe(540);
    }
  });

  it('rejects missing name', () => {
    const { name, ...rest } = validOilProduct;
    const result = baseProductSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects missing brandId', () => {
    const { brandId, ...rest } = validOilProduct;
    const result = baseProductSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for brandId', () => {
    const result = baseProductSchema.safeParse({
      ...validOilProduct,
      brandId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative currentStock', () => {
    const result = baseProductSchema.safeParse({
      ...validOilProduct,
      currentStock: -5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 200 characters', () => {
    const result = baseProductSchema.safeParse({
      ...validOilProduct,
      name: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid productType', () => {
    const result = baseProductSchema.safeParse({
      ...validOilProduct,
      productType: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('defaults unit to "unit"', () => {
    const result = baseProductSchema.safeParse(validOilProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit).toBe('unit');
    }
  });

  it('defaults minStockThreshold to 0', () => {
    const result = baseProductSchema.safeParse(validOilProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minStockThreshold).toBe(0);
    }
  });
});

describe('crossRefSchema', () => {
  it('accepts valid cross-ref', () => {
    const result = crossRefSchema.safeParse({ brand: 'Fram', code: 'PH8A' });
    expect(result.success).toBe(true);
  });

  it('rejects empty brand', () => {
    const result = crossRefSchema.safeParse({ brand: '', code: 'PH8A' });
    expect(result.success).toBe(false);
  });

  it('rejects missing code', () => {
    const result = crossRefSchema.safeParse({ brand: 'Fram' });
    expect(result.success).toBe(false);
  });
});

describe('specificationsSchema', () => {
  it('accepts valid battery specs', () => {
    const result = specificationsSchema.safeParse({
      cca: 600,
      voltage: 12,
      ah: 65,
    });
    expect(result.success).toBe(true);
  });

  it('accepts specs with optional dimensions', () => {
    const result = specificationsSchema.safeParse({
      cca: 600,
      voltage: 12,
      ah: 65,
      dimensions: '242x175x190',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative cca', () => {
    const result = specificationsSchema.safeParse({
      cca: -1,
      voltage: 12,
      ah: 65,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing voltage', () => {
    const result = specificationsSchema.safeParse({ cca: 600, ah: 65 });
    expect(result.success).toBe(false);
  });
});

describe('updateProductInput', () => {
  it('accepts partial update — name only', () => {
    const result = updateProductInput.safeParse({ name: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateProductInput.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('productFilterSchema', () => {
  it('accepts empty filter with defaults', () => {
    const result = productFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('rejects limit above 100', () => {
    const result = productFilterSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects page below 1', () => {
    const result = productFilterSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});
