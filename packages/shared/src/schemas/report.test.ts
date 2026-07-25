import { describe, it, expect } from 'vitest';
import {
  movementReportFilterSchema,
  valuationFilterSchema,
  valuationSummary,
} from './report.js';

describe('movementReportFilterSchema', () => {
  it('accepts empty filter with defaults', () => {
    const result = movementReportFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.groupBy).toBe('day');
    }
  });

  it('accepts date range filter', () => {
    const result = movementReportFilterSchema.safeParse({
      from: '2024-01-01',
      to: '2024-12-31',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from).toBeInstanceOf(Date);
    }
  });

  it('accepts all groupBy values', () => {
    for (const groupBy of ['day', 'week', 'month']) {
      const result = movementReportFilterSchema.safeParse({ groupBy });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid groupBy', () => {
    const result = movementReportFilterSchema.safeParse({ groupBy: 'year' });
    expect(result.success).toBe(false);
  });
});

describe('valuationFilterSchema', () => {
  it('accepts empty filter', () => {
    const result = valuationFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts brandId filter', () => {
    const result = valuationFilterSchema.safeParse({
      brandId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });
});

describe('valuationSummary', () => {
  it('accepts valid valuation summary', () => {
    const result = valuationSummary.safeParse({
      brands: [
        {
          brandId: '550e8400-e29b-41d4-a716-446655440000',
          brandName: 'Castrol',
          totalProducts: 10,
          totalStock: 500,
          totalValue: 75000,
        },
      ],
      grandTotal: 75000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.brands).toHaveLength(1);
      expect(result.data.grandTotal).toBe(75000);
    }
  });

  it('accepts empty brands array', () => {
    const result = valuationSummary.safeParse({
      brands: [],
      grandTotal: 0,
    });
    expect(result.success).toBe(true);
  });
});
