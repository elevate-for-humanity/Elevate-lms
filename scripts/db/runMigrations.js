// scripts/db/runMigrations.js
// Apply SQL migrations via Supabase exec_sql RPC (service role).
// Tracks applied files in efh_migrations — skips already-applied ones.
// No direct Postgres connection required.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const BASE_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function execSql(sql) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify({ sql }),
  });
  if (r.status !== 200 && r.status !== 204) {
    const t = await r.text();
    throw new Error(`${r.status}: ${t.slice(0, 300)}`);
  }
}

async function ensureTrackingTable() {
  await execSql(`
    CREATE TABLE IF NOT EXISTS public.efh_migrations (
      id          SERIAL PRIMARY KEY,
      filename    TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    GRANT ALL    ON public.efh_migrations TO service_role;
    GRANT SELECT ON public.efh_migrations TO authenticated;
  `);
}

async function getApplied() {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/efh_migrations?select=filename&limit=10000`,
    { headers: BASE_HEADERS }
  );
  if (!r.ok) return new Set();
  const rows = await r.json();
  return new Set(Array.isArray(rows) ? rows.map(r => r.filename) : []);
}

async function markApplied(filename) {
  await fetch(`${SUPABASE_URL}/rest/v1/efh_migrations`, {
    method: 'POST',
    headers: { ...BASE_HEADERS, Prefer: 'return=minimal,resolution=ignore-duplicates' },
    body: JSON.stringify({ filename }),
  });
}

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../../supabase/migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('supabase/migrations not found');
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files`);

  await ensureTrackingTable();
  const applied = await getApplied();
  console.log(`Already applied: ${applied.size}`);

  let ok = 0, skip = 0, fail = 0;

  for (const file of files) {
    if (applied.has(file)) { skip++; continue; }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    process.stdout.write(`  ${file} ... `);

    try {
      await execSql(sql);
      await markApplied(file);
      console.log('OK');
      ok++;
    } catch (e) {
      console.log('FAIL: ' + e.message.slice(0, 120));
      fail++;
    }
  }

  console.log(`\nDone: ${ok} applied, ${skip} skipped, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

runMigrations();
