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

  console.log('Migrations applied');
}
