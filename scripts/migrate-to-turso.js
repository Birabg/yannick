/**
 * One-time copy of the local SQLite database into Turso.
 *
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/migrate-to-turso.js [path/to/yannick.db]
 *   npm run migrate:turso -- [path/to/yannick.db] [--force]
 *
 * The URL and token are read from the environment or from .env. The source defaults to data/yannick.db
 * (keep its -wal file next to it, and stop the dev server first).
 *
 * Copies perfumes, their extra sizes, reviews and all settings. Settings hold the admin password hash,
 * the Our Story copy and the site image names, so the admin password carries over unchanged.
 * Login sessions are not copied: you simply sign in again.
 *
 * It refuses to run when Turso already holds perfumes, so it cannot overwrite live data by accident.
 * --force empties the Turso copies of these tables first.
 * Photos are not part of the database: the files in uploads/ have to be hosted separately.
 */
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ quiet: true });
const { createClient } = require('@libsql/client');

const force = process.argv.includes('--force');
const sourceArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
const sourceFile = path.resolve(sourceArg || path.join(__dirname, '..', 'data', 'yannick.db'));

// Parents before children; deleted in the opposite order.
const TABLES = ['settings', 'products', 'product_variants', 'reviews'];
const CHUNK = 50;

const names = (rows) => rows.map((r) => r.name);

async function main() {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error('Set TURSO_DATABASE_URL (libsql://...) and TURSO_AUTH_TOKEN first.');
  }
  if (!fs.existsSync(sourceFile)) throw new Error(`Source database not found: ${sourceFile}`);

  const source = createClient({ url: `file:${sourceFile}` });
  // src/db.js connects to Turso from the same variables and creates any missing tables and columns.
  const { db: target, ready } = require('../src/db');
  await ready();

  const existing = (await target.get('SELECT COUNT(*) AS n FROM products')).n;
  if (existing > 0 && !force) {
    throw new Error(
      `Turso already holds ${existing} perfumes. Nothing was changed. Run again with --force to replace them.`
    );
  }
  if (force) {
    await target.batch([...TABLES].reverse().map((t) => [`DELETE FROM ${t}`]));
    console.log('Emptied the existing Turso tables (--force).');
  }

  for (const table of TABLES) {
    const have = names((await source.execute(`PRAGMA table_info(${table})`)).rows);
    const want = names(await target.all(`PRAGMA table_info(${table})`));
    // Only columns that exist on both sides; an older local file simply gets the defaults for new ones.
    const cols = have.filter((c) => want.includes(c));
    const rows = (await source.execute(`SELECT ${cols.join(', ')} FROM ${table}`)).rows;
    const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await target.batch(rows.slice(i, i + CHUNK).map((r) => [sql, cols.map((c) => r[c])]));
    }
    console.log(`${table}: copied ${rows.length} rows`);
  }

  console.log('\nChecking the copy...');
  let ok = true;
  for (const table of TABLES) {
    const a = (await source.execute(`SELECT COUNT(*) AS n FROM ${table}`)).rows[0].n;
    const b = (await target.get(`SELECT COUNT(*) AS n FROM ${table}`)).n;
    if (b < a) ok = false;
    console.log(`  ${table}: local ${a}, Turso ${b}${b < a ? '  <-- MISSING ROWS' : ''}`);
  }
  const hash = await target.get("SELECT 1 AS found FROM settings WHERE key = 'admin_hash'");
  console.log(
    `  admin password: ${hash ? 'copied' : 'NOT FOUND (set ADMIN_PASSWORD on first start)'}`
  );
  if (!ok) process.exitCode = 1;
  else console.log('\nDone. Your data is in Turso.');

  source.close();
  target.close();
}

main().catch((err) => {
  console.error(`\nMigration failed: ${err.message}`);
  process.exit(1);
});
