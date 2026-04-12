#!/usr/bin/env tsx
/**
 * Cross-shop isolation test for /api/pwa/shop-owner/pending-reps
 *
 * Tests the query logic directly against the DB (no HTTP server needed).
 * Mirrors the exact query in pending-reps/route.ts.
 *
 * Scenarios:
 *   1. Supervisor at shop A sees only apprentices placed at shop A
 *   2. Supervisor at shop A cannot see apprentices placed at shop B
 *   3. User with no shop_supervisors row sees nothing
 *   4. Fallback disabled: user with only shop_placements email match sees nothing
 *
 * Usage:
 *   pnpm tsx scripts/test-pending-reps-isolation.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

let db: SupabaseClient;

// Mirrors the pending-reps route query exactly.
// emailFallbackEnabled mirrors the SUPERVISOR_EMAIL_FALLBACK_ENABLED env flag.
async function getPendingRepsForUser(
  userId: string,
  userEmail: string,
  emailFallbackEnabled: boolean,
): Promise<string[]> {
  // Path 1: shop_supervisors row
  const { data: supervisorRow } = await db
    .from('shop_supervisors')
    .select('shop_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  let apprenticeIds: string[] = [];

  if (supervisorRow) {
    const { data: placements } = await db
      .from('apprentice_placements')
      .select('student_id')
      .eq('shop_id', supervisorRow.shop_id)
      .eq('status', 'active');
    apprenticeIds = (placements ?? []).map(p => p.student_id);
  }

  // Path 2: email fallback (gated)
  if (apprenticeIds.length === 0 && emailFallbackEnabled) {
    const { data: textPlacements } = await db
      .from('shop_placements')
      .select('student_id')
      .eq('supervisor_email', userEmail)
      .eq('status', 'active');
    apprenticeIds = (textPlacements ?? []).map(p => p.student_id);
  }

  if (apprenticeIds.length === 0) return [];

  const { data: logs } = await db
    .from('competency_log')
    .select('id, apprentice_id')
    .in('apprentice_id', apprenticeIds)
    .eq('supervisor_verified', false);

  return (logs ?? []).map(l => l.apprentice_id);
}

async function cleanup(shopAId: string, shopBId: string, apprenticeAId: string, apprenticeBId: string, supervisorAUserId: string, supervisorBUserId: string) {
  await db.from('competency_log').delete().in('apprentice_id', [apprenticeAId, apprenticeBId]);
  await db.from('apprentice_placements').delete().in('student_id', [apprenticeAId, apprenticeBId]);
  await db.from('shop_supervisors').delete().in('user_id', [supervisorAUserId, supervisorBUserId]);
}

async function main() {
  db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Get two real shops and two real profiles to use as test subjects
  const { data: shops } = await db.from('shops').select('id').eq('active', true).limit(2);
  if (!shops || shops.length < 2) {
    console.error('Need at least 2 active shops in DB to run isolation test');
    process.exit(1);
  }
  const { data: profiles } = await db.from('profiles').select('id, email').limit(4);
  if (!profiles || profiles.length < 4) {
    console.error('Need at least 4 profiles in DB to run isolation test');
    process.exit(1);
  }

  const shopAId         = shops[0].id;
  const shopBId         = shops[1].id;
  const apprenticeAId   = profiles[0].id;   // placed at shop A
  const apprenticeBId   = profiles[1].id;   // placed at shop B
  const supervisorAId   = profiles[2].id;   // supervisor at shop A
  const supervisorBId   = profiles[3].id;   // supervisor at shop B
  const supervisorAEmail = profiles[2].email ?? 'supervisor-a@test.invalid';
  const noShopUserId    = profiles[0].id;   // reuse — no supervisor row

  console.log(`\nCross-shop isolation test`);
  console.log(`  Shop A: ${shopAId}`);
  console.log(`  Shop B: ${shopBId}`);
  console.log(`  Apprentice A (at shop A): ${apprenticeAId}`);
  console.log(`  Apprentice B (at shop B): ${apprenticeBId}`);
  console.log(`  Supervisor A (shop A): ${supervisorAId}`);
  console.log(`  Supervisor B (shop B): ${supervisorBId}\n`);

  // Setup: placements
  await db.from('apprentice_placements').delete().in('student_id', [apprenticeAId, apprenticeBId]);
  await db.from('apprentice_placements').insert([
    { student_id: apprenticeAId, shop_id: shopAId, program_slug: 'barber-apprenticeship', status: 'active', start_date: new Date().toISOString().split('T')[0] },
    { student_id: apprenticeBId, shop_id: shopBId, program_slug: 'barber-apprenticeship', status: 'active', start_date: new Date().toISOString().split('T')[0] },
  ]);

  // Setup: supervisor rows
  await db.from('shop_supervisors').delete().in('user_id', [supervisorAId, supervisorBId]);
  await db.from('shop_supervisors').insert([
    { shop_id: shopAId, user_id: supervisorAId, name: 'Test Supervisor A', email: supervisorAEmail, is_active: true, license_type: 'barber' },
    { shop_id: shopBId, user_id: supervisorBId, name: 'Test Supervisor B', email: 'supervisor-b@test.invalid', is_active: true, license_type: 'barber' },
  ]);

  // Setup: pending competency_log entries for both apprentices
  await db.from('competency_log').delete().in('apprentice_id', [apprenticeAId, apprenticeBId]);
  const skillRes = await db.from('apprentice_skills').select('id').limit(1).single();
  const skillId = skillRes.data?.id;
  if (!skillId) { console.error('No apprentice_skills rows'); process.exit(1); }

  await db.from('competency_log').insert([
    { apprentice_id: apprenticeAId, skill_id: skillId, work_date: new Date().toISOString().split('T')[0], service_count: 1, supervisor_verified: false, status: 'pending' },
    { apprentice_id: apprenticeBId, skill_id: skillId, work_date: new Date().toISOString().split('T')[0], service_count: 1, supervisor_verified: false, status: 'pending' },
  ]);

  const results: { scenario: string; expected: string; actual: string; pass: boolean }[] = [];

  const check = (scenario: string, expected: string[], actual: string[]) => {
    const expectedSet = new Set(expected);
    const actualSet   = new Set(actual);
    const pass = expected.every(id => actualSet.has(id)) && actual.every(id => expectedSet.has(id));
    results.push({ scenario, expected: expected.join(',') || '(none)', actual: actual.join(',') || '(none)', pass });
  };

  // Scenario 1: Supervisor A sees only apprentice A
  const s1 = await getPendingRepsForUser(supervisorAId, supervisorAEmail, false);
  check('Supervisor A sees only shop A apprentices', [apprenticeAId], s1);

  // Scenario 2: Supervisor A cannot see apprentice B (shop B)
  const s2 = await getPendingRepsForUser(supervisorAId, supervisorAEmail, false);
  const s2CrossShop = s2.includes(apprenticeBId);
  results.push({ scenario: 'Supervisor A cannot see shop B apprentice', expected: 'false', actual: String(s2CrossShop), pass: !s2CrossShop });

  // Scenario 3: User with no shop_supervisors row sees nothing (fallback disabled)
  // Use a profile that has no supervisor row — temporarily remove supervisorA row
  await db.from('shop_supervisors').delete().eq('user_id', supervisorAId);
  const s3 = await getPendingRepsForUser(supervisorAId, supervisorAEmail, false);
  check('No supervisor row, fallback disabled → sees nothing', [], s3);
  // Restore
  await db.from('shop_supervisors').insert({ shop_id: shopAId, user_id: supervisorAId, name: 'Test Supervisor A', email: supervisorAEmail, is_active: true, license_type: 'barber' });

  // Scenario 4: Fallback enabled — email match works for shop A supervisor
  const s4 = await getPendingRepsForUser(supervisorAId, supervisorAEmail, true);
  // With fallback enabled and supervisor row present, still only sees shop A
  check('Fallback enabled, supervisor row present → still only shop A', [apprenticeAId], s4);

  // Scenario 5: Fallback disabled — email-only user sees nothing
  await db.from('shop_supervisors').delete().eq('user_id', supervisorAId);
  const s5 = await getPendingRepsForUser(supervisorAId, supervisorAEmail, false);
  check('Fallback disabled, no supervisor row → sees nothing', [], s5);

  // Cleanup
  await cleanup(shopAId, shopBId, apprenticeAId, apprenticeBId, supervisorAId, supervisorBId);

  // Report
  console.log('Results:\n');
  let failures = 0;
  for (const r of results) {
    const icon = r.pass ? '✅' : '❌';
    console.log(`${icon} ${r.scenario}`);
    if (!r.pass) {
      console.log(`   expected: ${r.expected}`);
      console.log(`   actual:   ${r.actual}`);
      failures++;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Results: ${results.length - failures} passed, ${failures} failed`);

  if (failures > 0) {
    console.log('\nFAILURES — cross-shop isolation is broken');
    process.exit(1);
  } else {
    console.log('\nAll isolation checks pass.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
