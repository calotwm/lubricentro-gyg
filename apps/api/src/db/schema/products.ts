import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { brands } from './brands.js';
import { categories } from './categories.js';
import { productPrices } from './product_prices.js';
import { stockMovements } from './stock_movements.js';
import { productSuppliers } from './product_suppliers.js';

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    code: varchar('code', { length: 50 }),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    capacity: varchar('capacity', { length: 50 }),
    unit: varchar('unit', { length: 20 }).default('unit'),
    productType: varchar('product_type', { length: 50 }),
    viscosity: text('viscosity'),
    crossRefs: jsonb('cross_refs'),
    specifications: jsonb('specifications'),
    extras: jsonb('extras'),
    isActive: boolean('is_active').notNull().default(true),
    currentStock: integer('current_stock').notNull().default(0),
    minStockThreshold: integer('min_stock_threshold').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('products_brand_id_idx').on(table.brandId),
    index('products_category_id_idx').on(table.categoryId),
    uniqueIndex('products_code_unique').on(table.code).where(sql`${table.code} IS NOT NULL`),
    index('products_is_active_idx').on(table.isActive),
    index('products_name_idx').on(table.name),
  ],
);

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  prices: many(productPrices),
  stockMovements: many(stockMovements),
  productSuppliers: many(productSuppliers),
}));
