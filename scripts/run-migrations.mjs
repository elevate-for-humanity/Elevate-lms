/**
 * Migration runner — applies SQL files to Supabase via exec_sql RPC.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/run-migrations.mjs supabase/migrations/20260527000005_*.sql
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */

import { readFileSync } from 'fs';

const BASE = process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!BASE || !SKEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

async function runSQL(sql) {
  const res = await fetch(`${BASE}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SKEY,
      'Authorization': `Bearer ${SKEY}`,
    },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 500)}`);
  }
}

const files = process.argv.slice(2);
if (!files.length) { console.error('No files specified'); process.exit(1); }

let failed = 0;
for (const file of files) {
  const sql   = readFileSync(resolve(file), 'utf8');
  const label = file.split('/').pop();
  process.stdout.write(`Applying ${label} ... `);
  try {
    await runSQL(sql);
    console.log('✓');
  } catch (err) {
    console.log(`✗\n  ${err.message}`);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
