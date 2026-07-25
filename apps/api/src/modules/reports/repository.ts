import { db } from '../../db/index.js';
import {
  products,
  stockMovements,
  brands,
  productPrices,
  categories,
  users,
} from '../../db/schema/index.js';
import { eq, and, gte, lte, sql, desc, type SQL } from 'drizzle-orm';

export interface MovementReportFilters {
  from?: Date;
  to?: Date;
  productId?: string;
  brandId?: string;
  movementType?: string;
}

/**
 * Get movement report: individual movements with product/brand info,
 * filtered by date range, product, brand, and movement type.
 */
export async function findMovementReport(filters: MovementReportFilters) {
  const conditions: SQL[] = [];

  if (filters.from) {
    conditions.push(gte(stockMovements.createdAt, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(stockMovements.createdAt, filters.to));
  }
  if (filters.productId) {
    conditions.push(eq(stockMovements.productId, filters.productId));
  }
  if (filters.brandId) {
    conditions.push(eq(products.brandId, filters.brandId));
  }
  if (filters.movementType) {
    conditions.push(eq(stockMovements.movementType, filters.movementType));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      date: sql<string>`date_trunc('day', ${stockMovements.createdAt})::text`.as('date'),
      productId: stockMovements.productId,
      productName: products.name,
      brandName: brands.name,
      movementType: stockMovements.movementType,
      totalQuantity: sql<number>`sum(abs(${stockMovements.quantity}))::int`.as('total_quantity'),
      totalValue: sql<string>`sum(abs(${stockMovements.quantity}) * COALESCE(${stockMovements.unitPrice}, 0))`.as('total_value'),
    })
    .from(stockMovements)
    .leftJoin(products, eq(stockMovements.productId, products.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .where(where)
    .groupBy(
      sql`date_trunc('day', ${stockMovements.createdAt})::text`,
      stockMovements.productId,
      products.name,
      brands.name,
      stockMovements.movementType,
    )
    .orderBy(desc(sql`date_trunc('day', ${stockMovements.createdAt})::text`));
}

/**
 * Stock valuation: sum(current_stock × latest cost_price) per brand + grand total.
 * Uses raw SQL for the aggregation.
 */
export async function findValuation(filters: { brandId?: string }) {
  // Use fully raw SQL to avoid Drizzle mixed-mode scoping issues
  let whereClause = 'WHERE p.is_active = true';
  const params: unknown[] = [];

  if (filters.brandId) {
    whereClause += ' AND p.brand_id = $' + (params.length + 1);
    params.push(filters.brandId);
  }

  const sqlStr = `
    SELECT
      b.id AS brand_id,
      b.name AS brand_name,
      COUNT(DISTINCT p.id)::int AS total_products,
      COALESCE(SUM(p.current_stock), 0)::int AS total_stock,
      COALESCE(SUM(p.current_stock * COALESCE(
        (SELECT pp.price::numeric
         FROM product_prices pp
         WHERE pp.product_id = p.id AND pp.price_type = 'cost'
         ORDER BY pp.effective_from DESC
         LIMIT 1),
        0
      )), 0)::float AS total_value
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    ${whereClause}
    GROUP BY b.id, b.name
    ORDER BY b.name
  `;

  // Execute raw SQL via pgClient to avoid Drizzle transformation issues
  const { pgClient } = await import('../../db/index.js');
  const rows = await pgClient.unsafe(sqlStr, params as any);

  return rows as unknown as Array<{
    brand_id: string;
    brand_name: string;
    total_products: number;
    total_stock: number;
    total_value: number;
  }>;
}

/**
 * Low-stock products: current_stock <= min_stock_threshold.
 */
export async function findLowStockProducts() {
  return db
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
    .where(
      and(
        eq(products.isActive, true),
        sql`${products.currentStock} <= ${products.minStockThreshold}`,
      ),
    )
    .orderBy(products.name);
}
