import { describe, it, expect } from 'vitest';
import {
  supplierSchema,
  productSupplierSchema,
} from './supplier';

describe('supplierSchema', () => {
  it('accepts valid supplier with name only', () => {
    const result = supplierSchema.safeParse({ name: 'AutoParts Inc.' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('AutoParts Inc.');
    }
  });

  it('accepts full supplier data', () => {
    const result = supplierSchema.safeParse({
      name: 'Distribuidora Norte',
      contact: 'Juan Perez',
      phone: '+54 11 4567-8900',
      email: 'contacto@norte.com',
      notes: 'Main distributor',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = supplierSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = supplierSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 150 characters', () => {
    const result = supplierSchema.safeParse({ name: 'x'.repeat(151) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email when provided', () => {
    const result = supplierSchema.safeParse({
      name: 'Test Supplier',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty string email (optional field)', () => {
    const result = supplierSchema.safeParse({
      name: 'Test Supplier',
      email: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('productSupplierSchema', () => {
  it('accepts valid product-supplier link', () => {
    const result = productSupplierSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      supplierId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPrimary).toBe(false);
    }
  });

  it('accepts primary supplier', () => {
    const result = productSupplierSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      supplierId: '550e8400-e29b-41d4-a716-446655440001',
      isPrimary: true,
      supplierCode: 'SUP-001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing productId', () => {
    const result = productSupplierSchema.safeParse({
      supplierId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID', () => {
    const result = productSupplierSchema.safeParse({
      productId: 'not-uuid',
      supplierId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(false);
  });
});
