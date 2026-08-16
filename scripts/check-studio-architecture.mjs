#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const exists = (file) => fs.existsSync(path.join(root, file));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => failures.push(message);

const forbidden = ['components/studio/StudioShell.tsx'];
for (const file of forbidden) if (exists(file)) fail(`parallel Studio implementation exists: ${file}`);

for (const file of [
  'apps/admin/app/studio/layout.tsx',
  'apps/admin/app/studio/StudioNavigation.client.tsx',
  'lib/devstudio/workspace-registry.ts',
  'apps/studio-browser/server.mjs',
  'apps/admin/app/api/devstudio/browser/session/route.ts',
  'apps/admin/app/api/devstudio/browser/agent/route.ts',
  'components/studio/CloudBrowserWorkspace.tsx',
  'components/studio/CourseStudioApplication.tsx',
  'components/studio/CourseProvider.tsx',
  'components/studio/StudioWorkspace.tsx',
  'components/dev-studio/live-canvas/LiveCanvas.tsx',
  'apps/admin/app/studio/canvas/page.tsx',
  'apps/admin/app/studio/courses/[courseId]/page.tsx',
]) if (!exists(file)) fail(`canonical Studio file is missing: ${file}`);

const layout = read('apps/admin/app/studio/layout.tsx');
if (!layout.includes('StudioNavigation')) fail('Studio layout does not own persistent navigation');

const registry = read('lib/devstudio/workspace-registry.ts');
const routes = [...registry.matchAll(/route:\s*'([^']+)'/g)].map((match) => match[1]);
for (const route of routes) {
  const relative = route.replace(/^\/studio\/?/, '');
  const page = relative ? `apps/admin/app/studio/${relative}/page.tsx` : 'apps/admin/app/studio/page.tsx';
  if (!exists(page)) fail(`registered Studio route has no page: ${route}`);
  else if (/\bredirect\s*\(/.test(read(page))) fail(`registered Studio workspace redirects instead of rendering: ${route}`);
}

const canonicalRoot = path.join(root, 'apps/admin/app/api/admin/dev-studio');
const runtimeRoot = path.join(root, 'apps/admin/app/api/devstudio');
function routeFiles(base, current = base) {
  if (!fs.existsSync(current)) return [];
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? routeFiles(base, path.join(current, entry.name)) : entry.name === 'route.ts' ? [path.relative(base, path.join(current, entry.name))] : []);
}
const capabilityRoutes = new Set(routeFiles(canonicalRoot));
for (const route of routeFiles(runtimeRoot)) if (capabilityRoutes.has(route)) fail(`duplicate API route exists in both Studio namespaces: ${route}`);

const courseApplication = read('apps/admin/app/studio/courses/[courseId]/page.tsx');
for (const dependency of ['CourseProvider', 'CourseStudioApplication', 'StudioWorkspace', 'loadCourseSession']) {
  if (!courseApplication.includes(dependency)) fail(`complete course application is missing ${dependency}`);
}

const courseCatalog = read('components/admin/course-builder/UnifiedCourseBuilder.tsx');
for (const forbiddenDependency of [
  '/api/admin/course-builder/course',
  'LiveCourseBuilder',
  'CourseInteractionStudio',
  'WorkspacePayload',
]) {
  if (courseCatalog.includes(forbiddenDependency)) fail(`course catalog reintroduced a parallel course state path: ${forbiddenDependency}`);
}

const courseWorkspace = read('components/studio/StudioWorkspace.tsx');
for (const panel of ['InteractionsPanel', 'AssessmentsPanel', 'CompliancePanel']) {
  if (!courseWorkspace.includes(panel)) fail(`complete course application is missing ${panel}`);
}

const canvasPage = read('apps/admin/app/studio/canvas/page.tsx');
if (!canvasPage.includes('LiveCanvas')) fail('Live Canvas is not connected to its canonical route');

const cfdPage = read('apps/admin/app/studio/cfd/page.tsx');
for (const dependency of ['CfdStudioPanel', 'CfdCaseGenerator']) {
  if (!cfdPage.includes(dependency)) fail(`canonical CFD application is missing ${dependency}`);
}
if (!read('apps/admin/app/cfd-studio/page.tsx').includes("redirect('/studio/cfd')")) fail('legacy CFD route is not a compatibility redirect');

if (failures.length) {
  console.error(failures.map((message) => `STUDIO ARCHITECTURE ERROR: ${message}`).join('\n'));
  process.exit(1);
}
console.log(`Studio architecture verified: ${routes.length} canonical workspaces, one complete application, no parallel API routes.`);
