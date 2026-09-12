// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Admin dashboard resilience', () => {
  it('resolves the Cloud Browser target through canonical configuration', () => {
    const workspace = read('components/studio/CloudBrowserWorkspace.tsx');

    expect(workspace).toContain("fetch('/api/admin/dev-studio/config'");
    expect(workspace).toContain('payload.defaultPreviewUrl');
    expect(workspace).toContain('window.location.origin');
    expect(workspace).not.toContain(
      "useState('https://admin.elevateforhumanity.org/dashboard')",
    );
  });

  it('does not classify an intentional generation pause as degraded health', () => {
    const route = read('apps/admin/app/api/admin/courses/health/route.ts');
    const studio = read('components/admin/course-builder/UnifiedCourseBuilder.tsx');

    expect(route).toContain("state: generationPaused ? 'paused' : 'ready'");
    expect(route).not.toContain("if (generationPaused) status = 'degraded'");
    expect(studio).toContain("check.state === 'paused'");
  });

  it('timeboxes every Admin dashboard dependency independently', () => {
    const dashboard = read('lib/admin/get-admin-dashboard-data.ts');

    expect(dashboard).toContain('DASHBOARD_SOURCE_TIMEOUT_MS = 8_000');
    expect(dashboard).toContain('timeboxDashboardQuery(');
    expect(dashboard).toContain('timeboxDashboardHealth(');
    expect(dashboard).toContain('the rest of the dashboard remains available');
  });
});
