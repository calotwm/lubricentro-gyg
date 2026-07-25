import { db } from '../../db/index.js';
import { products, brands, categories, stockMovements } from '../../db/schema/index.js';
import { eq, and, ilike, sql, type SQL } from 'drizzle-orm';
import type { PaginationParams } from '../../lib/pagination.js';
import { calculateOffset } from '../../lib/pagination.js';

export interface ProductFilters {
  brandId?: string;
  categoryId?: string;
  search?: string;
  isActive?: boolean;
}

export async function findAll(filters: ProductFilters, pagination: PaginationParams) {
  const conditions: SQL[] = [];

  if (filters.brandId) {
    conditions.push(eq(products.brandId, filters.brandId));
  }
  if (filters.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }
  if (filters.search) {
    conditions.push(ilike(products.name, `%${filters.search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(where);

  // Get paginated data
  const data = await db
    .select({
      id: products.id,
      brandId: products.brandId,
      categoryId: products.categoryId,
      code: products.code,
      name: products.name,
      description: products.description,
      capacity: products.capacity,
      unit: products.unit,
      productType: products.productType,
      viscosity: products.viscosity,
      crossRefs: products.crossRefs,
      specifications: products.specifications,
      extras: products.extras,
      isActive: products.isActive,
      currentStock: products.currentStock,
      minStockThreshold: products.minStockThreshold,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      brandName: brands.name,
      categoryName: categories.name,
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

export async function findById(id: string) {
  const [result] = await db
    .select({
      id: products.id,
      brandId: products.brandId,
      categoryId: products.categoryId,
      code: products.code,
      name: products.name,
      description: products.description,
      capacity: products.capacity,
      unit: products.unit,
      productType: products.productType,
      viscosity: products.viscosity,
      crossRefs: products.crossRefs,
      specifications: products.specifications,
      extras: products.extras,
      isActive: products.isActive,
      currentStock: products.currentStock,
      minStockThreshold: products.minStockThreshold,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      brandName: brands.name,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);

  return result ?? null;
}

export async function create(data: typeof products.$inferInsert) {
  const [product] = await db.insert(products).values(data).returning();
  return product;
}

export async function update(id: string, data: Partial<typeof products.$inferInsert>) {
  const [product] = await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return product ?? null;
}

export async function remove(id: string) {
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
  return deleted ?? null;
}

export async function hasStockMovements(productId: string): Promise<boolean> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stockMovements)
    .where(eq(stockMovements.productId, productId));
  return result.count > 0;
}

export async function findByCode(code: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.code, code))
    .limit(1);
  return product ?? null;
}
