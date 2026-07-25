import { db } from '../../db/index.js';
import {
  users,
  brands,
  categories,
  products,
  productPrices,
  stockMovements,
  productSuppliers,
} from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * Clean all tables in dependency order (children first, then parents).
 * Call this in beforeEach for integration tests.
 */
export async function cleanAllTables(): Promise<void> {
  // Delete in dependency order to respect FK constraints
  await db.delete(stockMovements);
  await db.delete(productPrices);
  await db.delete(productSuppliers);
  await db.delete(products);
  await db.delete(users);
  await db.delete(brands);
  await db.delete(categories);
}

/**
 * Insert a brand and return it.
 */
export async function insertBrand(
  overrides: Partial<typeof brands.$inferInsert> = {},
): Promise<typeof brands.$inferSelect> {
  const defaults = {
    name: `Brand-${crypto.randomUUID().slice(0, 8)}`,
  };
  const [brand] = await db
    .insert(brands)
    .values({ ...defaults, ...overrides })
    .returning();
  return brand;
}

/**
 * Insert a category and return it.
 */
export async function insertCategory(
  overrides: Partial<typeof categories.$inferInsert> = {},
): Promise<typeof categories.$inferSelect> {
  const defaults = {
    name: `cat-${crypto.randomUUID().slice(0, 8)}` as string,
  };
  const [category] = await db
    .insert(categories)
    .values({ ...defaults, ...overrides })
    .returning();
  return category;
}

/**
 * Insert a user and return it (without password hash in the response).
 */
export async function insertUser(
  overrides: Partial<typeof users.$inferInsert> = {},
): Promise<typeof users.$inferSelect> {
  const defaults = {
    username: `user-${crypto.randomUUID().slice(0, 8)}`,
    email: `user-${crypto.randomUUID().slice(0, 8)}@test.com`,
    passwordHash: 'pre-hashed-password',
    role: 'employee',
  };
  // Filter out undefined values from overrides so they don't override defaults
  const cleanOverrides = Object.fromEntries(
    Object.entries(overrides).filter(([, v]) => v !== undefined),
  );
  const [user] = await db
    .insert(users)
    .values({ ...defaults, ...cleanOverrides })
    .returning();
  return user;
}

/**
 * Insert a product and return it.
 */
export async function insertProduct(
  overrides: Partial<typeof products.$inferInsert> = {},
): Promise<typeof products.$inferSelect> {
  // If brandId or categoryId not provided, create them
  let brandId = overrides.brandId;
  let categoryId = overrides.categoryId;

  if (!brandId) {
    const brand = await insertBrand();
    brandId = brand.id;
  }
  if (!categoryId) {
    const category = await insertCategory();
    categoryId = category.id;
  }

  const defaults = {
    name: `Product-${crypto.randomUUID().slice(0, 8)}`,
    brandId,
    categoryId,
    productType: 'general',
  };

  const [product] = await db
    .insert(products)
    .values({ ...defaults, ...overrides })
    .returning();
  return product;
}

/**
 * Insert a price and return it.
 */
export async function insertPrice(
  overrides: Partial<typeof productPrices.$inferInsert> = {},
): Promise<typeof productPrices.$inferSelect> {
  let productId = overrides.productId;
  if (!productId) {
    const product = await insertProduct();
    productId = product.id;
  }

  const defaults = {
    productId,
    priceType: 'list',
    price: '100.00',
    effectiveFrom: new Date(),
  };

  const [price] = await db
    .insert(productPrices)
    .values({ ...defaults, ...overrides })
    .returning();
  return price;
}

/**
 * Insert a stock movement and return it.
 */
export async function insertMovement(
  overrides: Partial<typeof stockMovements.$inferInsert> = {},
): Promise<typeof stockMovements.$inferSelect> {
  let productId = overrides.productId;
  let userId = overrides.userId;

  if (!productId) {
    const product = await insertProduct();
    productId = product.id;
  }
  if (!userId) {
    const user = await insertUser();
    userId = user.id;
  }

  const defaults = {
    productId,
    movementType: 'entry',
    quantity: 10,
    userId,
  };

  const [movement] = await db
    .insert(stockMovements)
    .values({ ...defaults, ...overrides } as any)
    .returning();
  return movement;
}
