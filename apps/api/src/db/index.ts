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

  // Seed data if products table is empty (run in background for faster startup)
  const [productCount] = await pgClient`SELECT COUNT(*)::int as cnt FROM products`;
  console.log(`Products in DB: ${productCount?.cnt}`);
  if (productCount?.cnt === 0) {
    console.log('Starting background seed...');
    runSeedInBackground().catch(err => console.error('Seed error:', err?.stack || err?.message));
  }

  console.log('Migrations applied');
}

async function runSeedInBackground(): Promise<void> {
  try {
    await pgClient`DELETE FROM product_prices`.catch(() => {});
    await pgClient`DELETE FROM products`.catch(() => {});
    await pgClient`DELETE FROM brands`.catch(() => {});
    await pgClient`DELETE FROM categories`.catch(() => {});

    const fs = await import('node:fs');
    const path = await import('node:path');
    const seedPath = path.join(process.cwd(), 'apps/api/src/db/migrations/seed_data.json');
    console.log('Reading seed from:', seedPath);
    const exists = fs.existsSync(seedPath);
    if (!exists) { console.log('Seed file not found:', seedPath); return; }
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

  // Batch insert products (100 at a time)
  for (let i = 0; i < seedData.products.length; i += 100) {
    const batch = seedData.products.slice(i, i + 100);
    for (const p of batch) {
      if (!p.id || !p.brandId || !p.categoryId || !p.name) continue;
      let params: any[] = [
        p.id, p.brandId, p.categoryId, p.code ?? null, p.name, p.description ?? null,
        p.capacity ?? null, p.unit || 'unit', p.productType || 'general', p.viscosity ?? null,
        p.crossRefs ? JSON.stringify(p.crossRefs) : null,
        p.specifications ? JSON.stringify(p.specifications) : null,
        p.extras ? JSON.stringify(p.extras) : null,
        p.isActive ?? true, p.currentStock ?? 0, p.minStockThreshold ?? 0
      ];
      // postgres.js rejects undefined — replace any rogue undefined with null
      for (let idx = 0; idx < params.length; idx++) {
        if (params[idx] === undefined) params[idx] = null;
      }
      await pgClient.unsafe(
        `INSERT INTO products (id, brand_id, category_id, code, name, description, capacity, unit, product_type, viscosity, cross_refs, specifications, extras, is_active, current_stock, min_stock_threshold) VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14, $15, $16) ON CONFLICT (id) DO NOTHING`,
        params
      );
      ok++;
    }
  }

  for (const pr of seedData.prices) {
    const ef = pr.effectiveFrom || new Date().toISOString();
    let pParams: any[] = [pr.id, pr.productId, pr.priceType, pr.price, ef];
    for (let idx = 0; idx < pParams.length; idx++) {
      if (pParams[idx] === undefined) pParams[idx] = null;
    }
    await pgClient.unsafe(
      `INSERT INTO product_prices (id, product_id, price_type, price, effective_from) VALUES ($1::uuid, $2::uuid, $3, $4, $5::timestamptz) ON CONFLICT (id) DO NOTHING`,
      pParams
    );
    ok++;
  }

  console.log(`Seed complete: ${ok} rows inserted`);
  } catch (err: any) {
    console.error('Seed failed:', err?.message?.substring(0, 200));
  }
}
