const fs = require('fs');
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const migration = fs.readFileSync('apps/api/src/db/migrations/0000_initial_schema.sql', 'utf-8');
  const statements = migration.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt.trim() + ';');
      console.log('OK:', stmt.trim().substring(0, 80));
    } catch(e) {
      if (e.message.includes('already exists')) console.log('SKIP (exists)');
      else console.error('FAIL:', e.message.substring(0, 120));
    }
  }
  // Also enlarge column widths
  await sql.unsafe(`ALTER TABLE brands ALTER COLUMN name TYPE varchar(200)`).catch(() => {});
  await sql.unsafe(`ALTER TABLE categories ALTER COLUMN name TYPE varchar(200)`).catch(() => {});
  await sql.unsafe(`ALTER TABLE products ALTER COLUMN name TYPE varchar(500)`).catch(() => {});
  await sql.unsafe(`ALTER TABLE products ALTER COLUMN code TYPE varchar(100)`).catch(() => {});
  await sql.unsafe(`ALTER TABLE products ALTER COLUMN capacity TYPE varchar(100)`).catch(() => {});
  console.log('Migration complete!');
  await sql.end();
}
run().catch(e => { console.error(e); process.exit(1); });
