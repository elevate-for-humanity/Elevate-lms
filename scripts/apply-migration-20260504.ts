#!/usr/bin/env tsx
/**
 * Apply migration 20260504000001 via Supabase Management API
 */
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? 'cuxzzpsyufcewtmicszk';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set');

const sql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260504000001_course_lessons_generator_join.sql'),
  'utf8'
);

async function runViaManagementAPI() {
  console.log('Trying Supabase Management API...');
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  return { status: res.status, body: await res.text() };
}

async function runViaPostgRESTRPC() {
  console.log('Trying pg_execute via PostgREST...');
  // Split into individual statements and run each via a custom RPC if available
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--'));

  const SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
  let passed = 0;
  let failed = 0;

  for (const stmt of statements) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ sql: stmt + ';' }),
    });
    if (res.ok) {
      passed++;
    } else {
      const err = await res.text();
      if (err.includes('already exists') || err.includes('does not exist')) {
        console.log(`  SKIP (already applied): ${stmt.slice(0, 60)}...`);
        passed++;
      } else {
        console.error(`  FAIL: ${err.slice(0, 200)}`);
        console.error(`  stmt: ${stmt.slice(0, 100)}`);
        failed++;
      }
    }
  }
  return { passed, failed };
}

async function main() {
  // Try management API first
  const mgmt = await runViaManagementAPI();
  console.log('Management API status:', mgmt.status);

  if (mgmt.status === 200 || mgmt.status === 201) {
    console.log('Migration applied via Management API');
    console.log(mgmt.body.slice(0, 300));
    return;
  }

  console.log('Management API response:', mgmt.body.slice(0, 200));
  console.log('\nFalling back to RPC approach...');

  const rpc = await runViaPostgRESTRPC();
  console.log(`\nRPC result: passed=${rpc.passed} failed=${rpc.failed}`);

  if (rpc.failed > 0) {
    console.error('Some statements failed. Apply manually in Supabase Dashboard SQL Editor.');
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
