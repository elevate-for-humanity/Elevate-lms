/**
 * Canonical Bookkeeping & QuickBooks course seed.
 *
 * Writes only to the canonical course graph:
 * courses -> course_modules -> course_lessons -> lms_lessons.
 *
 * Usage:
 *   npx tsx scripts/seed-bookkeeping-curriculum.ts           # dry run
 *   npx tsx scripts/seed-bookkeeping-curriculum.ts --apply   # fill missing content
 *   npx tsx scripts/seed-bookkeeping-curriculum.ts --force   # replace canonical course
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { bookkeepingQuickbooksBlueprint } from '../lib/curriculum/blueprints/bookkeeping-quickbooks';
import { generateCourseFromBlueprint } from '../lib/curriculum/generate-course-from-blueprint';

const APPLY = process.argv.includes('--apply') || process.argv.includes('--force');
const FORCE = process.argv.includes('--force');
const PROGRAM_SLUG = bookkeepingQuickbooksBlueprint.programSlug;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

async function main() {
  console.log(`\nBookkeeping canonical course seed`);
  console.log(`Blueprint: ${bookkeepingQuickbooksBlueprint.id} v${bookkeepingQuickbooksBlueprint.version}`);
  console.log(`Modules: ${bookkeepingQuickbooksBlueprint.expectedModuleCount}`);
  console.log(`Lessons: ${bookkeepingQuickbooksBlueprint.expectedLessonCount}`);

  if (!APPLY) {
    console.log('\nDRY RUN — pass --apply to write missing canonical rows or --force to replace.');
    return;
  }

  const { data: program, error } = await supabase
    .from('programs')
    .select('id, slug, title')
    .eq('slug', PROGRAM_SLUG)
    .maybeSingle();

  if (error || !program) {
    throw new Error(`Program '${PROGRAM_SLUG}' not found: ${error?.message ?? 'no row returned'}`);
  }

  const result = await generateCourseFromBlueprint({
    blueprintSlug: bookkeepingQuickbooksBlueprint.id,
    programId: program.id,
    mode: FORCE ? 'full' : 'missing-only',
  });

  console.log('\nCanonical build complete');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('\nFatal:', error instanceof Error ? error.message : error);
  process.exit(1);
});
