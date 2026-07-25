import { describe, it, expect } from 'vitest';
import { detectSheetType, parseWorkbook } from '../../modules/migration/parse.js';
import { cleanRow, cleanRows } from '../../modules/migration/clean.js';
import { validateRow, validateRows } from '../../modules/migration/validate.js';

describe('Migration — parse', () => {
  describe('detectSheetType', () => {
    it('should detect oil-brand sheet by VISCOSIDAD header', () => {
      const headers = ['PRODUCTO', 'VISCOSIDAD', 'CAPACIDAD', 'PRECIO'];
      expect(detectSheetType(headers)).toBe('oil-brand');
    });

    it('should detect battery sheet by CCA + VOLTAJE headers', () => {
      const headers = ['PRODUCTO', 'CCA', 'VOLTAJE', 'DIMENSIONES'];
      expect(detectSheetType(headers)).toBe('battery');
    });

    it('should detect filter sheet by CODIGO CRUZ header', () => {
      const headers = ['PRODUCTO', 'CODIGO CRUZ', 'MARCA', 'PRECIO'];
      expect(detectSheetType(headers)).toBe('filter');
    });

    it('should default to general for unrecognized headers', () => {
      const headers = ['PRODUCTO', 'PRECIO', 'MARCA'];
      expect(detectSheetType(headers)).toBe('general');
    });
  });
});

describe('Migration — clean', () => {
  describe('cleanRow', () => {
    it('should strip whitespace from string values', () => {
      const row = { name: '  Castrol GTX  ', viscosity: '  20W-50  ' };
      const cleaned = cleanRow(row);
      expect(cleaned).not.toBeNull();
      expect(cleaned!.name).toBe('Castrol GTX');
      expect(cleaned!.viscosity).toBe('20W-50');
    });

    it('should normalize comma decimal separators to dots', () => {
      const row = { name: 'Product', price: '1.234,56', capacity: '1,5L' };
      const cleaned = cleanRow(row);
      expect(cleaned).not.toBeNull();
      expect(cleaned!.price).toBe('1234.56');
      expect(cleaned!.capacity).toBe('1.5L');
    });

    it('should skip rows with #REF! errors', () => {
      const row = { name: '#REF!', price: '100' };
      const cleaned = cleanRow(row);
      expect(cleaned).toBeNull();
    });

    it('should skip rows with empty name', () => {
      const row = { name: '   ', price: '100' };
      const cleaned = cleanRow(row);
      expect(cleaned).toBeNull();
    });

    it('should handle empty string values gracefully', () => {
      const row = { name: 'Product', price: '', viscosity: '' };
      const cleaned = cleanRow(row);
      expect(cleaned).not.toBeNull();
      expect(cleaned!.name).toBe('Product');
      expect(cleaned!.price).toBe('');
      expect(cleaned!.viscosity).toBe('');
    });
  });

  describe('cleanRows', () => {
    it('should filter out invalid rows and clean valid ones', () => {
      const rows = [
        { name: 'Product A', price: '100' },
        { name: '#REF!', price: '200' },
        { name: '  Product B  ', price: '1.234,56' },
        { name: '', price: '300' },
      ];
      const result = cleanRows(rows);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Product A');
      expect(result[1].name).toBe('Product B');
      expect(result[1].price).toBe('1234.56');
    });
  });
});

describe('Migration — validate', () => {
  describe('validateRow', () => {
    it('should validate a valid oil-brand row', () => {
      const row = {
        name: 'Castrol GTX 20W-50',
        viscosity: '20W-50',
        capacity: '1L',
        price: '150.00',
      };
      const result = validateRow(row, 'oil-brand', 1);
      expect(result.success).toBe(true);
    });

    it('should reject row with missing name', () => {
      const row = {
        name: '',
        viscosity: '20W-50',
        price: '100',
      };
      const result = validateRow(row, 'oil-brand', 1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some((e) => e.field === 'name')).toBe(true);
      }
    });

    it('should validate a valid battery row', () => {
      const row = {
        name: 'Battery 12V 65Ah',
        cca: '600',
        voltage: '12',
        ah: '65',
        price: '500.00',
      };
      const result = validateRow(row, 'battery', 1);
      expect(result.success).toBe(true);
    });

    it('should validate a valid filter row', () => {
      const row = {
        name: 'Oil Filter PH8A',
        crossBrand: 'Fram',
        crossCode: 'PH8A',
        price: '50.00',
      };
      const result = validateRow(row, 'filter', 1);
      expect(result.success).toBe(true);
    });

    it('should validate a valid general row', () => {
      const row = {
        name: 'General Product',
        price: '100.00',
      };
      const result = validateRow(row, 'general', 1);
      expect(result.success).toBe(true);
    });
  });

  describe('validateRows', () => {
    it('should collect errors per row without failing on first error', () => {
      const rows = [
        { name: 'Valid Product', price: '100' },
        { name: '', price: '200' }, // invalid — empty name
        { name: 'Another Valid', price: '300' },
      ];
      const result = validateRows(rows, 'general');
      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(2); // second row (1-indexed)
    });

    it('should return all valid when no errors', () => {
      const rows = [
        { name: 'Product A', price: '100' },
        { name: 'Product B', price: '200' },
      ];
      const result = validateRows(rows, 'general');
      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });
  });
});
