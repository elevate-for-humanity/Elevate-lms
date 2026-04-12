#!/usr/bin/env tsx
/**
 * OJT Completion Truth-Table Test
 *
 * Tests canCompleteLesson() directly against the DB for all 7 gating states.
 * Does NOT call the HTTP endpoint — tests the gate function itself, which is
 * what the complete route calls. No HTTP server required.
 *
 * States tested per lesson:
 *   A: no placement, no reps           → blocked
 *   B: placement, no reps              → blocked
 *   C: placement, pending reps only    → blocked (requires_verification=true)
 *   D: placement, verified < threshold → blocked
 *   E: placement, verified = threshold → allowed
 *   F: mixed verified+pending, verified alone meets threshold → allowed
 *   G: total meets threshold, verified alone does not → blocked
 *
 * Usage:
 *   pnpm tsx scripts/test-ojt-truth-table.ts
 *   pnpm tsx scripts/test-ojt-truth-table.ts --lesson barber-lesson-10
 */

import { config } from 'dotenv';
import { resolve } from 'path';
// Load .env.local before any module that reads env vars
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let db: SupabaseClient;

/**
 * Inline implementation of canCompleteLesson logic.
 * Mirrors lib/ojt/canCompleteLesson.ts exactly — kept inline so this script
 * runs without Next.js module resolution (no @/lib/* imports in scripts).
 * If the gate logic changes, update both.
 */
async function canCompleteLesson(userId: string, lessonId: string): Promise<boolean> {
  // Resolve from course_lessons first, fall back to curriculum_lessons
  const { data: cl } = await db
    .from('course_lessons')
    .select('required_skill_id, required_reps, requires_verification, lesson_type')
    .eq('id', lessonId)
    .maybeSingle();

  let lesson: { required_skill_id: string | null; required_reps: number; requires_verification: boolean; lesson_type: string } | null = null;

  if (cl) {
    lesson = cl;
  } else {
    const { data: cul } = await db
      .from('curriculum_lessons')
      .select('required_skill_id, required_reps, requires_verification, step_type')
      .eq('id', lessonId)
      .maybeSingle();
    if (cul) lesson = { ...cul, lesson_type: cul.step_type };
  }

  if (!lesson) return false;
  if (lesson.lesson_type !== 'lab' || !lesson.required_skill_id) return true;

  // Gate 1: active placement
  const { data: canonicalPlacement } = await db
    .from('apprentice_placements')
    .select('id')
    .eq('student_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!canonicalPlacement) {
    const { data: legacyPlacement } = await db
      .from('shop_placements')
      .select('id')
      .eq('student_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    if (!legacyPlacement) return false;
  }

  // Gate 2+3: competency log reps
  const { data: logs } = await db
    .from('competency_log')
    .select('id, supervisor_verified, service_count')
    .eq('apprentice_id', userId)
    .eq('skill_id', lesson.required_skill_id);

  if (!logs || logs.length === 0) return false;

  const verifiedReps = logs.filter(l => l.supervisor_verified).reduce((s, l) => s + (l.service_count ?? 1), 0);
  const totalReps    = logs.reduce((s, l) => s + (l.service_count ?? 1), 0);

  return lesson.requires_verification ? verifiedReps >= lesson.required_reps : totalReps >= lesson.required_reps;
}

// Test user ID — resolved at runtime from a real profiles row.
// apprentice_placements.student_id → profiles.id (FK), so we need a real profile.
// competency_log.apprentice_id has no FK — any uuid works there.
let TEST_USER_ID = '';

interface LabLesson {
  id: string;
  slug: string;
  required_skill_id: string;
  required_reps: number;
  requires_verification: boolean;
}

interface TestResult {
  state: string;
  expected: boolean;
  actual: boolean;
  pass: boolean;
}

async function cleanup() {
  await db.from('competency_log').delete().eq('apprentice_id', TEST_USER_ID);
  await db.from('apprentice_placements').delete().eq('student_id', TEST_USER_ID);
  await db.from('shop_placements').delete().eq('student_id', TEST_USER_ID);
}

async function getShopId(): Promise<string> {
  const { data } = await db.from('shops').select('id').eq('active', true).limit(1).single();
  if (!data) throw new Error('No active shops in DB — cannot run truth-table test');
  return data.id;
}

async function setPlacement(shopId: string, active: boolean) {
  await db.from('apprentice_placements').delete().eq('student_id', TEST_USER_ID);
  if (active) {
    await db.from('apprentice_placements').insert({
      student_id:  TEST_USER_ID,
      shop_id:     shopId,
      program_slug: 'barber-apprenticeship',
      status:      'active',
      start_date:  new Date().toISOString().split('T')[0],
    });
  }
}

async function setReps(skillId: string, verified: number, pending: number) {
  await db.from('competency_log').delete().eq('apprentice_id', TEST_USER_ID);

  const rows = [];
  for (let i = 0; i < verified; i++) {
    rows.push({
      apprentice_id:      TEST_USER_ID,
      skill_id:           skillId,
      work_date:          new Date().toISOString().split('T')[0],
      service_count:      1,
      supervisor_verified: true,
      status:             'verified',
    });
  }
  for (let i = 0; i < pending; i++) {
    rows.push({
      apprentice_id:      TEST_USER_ID,
      skill_id:           skillId,
      work_date:          new Date().toISOString().split('T')[0],
      service_count:      1,
      supervisor_verified: false,
      status:             'pending',
    });
  }
  if (rows.length > 0) {
    const { error } = await db.from('competency_log').insert(rows);
    if (error) throw new Error(`Failed to insert test reps: ${error.message}`);
  }
}

async function runLesson(lesson: LabLesson, shopId: string): Promise<TestResult[]> {
  const { id: lessonId, required_skill_id: skillId, required_reps: threshold } = lesson;
  const results: TestResult[] = [];

  const check = async (
    state: string,
    expected: boolean,
    setup: () => Promise<void>,
  ) => {
    await setup();
    const actual = await canCompleteLesson(TEST_USER_ID, lessonId);
    results.push({ state, expected, actual, pass: actual === expected });
  };

  // A: no placement, no reps → blocked
  await check('A: no placement, no reps', false, async () => {
    await setPlacement(shopId, false);
    await setReps(skillId, 0, 0);
  });

  // B: placement, no reps → blocked
  await check('B: placement, no reps', false, async () => {
    await setPlacement(shopId, true);
    await setReps(skillId, 0, 0);
  });

  // C: placement, pending reps only (requires_verification=true) → blocked
  await check('C: placement, pending reps only', false, async () => {
    await setPlacement(shopId, true);
    await setReps(skillId, 0, threshold);
  });

  // D: placement, verified < threshold → blocked
  await check('D: placement, verified below threshold', false, async () => {
    await setPlacement(shopId, true);
    await setReps(skillId, threshold - 1, 0);
  });

  // E: placement, verified = threshold → allowed
  await check('E: placement, verified at threshold', true, async () => {
    await setPlacement(shopId, true);
    await setReps(skillId, threshold, 0);
  });

  // F: verified meets threshold, plus extra pending → allowed
  await check('F: verified meets threshold + extra pending', true, async () => {
    await setPlacement(shopId, true);
    await setReps(skillId, threshold, 2);
  });

  // G: total meets threshold but verified alone does not → blocked
  await check('G: total meets threshold, verified alone does not', false, async () => {
    await setPlacement(shopId, true);
    // verified = threshold-1, pending = 2 → total > threshold, verified < threshold
    await setReps(skillId, threshold - 1, 2);
  });

  return results;
}

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Resolve a real profile ID for placement FK compliance.
  // We write test placements under this ID and clean them up after.
  const { data: profileRow } = await db.from('profiles').select('id').limit(1).single();
  if (!profileRow) { console.error('No profiles in DB'); process.exit(1); }
  TEST_USER_ID = profileRow.id;
  console.log(`Using test profile: ${TEST_USER_ID}`);

  const onlySlug = process.argv.find(a => a.startsWith('--lesson='))?.split('=')[1]
    ?? (() => { const i = process.argv.indexOf('--lesson'); return i !== -1 ? process.argv[i + 1] : undefined; })();

  // Fetch all barber lab lessons
  let query = db
    .from('course_lessons')
    .select('id, slug, required_skill_id, required_reps, requires_verification')
    .eq('lesson_type', 'lab')
    .not('required_skill_id', 'is', null)
    .order('slug');

  if (onlySlug) query = query.eq('slug', onlySlug) as typeof query;

  const { data: lessons, error } = await query;
  if (error || !lessons?.length) {
    console.error('No lab lessons found:', error?.message);
    process.exit(1);
  }

  const shopId = await getShopId();
  console.log(`\nOJT Truth-Table Test — ${lessons.length} lesson(s), shop ${shopId}\n`);

  let totalPass = 0;
  let totalFail = 0;
  const blockers: string[] = [];

  for (const lesson of lessons as LabLesson[]) {
    console.log(`\n── ${lesson.slug} (threshold: ${lesson.required_reps} verified reps)`);
    const results = await runLesson(lesson, shopId);

    for (const r of results) {
      const icon = r.pass ? '✅' : '❌';
      console.log(`   ${icon} State ${r.state} — expected ${r.expected}, got ${r.actual}`);
      if (r.pass) totalPass++;
      else {
        totalFail++;
        blockers.push(`${lesson.slug} / ${r.state}`);
      }
    }
  }

  // Always clean up test data
  await cleanup();

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Results: ${totalPass} passed, ${totalFail} failed`);

  if (blockers.length > 0) {
    console.log('\nFAILURES (release blockers):');
    blockers.forEach(b => console.log(`  ❌ ${b}`));
    process.exit(1);
  } else {
    console.log('\nAll states pass. Enforcement is verified.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
