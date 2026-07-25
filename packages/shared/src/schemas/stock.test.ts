import { describe, it, expect } from 'vitest';
import {
  stockMovementSchema,
  createMovementInput,
  movementFilterSchema,
} from './stock.js';

const validMovement = {
  productId: '550e8400-e29b-41d4-a716-446655440000',
  movementType: 'entry' as const,
  quantity: 10,
  userId: '550e8400-e29b-41d4-a716-446655440001',
};

describe('stockMovementSchema', () => {
  it('accepts valid entry movement', () => {
    const result = stockMovementSchema.safeParse(validMovement);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(10);
      expect(result.data.movementType).toBe('entry');
    }
  });

  it('accepts valid exit movement', () => {
    const result = stockMovementSchema.safeParse({
      ...validMovement,
      movementType: 'exit',
      quantity: -5,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid adjustment movement', () => {
    const result = stockMovementSchema.safeParse({
      ...validMovement,
      movementType: 'adjustment',
      quantity: 3,
    });
    expect(result.success).toBe(true);
  });

  it('accepts movement with unitPrice', () => {
    const result = stockMovementSchema.safeParse({
      ...validMovement,
      unitPrice: 150.5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unitPrice).toBe(150.5);
    }
  });

  it('accepts movement with reference and notes', () => {
    const result = stockMovementSchema.safeParse({
      ...validMovement,
      reference: 'PO-2024-001',
      notes: 'Regular restock',
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero quantity', () => {
    const result = stockMovementSchema.safeParse({
      ...validMovement,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing productId', () => {
    const { productId, ...rest } = validMovement;
    const result = stockMovementSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects missing userId', () => {
    const { userId, ...rest } = validMovement;
    const result = stockMovementSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects invalid movementType', () => {
    const result = stockMovementSchema.safeParse({
      ...validMovement,
      movementType: 'transfer',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer quantity', () => {
    const result = stockMovementSchema.safeParse({
      ...validMovement,
      quantity: 5.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for productId', () => {
    const result = stockMovementSchema.safeParse({
      ...validMovement,
      productId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('createMovementInput', () => {
  it('does not require productId or userId', () => {
    const result = createMovementInput.safeParse({
      movementType: 'entry',
      quantity: 10,
    });
    expect(result.success).toBe(true);
  });
});

describe('movementFilterSchema', () => {
  it('accepts empty filter with defaults', () => {
    const result = movementFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('accepts filter with date range', () => {
    const result = movementFilterSchema.safeParse({
      from: '2024-01-01',
      to: '2024-12-31',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from).toBeInstanceOf(Date);
      expect(result.data.to).toBeInstanceOf(Date);
    }
  });

  it('accepts filter with movementType', () => {
    const result = movementFilterSchema.safeParse({
      movementType: 'entry',
    });
    expect(result.success).toBe(true);
  });
});
