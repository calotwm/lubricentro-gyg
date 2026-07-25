import {
  pgTable,
  uuid,
  varchar,
  numeric,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { products } from './products.js';

export const priceTypeEnum = varchar('price_type_enum', { length: 20 });

export const productPrices = pgTable(
  'product_prices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    priceType: varchar('price_type', { length: 20 }).notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    discountPct: numeric('discount_pct', { precision: 5, scale: 2 }),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    notes: text('notes'),
  },
  (table) => [
    index('product_prices_product_id_idx').on(table.productId),
    index('product_prices_price_type_idx').on(table.priceType),
    index('product_prices_effective_from_idx').on(table.effectiveFrom),
    uniqueIndex('product_prices_unique_idx').on(
      table.productId,
      table.priceType,
      table.effectiveFrom,
    ),
  ],
);

export const productPricesRelations = relations(productPrices, ({ one }) => ({
  product: one(products, {
    fields: [productPrices.productId],
    references: [products.id],
  }),
}));
