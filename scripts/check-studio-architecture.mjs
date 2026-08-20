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
  'apps/admin/app/layout.tsx',
  'apps/admin/app/studio/page.tsx',
  'apps/admin/app/studio/layout.tsx',
  'apps/admin/app/studio/ai/page.tsx',
  'apps/admin/app/studio/StudioNavigation.client.tsx',
  'components/studio/UnifiedEllieChat.tsx',
  'lib/devstudio/workspace-registry.ts',
  'lib/devstudio/ellie-message-router.ts',
  'services/studio-browser/server.mjs',
  'apps/admin/app/api/devstudio/browser/session/route.ts',
  'apps/admin/app/api/devstudio/browser/agent/route.ts',
  'components/studio/CloudBrowserWorkspace.tsx',
  'components/studio/CourseStudioApplication.tsx',
  'components/studio/CourseProvider.tsx',
  'components/studio/StudioWorkspace.tsx',
  'components/dev-studio/live-canvas/LiveCanvas.tsx',
  'apps/admin/app/studio/canvas/page.tsx',
  'apps/admin/app/studio/courses/[courseId]/page.tsx',
  'apps/admin/app/api/admin/courses/ai-builder/generate/route.ts',
]) if (!exists(file)) fail(`canonical Studio file is missing: ${file}`);

const adminLayout = read('apps/admin/app/layout.tsx');
for (const sharedSurface of [
  'AdminHeader',
  'BuildVersionSync',
  'AdminPwaRegister',
  'AdminUpdateNotice',
  'SupabaseConfigBootstrap',
]) {
  if (!adminLayout.includes(sharedSurface)) fail(`Admin layout is missing privileged shared surface: ${sharedSurface}`);
}
for (const publicSurface of ['AdminFooter', 'LiveChatWidget']) {
  if (adminLayout.includes(publicSurface)) fail(`Admin layout reintroduced public surface into privileged workspace: ${publicSurface}`);
}
for (const standaloneBypass of ['isDevStudio', "x-pathname", "pathname.includes('/studio')"]) {
  if (adminLayout.includes(standaloneBypass)) fail(`Admin layout bypasses its canonical shell for Studio: ${standaloneBypass}`);
}

const layout = read('apps/admin/app/studio/layout.tsx');
if (!layout.includes('StudioNavigation')) fail('Studio layout does not provide contextual workspace navigation');
for (const standaloneShell of ['min-h-screen', 'bg-slate-950 text-white']) {
  if (layout.includes(standaloneShell)) fail(`Studio layout reintroduced a standalone application shell: ${standaloneShell}`);
}

const studioNavigation = read('apps/admin/app/studio/StudioNavigation.client.tsx');
for (const standaloneNavigation of ['<aside', 'fixed inset-y-0', 'lg:sticky']) {
  if (studioNavigation.includes(standaloneNavigation)) fail(`Studio navigation reintroduced a standalone sidebar: ${standaloneNavigation}`);
}

const studioRoot = read('apps/admin/app/studio/page.tsx');
for (const invariant of ['UnifiedEllieChat', "requireRole(['super_admin', 'admin'])", 'Advanced capability surfaces']) {
  if (!studioRoot.includes(invariant)) fail(`conversation-first Studio root missing invariant: ${invariant}`);
}
for (const forbiddenRootPattern of ['bg-slate-950 text-white', '<StudioWorkspaceGrid workspaces={workspaces} />\n      </div>\n    </main>']) {
  if (studioRoot.includes(forbiddenRootPattern)) fail(`Studio root regressed to capability-grid-first UI: ${forbiddenRootPattern}`);
}

const legacyAiPage = read('apps/admin/app/studio/ai/page.tsx');
if (!legacyAiPage.includes("redirect('/studio')")) fail('legacy /studio/ai is not redirected to the canonical Admin AI surface');

const registry = read('lib/devstudio/workspace-registry.ts');
if (/id:\s*'ai'/.test(registry) || /route:\s*'\/studio\/ai'/.test(registry)) {
  fail('workspace registry reintroduced a second AI/chat workspace');
}
const routes = [...registry.matchAll(/route:\s*'([^']+)'/g)].map((match) => match[1]);
for (const route of routes) {
  const relative = route.replace(/^\/studio\/?/, '');
  const page = relative ? `apps/admin/app/studio/${relative}/page.tsx` : 'apps/admin/app/studio/page.tsx';
  if (!exists(page)) fail(`registered Studio route has no page: ${route}`);
  else if (/\bredirect\s*\(/.test(read(page))) fail(`registered Studio workspace redirects instead of rendering: ${route}`);
}

const messageRouter = read('lib/devstudio/ellie-message-router.ts');
for (const outcome of ['build (a )?course', 'create (a )?course', 'generate (a )?course', 'build (a )?website', 'publish (the )?website']) {
  if (!messageRouter.includes(outcome)) fail(`Admin AI router does not recognize outcome-oriented tool request: ${outcome}`);
}
if (/COMMAND_RE[\s\S]{0,300}build courses?/i.test(messageRouter)) {
  fail('course creation was routed back to raw command execution');
}

const canonicalRoot = path.join(root, 'apps/admin/app/api/admin/dev-studio');
const runtimeRoot = path.join(root, 'apps/admin/app/api/devstudio');
const forbiddenLegacyRoot = path.join(root, 'apps/admin/app/api/admin/devstudio');
function routeFiles(base, current = base) {
  if (!fs.existsSync(current)) return [];
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? routeFiles(base, path.join(current, entry.name)) : entry.name === 'route.ts' ? [path.relative(base, path.join(current, entry.name))] : []);
}
const capabilityRoutes = new Set(routeFiles(canonicalRoot));
for (const route of routeFiles(runtimeRoot)) if (capabilityRoutes.has(route)) fail(`duplicate API route exists in both Studio namespaces: ${route}`);
if (fs.existsSync(forbiddenLegacyRoot)) fail('legacy /api/admin/devstudio namespace exists; use /api/admin/dev-studio for Admin capability APIs');

function sourceFiles(current) {
  if (!fs.existsSync(current)) return [];
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(?:[cm]?[jt]sx?|mjs|cjs|sh)$/.test(entry.name) ? [target] : [];
  });
}
const checkerPath = path.join(root, 'scripts/check-studio-architecture.mjs');
for (const sourceRoot of ['apps/admin', 'components', 'lib', 'scripts', 'tests']) {
  for (const file of sourceFiles(path.join(root, sourceRoot))) {
    if (file === checkerPath) continue;
    if (read(path.relative(root, file)).includes('/api/admin/devstudio')) {
      fail(`legacy /api/admin/devstudio reference exists: ${path.relative(root, file)}`);
    }
  }
}

const courseDraftAdapter = read('apps/admin/app/api/admin/courses/ai-builder/generate/route.ts');
for (const invariant of ['generateBlueprintFromAI', "generation_authority: 'course-factory'", "persistence_authority: 'courseFactory()'", 'draft_only: true']) {
  if (!courseDraftAdapter.includes(invariant)) fail(`Admin AI course draft adapter bypasses canonical Course Factory contract: ${invariant}`);
}
for (const forbiddenWrite of [".from('courses').insert", ".from('course_modules').insert", ".from('course_lessons').insert", ".from('lms_courses').insert", ".from('curriculum_lessons').insert"]) {
  if (courseDraftAdapter.includes(forbiddenWrite)) fail(`Admin AI course draft adapter contains direct persistence: ${forbiddenWrite}`);
}

const adminAiChat = read('apps/admin/app/api/devstudio/chat/route.ts');
if (!adminAiChat.includes("await import('@/lib/course-factory')")) fail('Admin AI course save does not delegate to canonical Course Factory');
if (!adminAiChat.includes('normalizeGeneratedCourseForGovernance')) fail('Admin AI course save does not run post-generation governance');
for (const forbiddenWrite of [".from('lms_courses').insert", ".from('modules').insert", ".from('curriculum_lessons').insert"]) {
  if (adminAiChat.includes(forbiddenWrite)) fail(`Admin AI reintroduced parallel course persistence: ${forbiddenWrite}`);
}

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
console.log(`Studio architecture verified: conversation-first Admin AI plus ${routes.length} advanced capability surfaces inside the hardened Admin shell; no second AI workspace, public-shell leakage, standalone shell, parallel API routes, or legacy admin/devstudio namespace.`);
