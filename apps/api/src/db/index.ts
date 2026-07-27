import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://lubricentro:lubricentro_dev@localhost:5432/lubricentro_gyg';

export const pgClient = postgres(connectionString);
export const db = drizzle(pgClient, { schema });
export type Database = typeof db;

/**
 * Check database connectivity by running a simple query.
 * Returns 'connected' if successful, 'disconnected' otherwise.
 */
export async function checkDbHealth(): Promise<'connected' | 'disconnected'> {
  try {
    await pgClient`SELECT 1`;
    return 'connected';
  } catch {
    return 'disconnected';
  }
}

/**
 * Run database migrations on startup (production).
 * Reads the SQL migration file and executes each statement.
 */
export async function runMigrations(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');
  const migrationPath = path.join(process.cwd(), 'apps/api/src/db/migrations/0000_initial_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  const statements = migrationSQL.split(';').filter(s => s.trim());

  for (const stmt of statements) {
    try {
      await pgClient.unsafe(stmt.trim() + ';');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('already exists')) {
        console.warn('Migration warning:', msg);
      }
    }
  }

  // Widen columns for imported data
  for (const cmd of [
    `ALTER TABLE brands ALTER COLUMN name TYPE varchar(200)`,
    `ALTER TABLE categories ALTER COLUMN name TYPE varchar(200)`,
    `ALTER TABLE products ALTER COLUMN name TYPE varchar(500)`,
    `ALTER TABLE products ALTER COLUMN code TYPE varchar(100)`,
    `ALTER TABLE products ALTER COLUMN capacity TYPE varchar(100)`,
  ]) {
    await pgClient.unsafe(cmd).catch(() => {});
  }

  // Seed default admin user if none exists
  const [existing] = await pgClient`SELECT COUNT(*)::int as cnt FROM users`;
  if (existing?.cnt === 0) {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('admin123', 10);
    await pgClient`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@lubricentro.com', ${hash}, 'admin')
    `;
    console.log('Default admin user created (admin / admin123)');
  }

  // Seed data if products table is empty
  const [productCount] = await pgClient`SELECT COUNT(*)::int as cnt FROM products`;
  console.log(`Products in DB: ${productCount?.cnt}`);
  if (productCount?.cnt === 0) {
    // Clear existing data that might have different UUIDs from previous seeds
    await pgClient`DELETE FROM product_prices`;
    await pgClient`DELETE FROM products`;
    await pgClient`DELETE FROM brands`;
    await pgClient`DELETE FROM categories`;
    console.log('Cleared existing data for clean seed');

    // Seed from JSON (parameterized queries — safe from SQL injection)
    const seedPath = path.join(process.cwd(), 'apps/api/src/db/migrations/seed_data.json');
    console.log(`Seed file exists: ${fs.existsSync(seedPath)}`);
    if (fs.existsSync(seedPath)) {
      const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      let ok = 0;

      for (const b of seedData.brands) {
        await pgClient`INSERT INTO brands (id, name, notes) VALUES (${b.id}, ${b.name}, ${b.notes}) ON CONFLICT (name) DO NOTHING`;
        ok++;
      }
      for (const c of seedData.categories) {
        await pgClient`INSERT INTO categories (id, name) VALUES (${c.id}, ${c.name}) ON CONFLICT (name) DO NOTHING`;
        ok++;
      }
      for (const p of seedData.products) {
        await pgClient`INSERT INTO products (id, brand_id, category_id, code, name, description, capacity, unit, product_type, viscosity, cross_refs, specifications, extras, is_active, current_stock, min_stock_threshold) VALUES (${p.id}, ${p.brandId}, ${p.categoryId}, ${p.code}, ${p.name}, ${p.description}, ${p.capacity}, ${p.unit}, ${p.productType}, ${p.viscosity}, ${p.crossRefs}, ${p.specifications}, ${p.extras}, ${p.isActive}, ${p.currentStock}, ${p.minStockThreshold}) ON CONFLICT (id) DO NOTHING`;
        ok++;
      }
      for (const pr of seedData.prices) {
        await pgClient`INSERT INTO product_prices (id, product_id, price_type, price, effective_from) VALUES (${pr.id}, ${pr.productId}, ${pr.priceType}, ${pr.price}, ${pr.effectiveFrom}::timestamptz) ON CONFLICT (id) DO NOTHING`;
        ok++;
      }

      console.log(`Seed complete: ${ok} rows inserted`);
    }
  }

  console.log('Migrations applied');
}
