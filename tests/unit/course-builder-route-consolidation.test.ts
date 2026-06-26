import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

describe('studio route consolidation', () => {
  it('studio pages exist at the canonical /admin/studio route (LMS container)', () => {
    // LMS root level: app/admin/studio/
    expect(existsSync(path.join(root, 'app/admin/studio/page.tsx'))).toBe(true);
    expect(existsSync(path.join(root, 'app/admin/studio/courses/page.tsx'))).toBe(true);
    expect(existsSync(path.join(root, 'app/admin/studio/StudioClientWrapper.tsx'))).toBe(true);
  });

  it('deleted legacy page directories no longer exist', () => {
    expect(existsSync(path.join(root, 'app/admin/course-builder'))).toBe(false);
    expect(existsSync(path.join(root, 'app/admin/video-manager'))).toBe(false);
    expect(existsSync(path.join(root, 'app/admin/ai-console'))).toBe(false);
    expect(existsSync(path.join(root, 'app/admin/ai-studio'))).toBe(false);
    expect(existsSync(path.join(root, 'app/admin/copilot'))).toBe(false);
    expect(existsSync(path.join(root, 'app/admin/applicants'))).toBe(false);
  });

  it('nav and program pages link to /admin/studio, not old routes', () => {
    expect(read('app/admin/programs/page.tsx')).toContain('href="/admin/studio"');
    expect(read('app/admin/programs/page.tsx')).not.toContain('href="/admin/course-builder"');
    expect(read('app/admin/programs/page.tsx')).not.toContain('href="/admin/curriculum"');
  });

  it('programs-table links to /admin/studio not /admin/course-builder', () => {
    const table = read('app/admin/programs/programs-table.tsx');
    expect(table).not.toContain('/admin/course-builder');
    expect(table).toContain('/admin/studio');
  });

  it('does not rely on legacy builder redirects or route metadata', () => {
    expect(read('proxy.ts')).not.toContain('/admin/programs/builder');
    expect(read('lib/auth/lms-routes.ts')).not.toContain('/lms/builder');
  });

  it('studio route uses ClientComponent wrapper for ssr:false', () => {
    const wrapper = read('app/admin/studio/StudioClientWrapper.tsx');
    expect(wrapper).toContain("'use client'");
    expect(wrapper).toContain("ssr: false");
    expect(wrapper).toContain("dynamic(");
  });
});
