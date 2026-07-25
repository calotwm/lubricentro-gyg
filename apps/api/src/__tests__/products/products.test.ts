import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../helpers/app-factory.js';
import { cleanAllTables, insertBrand, insertCategory, insertProduct } from '../helpers/db-helpers.js';
import { createTestUser, createAdminUser, authHeader } from '../helpers/auth-helpers.js';
import { db } from '../../db/index.js';
import { products, productPrices, stockMovements } from '../../db/schema/index.js';
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

describe('GET /api/products', () => {
  it('should return paginated product list', async () => {
    const { token } = await createTestUser();
    const brand = await insertBrand({ name: 'Castrol' });
    const category = await insertCategory({ name: 'motor-oil' });

    await insertProduct({ name: 'Castrol GTX 20W-50', brandId: brand.id, categoryId: category.id });
    await insertProduct({ name: 'Castrol EDGE 5W-30', brandId: brand.id, categoryId: category.id });

    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(2);
    expect(body.meta.total).toBe(2);
    expect(body.meta.page).toBe(1);
  });

  it('should filter by brandId', async () => {
    const { token } = await createTestUser();
    const brand1 = await insertBrand({ name: 'Castrol' });
    const brand2 = await insertBrand({ name: 'Mobil' });
    const category = await insertCategory({ name: 'motor-oil' });

    await insertProduct({ name: 'Castrol Oil', brandId: brand1.id, categoryId: category.id });
    await insertProduct({ name: 'Mobil Oil', brandId: brand2.id, categoryId: category.id });

    const response = await app.inject({
      method: 'GET',
      url: `/api/products?brandId=${brand1.id}`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Castrol Oil');
  });

  it('should search by name (case-insensitive)', async () => {
    const { token } = await createTestUser();
    const brand = await insertBrand();
    const category = await insertCategory();

    await insertProduct({ name: 'Castrol GTX 20W-50', brandId: brand.id, categoryId: category.id });
    await insertProduct({ name: 'Mobil Super', brandId: brand.id, categoryId: category.id });

    const response = await app.inject({
      method: 'GET',
      url: '/api/products?search=castrol',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Castrol GTX 20W-50');
  });

  it('should return 401 without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('GET /api/products/:id', () => {
  it('should return a single product by id', async () => {
    const { token } = await createTestUser();
    const brand = await insertBrand({ name: 'Fram' });
    const category = await insertCategory({ name: 'filter' });
    const product = await insertProduct({
      name: 'Fram PH8A',
      brandId: brand.id,
      categoryId: category.id,
      code: 'PH8A',
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/products/${product.id}`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.id).toBe(product.id);
    expect(body.name).toBe('Fram PH8A');
    expect(body.code).toBe('PH8A');
  });

  it('should return 404 for non-existent product', async () => {
    const { token } = await createTestUser();

    const response = await app.inject({
      method: 'GET',
      url: '/api/products/00000000-0000-0000-0000-000000000000',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('POST /api/products', () => {
  it('should create a product and return 201', async () => {
    const { token } = await createTestUser();
    const brand = await insertBrand({ name: 'Castrol' });
    const category = await insertCategory({ name: 'motor-oil' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: authHeader(token),
      payload: {
        brandId: brand.id,
        categoryId: category.id,
        name: 'Castrol GTX 20W-50',
        productType: 'motor-oil',
        viscosity: '20W-50',
        capacity: '1L',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe('Castrol GTX 20W-50');
    expect(body.productType).toBe('motor-oil');
    expect(body.viscosity).toBe('20W-50');
  });

  it('should return 409 for duplicate product code', async () => {
    const { token } = await createTestUser();
    const brand = await insertBrand();
    const category = await insertCategory();

    await insertProduct({
      name: 'Product 1',
      brandId: brand.id,
      categoryId: category.id,
      code: 'DUP-CODE',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: authHeader(token),
      payload: {
        brandId: brand.id,
        categoryId: category.id,
        name: 'Product 2',
        productType: 'general',
        code: 'DUP-CODE',
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it('should return 400 for invalid payload', async () => {
    const { token } = await createTestUser();

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: authHeader(token),
      payload: { name: '' }, // invalid — missing required fields
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('PUT /api/products/:id', () => {
  it('should update a product', async () => {
    const { token } = await createTestUser();
    const brand = await insertBrand();
    const category = await insertCategory();
    const product = await insertProduct({
      name: 'Old Name',
      brandId: brand.id,
      categoryId: category.id,
    });

    const response = await app.inject({
      method: 'PUT',
      url: `/api/products/${product.id}`,
      headers: authHeader(token),
      payload: {
        name: 'New Name',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.name).toBe('New Name');
  });
});

describe('PATCH /api/products/:id', () => {
  it('should deactivate a product (set isActive=false)', async () => {
    const { token } = await createTestUser();
    const brand = await insertBrand();
    const category = await insertCategory();
    const product = await insertProduct({
      name: 'Active Product',
      brandId: brand.id,
      categoryId: category.id,
      isActive: true,
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/products/${product.id}`,
      headers: authHeader(token),
      payload: { isActive: false },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.isActive).toBe(false);
  });
});

describe('DELETE /api/products/:id', () => {
  it('should delete a product with no stock movements', async () => {
    const { token } = await createAdminUser();
    const brand = await insertBrand();
    const category = await insertCategory();
    const product = await insertProduct({
      name: 'To Delete',
      brandId: brand.id,
      categoryId: category.id,
    });

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/products/${product.id}`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(204);
  });

  it('should return 409 when product has stock movements', async () => {
    const { token } = await createAdminUser();
    const { user: testUser } = await createTestUser();
    const brand = await insertBrand();
    const category = await insertCategory();
    const product = await insertProduct({
      name: 'With Movements',
      brandId: brand.id,
      categoryId: category.id,
    });

    // Insert a stock movement
    await db.insert(stockMovements).values({
      productId: product.id,
      movementType: 'entry',
      quantity: 10,
      userId: testUser.id,
    });

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/products/${product.id}`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(409);
  });

  it('should return 403 for non-admin users', async () => {
    const { token } = await createTestUser({ role: 'employee' });
    const brand = await insertBrand();
    const category = await insertCategory();
    const product = await insertProduct({
      brandId: brand.id,
      categoryId: category.id,
    });

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/products/${product.id}`,
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(403);
  });
});
