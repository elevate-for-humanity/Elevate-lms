import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

describe('Admin Dashboard and Studio surface contract', () => {
  it('registers implemented top-level Studio operations pages in navigation', () => {
    const registry = source('lib/devstudio/workspace-registry.ts');
    for (const route of ['/studio/agents', '/studio/builds', '/studio/logs']) {
      expect(registry).toContain(`route: '${route}'`);
    }
  });

  it('keeps one canonical Admin Dashboard and Studio route', () => {
    const contracts = JSON.parse(source('lib/routes/platform-surface-contracts.json'));

    expect(contracts.surfaces.adminPortal.canonical).toEqual({ app: 'admin', path: '/dashboard' });
    expect(contracts.surfaces.devStudio.canonical).toEqual({ app: 'admin', path: '/studio' });
  });

  it('canonicalizes legacy Admin paths once in middleware without duplicate Next routes', () => {
    const nextConfig = source('apps/admin/next.config.mjs');
    const middleware = source('apps/admin/middleware.ts');

    expect(nextConfig).not.toContain("source: '/admin'");
    expect(nextConfig).not.toContain("source: '/admin/");
    expect(nextConfig).not.toContain("source: '/dev-studio/:path*'");
    expect(middleware).toContain("const legacyStudioPrefixes = ['/admin/studio', '/admin/dev-studio', '/dev-studio']");
    expect(middleware).toContain("pathname === '/admin/dashboard'");
    expect(middleware).toContain("pathname === '/admin' || pathname.startsWith('/admin/')");
  });

  it('uses the single canonical Course Builder route from the Studio UI', () => {
    const builder = source('components/course/AutomaticCourseBuilder.tsx');
    const client = source('components/admin/course-builder/runCourseFactoryPipeline.ts');
    const unified = source('components/admin/course-builder/UnifiedCourseBuilder.tsx');

    expect(builder).toContain('runCourseFactoryPipeline');
    expect(client).toContain("fetch('/api/admin/course-builder'");
    expect(client).not.toContain('/api/admin/course-builder/pipeline');
    expect(unified).toContain("fetch('/api/admin/course-builder?action=blueprints'");
    expect(unified).not.toContain('/api/admin/course-builder/generate-from-blueprint');
    expect(builder).not.toContain('/api/admin/courses/generate');
    expect(builder).not.toContain('/api/ai/generate-and-publish-course');
  });

  it('uses the canonical workflow API from dashboard and Studio panels', () => {
    for (const file of [
      'components/admin/dashboard/WorkflowsOpsPanel.tsx',
      'components/studio/DevStudioWorkflowsPanel.tsx',
    ]) {
      const content = source(file);
      expect(content).toContain("fetch('/api/admin/workflows'");
      expect(content).toContain("fetch('/api/admin/workflows/run'");
      expect(content).not.toContain('/api/admin/studio/');
    }
  });

  it('uses the canonical Dev Studio chat controller', () => {
    const panel = source('components/studio/panels/AIPanel.tsx');

    expect(panel).toContain("fetch('/api/admin/dev-studio/chat'");
    expect(panel).not.toContain('/api/admin/studio/');
  });

  it('routes commercial generation through the live Media Studio endpoint', () => {
    const registry = source('lib/ai/tools/registry.ts');
    const commercialRoute = source('apps/admin/app/api/admin/media-studio/commercial/route.ts');

    expect(registry).toContain("name: 'video.generate'");
    expect(registry).toContain("path: '/api/admin/media-studio/commercial'");
    expect(registry).not.toContain("path: '/api/video/generate'");
    expect(commercialRoute).toContain("z.enum(['plan', 'revise', 'render'])");
    expect(commercialRoute).toContain('renderCommercialVideo(plan, brief)');
  });

  it('keeps organization lookup separate from protected student search', () => {
    const registry = source('lib/ai/tools/registry.ts');
    const planner = source('lib/ai/tools/planner.ts');
    const execute = source('apps/admin/app/api/admin/dev-studio/execute/route.ts');

    expect(registry).toContain("name: 'organization.directory'");
    expect(planner).toContain("name: 'organization.directory'");
    expect(execute).toContain("toolName === 'organization.directory'");
    expect(execute).toContain("'students.search': 'Student records were found.");
  });

  it('enforces production confirmation at server execution boundaries', () => {
    const shell = source('apps/admin/app/api/admin/dev-studio/shell/route.ts');
    const files = source('apps/admin/app/api/admin/dev-studio/files/route.ts');
    const builds = source('apps/admin/app/api/admin/dev-studio/builds/route.ts');
    const services = source('apps/admin/app/api/admin/dev-studio/services/route.ts');
    const environment = source('apps/admin/app/api/admin/dev-studio/env/route.ts');

    expect(shell).toContain("requireTypedConfirmation(body?.confirmation, 'deploy_autopilot')");
    expect(files).toContain("requireTypedConfirmation(body.confirmation, 'git_push')");
    expect(builds).toContain("requireTypedConfirmation(body.confirmation, 'deploy_autopilot')");
    expect(builds).toContain("return safeError('Northflank is not configured.");
    expect(services).toContain("requireTypedConfirmation(body.confirmation, 'deploy_autopilot')");
    expect(environment).toContain("requireTypedConfirmation(req.headers.get('x-confirmation'), 'delete_secret')");
  });

  it('preflights the isolated browser runtime before enabling Chromium', () => {
    const workspace = source('components/studio/CloudBrowserWorkspace.tsx');
    expect(workspace).toContain("fetch('/api/admin/dev-studio/browser/session', { cache: 'no-store' })");
    expect(workspace).toContain('disabled={runtimeReady !== true}');
    expect(workspace).toContain('STUDIO_BROWSER_PUBLIC_URL');
  });

  it('binds browser evidence to the canonical task identity for the full stream', () => {
    const workspace = source('components/studio/CloudBrowserWorkspace.tsx');
    const route = source('apps/admin/app/api/admin/dev-studio/browser/agent/route.ts');
    const tasks = source('apps/admin/app/studio/tasks/TasksClient.tsx');
    expect(route).toContain("'X-Studio-Task-Id': taskId");
    expect(workspace).toContain("response.headers.get('x-studio-task-id')");
    expect(workspace).toContain('event.taskId !== canonicalTaskId');
    expect(workspace).toContain('AI browser task identity changed during execution');
    expect(tasks).toContain('Task ID: {task.id}');
    expect(tasks).toContain('Trace ID: ${task.trace_id}');
    expect(tasks).not.toContain('{task.trace_id || task.id}');
  });

  it('does not advertise the unconnected Live Canvas without its feature flag', () => {
    const registry = source('lib/devstudio/workspace-registry.ts');
    expect(registry).toContain("route: '/studio/canvas'");
    expect(registry).toContain("featureFlag: 'LIVE_CANVAS_ENABLED'");
  });

  it('keeps live preview and isolated browser inspection beside Admin AI', () => {
    const page = source('apps/admin/app/studio/page.tsx');
    const workspace = source('components/studio/StudioCommandWorkspace.tsx');

    expect(page).toContain('StudioCommandWorkspace');
    expect(workspace).toContain('<UnifiedEllieChat');
    expect(workspace).toContain('<RepositoryLivePreview');
    expect(workspace).toContain('<CloudBrowserWorkspace');
    expect(workspace).toContain('Live inspection');
  });

  it('greets Store visitors with the PARIS product interview', () => {
    const wrapper = source('apps/marketing/app/store/StoreClientWrapper.tsx');
    const guide = source('components/store/StoreGuideChat.tsx');
    expect(wrapper).toContain("forceOpen={pathname === '/store'}");
    expect(guide).toContain("I'll start with a quick interview");
    expect(guide).toContain('Let PARIS interview you');
    expect(guide).toContain("useState<'recommend' | 'chat'>('chat')");
    expect(guide).toContain('Guided interview');
    expect(guide).toContain('aria-label="Minimize PARIS"');
  });

  it('consolidates the legacy testing screen into the governed Testing Center', () => {
    const legacy = source('apps/admin/app/testing/page.tsx');
    const canonical = source('apps/admin/app/testing-center/page.tsx');

    expect(legacy).toContain("redirect('/testing-center')");
    expect(legacy).not.toContain("from('testing_sessions')");
    expect(canonical).toContain("from('exam_bookings')");
    expect(canonical).toContain("from('exam_sessions')");
    expect(canonical).toContain("from('testing_slots')");
  });

  it('does not duplicate the Course Builder under multiple program labels', () => {
    const programs = source('apps/admin/app/programs/page.tsx');

    expect(programs.match(/href="\/course-builder"/g)).toHaveLength(1);
    expect(programs).not.toContain('>Program Builder<');
    expect(programs).toContain('>Course Library<');
  });

  it('validates GitHub credentials before declaring Studio execution ready', () => {
    const health = source('lib/devstudio/health-handler.ts');
    expect(health).toContain("fetch('https://api.github.com/user'");
    expect(health).toContain('ready: githubTokenValid');
  });
});
