import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

describe('Admin Dashboard and Studio surface contract', () => {
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
});
