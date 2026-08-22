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
const studioChatRoute = 'apps/admin/app/api/devstudio/chat/route.ts';
const rootText = read(rootRoute);
for (const required of [
  "from '@/lib/course-builder/orchestrator'",
  "from '@/lib/course-builder/edit-service'",
  "from '@/lib/course-builder/persisted-publish-service'",
  "action === 'generate-from-blueprint'",
  "action === 'queue-media'",
  "action === 'save-program-config'",
  "action === 'save-module'",
  "action === 'save-lesson'",
  "action === 'patch-lesson'",
  "action === 'link-scorm'",
  "action === 'publish'",
  "action === 'publish-persisted'",
  "action === 'repair'",
  "action === 'audit'",
]) if (!rootText.includes(required)) failures.push(`${rootRoute}: missing canonical action/authority ${required}`);

const index = read('lib/course-factory/index.ts');
if (!index.includes("export { courseFactory } from '../course-builder/orchestrator'")) failures.push('lib/course-factory/index.ts must expose Course Builder facade instead of raw factory.ts');
const orchestrator = read('lib/course-builder/orchestrator.ts');
if (!orchestrator.includes("from '../course-factory/factory'")) failures.push('Course Builder orchestrator does not own private Course Factory execution');
if (!orchestrator.includes('saveCourseProgramConfiguration')) failures.push('Course Builder orchestrator does not own course program configuration persistence');
const controller = read('lib/devstudio/course-builder-controller.ts');
if (!controller.includes("from '../course-builder/orchestrator'")) failures.push('Studio Course Builder controller is not backed by canonical orchestrator');
const editService = read('lib/course-builder/edit-service.ts');
for (const capability of ['saveCourseModule','saveCourseLesson','patchCourseLesson','linkCourseScormPackage']) {
  if (!editService.includes(capability)) failures.push(`Course Builder edit service is missing ${capability}`);
}
const persistedPublish = read('lib/course-builder/persisted-publish-service.ts');
for (const capability of ['runPersistedCourseProcurementHealthCheck','publishPersistedCourse','publishCourse','review_status','module_completion_rules']) {
  if (!persistedPublish.includes(capability)) failures.push(`Persisted Course Builder publication service is missing ${capability}`);
}

const retiredMutationRoutes = [
  'apps/admin/app/api/admin/lms/courses/generate/route.ts',
  'apps/admin/app/api/admin/lms/courses/[courseId]/publish/route.ts',
  'apps/admin/app/api/admin/course-builder/publish/route.ts',
  'apps/admin/app/api/admin/course-builder/program/route.ts',
  'apps/admin/app/api/admin/course-builder/module/route.ts',
  'apps/admin/app/api/admin/course-builder/lesson/route.ts',
  'apps/admin/app/api/admin/course-builder/lesson-patch/route.ts',
  'apps/admin/app/api/admin/courses/[courseId]/generate-missing/route.ts',
  'apps/admin/app/api/admin/courses/ai-builder/generate/route.ts',
  'apps/lms/app/api/ai/generate-and-publish-course/route.ts',
  'apps/admin/app/api/admin/courses/generate/publish/route.ts',
  'supabase/functions/ai-course-create/index.ts',
];
for (const rel of retiredMutationRoutes) {
  const text = read(rel);
  if (!/(RETIRED|COURSE_FACTORY_REQUIRED|COURSE_BUILDER_ROOT_REQUIRED)/.test(text)) failures.push(`${rel}: historical course mutation endpoint is not explicitly retired`);
  if (/\bcourseFactory\s*\(/.test(text)) failures.push(`${rel}: retired endpoint still invokes course generation`);
  if (/\.from\(['\"](?:courses|course_modules|course_lessons)['\"]\)[\s\S]{0,220}\.(?:insert|upsert|update|delete)\(/.test(text)) failures.push(`${rel}: retired endpoint still writes canonical course tables`);
  if (/\bpublishCourse\s*\(/.test(text)) failures.push(`${rel}: retired endpoint still publishes outside Course Builder root`);
}
const scormText = read('apps/admin/app/api/admin/course-builder/scorm-link/route.ts');
if (!scormText.includes('RETIRED mutation')) failures.push('SCORM mutation route is not explicitly retired');
if (/export async function POST[\s\S]*?\.from\(['\"]scorm_packages['\"]\)[\s\S]{0,220}\.update\(/.test(scormText)) failures.push('SCORM POST still mutates outside Course Builder root');

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
  if (rel === 'lib/course-factory/publisher.ts' || specializedPackageWriters.has(rel)) continue;
  const text = read(rel);
  const writes = (table) => new RegExp(`\\.from\\(['\"]${table}['\"]\\)[\\s\\S]{0,280}\\.(?:insert|upsert|update|delete)\\(`).test(text);
  if (writes('courses') && writes('course_modules') && writes('course_lessons')) failures.push(`${rel}: parallel complete course-package writer detected; complete packages must persist through Course Factory publisher`);
}

for (const rel of walk('apps')) {
  if (rel === rootRoute || retiredMutationRoutes.includes(rel)) continue;
  const text = read(rel);
  if (text.includes("@/lib/course-factory/factory")) failures.push(`${rel}: runtime route imports private Course Factory engine`);
  if (/\bcourseFactory\s*\(/.test(text) && rel.includes('/api/')) {
    const studioFacadeAllowed = rel === studioChatRoute && text.includes("await import('@/lib/course-factory')") && !text.includes("@/lib/course-factory/factory");
    if (!studioFacadeAllowed) failures.push(`${rel}: independent HTTP complete-course caller detected; use ${rootRoute}`);
  }
  if (/\bpublishCourse\s*\(/.test(text) && rel.includes('/api/')) failures.push(`${rel}: independent HTTP publication caller detected; use ${rootRoute}`);
}

const forbiddenEndpointRefs = [
  '/api/admin/lms/courses/generate',
  '/api/admin/lms/courses/[courseId]/publish',
  '/api/admin/course-builder/publish',
  '/api/admin/course-builder/program',
  '/api/admin/course-builder/module',
  '/api/admin/course-builder/lesson-patch',
  '/api/admin/course-builder/lesson',
  '/api/admin/course-builder/quick-add',
  '/api/admin/courses/generate/publish',
  '/api/ai/generate-and-publish-course',
];
const endpointReferenced = (text, endpoint) => {
  if (endpoint === '/api/admin/course-builder/program') {
    text = text.replaceAll('/api/admin/course-builder/program-map', '');
  }
  return text.includes(endpoint);
};
for (const rel of [...walk('apps'), ...walk('components'), ...walk('lib')]) {
  if (retiredMutationRoutes.includes(rel)) continue;
  const text = read(rel);
  for (const endpoint of forbiddenEndpointRefs) if (endpointReferenced(text, endpoint)) failures.push(`${rel}: retired endpoint referenced: ${endpoint}`);
}

if (failures.length) {
  console.error('\nCOURSE BUILDER AUTHORITY GATE FAILED\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Course Builder authority gate passed: Studio control plane -> root Course Builder orchestration/editing/publication facade -> private Course Factory/internal services -> canonical persistence/media/publish -> LMS; no raw-engine, parallel complete-package, or parallel publication authority detected.');
