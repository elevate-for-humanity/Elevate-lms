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

// Required compatibility paths must delegate to Course Factory.
assertContains(
  'lib/course-builder/pipeline.ts',
  "from '@/lib/course-factory'",
  'legacy pipeline must delegate to the canonical Course Factory',
);
assertContains(
  'lib/course-builder/program-auto-course.ts',
  "from '@/lib/course-factory'",
  'program auto-course creation must delegate to Course Factory',
);
assertContains(
  'apps/admin/app/api/admin/course-builder/publish/route.ts',
  "from '@/lib/course-factory'",
  'Admin publish route must use Course Factory',
);

// Historical Supabase AI course creator must remain non-executable.
const edge = read('supabase/functions/ai-course-create/index.ts');
if (!edge.includes('COURSE_FACTORY_REQUIRED') || /\.from\(['\"](?:courses|modules|lessons)['\"]\)\s*\.(?:insert|upsert|update|delete)/s.test(edge)) {
  failures.push('supabase/functions/ai-course-create/index.ts: historical AI creator must remain disabled and must not write course tables');
}

// A complete course-package writer outside the canonical publisher is forbidden.
// Manual single-entity editors/importers remain allowed; this catches parallel orchestration engines.
const allowPackageWriters = new Set([
  'lib/course-factory/publisher.ts',
]);

for (const rel of [...walk('apps'), ...walk('lib'), ...walk('scripts'), ...walk('supabase/functions')]) {
  const normalized = rel.split(path.sep).join('/');
  if (allowPackageWriters.has(normalized)) continue;
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  const writes = (table) => new RegExp(`\\.from\\(['\"]${table}['\"]\\)[\\s\\S]{0,240}\\.(?:insert|upsert|update|delete)\\(`).test(text);
  if (writes('courses') && writes('course_modules') && writes('course_lessons')) {
    failures.push(`${normalized}: parallel complete course-package writer detected; route generation/persistence through lib/course-factory`);
  }
}

if (failures.length) {
  console.error('\nCOURSE FACTORY AUTHORITY GATE FAILED\n');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Course Factory authority gate passed: one canonical generation/persistence authority enforced.');
