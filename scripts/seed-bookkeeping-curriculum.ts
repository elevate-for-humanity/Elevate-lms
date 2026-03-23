/**
 * scripts/seed-bookkeeping-curriculum.ts
 *
 * Seeds the Bookkeeping & QuickBooks curriculum into curriculum_lessons.
 * Idempotent — safe to re-run. Uses 'seed_missing' mode by default.
 *
 * Prerequisites (must exist in DB before running):
 *   - programs row with slug = 'bookkeeping'
 *
 * Usage:
 *   npx tsx scripts/seed-bookkeeping-curriculum.ts           # dry run
 *   npx tsx scripts/seed-bookkeeping-curriculum.ts --apply   # write to DB
 *   npx tsx scripts/seed-bookkeeping-curriculum.ts --force   # overwrite existing
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { CurriculumGenerator } from '../lib/services/curriculum-generator';
import { bookkeepingQuickbooksBlueprint } from '../lib/curriculum/blueprints/bookkeeping-quickbooks';

const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');
const PROGRAM_SLUG = 'bookkeeping';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  console.log(`\nBookkeeping Curriculum Seed`);
  console.log(`Mode: ${APPLY ? (FORCE ? 'FORCE' : 'APPLY') : 'DRY RUN'}`);
  console.log(`Blueprint: ${bookkeepingQuickbooksBlueprint.id} v${bookkeepingQuickbooksBlueprint.version}`);
  console.log(`Modules: ${bookkeepingQuickbooksBlueprint.expectedModuleCount}`);
  console.log(`Lessons: ${bookkeepingQuickbooksBlueprint.expectedLessonCount}\n`);

  if (!APPLY) {
    console.log('--- DRY RUN: pass --apply to write to DB ---\n');
    console.log('Would seed:');
    for (const mod of bookkeepingQuickbooksBlueprint.modules) {
      console.log(`  Module ${mod.orderIndex}: ${mod.title} (${mod.lessons?.length ?? 0} lessons)`);
      for (const lesson of mod.lessons ?? []) {
        const isCheckpoint = lesson.slug.endsWith('-checkpoint') || lesson.slug.endsWith('-exam');
        console.log(`    ${lesson.order}. [${isCheckpoint ? 'checkpoint' : 'lesson'}] ${lesson.title}`);
      }
    }
    return;
  }

  // 1. Resolve program row
  const { data: program, error: progErr } = await supabase
    .from('programs')
    .select('id, slug, title')
    .eq('slug', PROGRAM_SLUG)
    .single();

  if (progErr || !program) {
    throw new Error(
      `Program "${PROGRAM_SLUG}" not found in DB.\n` +
      `Run the programs seed first, or create the row manually.\n` +
      `Error: ${progErr?.message ?? 'no row returned'}`
    );
  }
  console.log(`Program: ${program.title} (${program.id})\n`);

  // 2. Resolve canonical courses row for course_id linkage.
  // The courses row is created by the canonicalization migration; it may not
  // exist yet if the migration hasn't been applied. Seed proceeds without it —
  // the migration backfills course_id after the fact.
  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title')
    .eq('program_id', program.id)
    .maybeSingle();

  const courseId = course?.id ?? null;
  if (courseId) {
    console.log(`Linked course: ${course!.title} (${courseId})`);
  } else {
    console.log(`No courses row found for program_id ${program.id} — lessons will seed without course_id.`);
    console.log(`Apply 20260504000000_lms_course_canonicalization.sql to backfill course_id after seeding.`);
  }

  // 3. Run generator
  const mode = FORCE ? 'force' : 'seed_missing';
  const gen = new CurriculumGenerator(program.id, null, mode);
  await gen.loadExistingSlugs();

  for (const mod of bookkeepingQuickbooksBlueprint.modules) {
    await gen.upsertModule({
      slug:        mod.slug,
      title:       mod.title,
      description: `Module ${mod.orderIndex} of the Bookkeeping & QuickBooks program.`,
      orderIndex:  mod.orderIndex,
    });

    for (const lesson of mod.lessons ?? []) {
      const isCheckpoint = lesson.slug.endsWith('-checkpoint');
      const isFinalExam  = lesson.slug.endsWith('-final-certification-exam') || lesson.slug === 'bk-final-certification-exam';

      let stepType: 'lesson' | 'checkpoint' | 'exam' = 'lesson';
      if (isFinalExam)  stepType = 'exam';
      else if (isCheckpoint) stepType = 'checkpoint';

      await gen.upsertLesson({
        lessonSlug:   lesson.slug,
        lessonTitle:  lesson.title,
        moduleSlug:   mod.slug,
        lessonOrder:  lesson.order - 1,   // 0-based in generator
        moduleOrder:  mod.orderIndex - 1, // 0-based in generator
        moduleTitle:  mod.title,
        stepType,
        passingScore: stepType === 'lesson' ? 0 : 70,
        courseId:     courseId ?? undefined,
      });
    }
  }

  const summary = gen.summarize();
  console.log('\n--- Seed Summary ---');
  console.log(`Modules upserted:  ${summary.modulesUpserted}`);
  console.log(`Lessons upserted:  ${summary.lessonsUpserted}`);
  console.log(`Lessons skipped:   ${summary.lessonsSkipped}`);
  if (summary.errors.length > 0) {
    console.error(`\nErrors (${summary.errors.length}):`);
    summary.errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }
  console.log('\nDone. Bookkeeping curriculum seeded successfully.');
}

main().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
