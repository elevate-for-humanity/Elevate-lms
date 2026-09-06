#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const exists = (file) => fs.existsSync(path.join(root, file));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => failures.push(message);

const forbidden = ['components/studio/StudioShell.tsx', 'scripts/studio-tables.sql'];
for (const file of forbidden)
  if (exists(file)) fail(`parallel/obsolete Studio implementation exists: ${file}`);

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
  'scripts/northflank/resolve-studio-browser-secret.ts',
  'scripts/northflank/verify-studio-browser-link.ts',
  'apps/admin/app/api/admin/dev-studio/browser/session/route.ts',
  'apps/admin/app/api/admin/dev-studio/browser/agent/route.ts',
  'components/studio/CloudBrowserWorkspace.tsx',
  'components/studio/CourseStudioApplication.tsx',
  'components/studio/CourseProvider.tsx',
  'components/studio/StudioWorkspace.tsx',
  'components/dev-studio/live-canvas/LiveCanvas.tsx',
  'apps/admin/app/studio/canvas/page.tsx',
  'apps/admin/app/studio/courses/[courseId]/page.tsx',
])
  if (!exists(file)) fail(`canonical Studio file is missing: ${file}`);

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

const browserDeployWorkflow = read('.github/workflows/deploy-studio-browser.yml');
for (const invariant of [
  'resolve-studio-browser-secret.ts',
  'verify-studio-browser-link.ts',
  'cancel-in-progress: false',
]) {
  if (!browserDeployWorkflow.includes(invariant)) {
    fail(`Studio Browser deployment is missing credit-safe invariant: ${invariant}`);
  }
}

const browserAgentRoute = read('apps/admin/app/api/admin/dev-studio/browser/agent/route.ts');
const browserPlanner = read('lib/devstudio/browser-planner.ts');
for (const forbiddenProviderBypass of [
  'getOpenAIClient',
  'OPENAI_COMPUTER_MODEL',
  'client.responses.create',
  "from 'openai'",
]) {
  if (browserAgentRoute.includes(forbiddenProviderBypass)) {
    fail(`Studio browser agent bypasses the canonical AI provider: ${forbiddenProviderBypass}`);
  }
}
if (!browserPlanner.includes("providerPolicy: 'owned-only'")) {
  fail('Studio browser planner is not restricted to Elevate-owned inference');
}
for (const providerNeutralInvariant of ['planBrowserTurn', '/snapshot']) {
  if (!browserAgentRoute.includes(providerNeutralInvariant)) {
    fail(`Studio browser agent is missing provider-neutral invariant: ${providerNeutralInvariant}`);
  }
}
if (!browserAgentRoute.includes('browserTaskMatches')) {
  fail('Studio browser approval resume is not bound to canonical tool input');
}
if (!browserAgentRoute.includes("'X-Studio-Task-Id': taskId")) {
  fail('Studio browser stream does not expose its canonical durable task identity');
}
const browserWorkspace = read('components/studio/CloudBrowserWorkspace.tsx');
for (const taskIdentityInvariant of [
  "response.headers.get('x-studio-task-id')",
  'event.taskId !== canonicalTaskId',
]) {
  if (!browserWorkspace.includes(taskIdentityInvariant)) {
    fail(`Studio browser UI is missing task identity invariant: ${taskIdentityInvariant}`);
  }
}
const studioTasks = read('apps/admin/app/studio/tasks/TasksClient.tsx');
if (!studioTasks.includes('Task ID: {task.id}') || studioTasks.includes('{task.trace_id || task.id}')) {
  fail('Studio task evidence conflates the canonical task ID with its trace ID');
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
const privilegedNavigationSurfaces = ['AdminNavShell', 'AdminHeader'];
if (!privilegedNavigationSurfaces.some((surface) => adminLayout.includes(surface))) {
  fail(
    `Admin layout is missing a privileged navigation surface: ${privilegedNavigationSurfaces.join(' or ')}`,
  );
}
for (const sharedSurface of [
  'BuildVersionSync',
  'AdminPwaRegister',
  'AdminUpdateNotice',
  'SupabaseConfigBootstrap',
]) {
  if (!adminLayout.includes(sharedSurface))
    fail(`Admin layout is missing privileged shared surface: ${sharedSurface}`);
}
for (const publicSurface of ['AdminFooter', 'LiveChatWidget']) {
  if (adminLayout.includes(publicSurface))
    fail(`Admin layout reintroduced public surface into privileged workspace: ${publicSurface}`);
}
for (const standaloneBypass of ['isDevStudio', 'x-pathname', "pathname.includes('/studio')"]) {
  if (adminLayout.includes(standaloneBypass))
    fail(`Admin layout bypasses its canonical shell for Studio: ${standaloneBypass}`);
}

const layout = read('apps/admin/app/studio/layout.tsx');
if (!layout.includes('StudioNavigation'))
  fail('Studio layout does not provide contextual workspace navigation');
for (const standaloneShell of ['min-h-screen', 'bg-slate-950 text-white']) {
  if (layout.includes(standaloneShell))
    fail(`Studio layout reintroduced a standalone application shell: ${standaloneShell}`);
}

const studioNavigation = read('apps/admin/app/studio/StudioNavigation.client.tsx');
for (const standaloneNavigation of ['<aside', 'fixed inset-y-0', 'lg:sticky']) {
  if (studioNavigation.includes(standaloneNavigation))
    fail(`Studio navigation reintroduced a standalone sidebar: ${standaloneNavigation}`);
}

const studioRoot = read('apps/admin/app/studio/page.tsx');
for (const invariant of [
  'StudioCommandWorkspace',
  "requireRole(['super_admin', 'admin'])",
  'Advanced capability surfaces',
]) {
  if (!studioRoot.includes(invariant))
    fail(`conversation-first Studio root missing invariant: ${invariant}`);
}
const studioCommandWorkspace = read('components/studio/StudioCommandWorkspace.tsx');
if (!studioCommandWorkspace.includes('<UnifiedEllieChat')) {
  fail('Studio command workspace does not include the canonical Admin AI conversation');
}
for (const forbiddenRootPattern of [
  'bg-slate-950 text-white',
  '<StudioWorkspaceGrid workspaces={workspaces} />\n      </div>\n    </main>',
]) {
  if (studioRoot.includes(forbiddenRootPattern))
    fail(`Studio root regressed to capability-grid-first UI: ${forbiddenRootPattern}`);
}

const legacyAiPage = read('apps/admin/app/studio/ai/page.tsx');
if (!legacyAiPage.includes("redirect('/studio')"))
  fail('legacy /studio/ai is not redirected to the canonical Admin AI surface');

const legacyLearnerAiChat = read('apps/lms/app/ai-chat/page.tsx');
if (!legacyLearnerAiChat.includes("permanentRedirect('/lms/ai-team')")) {
  fail(
    'legacy learner /ai-chat still exposes the privileged Studio chat instead of the canonical learner AI Team',
  );
}

const registry = read('lib/devstudio/workspace-registry.ts');
if (/id:\s*'ai'/.test(registry) || /route:\s*'\/studio\/ai'/.test(registry))
  fail('workspace registry reintroduced a second AI/chat workspace');
const routes = [...registry.matchAll(/route:\s*'([^']+)'/g)].map((match) => match[1]);
for (const route of routes) {
  const relative = route.replace(/^\/studio\/?/, '');
  const page = relative
    ? `apps/admin/app/studio/${relative}/page.tsx`
    : 'apps/admin/app/studio/page.tsx';
  if (!exists(page)) fail(`registered Studio route has no page: ${route}`);
  else if (/\bredirect\s*\(/.test(read(page)))
    fail(`registered Studio workspace redirects instead of rendering: ${route}`);
}

const messageRouter = read('lib/devstudio/ellie-message-router.ts');
for (const outcome of [
  'build (a )?course',
  'create (a )?course',
  'generate (a )?course',
  'build (a )?website',
  'publish (the )?website',
]) {
  if (!messageRouter.includes(outcome))
    fail(`Admin AI router does not recognize outcome-oriented tool request: ${outcome}`);
}
if (/COMMAND_RE[\s\S]{0,300}build courses?/i.test(messageRouter))
  fail('course creation was routed back to raw command execution');

const canonicalRoot = path.join(root, 'apps/admin/app/api/admin/dev-studio');
const runtimeRoot = path.join(root, 'apps/admin/app/api/devstudio');
const forbiddenLegacyRoot = path.join(root, 'apps/admin/app/api/admin/devstudio');
function routeFiles(base, current = base) {
  if (!fs.existsSync(current)) return [];
  return fs
    .readdirSync(current, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? routeFiles(base, path.join(current, entry.name))
        : entry.name === 'route.ts'
          ? [path.relative(base, path.join(current, entry.name))]
          : [],
    );
}
const capabilityRoutes = new Set(routeFiles(canonicalRoot));
if (capabilityRoutes.size === 0) fail('canonical /api/admin/dev-studio API tree is empty');
if (fs.existsSync(runtimeRoot))
  fail('legacy /api/devstudio route tree exists; Studio APIs must be Admin-owned');
if (fs.existsSync(forbiddenLegacyRoot))
  fail(
    'legacy /api/admin/devstudio namespace exists; use /api/admin/dev-studio for Admin capability APIs',
  );

function sourceFiles(current) {
  if (!fs.existsSync(current)) return [];
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(current, entry.name);
    if (entry.isSymbolicLink()) return [];
    if (entry.isDirectory() && ['node_modules', '.next', 'dist', 'coverage'].includes(entry.name))
      return [];
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
    if (source.includes('/api/admin/devstudio'))
      fail(`legacy /api/admin/devstudio reference exists: ${path.relative(root, file)}`);
    if (source.includes('/api/devstudio'))
      fail(`legacy /api/devstudio reference exists: ${path.relative(root, file)}`);
  }
}

const courseFactoryBarrel = read('lib/course-factory/index.ts');
if (
  !courseFactoryBarrel.includes("export { courseFactory } from '../course-builder/orchestrator'")
) {
  fail('public Course Factory barrel bypasses Course Builder orchestration');
}
const studioController = read('lib/devstudio/course-builder-controller.ts');
if (!studioController.includes("from '../course-builder/orchestrator'"))
  fail('Studio Course Builder controller does not delegate to canonical orchestrator');
const courseOrchestrator = read('lib/course-builder/orchestrator.ts');
if (!courseOrchestrator.includes("from '../course-factory/factory'"))
  fail('Course Builder orchestrator is not the owner of private Course Factory execution');

const adminAiChat = read('apps/admin/app/api/admin/dev-studio/chat/route.ts');
const durableCourseWorker = read('lib/jobs/handlers/course-build.ts');
if (!durableCourseWorker.includes("from '@/lib/course-factory'")) {
  fail(
    'Admin AI does not delegate course creation through the canonical Course Builder facade/controller',
  );
}
if (adminAiChat.includes('@/lib/course-factory/factory'))
  fail('Admin AI imports the private Course Factory engine directly');
if (!durableCourseWorker.includes('normalizeGeneratedCourseForGovernance'))
  fail('Admin AI course creation does not run post-generation governance');
if (adminAiChat.includes('intake_submissions'))
  fail(
    'Admin AI references retired/nonexistent intake_submissions instead of canonical applications',
  );
for (const invariant of ['ADMIN_AI', 'UNIFIED_CAPABILITY_RULES', 'recordUnifiedCapabilityUse']) {
  if (!adminAiChat.includes(invariant)) fail(`Admin AI is missing unified execution: ${invariant}`);
}

const capabilityRail = read('components/studio/StudioCapabilityRail.tsx');
for (const capability of ['Plugins & connections', 'repository:', 'browser:', 'memory:']) {
  if (!capabilityRail.includes(capability))
    fail(`Studio capability rail does not expose canonical capability: ${capability}`);
}
if (!capabilityRail.includes('const visible = workspaces;'))
  fail(
    'Studio capability rail hides registered workspaces instead of exposing the canonical registry',
  );
const unifiedChat = read('components/studio/UnifiedEllieChat.tsx');
for (const interaction of ['Attach a file', 'selectStudioAgent', 'capabilitiesUsed']) {
  if (!unifiedChat.includes(interaction))
    fail(`canonical Studio chat is missing intelligence interaction: ${interaction}`);
}
const studioWorkspace = read('components/studio/StudioCommandWorkspace.tsx');
if (studioWorkspace.includes('StudioCapabilityRail'))
  fail('Root Studio still exposes separate agent/capability navigation');
if (unifiedChat.includes('agentOverride'))
  fail('Canonical Studio chat still allows a user-selected agent override');
for (const forbiddenWrite of [
  ".from('lms_courses').insert",
  ".from('modules').insert",
  ".from('curriculum_lessons').insert",
]) {
  if (adminAiChat.includes(forbiddenWrite))
    fail(`Admin AI reintroduced parallel course persistence: ${forbiddenWrite}`);
}
const buildCourseBlock =
  adminAiChat.match(/case 'build_course': \{([\s\S]*?)case 'generate_videos':/i)?.[1] ?? '';
for (const invariant of [
  'dryRun: false',
  "__type: 'course_build_queued'",
  "status: 'queued'",
  'idempotency_key',
  'requestedCourseId',
  'programId',
  'programSlug',
]) {
  if (!buildCourseBlock.includes(invariant))
    fail(`build_course is not a one-step governed Course Builder operation: ${invariant}`);
}
for (const durableFile of [
  'lib/jobs/handlers/course-build.ts',
  'apps/admin/app/api/cron/process-course-builder-jobs/route.ts',
  'supabase/migrations/20260902090000_durable_course_builder_jobs.sql',
])
  if (!exists(durableFile))
    fail(`durable Course Builder execution file is missing: ${durableFile}`);
const courseBuildWorker = read('lib/jobs/handlers/course-build.ts');
for (const invariant of [
  'courseFactory(',
  'normalizeGeneratedCourseForGovernance',
  "status: 'completed'",
])
  if (!courseBuildWorker.includes(invariant))
    fail(`durable Course Builder worker is missing invariant: ${invariant}`);
if (buildCourseBlock.includes('/api/admin/courses/ai-builder/generate'))
  fail(
    'build_course regressed to draft-only compatibility endpoint instead of canonical persistence',
  );
if (adminAiChat.includes("name: 'save_course'") || adminAiChat.includes("case 'save_course'"))
  fail('obsolete save_course compatibility path was reintroduced');

const preAuthRegistry = read('lib/pre-auth-tables.ts');
if (
  /table:\s*'studio_(?:chat_history|comments|shares|deploy_tokens|favorites|pr_tracking|recent_files|repos|sessions|settings|workflow_tracking)'/.test(
    preAuthRegistry,
  )
)
  fail('pre-auth registry contains retired legacy Studio tables');

const courseApplication = read('apps/admin/app/studio/courses/[courseId]/page.tsx');
for (const dependency of [
  'CourseProvider',
  'CourseStudioApplication',
  'StudioWorkspace',
  'loadCourseSession',
]) {
  if (!courseApplication.includes(dependency))
    fail(`complete course application is missing ${dependency}`);
}

const courseCatalog = read('components/admin/course-builder/UnifiedCourseBuilder.tsx');
for (const forbiddenDependency of [
  '/api/admin/course-builder/course',
  'LiveCourseBuilder',
  'CourseInteractionStudio',
  'WorkspacePayload',
]) {
  if (courseCatalog.includes(forbiddenDependency))
    fail(`course catalog reintroduced a parallel course state path: ${forbiddenDependency}`);
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
if (!read('apps/admin/app/cfd-studio/page.tsx').includes("redirect('/studio/cfd')"))
  fail('legacy CFD route is not a compatibility redirect');

if (failures.length) {
  console.error(failures.map((message) => `STUDIO ARCHITECTURE ERROR: ${message}`).join('\n'));
  process.exit(1);
}
console.log(
  `Studio architecture verified: one Admin shell, ${routes.length} advanced capability surfaces, and ${capabilityRoutes.size} Admin-owned Studio APIs; Course Builder facade/orchestrator owns course execution and no parallel Studio API/schema authority exists.`,
);
