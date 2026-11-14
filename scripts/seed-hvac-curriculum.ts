/**
 * Canonical HVAC / EPA Section 608 course seed.
 *
 * The HVAC blueprint intentionally uses curriculum_lessons as a one-time
 * legacy content source while writing the learner-facing canonical graph:
 * courses -> course_modules -> course_lessons -> lms_lessons.
 *
 * Usage:
 *   npx tsx scripts/seed-hvac-curriculum.ts           # dry run
 *   npx tsx scripts/seed-hvac-curriculum.ts --apply   # fill missing canonical rows
 *   npx tsx scripts/seed-hvac-curriculum.ts --force   # replace canonical course
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { HVAC_EPA608_BLUEPRINT } from '../lib/curriculum/blueprints/hvac-epa-608';
import { generateCourseFromBlueprint } from '../lib/curriculum/generate-course-from-blueprint';

const APPLY = process.argv.includes('--apply') || process.argv.includes('--force');
const FORCE = process.argv.includes('--force');
const PROGRAM_SLUG = HVAC_EPA608_BLUEPRINT.programSlug;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

async function main() {
  console.log(`\nHVAC canonical course seed`);
  console.log(`Blueprint: ${HVAC_EPA608_BLUEPRINT.id} v${HVAC_EPA608_BLUEPRINT.version}`);
  console.log(`Modules: ${HVAC_EPA608_BLUEPRINT.expectedModuleCount}`);
  console.log(`Lessons: ${HVAC_EPA608_BLUEPRINT.expectedLessonCount}`);

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
    blueprintSlug: HVAC_EPA608_BLUEPRINT.id,
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
