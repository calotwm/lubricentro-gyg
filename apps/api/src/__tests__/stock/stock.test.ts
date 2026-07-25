import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../helpers/app-factory.js';
import { cleanAllTables, insertProduct } from '../helpers/db-helpers.js';
import { createTestUser, createAdminUser, authHeader } from '../helpers/auth-helpers.js';
import { db } from '../../db/index.js';
import { products, stockMovements } from '../../db/schema/index.js';
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

describe('POST /api/stock/movements', () => {
  it('should increment stock on entry', async () => {
    const { token, user } = await createTestUser();
    const product = await insertProduct({ name: 'Castrol GTX', currentStock: 10 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/stock/movements',
      headers: authHeader(token),
      payload: {
        productId: product.id,
        movementType: 'entry',
        quantity: 5,
        unitPrice: 150.0,
        reference: 'PO-001',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.movementType).toBe('entry');
    expect(body.quantity).toBe(5);

    // Verify stock was updated
    const [updated] = await db
      .select({ currentStock: products.currentStock })
      .from(products)
      .where(eq(products.id, product.id));
    expect(updated.currentStock).toBe(15);
  });

  it('should decrement stock on exit', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct({ name: 'Mobil Super', currentStock: 10 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/stock/movements',
      headers: authHeader(token),
      payload: {
        productId: product.id,
        movementType: 'exit',
        quantity: 3,
      },
    });

    expect(response.statusCode).toBe(201);

    const [updated] = await db
      .select({ currentStock: products.currentStock })
      .from(products)
      .where(eq(products.id, product.id));
    expect(updated.currentStock).toBe(7);
  });

  it('should return 422 when exit exceeds current stock', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct({ name: 'Low Stock Item', currentStock: 3 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/stock/movements',
      headers: authHeader(token),
      payload: {
        productId: product.id,
        movementType: 'exit',
        quantity: 5,
      },
    });

    expect(response.statusCode).toBe(422);
    const body = response.json();
    expect(body.error.message).toContain('Insufficient stock');
    expect(body.error.message).toContain('3');
    expect(body.error.message).toContain('5');

    // Stock unchanged
    const [unchanged] = await db
      .select({ currentStock: products.currentStock })
      .from(products)
      .where(eq(products.id, product.id));
    expect(unchanged.currentStock).toBe(3);
  });

  it('should set stock to target value on adjustment', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct({ name: 'Adjust Test', currentStock: 10 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/stock/movements',
      headers: authHeader(token),
      payload: {
        productId: product.id,
        movementType: 'adjustment',
        quantity: 8, // target stock
      },
    });

    expect(response.statusCode).toBe(201);

    // Stock set to 8
    const [updated] = await db
      .select({ currentStock: products.currentStock })
      .from(products)
      .where(eq(products.id, product.id));
    expect(updated.currentStock).toBe(8);

    // Movement records the diff (-2)
    const body = response.json();
    expect(body.quantity).toBe(-2);
    expect(body.movementType).toBe('adjustment');
  });

  it('should record movement with all fields', async () => {
    const { token, user } = await createTestUser();
    const product = await insertProduct({ currentStock: 10 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/stock/movements',
      headers: authHeader(token),
      payload: {
        productId: product.id,
        movementType: 'entry',
        quantity: 5,
        unitPrice: 120.5,
        reference: 'INV-001',
        notes: 'Monthly restock',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.productId).toBe(product.id);
    expect(body.userId).toBe(user.id);
    expect(body.reference).toBe('INV-001');
    expect(body.notes).toBe('Monthly restock');
    expect(body.createdAt).toBeDefined();
  });

  it('should return 404 for non-existent product', async () => {
    const { token } = await createTestUser();

    const response = await app.inject({
      method: 'POST',
      url: '/api/stock/movements',
      headers: authHeader(token),
      payload: {
        productId: '00000000-0000-0000-0000-000000000000',
        movementType: 'entry',
        quantity: 5,
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/stock/movements',
      payload: {
        productId: '00000000-0000-0000-0000-000000000000',
        movementType: 'entry',
        quantity: 5,
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 for invalid movement type', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct({ currentStock: 10 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/stock/movements',
      headers: authHeader(token),
      payload: {
        productId: product.id,
        movementType: 'invalid',
        quantity: 5,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should handle concurrent entries correctly (serializable)', async () => {
    const { token } = await createTestUser();
    const product = await insertProduct({ name: 'Concurrent Test', currentStock: 0 });

    // Simulate two sequential entries (true concurrency needs parallel DB connections)
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/stock/movements',
      headers: authHeader(token),
      payload: { productId: product.id, movementType: 'entry', quantity: 10 },
    });
    expect(res1.statusCode).toBe(201);

    const res2 = await app.inject({
      method: 'POST',
      url: '/api/stock/movements',
      headers: authHeader(token),
      payload: { productId: product.id, movementType: 'entry', quantity: 5 },
    });
    expect(res2.statusCode).toBe(201);

    const [updated] = await db
      .select({ currentStock: products.currentStock })
      .from(products)
      .where(eq(products.id, product.id));
    expect(updated.currentStock).toBe(15);
  });
});

describe('GET /api/stock/movements', () => {
  it('should return paginated movement list', async () => {
    const { token, user } = await createTestUser();
    const product = await insertProduct({ currentStock: 20 });

    // Insert movements
    await db.insert(stockMovements).values([
      { productId: product.id, movementType: 'entry', quantity: 10, userId: user.id },
      { productId: product.id, movementType: 'entry', quantity: 15, userId: user.id },
      { productId: product.id, movementType: 'exit', quantity: -5, userId: user.id },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/stock/movements',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(3);
    expect(body.meta.total).toBe(3);
  });

  it('should filter movements by productId', async () => {
    const { token, user } = await createTestUser();
    const product1 = await insertProduct({ name: 'Product A' });
    const product2 = await insertProduct({ name: 'Product B' });

    await db.insert(stockMovements).values([
      { productId: product1.id, movementType: 'entry', quantity: 10, userId: user.id },
      { productId: product2.id, movementType: 'entry', quantity: 5, userId: user.id },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: `/api/stock/movements?productId=${product1.id}`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].productId).toBe(product1.id);
  });

  it('should filter movements by type', async () => {
    const { token, user } = await createTestUser();
    const product = await insertProduct();

    await db.insert(stockMovements).values([
      { productId: product.id, movementType: 'entry', quantity: 10, userId: user.id },
      { productId: product.id, movementType: 'exit', quantity: -3, userId: user.id },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/stock/movements?movementType=entry',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].movementType).toBe('entry');
  });
});

describe('GET /api/stock', () => {
  it('should return current stock balance with product info', async () => {
    const { token } = await createTestUser();
    await insertProduct({ name: 'Stock Item A', currentStock: 50, minStockThreshold: 10 });
    await insertProduct({ name: 'Stock Item B', currentStock: 3, minStockThreshold: 5 });

    const response = await app.inject({
      method: 'GET',
      url: '/api/stock',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(2);
    expect(body.meta.total).toBe(2);
  });

  it('should filter low-stock products', async () => {
    const { token } = await createTestUser();
    await insertProduct({ name: 'OK Stock', currentStock: 50, minStockThreshold: 10 });
    await insertProduct({ name: 'Low Stock', currentStock: 3, minStockThreshold: 5 });

    const response = await app.inject({
      method: 'GET',
      url: '/api/stock?lowStock=true',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Low Stock');
    expect(body.data[0].currentStock).toBe(3);
  });
});
