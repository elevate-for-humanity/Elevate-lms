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

const rootRoute = 'apps/admin/app/api/admin/course-builder/route.ts';
assertContains(rootRoute, "from '@/lib/course-factory'", 'root Course Builder route must delegate to Course Factory');
assertContains(rootRoute, "action === 'generate-from-blueprint'", 'blueprint builds must be dispatched by the root route');
assertContains(rootRoute, "action === 'queue-media'", 'media queueing must be dispatched by the root route');

const browserClient = read('components/admin/course-builder/runCourseFactoryPipeline.ts');
if (!browserClient.includes("fetch('/api/admin/course-builder'")) {
  failures.push('Course Builder browser pipeline must call POST /api/admin/course-builder');
}
if (browserClient.includes('/api/admin/course-builder/pipeline')) {
  failures.push('Retired /api/admin/course-builder/pipeline route is still referenced');
}

// Historical generation endpoints must be disabled or delegate only to the root authority.
for (const rel of [
  'apps/lms/app/api/ai/generate-and-publish-course/route.ts',
  'apps/admin/app/api/admin/courses/generate/publish/route.ts',
  'supabase/functions/ai-course-create/index.ts',
]) {
  const text = read(rel);
  if (!/(RETIRED|COURSE_FACTORY_REQUIRED)/.test(text)) {
    failures.push(`${rel}: historical complete-course endpoint must be explicitly retired`);
  }
  if (/\bcourseFactory\s*\(/.test(text)) {
    failures.push(`${rel}: retired endpoint still invokes Course Factory independently; use the canonical Admin root route`);
  }
}

// Course Builder UI surfaces must use the root HTTP authority for complete builds.
for (const rel of [...walk('components/admin/course-builder'), ...walk('components/course')]) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  const forbidden = [
    '/api/admin/courses/generate',
    '/api/admin/course-builder/pipeline',
    '/api/admin/course-builder/generate-from-blueprint',
    '/api/ai/generate-and-publish-course',
  ];
  for (const endpoint of forbidden) {
    if (text.includes(endpoint)) failures.push(`${rel}: retired course-generation endpoint referenced: ${endpoint}`);
  }
}

// The old Supabase AI creator may not write course tables.
const edge = read('supabase/functions/ai-course-create/index.ts');
if (
  !edge.includes('COURSE_FACTORY_REQUIRED') ||
  /\.from\(['\"](?:courses|modules|lessons|course_modules|course_lessons)['\"]\)\s*\.(?:insert|upsert|update|delete)/s.test(edge)
) {
  failures.push('supabase/functions/ai-course-create/index.ts: historical AI creator must remain disabled and non-writing');
}

// These files legitimately touch all three canonical tables but do not own a generation pipeline.
const specializedPackageWriters = new Set([
  'apps/admin/app/api/admin/courses/[courseId]/clone/route.ts',
  'apps/admin/app/api/admin/programs/[programId]/clone/route.ts',
  'lib/course-factory/versioning.ts',
  'lib/course-factory/post-generation-governance.ts',
  'lib/db/courses.ts',
  'lib/lms/course-service.ts',
  'lib/studio/tools.ts',
  'scripts/e2e-test.ts',
  'scripts/run-pipeline-e2e.ts',
  'scripts/seed/apprenticeship-courses.mjs',
  'scripts/smoke-test-pipeline.ts',
]);

for (const rel of [...walk('apps'), ...walk('lib'), ...walk('scripts'), ...walk('supabase/functions')]) {
  const normalized = rel.split(path.sep).join('/');
  if (normalized === 'lib/course-factory/publisher.ts' || specializedPackageWriters.has(normalized)) continue;
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  const writes = (table) =>
    new RegExp(`\\.from\\(['\"]${table}['\"]\\)[\\s\\S]{0,240}\\.(?:insert|upsert|update|delete)\\(`).test(text);
  if (writes('courses') && writes('course_modules') && writes('course_lessons')) {
    failures.push(`${normalized}: parallel complete course-package writer detected; use lib/course-factory/publisher.ts`);
  }
}

// No second complete-course HTTP generator may exist below the Course Builder route family.
for (const rel of walk('apps')) {
  const normalized = rel.split(path.sep).join('/');
  if (normalized === rootRoute) continue;
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  if (/\bcourseFactory\s*\(/.test(text) && normalized.includes('/api/')) {
    failures.push(`${normalized}: independent HTTP Course Factory caller detected; dispatch through ${rootRoute}`);
  }
}

if (failures.length) {
  console.error('\nCOURSE FACTORY AUTHORITY GATE FAILED\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Course Factory authority gate passed: one complete-course HTTP authority, one orchestration engine, one package publisher.');
