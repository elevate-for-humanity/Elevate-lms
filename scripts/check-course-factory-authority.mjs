import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function read(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    failures.push(`Missing required file: ${rel}`);
    return '';
  }
  return fs.readFileSync(abs, 'utf8');
}

function assertContains(rel, needle, reason) {
  const text = read(rel);
  if (!text.includes(needle)) failures.push(`${rel}: ${reason}`);
}

function walk(dir, out = []) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (['node_modules', '.next', 'dist', 'build', 'archive'].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(?:ts|tsx|js|mjs|cjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

// All historical generation/orchestration entry points must delegate to Course Factory.
const requiredDelegations = [
  ['lib/course-builder/pipeline.ts', "from '@/lib/course-factory'", 'legacy pipeline'],
  ['lib/course-builder/program-auto-course.ts', "from '@/lib/course-factory'", 'program auto-course'],
  ['apps/admin/app/api/admin/course-builder/publish/route.ts', "from '@/lib/course-factory'", 'Admin builder publish'],
  ['apps/lms/app/api/ai/generate-and-publish-course/route.ts', "from '@/lib/course-factory'", 'AI generate-and-publish'],
  ['lib/curriculum/builders/buildCanonicalCourseFromBlueprint.ts', "from '@/lib/course-factory/publisher'", 'blueprint seeder'],
  ['lib/db/save-blueprint-canonical.ts', "from '@/lib/course-factory/publisher'", 'ingestion blueprint persistence'],
  ['lib/programs/create-and-publish-program.ts', "from '@/lib/course-factory/publisher'", 'program course persistence'],
  ['lib/studio/tools.ts', '@/lib/course-factory/publisher', 'Studio full-blueprint build'],
];

for (const [rel, needle, label] of requiredDelegations) {
  assertContains(rel, needle, `${label} must delegate to the canonical Course Factory`);
}

// Course Builder UI surfaces must not call the retired two-stage draft writer.
for (const rel of [...walk('components/admin/course-builder'), ...walk('components/course')]) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  if (text.includes('/api/admin/courses/generate')) {
    failures.push(`${rel}: retired draft generation API referenced from Course Builder UI`);
  }
}

// Historical Supabase AI creator must remain non-executable.
const edge = read('supabase/functions/ai-course-create/index.ts');
if (
  !edge.includes('COURSE_FACTORY_REQUIRED') ||
  /\.from\(['\"](?:courses|modules|lessons)['\"]\)\s*\.(?:insert|upsert|update|delete)/s.test(edge)
) {
  failures.push(
    'supabase/functions/ai-course-create/index.ts: historical AI creator must remain disabled and must not write course tables',
  );
}

// These files legitimately touch all three canonical tables but do NOT own a
// generation pipeline. Each exception has a narrow role and is reviewed here
// explicitly so a new full-package writer cannot appear unnoticed.
const specializedPackageWriters = new Set([
  // cloning preserves existing course/program content; it does not generate curriculum
  'apps/admin/app/api/admin/courses/[courseId]/clone/route.ts',
  'apps/admin/app/api/admin/programs/[programId]/clone/route.ts',
  // version rollback restores an immutable prior snapshot
  'lib/course-factory/versioning.ts',
  // generic/manual entity CRUD and lifecycle services
  'lib/db/courses.ts',
  'lib/lms/course-service.ts',
  // Studio contains individual manual create/edit operations; its full build delegates above
  'lib/studio/tools.ts',
  // non-runtime verification/seed utilities
  'scripts/e2e-test.ts',
  'scripts/run-pipeline-e2e.ts',
  'scripts/seed/apprenticeship-courses.mjs',
  'scripts/smoke-test-pipeline.ts',
]);

// A newly introduced complete package writer is forbidden by default.
for (const rel of [...walk('apps'), ...walk('lib'), ...walk('scripts'), ...walk('supabase/functions')]) {
  const normalized = rel.split(path.sep).join('/');
  if (normalized === 'lib/course-factory/publisher.ts' || specializedPackageWriters.has(normalized)) {
    continue;
  }
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  const writes = (table) =>
    new RegExp(
      `\\.from\\(['\"]${table}['\"]\\)[\\s\\S]{0,240}\\.(?:insert|upsert|update|delete)\\(`,
    ).test(text);
  if (writes('courses') && writes('course_modules') && writes('course_lessons')) {
    failures.push(
      `${normalized}: parallel complete course-package writer detected; route generation/persistence through lib/course-factory or explicitly classify a narrow non-generation exception`,
    );
  }
}

if (failures.length) {
  console.error('\nCOURSE FACTORY AUTHORITY GATE FAILED\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  'Course Factory authority gate passed: generation paths delegate to one canonical authority; specialized non-generation writers are explicitly classified.',
);
