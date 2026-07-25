import { db } from '../../db/index.js';
import { productPrices } from '../../db/schema/index.js';
import { eq, and, desc, isNull, or, sql, type SQL } from 'drizzle-orm';
import postgres from 'postgres';

// Dedicated pgClient for INSERT/UPDATE (tsx breaks postgres Date handling, so use ISO strings)
const localPg = postgres(process.env.DATABASE_URL || 'postgresql://lubricentro:lubricentro_dev@localhost:5432/lubricentro_gyg');

function toPgDate(d: Date | string | null | undefined): string | null {
  if (d === null || d === undefined) return null;
  if (typeof d === 'string') return d;
  return d.toISOString();
}

// Convert snake_case DB row to camelCase for API response
function toCamelCase(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

export async function findPricesByProduct(
  productId: string,
  priceType?: string,
) {
  const conditions: SQL[] = [eq(productPrices.productId, productId)];

  if (priceType) {
    conditions.push(eq(productPrices.priceType, priceType));
  }

  return db
    .select()
    .from(productPrices)
    .where(and(...conditions))
    .orderBy(desc(productPrices.effectiveFrom));
}

export async function findActivePrice(productId: string, priceType: string) {
  const [price] = await db
    .select()
    .from(productPrices)
    .where(
      and(
        eq(productPrices.productId, productId),
        eq(productPrices.priceType, priceType),
        sql`${productPrices.effectiveTo} IS NULL OR ${productPrices.effectiveTo} > NOW()`,
        sql`${productPrices.effectiveFrom} <= NOW()`,
      ),
    )
    .limit(1);
  return price ?? null;
}

export async function createPrice(data: {
  productId: string;
  priceType: string;
  price: string;
  discountPct?: string | null;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  notes?: string | null;
}) {
  const ef = toPgDate(data.effectiveFrom);
  const et = toPgDate(data.effectiveTo);
  const rows = await localPg`
    INSERT INTO product_prices (product_id, price_type, price, discount_pct, effective_from, effective_to, notes)
    VALUES (${data.productId}, ${data.priceType}, ${data.price}, ${data.discountPct ?? null}, ${ef}::timestamptz, ${et}::timestamptz, ${data.notes ?? null})
    RETURNING *
  `;
  return toCamelCase(rows[0] as any) as any;
}

export async function updatePriceEffectiveTo(id: string, effectiveTo: Date) {
  const et = toPgDate(effectiveTo);
  const result = await localPg`
    UPDATE product_prices SET effective_to = ${et}::timestamptz
    WHERE id = ${id}
    RETURNING *
  `;
  return toCamelCase(result[0] as any) ?? null;
}

export async function findOverlappingPrice(
  productId: string,
  priceType: string,
  effectiveFrom: Date,
  effectiveTo?: Date | null,
) {
  const ef = toPgDate(effectiveFrom);
  const et = toPgDate(effectiveTo);
  const conditions: SQL[] = [
    eq(productPrices.productId, productId),
    eq(productPrices.priceType, priceType),
  ];

  if (et) {
    // Both have end dates: overlap if ranges intersect
    conditions.push(
      and(
        sql`${productPrices.effectiveFrom} < ${et}::timestamptz`,
        sql`${productPrices.effectiveTo} > ${ef}::timestamptz`,
      ) as SQL,
    );
  } else {
    // New price is open-ended (no effective_to):
    // Overlap only if existing has an end date that's AFTER the new start
    conditions.push(
      and(
        sql`${productPrices.effectiveTo} IS NOT NULL`,
        sql`${productPrices.effectiveTo} > ${ef}::timestamptz`,
      ) as SQL,
    );
  }

  const [price] = await db
    .select()
    .from(productPrices)
    .where(and(...conditions))
    .limit(1);
  return price ?? null;
}

export async function findCurrentActivePrice(
  productId: string,
  priceType: string,
) {
  const [price] = await db
    .select()
    .from(productPrices)
    .where(
      and(
        eq(productPrices.productId, productId),
        eq(productPrices.priceType, priceType),
        sql`${productPrices.effectiveFrom} <= NOW()`,
        or(
          isNull(productPrices.effectiveTo),
          sql`${productPrices.effectiveTo} > NOW()`,
        ),
      ),
    )
    .limit(1);
  return price ?? null;
}
