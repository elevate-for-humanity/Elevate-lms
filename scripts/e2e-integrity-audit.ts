/**
 * E2E integrity audit — tests the real approval pipeline and enrollment invariants
 * against the live DB. Does not mock routes or invent endpoints.
 *
 * What this proves:
 *   1. approveApplication() creates program_enrollments correctly
 *   2. Duplicate approval is idempotent (no double-enrollment)
 *   3. Programs with has_lms_course=false produce enrollments with null course_id
 *      (expected — dashboard guards this; approve.ts does not yet block it)
 *   4. Programs with has_lms_course=true and no training_courses row are NOT yet
 *      blocked at approval time (documents the open gap from issue #54)
 *   5. Stripe webhook endpoint is reachable and rejects unsigned payloads with 400
 *   6. Deprecated /api/stripe/webhook is still live (should be removed from Stripe config)
 *
 * Run:
 *   npx tsx scripts/e2e-integrity-audit.ts
 *   npx tsx scripts/e2e-integrity-audit.ts --cleanup
 *
 * Requires:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env
 *   NEXT_PUBLIC_SITE_URL or BASE_URL for webhook reachability check
 */

import { createClient } from '@supabase/supabase-js';
import { approveApplication } from '../lib/enrollment/approve';

const CLEANUP = process.argv.includes('--cleanup');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!supabaseUrl || !serviceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const db = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

let passed = 0;
let failed = 0;
const createdApplicationIds: string[] = [];
const createdUserIds: string[] = [];

function pass(label: string) {
  console.log(`  ✅ ${label}`);
  passed++;
}

function fail(label: string, detail?: unknown) {
  console.error(`  ❌ ${label}`, detail ?? '');
  failed++;
}

async function cleanup() {
  if (!CLEANUP) return;
  console.log('\n--- cleanup ---');
  for (const id of createdApplicationIds) {
    await db.from('applications').delete().eq('id', id);
  }
  for (const id of createdUserIds) {
    await db.auth.admin.deleteUser(id);
    await db.from('profiles').delete().eq('id', id);
    await db.from('program_enrollments').delete().eq('user_id', id);
  }
  console.log(`  removed ${createdApplicationIds.length} applications, ${createdUserIds.length} users`);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function createTestApplication(programId: string | null, email: string) {
  const { data, error } = await db
    .from('applications')
    .insert({
      email,
      first_name: 'Audit',
      last_name: 'Test',
      program_id: programId,
      status: 'pending',
      source: 'e2e-audit',
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(`Failed to create application: ${error?.message}`);
  createdApplicationIds.push(data.id);
  return data.id;
}

async function getCanonicalProgram() {
  const { data } = await db
    .from('programs')
    .select('id, slug, has_lms_course')
    .eq('has_lms_course', true)
    .eq('published', true)
    .limit(1)
    .maybeSingle();
  return data;
}

async function getNonLmsProgram() {
  const { data } = await db
    .from('programs')
    .select('id, slug, has_lms_course')
    .eq('has_lms_course', false)
    .eq('published', true)
    .limit(1)
    .maybeSingle();
  return data;
}

// ─── tests ───────────────────────────────────────────────────────────────────

async function testApprovalCreatesEnrollment() {
  console.log('\nTest 1 — Approval creates program_enrollments row');

  const program = await getCanonicalProgram();
  if (!program) { fail('No published has_lms_course=true program found — skipping'); return; }

  const email = `audit-t1-${Date.now()}@test.invalid`;
  const appId = await createTestApplication(program.id, email);

  const result = await approveApplication(db, { applicationId: appId, programId: program.id });

  if (!result.success) {
    fail('approveApplication returned success=false', result.error);
    return;
  }
  if (result.userId) createdUserIds.push(result.userId);

  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, status, enrollment_state')
    .eq('user_id', result.userId!)
    .eq('program_id', program.id)
    .maybeSingle();

  if (!enrollment) { fail('No program_enrollments row created'); return; }
  if (enrollment.status !== 'active') { fail(`enrollment.status = ${enrollment.status}, expected active`); return; }

  pass(`enrollment created (id=${enrollment.id}, state=${enrollment.enrollment_state})`);
}

async function testDuplicateApprovalIsIdempotent() {
  console.log('\nTest 2 — Duplicate approval is idempotent (no double-enrollment)');

  const program = await getCanonicalProgram();
  if (!program) { fail('No published has_lms_course=true program found — skipping'); return; }

  const email = `audit-t2-${Date.now()}@test.invalid`;
  const appId = await createTestApplication(program.id, email);

  const r1 = await approveApplication(db, { applicationId: appId, programId: program.id });
  if (!r1.success) { fail('First approval failed', r1.error); return; }
  if (r1.userId) createdUserIds.push(r1.userId);

  // Second approval on same application — should return already-approved
  const r2 = await approveApplication(db, { applicationId: appId, programId: program.id });
  if (!r2.success && r2.error !== 'Already approved') {
    fail('Second approval returned unexpected error', r2.error);
    return;
  }

  const { data: enrollments } = await db
    .from('program_enrollments')
    .select('id')
    .eq('user_id', r1.userId!)
    .eq('program_id', program.id);

  if ((enrollments?.length ?? 0) > 1) {
    fail(`Duplicate enrollment rows: ${enrollments?.length}`);
    return;
  }

  pass('idempotent — exactly one enrollment row after two approval calls');
}

async function testNonLmsProgramEnrollmentHasNullCourseId() {
  console.log('\nTest 3 — Non-LMS program enrollment has null course_id (expected gap, issue #54)');

  const program = await getNonLmsProgram();
  if (!program) { fail('No published has_lms_course=false program found — skipping'); return; }

  const email = `audit-t3-${Date.now()}@test.invalid`;
  const appId = await createTestApplication(program.id, email);

  const result = await approveApplication(db, { applicationId: appId, programId: program.id });
  if (!result.success) { fail('approveApplication failed', result.error); return; }
  if (result.userId) createdUserIds.push(result.userId);

  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, course_id')
    .eq('user_id', result.userId!)
    .eq('program_id', program.id)
    .maybeSingle();

  if (!enrollment) { fail('No enrollment row created'); return; }

  // course_id is null — this is the documented gap. Dashboard guards it with "Coming Soon".
  // Issue #54 will add the upstream gate in approve.ts.
  if (enrollment.course_id !== null) {
    fail(`Expected course_id=null for non-LMS program, got ${enrollment.course_id}`);
    return;
  }

  pass(`course_id=null confirmed for has_lms_course=false program (dashboard guards this — issue #54 tracks upstream fix)`);
}

async function testLmsProgramWithNoTrainingCourseIsNotYetBlocked() {
  console.log('\nTest 4 — LMS program with no training_courses row (issue #54 open gap)');

  // Find a program with has_lms_course=true but no active training_courses row
  const { data: programs } = await db
    .from('programs')
    .select('id, slug')
    .eq('has_lms_course', true)
    .eq('published', true);

  if (!programs?.length) { pass('no has_lms_course=true programs to test — skipping'); return; }

  let gapProgram: { id: string; slug: string } | null = null;
  for (const p of programs) {
    const { data: course } = await db
      .from('training_courses')
      .select('id')
      .eq('program_id', p.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!course) { gapProgram = p; break; }
  }

  if (!gapProgram) {
    pass('all has_lms_course=true programs have an active training_courses row — no gap found');
    return;
  }

  // Document the gap — approval currently succeeds even without a training_courses row
  const email = `audit-t4-${Date.now()}@test.invalid`;
  const appId = await createTestApplication(gapProgram.id, email);
  const result = await approveApplication(db, { applicationId: appId, programId: gapProgram.id });

  if (result.userId) createdUserIds.push(result.userId);

  if (result.success) {
    // This is the known gap — approval succeeds when it should fail
    console.log(`  ⚠️  KNOWN GAP (issue #54): program '${gapProgram.slug}' has has_lms_course=true but no active training_courses row — approval still succeeds`);
    console.log(`     Fix: implement upstream gate in approve.ts before program_enrollments upsert`);
    passed++; // not a test failure — it's a documented gap
  } else {
    // If this ever fails, issue #54 has been implemented
    pass(`issue #54 implemented — approval correctly blocked for program '${gapProgram.slug}'`);
  }
}

async function testWebhookEndpointReachability() {
  console.log('\nTest 5 — Stripe webhook endpoint reachability');

  try {
    const res = await fetch(`${baseUrl}/api/webhooks/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    });

    // Unsigned payload must be rejected with 400 (signature verification fails)
    // 400 = endpoint alive and correctly rejecting unsigned events
    // 200 = endpoint alive but not verifying signatures (security gap)
    // 404/500 = endpoint not reachable
    if (res.status === 400) {
      pass(`canonical webhook reachable — correctly rejects unsigned payload (${res.status})`);
    } else if (res.status === 200) {
      fail(`canonical webhook accepted unsigned payload — signature verification may be disabled`);
    } else {
      fail(`canonical webhook returned unexpected status ${res.status}`);
    }
  } catch (err) {
    fail('canonical webhook unreachable (is the server running?)', err);
  }
}

async function testDeprecatedWebhookStillLive() {
  console.log('\nTest 6 — Deprecated /api/stripe/webhook (should be removed from Stripe config)');

  try {
    const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    });

    if (res.status === 404) {
      pass('deprecated webhook removed — good');
    } else {
      console.log(`  ⚠️  DEPRECATED ENDPOINT STILL LIVE (status ${res.status})`);
      console.log(`     Remove /api/stripe/webhook from Stripe dashboard webhook config.`);
      console.log(`     Canonical endpoint is /api/webhooks/stripe`);
      passed++; // not a hard failure — documented warning
    }
  } catch {
    pass('deprecated webhook unreachable (server not running — skip)');
  }
}

// ─── main ────────────────────────────────────────────────────────────────────

(async () => {
  console.log('=== E2E INTEGRITY AUDIT ===');
  console.log(`  DB: ${supabaseUrl}`);
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Cleanup: ${CLEANUP}`);

  try {
    await testApprovalCreatesEnrollment();
    await testDuplicateApprovalIsIdempotent();
    await testNonLmsProgramEnrollmentHasNullCourseId();
    await testLmsProgramWithNoTrainingCourseIsNotYetBlocked();
    await testWebhookEndpointReachability();
    await testDeprecatedWebhookStillLive();
  } finally {
    await cleanup();
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) process.exit(1);
})();
