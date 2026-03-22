#!/usr/bin/env tsx
/**
 * seed-prs-curriculum
 *
 * Seeds the PRS Indiana blueprint into course_modules and course_lessons
 * using the canonical CurriculumGenerator.
 *
 * This is a SEED script — it writes placeholder content to course_lessons
 * so the learner path has visible rows. Real lesson content must be authored
 * separately (via the admin curriculum editor or direct DB update).
 *
 * Prerequisites:
 *   - programs row with slug='peer-recovery-specialist-jri' must exist
 *   - courses row with program_id=<that program's id> must exist
 *
 * Usage:
 *   pnpm tsx scripts/seed-prs-curriculum.ts
 *   pnpm tsx scripts/seed-prs-curriculum.ts --dry-run   (validate, no writes)
 *   pnpm tsx scripts/seed-prs-curriculum.ts --force     (re-upsert all rows)
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { buildCourseFromBlueprint } from '../lib/services/curriculum-generator';
import { prsIndianaBlueprint } from '../lib/curriculum/blueprints/prs-indiana';

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('[seed-prs-curriculum] DRY RUN — no writes will occur');
  } else {
    console.log('[seed-prs-curriculum] Seeding PRS Indiana blueprint → course_lessons');
    console.log('  programSlug:', prsIndianaBlueprint.programSlug);
    console.log('  modules:', prsIndianaBlueprint.modules.length);
    console.log('  lessons:', prsIndianaBlueprint.expectedLessonCount);
    console.log('');
    console.log('  NOTE: seedMode=true — placeholder content will be written.');
    console.log('  Author real lesson content via the admin curriculum editor.');
    console.log('');
  }

  const result = await buildCourseFromBlueprint(prsIndianaBlueprint, {
    seedMode: true,
    dryRun,
  });

  console.log('\n[seed-prs-curriculum] Result:');
  console.log(`  programSlug : ${result.programSlug}`);
  console.log(`  programId   : ${result.programId}`);
  console.log(`  courseId    : ${result.courseId}`);
  console.log(`  modules     : ${result.modules.length}`);
  console.log(`  totalLessons: ${result.totalLessons}`);
  console.log(`  upserted    : ${result.upserted}`);
  console.log(`  skipped     : ${result.skipped}`);

  if (result.skipped > 0) {
    console.log('\n  Skipped lessons:');
    for (const mod of result.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.status === 'skipped') {
          console.log(`    ${lesson.lessonSlug}: ${lesson.reason}`);
        }
      }
    }
  }

  if (!dryRun && result.upserted > 0) {
    console.log('\n  Next steps:');
    console.log('  1. Open /admin/curriculum/<courseId> to author lesson content');
    console.log('  2. Set step_type=checkpoint on module-boundary quiz lessons in the DB');
    console.log('  3. Run publish_course(<courseId>) when content is complete');
  }
}

main().catch((err) => {
  console.error('[seed-prs-curriculum] Fatal error:', err);
  process.exit(1);
});
