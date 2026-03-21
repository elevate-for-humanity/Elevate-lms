#!/usr/bin/env node
/**
 * Automatic Supabase Migration Runner
 * Connects via pg (pooler) and runs all pending migrations from supabase/migrations/
 *
 * Required env vars (set in GitHub Secrets or .env.local):
 *   SUPABASE_DB_URL  — full postgres:// connection string (pooler or direct)
 *   OR both of:
 *     SUPABASE_DB_PASSWORD — database password
 *     SUPABASE_PROJECT_REF — project ref (e.g. cuxzzpsyufcewtmicszk)
 */

import pg from 'pg';
import { config } from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

config({ path: join(rootDir, '.env.local') });

// Build connection string
function getConnectionString() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = process.env.SUPABASE_PROJECT_REF || process.env.SUPABASE_PROJECT_REF;

  if (password) {
    return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  }

  return null;
}

const connStr = getConnectionString();
if (!connStr) {
  console.error('❌ No database connection available.');
  console.error('   Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in env.');
  console.error('   Alternatively, paste the SQL into Supabase Dashboard > SQL Editor.');
  process.exit(1);
}

// Read migration files
const migrationsDir = join(rootDir, 'supabase/migrations');
let migrationFiles;
try {
  migrationFiles = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
} catch (err) {
  console.error('❌ Could not read migrations directory:', err.message);
  process.exit(1);
}

console.log(`Found ${migrationFiles.length} migration files.`);

// Connect
const client = new Client({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

try {
  await client.connect();
  console.log('✅ Connected to database.');
} catch (err) {
  console.error('❌ Failed to connect:', err.message);
  process.exit(1);
}

// Ensure tracking table exists
await client.query(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
  );
`);

// Get already-executed migrations
const { rows: executed } = await client.query(
  `SELECT filename FROM _migrations WHERE success = TRUE`
);
const executedSet = new Set(executed.map(r => r.filename));

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (const filename of migrationFiles) {
  if (executedSet.has(filename)) {
    skipCount++;
    continue;
  }

  console.log(`▶ Running: ${filename}`);

  try {
    const sql = readFileSync(join(migrationsDir, filename), 'utf8');

    // Execute the entire file as a single transaction
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    // Record success
    await client.query(
      `INSERT INTO _migrations (filename, success) VALUES ($1, TRUE) ON CONFLICT (filename) DO UPDATE SET success = TRUE, executed_at = NOW()`,
      [filename]
    );

    successCount++;
    console.log(`  ✅ ${filename}`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});

    // Record failure
    await client.query(
      `INSERT INTO _migrations (filename, success, error_message) VALUES ($1, FALSE, $2) ON CONFLICT (filename) DO UPDATE SET success = FALSE, error_message = $2, executed_at = NOW()`,
      [filename, err.message]
    ).catch(() => {});

    errorCount++;
    console.error(`  ❌ ${filename}: ${err.message}`);

    if (process.env.CI === 'true') break;
  }
}

await client.end();

console.log(`\nDone: ${successCount} applied, ${skipCount} skipped, ${errorCount} failed.`);

if (errorCount > 0) {
  process.exit(1);
}
