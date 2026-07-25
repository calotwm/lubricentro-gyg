import { describe, it, expect } from 'vitest';
import { brands } from './brands.js';
import { categories } from './categories.js';
import { products, productsRelations } from './products.js';
import { productPrices, productPricesRelations } from './product_prices.js';
import { stockMovements, stockMovementsRelations } from './stock_movements.js';
import { suppliers } from './suppliers.js';
import {
  productSuppliers,
  productSuppliersRelations,
} from './product_suppliers.js';
import { users, usersRelations } from './users.js';

// Drizzle internal symbols
const NameSymbol = Symbol.for('drizzle:Name');
const ColumnsSymbol = Symbol.for('drizzle:Columns');

function getTableName(table: any): string {
  return table[NameSymbol];
}

function getDbColumnNames(table: any): string[] {
  const cols = table[ColumnsSymbol] ?? {};
  return Object.values(cols).map((col: any) => col.name);
}

describe('brands table', () => {
  it('has correct table name', () => {
    expect(getTableName(brands)).toBe('brands');
  });

  it('has expected DB columns', () => {
    const cols = getDbColumnNames(brands);
    expect(cols).toContain('id');
    expect(cols).toContain('name');
    expect(cols).toContain('notes');
  });

  it('has exactly 3 columns', () => {
    expect(getDbColumnNames(brands)).toHaveLength(3);
  });
});

describe('categories table', () => {
  it('has correct table name', () => {
    expect(getTableName(categories)).toBe('categories');
  });

  it('has expected DB columns', () => {
    const cols = getDbColumnNames(categories);
    expect(cols).toContain('id');
    expect(cols).toContain('name');
    expect(cols).toContain('config');
  });
});

describe('products table', () => {
  it('has correct table name', () => {
    expect(getTableName(products)).toBe('products');
  });

  it('has all required DB columns', () => {
    const cols = getDbColumnNames(products);
    const expected = [
      'id',
      'brand_id',
      'category_id',
      'code',
      'name',
      'description',
      'capacity',
      'unit',
      'product_type',
      'viscosity',
      'cross_refs',
      'specifications',
      'extras',
      'is_active',
      'current_stock',
      'min_stock_threshold',
      'created_at',
      'updated_at',
    ];
    for (const col of expected) {
      expect(cols).toContain(col);
    }
  });

  it('has 18 columns total', () => {
    expect(getDbColumnNames(products)).toHaveLength(18);
  });

  it('has relations defined', () => {
    expect(productsRelations).toBeDefined();
    expect(productsRelations).toBeTruthy();
  });
});

describe('product_prices table', () => {
  it('has correct table name', () => {
    expect(getTableName(productPrices)).toBe('product_prices');
  });

  it('has all required DB columns', () => {
    const cols = getDbColumnNames(productPrices);
    const expected = [
      'id',
      'product_id',
      'price_type',
      'price',
      'discount_pct',
      'effective_from',
      'effective_to',
      'notes',
    ];
    for (const col of expected) {
      expect(cols).toContain(col);
    }
  });

  it('has relations defined', () => {
    expect(productPricesRelations).toBeDefined();
  });
});

describe('stock_movements table', () => {
  it('has correct table name', () => {
    expect(getTableName(stockMovements)).toBe('stock_movements');
  });

  it('has all required DB columns', () => {
    const cols = getDbColumnNames(stockMovements);
    const expected = [
      'id',
      'product_id',
      'movement_type',
      'quantity',
      'unit_price',
      'reference',
      'notes',
      'user_id',
      'created_at',
    ];
    for (const col of expected) {
      expect(cols).toContain(col);
    }
  });

  it('has relations defined', () => {
    expect(stockMovementsRelations).toBeDefined();
  });
});

describe('suppliers table', () => {
  it('has correct table name', () => {
    expect(getTableName(suppliers)).toBe('suppliers');
  });

  it('has expected DB columns', () => {
    const cols = getDbColumnNames(suppliers);
    expect(cols).toContain('id');
    expect(cols).toContain('name');
    expect(cols).toContain('contact');
    expect(cols).toContain('phone');
    expect(cols).toContain('email');
    expect(cols).toContain('notes');
  });
});

describe('product_suppliers table', () => {
  it('has correct table name', () => {
    expect(getTableName(productSuppliers)).toBe('product_suppliers');
  });

  it('has all required DB columns', () => {
    const cols = getDbColumnNames(productSuppliers);
    const expected = [
      'id',
      'product_id',
      'supplier_id',
      'supplier_code',
      'is_primary',
      'notes',
    ];
    for (const col of expected) {
      expect(cols).toContain(col);
    }
  });

  it('has relations defined', () => {
    expect(productSuppliersRelations).toBeDefined();
  });
});

describe('users table', () => {
  it('has correct table name', () => {
    expect(getTableName(users)).toBe('users');
  });

  it('has all required DB columns', () => {
    const cols = getDbColumnNames(users);
    const expected = [
      'id',
      'username',
      'email',
      'password_hash',
      'role',
      'is_active',
      'created_at',
    ];
    for (const col of expected) {
      expect(cols).toContain(col);
    }
  });

  it('has relations defined', () => {
    expect(usersRelations).toBeDefined();
  });
});
