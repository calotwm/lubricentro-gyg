import { db } from '../../db/index.js';
import { products, stockMovements, brands, categories, users } from '../../db/schema/index.js';
import { eq, and, desc, gte, lte, sql, type SQL } from 'drizzle-orm';
import type { PaginationParams } from '../../lib/pagination.js';
import { calculateOffset } from '../../lib/pagination.js';

export interface MovementFilters {
  productId?: string;
  movementType?: string;
  from?: Date;
  to?: Date;
}

export async function findMovements(
  filters: MovementFilters,
  pagination: PaginationParams,
) {
  const conditions: SQL[] = [];

  if (filters.productId) {
    conditions.push(eq(stockMovements.productId, filters.productId));
  }
  if (filters.movementType) {
    conditions.push(eq(stockMovements.movementType, filters.movementType));
  }
  if (filters.from) {
    conditions.push(gte(stockMovements.createdAt, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(stockMovements.createdAt, filters.to));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stockMovements)
    .where(where);

  const data = await db
    .select({
      id: stockMovements.id,
      productId: stockMovements.productId,
      productName: products.name,
      brandName: brands.name,
      movementType: stockMovements.movementType,
      quantity: stockMovements.quantity,
      unitPrice: stockMovements.unitPrice,
      reference: stockMovements.reference,
      notes: stockMovements.notes,
      userId: stockMovements.userId,
      username: users.username,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .leftJoin(products, eq(stockMovements.productId, products.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(users, eq(stockMovements.userId, users.id))
    .where(where)
    .orderBy(desc(stockMovements.createdAt))
    .limit(pagination.limit)
    .offset(calculateOffset(pagination));

  return { data, total: countResult.count };
}

export async function findStockBalance(
  filters: { lowStock?: boolean },
  pagination: PaginationParams,
) {
  const conditions: SQL[] = [eq(products.isActive, true)];

  if (filters.lowStock) {
    conditions.push(
      sql`${products.currentStock} <= ${products.minStockThreshold}`,
    );
  }

  const where = and(...conditions);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(where);

  const data = await db
    .select({
      id: products.id,
      name: products.name,
      code: products.code,
      brandName: brands.name,
      categoryName: categories.name,
      currentStock: products.currentStock,
      minStockThreshold: products.minStockThreshold,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(products.name)
    .limit(pagination.limit)
    .offset(calculateOffset(pagination));

  return { data, total: countResult.count };
}
