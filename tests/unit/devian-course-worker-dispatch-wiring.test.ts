import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Devian/PARIS course worker delegation', () => {
  it('uses the same authenticated worker launcher as the Admin resume button', () => {
    const source = readFileSync('apps/admin/app/api/admin/dev-studio/course-agent/route.ts', 'utf8');
    expect(source).toContain("import { requestCourseWorker } from '@/lib/gcp/course-worker-launch'");
    expect(source).toContain('const dispatch = await requestCourseWorker()');
    expect(source).not.toContain("dispatchGoogleDeployment('course-builder')");
  });
  it('does not claim execution success when neither dispatcher starts', () => {
    const source = readFileSync('apps/admin/app/api/admin/dev-studio/course-agent/route.ts', 'utf8');
    expect(source).toContain('if (!dispatch.dispatched)');
    expect(source).toContain('executionVerified: false');
    expect(source).toContain('buildId: queued.build.id');
  });
});
