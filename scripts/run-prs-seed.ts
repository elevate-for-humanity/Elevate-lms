#!/usr/bin/env tsx
import { buildCourseFromBlueprint } from '../lib/services/curriculum-generator';
import { prsIndianaBlueprint } from '../lib/curriculum/blueprints/prs-indiana';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eHp6cHN5dWZjZXd0bWljc3prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE2MTA0NywiZXhwIjoyMDczNzM3MDQ3fQ.5JRYvJPzFzsVaZQkbZDLcohP7dq8LWQEFeFdVByyihE';

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
