import { pgTable, uuid, varchar, text, index } from 'drizzle-orm/pg-core';

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull().unique(),
    contact: varchar('contact', { length: 100 }),
    phone: varchar('phone', { length: 30 }),
    email: varchar('email', { length: 100 }),
    notes: text('notes'),
  },
  (table) => [index('suppliers_name_idx').on(table.name)],
);
