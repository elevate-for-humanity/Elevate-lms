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

  it('uses Admin-owned course generation and publishing from the Studio UI', () => {
    const builder = source('components/course/AutomaticCourseBuilder.tsx');

    expect(builder).toContain("fetch('/api/admin/courses/generate'");
    expect(builder).toContain("fetch('/api/admin/courses/generate/publish'");
    expect(builder).not.toContain("fetch('/api/ai/generate-and-publish-course'");
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

    expect(panel).toContain("fetch('/api/devstudio/chat'");
    expect(panel).not.toContain('/api/admin/studio/');
  });
});
