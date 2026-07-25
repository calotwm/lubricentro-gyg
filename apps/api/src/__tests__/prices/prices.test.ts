import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../helpers/app-factory.js';
import { cleanAllTables, insertProduct, insertPrice } from '../helpers/db-helpers.js';
import { createTestUser, authHeader } from '../helpers/auth-helpers.js';
import { db } from '../../db/index.js';
import { productPrices } from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

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

describe('GET /api/products/:id/prices', () => {
  it('should return price history sorted by effective_from DESC', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct();

    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    await insertPrice({
      productId: product.id,
      priceType: 'list',
      price: '100.00',
      effectiveFrom: past,
      effectiveTo: now,
    });
    await insertPrice({
      productId: product.id,
      priceType: 'list',
      price: '120.00',
      effectiveFrom: now,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/products/${product.id}/prices`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.length).toBe(2);
    // Most recent first
    expect(parseFloat(body[0].price)).toBe(120);
    expect(parseFloat(body[1].price)).toBe(100);
  });

  it('should return empty array for product with no prices', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct();

    const response = await app.inject({
      method: 'GET',
      url: `/api/products/${product.id}/prices`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual([]);
  });

  it('should filter by price type', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct();

    await insertPrice({
      productId: product.id,
      priceType: 'list',
      price: '100.00',
      effectiveFrom: new Date(),
    });
    await insertPrice({
      productId: product.id,
      priceType: 'cost',
      price: '80.00',
      effectiveFrom: new Date(),
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/products/${product.id}/prices?priceType=list`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0].priceType).toBe('list');
  });
});

describe('POST /api/products/:id/prices', () => {
  it('should create a new price and return 201', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct();

    const response = await app.inject({
      method: 'POST',
      url: `/api/products/${product.id}/prices`,
      headers: authHeader(token),
      payload: {
        priceType: 'list',
        price: 150.0,
        effectiveFrom: new Date().toISOString(),
      },
    });

    if (response.statusCode !== 201) {
      console.log('Price create body:', response.statusCode, response.body);
    }
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toBeDefined();
    expect(body.productId).toBe(product.id);
    expect(parseFloat(body.price)).toBe(150);
    expect(body.priceType).toBe('list');
  });

  it('should set effective_to on previous active price of same type', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct();

    // Create initial price
    const initialPrice = await insertPrice({
      productId: product.id,
      priceType: 'list',
      price: '100.00',
      effectiveFrom: new Date(Date.now() - 86400000), // yesterday
      effectiveTo: null,
    });

    // Create new price for same type
    const now = new Date();
    const response = await app.inject({
      method: 'POST',
      url: `/api/products/${product.id}/prices`,
      headers: authHeader(token),
      payload: {
        priceType: 'list',
        price: 120.0,
        effectiveFrom: now.toISOString(),
      },
    });

    expect(response.statusCode).toBe(201);

    // Check that old price now has effective_to set
    const [oldPrice] = await db
      .select()
      .from(productPrices)
      .where(eq(productPrices.id, initialPrice.id));
    expect(oldPrice.effectiveTo).not.toBeNull();
  });

  it('should return 422 for overlapping date range', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct();

    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Create a price with a date range
    await insertPrice({
      productId: product.id,
      priceType: 'list',
      price: '100.00',
      effectiveFrom: now,
      effectiveTo: future,
    });

    // Try to create overlapping price
    const overlapStart = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // middle of existing range
    const response = await app.inject({
      method: 'POST',
      url: `/api/products/${product.id}/prices`,
      headers: authHeader(token),
      payload: {
        priceType: 'list',
        price: 110.0,
        effectiveFrom: overlapStart.toISOString(),
      },
    });

    if (response.statusCode !== 422) {
      console.log('Overlap response:', response.statusCode, response.body);
    }
    expect(response.statusCode).toBe(422);
    const body = response.json();
    expect(body.error.message).toContain('Overlapping');
  });

  it('should allow different price types for same date range', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct();

    const now = new Date();

    // Create list price
    await insertPrice({
      productId: product.id,
      priceType: 'list',
      price: '100.00',
      effectiveFrom: now,
    });

    // Create cost price for same time — should succeed
    const response = await app.inject({
      method: 'POST',
      url: `/api/products/${product.id}/prices`,
      headers: authHeader(token),
      payload: {
        priceType: 'cost',
        price: 80.0,
        effectiveFrom: now.toISOString(),
      },
    });

    expect(response.statusCode).toBe(201);
  });

  it('should validate discount_pct is 0-100', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct();

    const response = await app.inject({
      method: 'POST',
      url: `/api/products/${product.id}/prices`,
      headers: authHeader(token),
      payload: {
        priceType: 'mechanic',
        price: 100.0,
        discountPct: 150, // invalid — > 100
        effectiveFrom: new Date().toISOString(),
      },
    });

    if (response.statusCode !== 400) {
      console.log('discount_pct response:', response.statusCode, response.body);
    }
    expect(response.statusCode).toBe(400);
  });

  it('should validate price is positive', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct();

    const response = await app.inject({
      method: 'POST',
      url: `/api/products/${product.id}/prices`,
      headers: authHeader(token),
      payload: {
        priceType: 'list',
        price: -10,
        effectiveFrom: new Date().toISOString(),
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
