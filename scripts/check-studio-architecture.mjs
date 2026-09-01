#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const exists = (file) => fs.existsSync(path.join(root, file));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => failures.push(message);

const forbidden = [
  'components/studio/StudioShell.tsx',
  'scripts/studio-tables.sql',
];
for (const file of forbidden) if (exists(file)) fail(`parallel/obsolete Studio implementation exists: ${file}`);

for (const file of [
  'apps/admin/app/layout.tsx',
  'apps/admin/app/studio/page.tsx',
  'apps/admin/app/studio/layout.tsx',
  'apps/admin/app/studio/ai/page.tsx',
  'apps/admin/app/studio/StudioNavigation.client.tsx',
  'components/studio/UnifiedEllieChat.tsx',
  'components/studio/StudioCommandWorkspace.tsx',
  'lib/devstudio/workspace-registry.ts',
  'lib/devstudio/ellie-message-router.ts',
  'lib/devstudio/course-builder-controller.ts',
  'lib/course-builder/orchestrator.ts',
  'Dockerfile.studio-browser',
  'services/studio-browser/server.mjs',
  'apps/admin/app/api/admin/dev-studio/browser/session/route.ts',
  'apps/admin/app/api/admin/dev-studio/browser/agent/route.ts',
  'components/studio/CloudBrowserWorkspace.tsx',
  'components/studio/CourseStudioApplication.tsx',
  'components/studio/CourseProvider.tsx',
  'components/studio/StudioWorkspace.tsx',
  'components/dev-studio/live-canvas/LiveCanvas.tsx',
  'apps/admin/app/studio/canvas/page.tsx',
  'apps/admin/app/studio/courses/[courseId]/page.tsx',
]) if (!exists(file)) fail(`canonical Studio file is missing: ${file}`);

const studioBrowserImage = read('Dockerfile.studio-browser');
for (const invariant of [
  'FROM node:22-bookworm-slim',
  'playwright install --with-deps chromium',
  'PLAYWRIGHT_BROWSERS_PATH=/ms-playwright',
  'USER studio',
]) {
  if (!studioBrowserImage.includes(invariant)) {
    fail(`Studio browser image is missing resource/security invariant: ${invariant}`);
  }
}
for (const oversizedImage of [
  'mcr.microsoft.com/playwright',
  'playwright install firefox',
  'playwright install webkit',
]) {
  if (studioBrowserImage.includes(oversizedImage)) {
    fail(`Studio browser image installs an unused browser payload: ${oversizedImage}`);
  }
}

const adminLayout = read('apps/admin/app/layout.tsx');
for (const sharedSurface of ['AdminHeader','BuildVersionSync','AdminPwaRegister','AdminUpdateNotice','SupabaseConfigBootstrap']) {
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
for (const invariant of ['StudioCommandWorkspace', "requireRole(['super_admin', 'admin'])", 'Advanced capability surfaces']) {
  if (!studioRoot.includes(invariant)) fail(`conversation-first Studio root missing invariant: ${invariant}`);
}
const studioCommandWorkspace = read('components/studio/StudioCommandWorkspace.tsx');
if (!studioCommandWorkspace.includes('<UnifiedEllieChat')) {
  fail('Studio command workspace does not include the canonical Admin AI conversation');
}
for (const forbiddenRootPattern of ['bg-slate-950 text-white', '<StudioWorkspaceGrid workspaces={workspaces} />\n      </div>\n    </main>']) {
  if (studioRoot.includes(forbiddenRootPattern)) fail(`Studio root regressed to capability-grid-first UI: ${forbiddenRootPattern}`);
}

const legacyAiPage = read('apps/admin/app/studio/ai/page.tsx');
if (!legacyAiPage.includes("redirect('/studio')")) fail('legacy /studio/ai is not redirected to the canonical Admin AI surface');

const registry = read('lib/devstudio/workspace-registry.ts');
if (/id:\s*'ai'/.test(registry) || /route:\s*'\/studio\/ai'/.test(registry)) fail('workspace registry reintroduced a second AI/chat workspace');
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
if (/COMMAND_RE[\s\S]{0,300}build courses?/i.test(messageRouter)) fail('course creation was routed back to raw command execution');

const canonicalRoot = path.join(root, 'apps/admin/app/api/admin/dev-studio');
const runtimeRoot = path.join(root, 'apps/admin/app/api/devstudio');
const forbiddenLegacyRoot = path.join(root, 'apps/admin/app/api/admin/devstudio');
function routeFiles(base, current = base) {
  if (!fs.existsSync(current)) return [];
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? routeFiles(base, path.join(current, entry.name)) : entry.name === 'route.ts' ? [path.relative(base, path.join(current, entry.name))] : []);
}
const capabilityRoutes = new Set(routeFiles(canonicalRoot));
if (capabilityRoutes.size === 0) fail('canonical /api/admin/dev-studio API tree is empty');
if (fs.existsSync(runtimeRoot)) fail('legacy /api/devstudio route tree exists; Studio APIs must be Admin-owned');
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
const legacyReferenceGatePath = path.join(root, 'scripts/dev-studio-integration-gate.sh');
for (const sourceRoot of ['apps/admin', 'components', 'lib', 'scripts', 'tests']) {
  for (const file of sourceFiles(path.join(root, sourceRoot))) {
    if (file === checkerPath || file === legacyReferenceGatePath) continue;
    const source = read(path.relative(root, file));
    if (source.includes('/api/admin/devstudio')) fail(`legacy /api/admin/devstudio reference exists: ${path.relative(root, file)}`);
    if (source.includes('/api/devstudio')) fail(`legacy /api/devstudio reference exists: ${path.relative(root, file)}`);
  }
}

const retiredCourseDraftAdapter = 'apps/admin/app/api/admin/courses/ai-builder/generate/route.ts';
if (exists(retiredCourseDraftAdapter)) {
  const courseDraftAdapter = read(retiredCourseDraftAdapter);
  if (!courseDraftAdapter.includes('COURSE_BUILDER_ROOT_REQUIRED')) {
    fail('retired Admin AI course draft adapter is not pinned to the canonical Course Builder root');
  }
  for (const forbiddenLegacyBehavior of ['generateBlueprintFromAI', "generation_authority: 'course-factory'", "persistence_authority: 'courseFactory()'", 'draft_only: true']) {
    if (courseDraftAdapter.includes(forbiddenLegacyBehavior)) fail(`retired Admin AI course draft adapter still contains legacy generation behavior: ${forbiddenLegacyBehavior}`);
  }
  for (const forbiddenWrite of [".from('courses').insert", ".from('course_modules').insert", ".from('course_lessons').insert", ".from('lms_courses').insert", ".from('curriculum_lessons').insert"]) {
    if (courseDraftAdapter.includes(forbiddenWrite)) fail(`retired Admin AI course draft adapter contains direct persistence: ${forbiddenWrite}`);
  }
}

const courseFactoryBarrel = read('lib/course-factory/index.ts');
if (!courseFactoryBarrel.includes("export { courseFactory } from '../course-builder/orchestrator'")) {
  fail('public Course Factory barrel bypasses Course Builder orchestration');
}
const studioController = read('lib/devstudio/course-builder-controller.ts');
if (!studioController.includes("from '../course-builder/orchestrator'")) fail('Studio Course Builder controller does not delegate to canonical orchestrator');
const courseOrchestrator = read('lib/course-builder/orchestrator.ts');
if (!courseOrchestrator.includes("from '../course-factory/factory'")) fail('Course Builder orchestrator is not the owner of private Course Factory execution');

const adminAiChat = read('apps/admin/app/api/admin/dev-studio/chat/route.ts');
if (!adminAiChat.includes("await import('@/lib/course-factory')") && !adminAiChat.includes("await import('@/lib/devstudio/course-builder-controller')")) {
  fail('Admin AI does not delegate course creation through the canonical Course Builder facade/controller');
}
if (adminAiChat.includes("@/lib/course-factory/factory")) fail('Admin AI imports the private Course Factory engine directly');
if (!adminAiChat.includes('normalizeGeneratedCourseForGovernance')) fail('Admin AI course creation does not run post-generation governance');
if (adminAiChat.includes('intake_submissions')) fail('Admin AI references retired/nonexistent intake_submissions instead of canonical applications');
for (const forbiddenWrite of [".from('lms_courses').insert", ".from('modules').insert", ".from('curriculum_lessons').insert"]) {
  if (adminAiChat.includes(forbiddenWrite)) fail(`Admin AI reintroduced parallel course persistence: ${forbiddenWrite}`);
}
const buildCourseBlock = adminAiChat.match(/case 'build_course': \{([\s\S]*?)case 'save_course':/i)?.[1] ?? '';
for (const invariant of ['dryRun: false', "__type: 'course_saved'", 'normalizeGeneratedCourseForGovernance']) {
  if (!buildCourseBlock.includes(invariant)) fail(`build_course is not a one-step governed Course Builder operation: ${invariant}`);
}
if (!buildCourseBlock.includes("await import('@/lib/course-factory')") && !buildCourseBlock.includes("await import('@/lib/devstudio/course-builder-controller')")) {
  fail('build_course does not enter the Course Builder facade/controller');
}
if (buildCourseBlock.includes('/api/admin/courses/ai-builder/generate')) fail('build_course regressed to draft-only compatibility endpoint instead of canonical persistence');

const preAuthRegistry = read('lib/pre-auth-tables.ts');
if (/table:\s*'studio_(?:chat_history|comments|shares|deploy_tokens|favorites|pr_tracking|recent_files|repos|sessions|settings|workflow_tracking)'/.test(preAuthRegistry)) fail('pre-auth registry contains retired legacy Studio tables');

const courseApplication = read('apps/admin/app/studio/courses/[courseId]/page.tsx');
for (const dependency of ['CourseProvider', 'CourseStudioApplication', 'StudioWorkspace', 'loadCourseSession']) {
  if (!courseApplication.includes(dependency)) fail(`complete course application is missing ${dependency}`);
}

const courseCatalog = read('components/admin/course-builder/UnifiedCourseBuilder.tsx');
for (const forbiddenDependency of ['/api/admin/course-builder/course','LiveCourseBuilder','CourseInteractionStudio','WorkspacePayload']) {
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
console.log(`Studio architecture verified: one Admin shell, ${routes.length} advanced capability surfaces, and ${capabilityRoutes.size} Admin-owned Studio APIs; Course Builder facade/orchestrator owns course execution and no parallel Studio API/schema authority exists.`);
