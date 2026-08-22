import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = (rel) => {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) { failures.push(`Missing required file: ${rel}`); return ''; }
  return fs.readFileSync(abs, 'utf8');
};
const walk = (dir, out = []) => {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (['node_modules','.next','dist','build','archive'].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(?:ts|tsx|js|mjs|cjs)$/.test(entry.name)) out.push(rel.split(path.sep).join('/'));
  }
  return out;
};

const rootRoute = 'apps/admin/app/api/admin/course-builder/route.ts';
const rootText = read(rootRoute);
for (const required of [
  "from '@/lib/course-builder/orchestrator'",
  "action === 'generate-from-blueprint'",
  "action === 'queue-media'",
  "action === 'publish'",
  "action === 'repair'",
  "action === 'audit'",
]) if (!rootText.includes(required)) failures.push(`${rootRoute}: missing canonical action/authority ${required}`);

const index = read('lib/course-factory/index.ts');
if (!index.includes("export { courseFactory } from '../course-builder/orchestrator'")) {
  failures.push('lib/course-factory/index.ts must expose Course Builder facade instead of raw factory.ts');
}
const orchestrator = read('lib/course-builder/orchestrator.ts');
if (!orchestrator.includes("from '../course-factory/factory'")) failures.push('Course Builder orchestrator does not own private Course Factory execution');
const controller = read('lib/devstudio/course-builder-controller.ts');
if (!controller.includes("from '../course-builder/orchestrator'")) failures.push('Studio Course Builder controller is not backed by canonical orchestrator');

for (const rel of [
  'apps/admin/app/api/admin/lms/courses/generate/route.ts',
  'apps/admin/app/api/admin/course-builder/publish/route.ts',
  'apps/admin/app/api/admin/courses/[courseId]/generate-missing/route.ts',
  'apps/lms/app/api/ai/generate-and-publish-course/route.ts',
  'apps/admin/app/api/admin/courses/generate/publish/route.ts',
  'supabase/functions/ai-course-create/index.ts',
]) {
  const text = read(rel);
  if (!/(RETIRED|COURSE_FACTORY_REQUIRED|COURSE_BUILDER_ROOT_REQUIRED)/.test(text)) failures.push(`${rel}: historical complete-course endpoint is not explicitly retired`);
  if (/\bcourseFactory\s*\(/.test(text)) failures.push(`${rel}: retired endpoint still invokes course generation`);
}

for (const rel of walk('apps')) {
  if (rel === rootRoute) continue;
  const text = read(rel);
  if (text.includes("@/lib/course-factory/factory")) failures.push(`${rel}: runtime route imports private Course Factory engine`);
  if (/\bcourseFactory\s*\(/.test(text) && rel.includes('/api/')) failures.push(`${rel}: independent HTTP complete-course caller detected; use ${rootRoute}`);
}

const forbiddenEndpointRefs = [
  '/api/admin/lms/courses/generate',
  '/api/admin/course-builder/publish',
  '/api/admin/courses/generate/publish',
  '/api/ai/generate-and-publish-course',
];
for (const rel of [...walk('apps'), ...walk('components'), ...walk('lib')]) {
  const text = read(rel);
  for (const endpoint of forbiddenEndpointRefs) if (text.includes(endpoint)) failures.push(`${rel}: retired endpoint referenced: ${endpoint}`);
}

if (failures.length) {
  console.error('\nCOURSE BUILDER AUTHORITY GATE FAILED\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Course Builder authority gate passed: Studio control plane -> Course Builder orchestrator -> private Course Factory -> canonical persistence/media/publish -> LMS.');
