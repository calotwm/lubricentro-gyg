import {
  pgTable,
  uuid,
  varchar,
  boolean,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { products } from './products.js';
import { suppliers } from './suppliers.js';

export const productSuppliers = pgTable(
  'product_suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    supplierCode: varchar('supplier_code', { length: 50 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    notes: text('notes'),
  },
  (table) => [
    index('product_suppliers_product_id_idx').on(table.productId),
    index('product_suppliers_supplier_id_idx').on(table.supplierId),
    uniqueIndex('product_suppliers_unique_idx').on(
      table.productId,
      table.supplierId,
    ),
  ],
);

export const productSuppliersRelations = relations(
  productSuppliers,
  ({ one }) => ({
    product: one(products, {
      fields: [productSuppliers.productId],
      references: [products.id],
    }),
    supplier: one(suppliers, {
      fields: [productSuppliers.supplierId],
      references: [suppliers.id],
    }),
  }),
);
