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
