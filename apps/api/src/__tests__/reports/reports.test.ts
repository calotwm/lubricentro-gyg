import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../helpers/app-factory.js';
import { cleanAllTables, insertBrand, insertProduct } from '../helpers/db-helpers.js';
import { createTestUser, authHeader } from '../helpers/auth-helpers.js';
import { db } from '../../db/index.js';
import { stockMovements, products, productPrices } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await cleanAllTables();
});

describe('GET /api/reports/movements', () => {
  it('should return movement aggregation by date range', async () => {
    const { token, user } = await createTestUser();
    const brand = await insertBrand({ name: 'Castrol' });
    const product = await insertProduct({
      name: 'Castrol GTX',
      brandId: brand.id,
      currentStock: 20,
    });

    // Insert movements at different dates
    const nowMs = Date.now();
    const yesterday = new Date(nowMs - 86400000).toISOString();
    const now = new Date(nowMs).toISOString();

    const pgClient = (await import('../../db/index.js')).pgClient;
    await pgClient`
      INSERT INTO stock_movements (product_id, movement_type, quantity, unit_price, user_id, created_at)
      VALUES (${product.id}, 'entry', 10, '100.00', ${user.id}, ${yesterday}::timestamptz),
             (${product.id}, 'exit', -3, '150.00', ${user.id}, ${now}::timestamptz)
    `;

    const from = new Date(nowMs - 7 * 86400000).toISOString();
    const to = new Date(nowMs + 86400000).toISOString();

    const response = await app.inject({
      method: 'GET',
      url: `/api/reports/movements?from=${from}&to=${to}`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toBeDefined();
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('should filter movements by productId', async () => {
    const { token, user } = await createTestUser();
    const product1 = await insertProduct({ name: 'Product A' });
    const product2 = await insertProduct({ name: 'Product B' });

    const pgClient = (await import('../../db/index.js')).pgClient;
    await pgClient`
      INSERT INTO stock_movements (product_id, movement_type, quantity, user_id)
      VALUES (${product1.id}, 'entry', 10, ${user.id}),
             (${product2.id}, 'entry', 5, ${user.id})
    `;

    const response = await app.inject({
      method: 'GET',
      url: `/api/reports/movements?productId=${product1.id}`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].productName).toBe('Product A');
  });

  it('should return empty data when no movements match', async () => {
    const { token } = await createTestUser();

    const response = await app.inject({
      method: 'GET',
      url: '/api/reports/movements',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toEqual([]);
  });
});

describe('GET /api/reports/valuation', () => {
  it('should calculate stock valuation per brand and grand total', async () => {
    const { token } = await createTestUser();
    const brand1 = await insertBrand({ name: 'Castrol' });
    const brand2 = await insertBrand({ name: 'Mobil' });

    const product1 = await insertProduct({
      name: 'Castrol GTX',
      brandId: brand1.id,
      currentStock: 10,
    });
    const product2 = await insertProduct({
      name: 'Mobil Super',
      brandId: brand2.id,
      currentStock: 5,
    });

    // Set cost prices (use ISO strings to avoid postgres Date serialization issue)
    const pgClient = (await import('../../db/index.js')).pgClient;
    await pgClient`
      INSERT INTO product_prices (product_id, price_type, price, effective_from)
      VALUES (${product1.id}, 'cost', '100.00', ${new Date().toISOString()}::timestamptz),
             (${product2.id}, 'cost', '200.00', ${new Date().toISOString()}::timestamptz)
    `;

    const response = await app.inject({
      method: 'GET',
      url: '/api/reports/valuation',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.brands).toBeDefined();
    expect(body.grandTotal).toBeDefined();

    // Castrol: 10 × 100 = 1000
    // Mobil: 5 × 200 = 1000
    // Grand total: 2000
    expect(body.grandTotal).toBe(2000);

    const castrolBrand = body.brands.find((b: any) => b.brandName === 'Castrol');
    expect(castrolBrand).toBeDefined();
    expect(castrolBrand.totalValue).toBe(1000);
    expect(castrolBrand.totalStock).toBe(10);
  });

  it('should handle products without cost price (value = 0)', async () => {
    const { token } = await createTestUser();
    const brand = await insertBrand({ name: 'NoPrice' });
    await insertProduct({
      name: 'No Cost Product',
      brandId: brand.id,
      currentStock: 10,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/reports/valuation',
      headers: authHeader(token),
    });

    if (response.statusCode !== 200) {
      console.log('NoCostPrice response:', response.statusCode, response.body);
    }
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.grandTotal).toBe(0);
  });
});

describe('GET /api/reports/low-stock', () => {
  it('should return products where currentStock <= minStockThreshold', async () => {
    const { token } = await createTestUser();
    await insertProduct({
      name: 'Low Stock Item',
      currentStock: 3,
      minStockThreshold: 5,
    });
    await insertProduct({
      name: 'OK Stock Item',
      currentStock: 50,
      minStockThreshold: 10,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/reports/low-stock',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Low Stock Item');
    expect(body.data[0].currentStock).toBe(3);
    expect(body.data[0].minStockThreshold).toBe(5);
  });

  it('should return empty when no products are low stock', async () => {
    const { token } = await createTestUser();
    await insertProduct({
      name: 'Well Stocked',
      currentStock: 100,
      minStockThreshold: 5,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/reports/low-stock',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(0);
  });

  it('should include brand and category info', async () => {
    const { token } = await createTestUser();
    const brand = await insertBrand({ name: 'TestBrand' });
    await insertProduct({
      name: 'Low Item',
      brandId: brand.id,
      currentStock: 2,
      minStockThreshold: 10,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/reports/low-stock',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data[0].brandName).toBe('TestBrand');
  });
});
