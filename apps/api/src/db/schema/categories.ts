import { pgTable, uuid, varchar, jsonb, index } from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 50 }).notNull().unique(),
    config: jsonb('config'),
  },
  (table) => [index('categories_name_idx').on(table.name)],
);
