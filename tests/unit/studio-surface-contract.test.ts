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

    expect(shell).toContain("requireTypedConfirmation(body?.confirmation, 'deploy_autopilot')");
    expect(files).toContain("requireTypedConfirmation(body.confirmation, 'git_push')");
  });
});
