import { pgTable, uuid, varchar, text, index } from 'drizzle-orm/pg-core';

export const brands = pgTable(
  'brands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    notes: text('notes'),
  },
  (table) => [index('brands_name_idx').on(table.name)],
);
