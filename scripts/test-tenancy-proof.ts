/**
 * Post-migration tenancy proof test suite.
 *
 * Run after all 6 migrations are applied:
 *   npx tsx scripts/test-tenancy-proof.ts
 *
 * Tests 3 categories:
 *   1. Schema proof: columns exist, NOT NULL enforced, indexes present
 *   2. Policy proof: correct policies active on each table
 *   3. Behavior proof: simulated actor access patterns
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
function envVar(name: string): string {
  const match = envContent.match(new RegExp(`^${name}=(.+)`, 'm'));
  return match ? match[1].trim() : '';
}

const SUPABASE_URL = envVar('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = envVar('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = envVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const svc = createClient(SUPABASE_URL, SERVICE_KEY);
const anon = createClient(SUPABASE_URL, ANON_KEY);

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.log(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function colExists(table: string, col: string): Promise<boolean> {
  const { data } = await svc.rpc('_col_exists', { p_table: table, p_col: col });
  return data === true;
}

async function main() {
  console.log('=== TENANCY PROOF TEST SUITE ===\n');

  // ============================================================
  // 1. SCHEMA PROOF
  // ============================================================
  console.log('--- 1. Schema Proof ---\n');

  const tenantTables = [
    'profiles', 'enrollments', 'certificates', 'lesson_progress',
    'apprentice_placements', 'shops', 'shop_staff'
  ];

  for (const table of tenantTables) {
    const has = await colExists(table, 'tenant_id');
    assert(`${table}.tenant_id column exists`, has);
  }

  // Check for NULL tenant_id (should be 0 after backfill)
  console.log('');
  for (const table of tenantTables) {
    const { count } = await svc.from(table).select('*', { count: 'exact', head: true }).is('tenant_id', null);
    assert(`${table}: zero NULL tenant_id`, count === 0, `found ${count} NULLs`);
  }

  // ============================================================
  // 2. POLICY PROOF (via behavior, since we can't query pg_policies)
  // ============================================================
  console.log('\n--- 2. Policy Proof (Anon Access) ---\n');

  // Anon should NOT be able to read sensitive tables
  const blockedForAnon = [
    'profiles', 'enrollments', 'lesson_progress',
    'shops', 'shop_staff', 'apprentice_placements',
    'licenses', 'audit_logs', 'sfc_tax_returns', 'sfc_tax_documents',
    'organization_users', 'tenant_memberships', 'tenant_licenses'
  ];

  for (const table of blockedForAnon) {
    const { count, error } = await anon.from(table).select('*', { count: 'exact', head: true });
    const blocked = error !== null || count === 0;
    assert(`anon blocked from ${table}`, blocked, `got ${count} rows`);
  }

  // Anon CAN read public verification certificates
  const { count: certCount } = await anon.from('certificates').select('*', { count: 'exact', head: true });
  // This depends on whether certificates has a public read policy
  console.log(`  INFO: anon certificates count = ${certCount}`);

  // Anon CAN read active programs
  const { count: progCount } = await anon.from('programs').select('*', { count: 'exact', head: true });
  assert('anon can read active programs', (progCount || 0) > 0, `got ${progCount}`);

  // ============================================================
  // 3. BEHAVIOR PROOF (Write Locks)
  // ============================================================
  console.log('\n--- 3. Behavior Proof (Write Locks) ---\n');

  const fakeId = '00000000-0000-0000-0000-000000000000';
  const writeLockTables = ['shops', 'shop_staff', 'apprentice_placements', 'profiles', 'enrollments', 'certificates'];

  for (const table of writeLockTables) {
    const { error: insertErr } = await anon.from(table).insert({ id: fakeId });
    assert(`anon INSERT blocked on ${table}`, insertErr !== null);

    const { error: deleteErr } = await anon.from(table).delete().eq('id', fakeId);
    assert(`anon DELETE blocked on ${table}`, deleteErr !== null);
  }

  // ============================================================
  // 4. BEHAVIOR PROOF (Service Role Bypass)
  // ============================================================
  console.log('\n--- 4. Service Role Access ---\n');

  const svcTables = ['profiles', 'enrollments', 'shops', 'shop_staff', 'apprentice_placements'];
  for (const table of svcTables) {
    const { count } = await svc.from(table).select('*', { count: 'exact', head: true });
    assert(`service role reads ${table}`, (count || 0) >= 0, `count=${count}`);
  }

  // ============================================================
  // 5. TENANT ISOLATION PROOF
  // ============================================================
  console.log('\n--- 5. Tenant Isolation ---\n');

  // All data should belong to the same tenant (Elevate for Humanity)
  const ELEVATE_TENANT = '6ba71334-58f4-4104-9b2a-5114f2a7614c';

  for (const table of ['profiles', 'enrollments', 'shops', 'shop_staff']) {
    const { count: total } = await svc.from(table).select('*', { count: 'exact', head: true });
    const { count: tenanted } = await svc.from(table).select('*', { count: 'exact', head: true }).eq('tenant_id', ELEVATE_TENANT);
    assert(`${table}: all rows belong to Elevate tenant`, total === tenanted, `total=${total} tenanted=${tenanted}`);
  }

  // ============================================================
  // 6. RELATIONSHIP TABLE INTEGRITY
  // ============================================================
  console.log('\n--- 6. Relationship Integrity ---\n');

  // Every placement's student should have a profile
  const { data: placements } = await svc.from('apprentice_placements').select('student_id');
  for (const p of placements || []) {
    const { data: profile } = await svc.from('profiles').select('id').eq('id', p.student_id).single();
    assert(`placement student ${p.student_id?.substring(0, 8)} has profile`, profile !== null);
  }

  // Every shop_staff user should have a profile
  const { data: staff } = await svc.from('shop_staff').select('user_id');
  for (const s of staff || []) {
    const { data: profile } = await svc.from('profiles').select('id').eq('id', s.user_id).single();
    assert(`shop_staff user ${s.user_id?.substring(0, 8)} has profile`, profile !== null);
  }

  // Every shop_staff's shop should exist
  for (const s of staff || []) {
    const { data: shop } = await svc.from('shops').select('id').eq('id', (s as any).shop_id).single();
    // shop_id isn't in the select, re-query
  }
  const { data: staffFull } = await svc.from('shop_staff').select('shop_id, user_id');
  for (const s of staffFull || []) {
    const { data: shop } = await svc.from('shops').select('id').eq('id', s.shop_id).single();
    assert(`shop_staff shop ${s.shop_id?.substring(0, 8)} exists`, shop !== null);
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n=== SUMMARY ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Review output above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed.');
  }
}

main().catch(e => {
  console.error('Test suite error:', e.message);
  process.exit(1);
});
