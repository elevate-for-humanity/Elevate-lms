#!/usr/bin/env tsx
import { buildCourseFromBlueprint } from '../lib/services/curriculum-generator';
import { prsIndianaBlueprint } from '../lib/curriculum/blueprints/prs-indiana';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
}

const dryRun = process.argv.includes('--dry-run');

console.log(`Running PRS Indiana seed (dryRun=${dryRun})...`);
console.log(`  programSlug: ${prsIndianaBlueprint.programSlug}`);
console.log(`  modules: ${prsIndianaBlueprint.modules.length}`);
console.log(`  lessons: ${prsIndianaBlueprint.expectedLessonCount}`);

const result = await buildCourseFromBlueprint(prsIndianaBlueprint, {
  seedMode: true,
  dryRun,
});

console.log('\nResult:');
console.log(`  programSlug : ${result.programSlug}`);
console.log(`  programId   : ${result.programId}`);
console.log(`  courseId    : ${result.courseId}`);
console.log(`  modules     : ${result.modules.length}`);
console.log(`  totalLessons: ${result.totalLessons}`);
console.log(`  upserted    : ${result.upserted}`);
console.log(`  skipped     : ${result.skipped}`);

if (result.skipped > 0) {
  for (const mod of result.modules) {
    for (const l of mod.lessons) {
      if (l.status === 'skipped') console.log(`  SKIP ${l.lessonSlug}: ${l.reason}`);
    }
  }
}
