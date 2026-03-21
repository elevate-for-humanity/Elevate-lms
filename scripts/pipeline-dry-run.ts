/**
 * PRS pipeline dry-run
 *
 * Exercises the full pipeline code path without writing to the DB:
 *   1. Validate the generator contract (types, schema)
 *   2. Run the structural alignment audit (read-only DB call)
 *   3. Run the content alignment audit (read-only DB call)
 *   4. Simulate the publish gate decision
 *   5. Report what would happen on a real publish
 *
 * Requires live DB credentials. Set in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Run:
 *   npx tsx scripts/pipeline-dry-run.ts
 *   npx tsx scripts/pipeline-dry-run.ts --program peer-recovery-specialist-jri
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { runAlignmentAudit, formatAuditReport } from '../lib/services/credential-alignment-audit';
import { runContentAlignmentAudit, formatContentAuditReport } from '../lib/curriculum/audit-alignment';
import { validateBatch } from '../lib/curriculum/validator';

const PROGRAM_SLUG = process.argv.includes('--program')
  ? process.argv[process.argv.indexOf('--program') + 1]
  : 'peer-recovery-specialist-jri';

const pass = (msg: string) => console.log(`✅ ${msg}`);
const fail = (msg: string) => console.log(`❌ ${msg}`);
const warn = (msg: string) => console.log(`⚠️  ${msg}`);
const info = (msg: string) => console.log(`   ${msg}`);
const section = (title: string) => {
  console.log('\n' + '='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
};

async function main() {
  console.log(`PRS Pipeline Dry-Run — ${new Date().toISOString()}`);
  console.log(`Program: ${PROGRAM_SLUG}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasDb = !!(supabaseUrl && serviceKey);

  if (!hasDb) {
    warn('No DB credentials — structural and content audits will be skipped.');
    info('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local for full run.');
  }

  let score = 0;
  const max = 5;

  // ── 1. Structural alignment audit ─────────────────────────────────────────
  section('1) STRUCTURAL ALIGNMENT AUDIT');
  if (!hasDb) { warn('Skipped — no DB credentials'); }
  if (hasDb) try {
    const structuralAudit = await runAlignmentAudit([PROGRAM_SLUG]);
    console.log(formatAuditReport(structuralAudit));

    const prog = structuralAudit.programs.find(p => p.programSlug === PROGRAM_SLUG);
    if (!prog) {
      fail(`Program "${PROGRAM_SLUG}" not found or not active`);
    } else if (prog.isAligned) {
      pass('Structural audit: ALIGNED');
      score++;
    } else {
      fail(`Structural audit: NOT ALIGNED — ${prog.gaps.length} gap(s)`);
      prog.gaps.forEach(g => info(`Gap: ${g}`));
    }
  } catch (err: any) {
    fail(`Structural audit threw: ${err.message}`);
  }

  // ── 2. Content alignment audit ─────────────────────────────────────────────
  section('2) CONTENT ALIGNMENT AUDIT');
  if (!hasDb) { warn('Skipped — no DB credentials'); }
  if (hasDb) try {
    const contentAudit = await runContentAlignmentAudit(PROGRAM_SLUG);
    console.log(formatContentAuditReport(contentAudit));

    if (contentAudit.isAligned) {
      pass('Content audit: ALIGNED');
      score++;
    } else {
      fail(
        `Content audit: NOT ALIGNED — ` +
        `${contentAudit.failingLessons} failing, ` +
        `${contentAudit.stuffedLessons} stuffed, ` +
        `${contentAudit.missingExamProfiles.length} missing profiles`
      );
    }
  } catch (err: any) {
    fail(`Content audit threw: ${err.message}`);
  }

  // ── 3. Publish gate simulation ─────────────────────────────────────────────
  section('3) PUBLISH GATE SIMULATION');
  if (!hasDb) { warn('Skipped — no DB credentials'); }
  info('Simulating: auto_publish=true, program_id=<PRS program id>');
  info('The gate calls runAlignmentAudit internally — result above determines outcome.');

  if (hasDb) try {
    // Re-run structural audit to simulate gate decision
    const gateAudit = await runAlignmentAudit([PROGRAM_SLUG]);
    const prog = gateAudit.programs.find(p => p.programSlug === PROGRAM_SLUG);

    if (!prog) {
      fail('Gate would return 422: program not found or inactive (fail closed)');
    } else if (prog.isAligned) {
      pass('Gate would ALLOW publication');
      score++;
    } else {
      warn('Gate would BLOCK publication with 422');
      info(`Gaps: ${prog.gaps.slice(0, 3).join('; ')}`);
      info('This is correct behavior — fix gaps before publishing live.');
    }
  } catch (err: any) {
    warn(`Gate simulation threw (would fail open in production): ${err.message}`);
  }

  // ── 4. Lesson contract validation ─────────────────────────────────────────
  section('4) LESSON CONTRACT VALIDATION');
  info('Checking validator module loads and exports correctly...');
  try {
    // validateBatch is a pure function — test with a minimal valid LessonContract
    const testLesson = {
      lesson_title: 'Introduction to Peer Recovery',
      lesson_slug: 'intro-peer-recovery',
      script_text: 'A'.repeat(350),          // >= MIN_SCRIPT_LENGTH (300)
      summary_text: 'B'.repeat(60),           // >= MIN_SUMMARY_LENGTH (50)
      reflection_prompt: 'C'.repeat(25),      // >= 20 chars
      competency_keys: ['recovery_support'],
      key_terms: ['peer support', 'recovery'],
      duration_minutes: 10,                   // >= 5
    };

    const result = validateBatch([testLesson as any]);
    if (result.allPassed) {
      pass('Lesson contract validator: valid lesson passes');
      score++;
    } else {
      const reasons = result.results.flatMap(r => r.errors as string[]);
      fail(`Lesson contract validator rejected valid lesson: ${reasons.join(' | ')}`);
    }

    // Test that an invalid lesson is caught (script_text too short)
    const invalidLesson = { ...testLesson, script_text: 'too short' };
    const invalidResult = validateBatch([invalidLesson as any]);
    if (!invalidResult.allPassed) {
      pass('Lesson contract validator: invalid lesson correctly rejected');
      score++;
    } else {
      fail('Lesson contract validator: invalid lesson was not rejected');
    }
  } catch (err: any) {
    fail(`Validator threw: ${err.message}`);
  }

  // ── 5. Scorecard ───────────────────────────────────────────────────────────
  section('PIPELINE DRY-RUN SCORECARD');
  console.log(`Score: ${score} / ${max}`);
  console.log('');

  if (score === max) {
    pass('Pipeline is production-ready for this program');
  } else if (score >= 3) {
    warn('Pipeline is partially ready — address failures above before opening to partners');
  } else {
    fail('Pipeline has critical gaps — do not publish live content until resolved');
  }

  console.log('\nNext steps if any checks failed:');
  console.log('  1. Apply pending migrations (003-006) in Supabase Dashboard');
  console.log('  2. Apply storage policies from migration 004 comments');
  console.log('  3. Run seed-prs-curriculum.ts to populate curriculum_lessons');
  console.log('  4. Re-run this script until score = 5/5');
  console.log('  5. Then run runtime-proof-prs.sh for the full DB-level proof');
}

main().catch(err => {
  console.error('Dry-run failed:', err);
  process.exit(1);
});
