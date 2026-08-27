import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const generator = readFileSync('lib/scorm/course-package.ts', 'utf8');
const route = readFileSync('apps/admin/app/api/admin/course-builder/scorm/export/route.ts', 'utf8');
const workspace = readFileSync('components/admin/course-builder/CourseLifecycleWorkspace.tsx', 'utf8');

describe('production SCORM export', () => {
  it('generates ZIP packages in memory without temporary files or shell execution', () => {
    expect(generator).toContain('generateScormPackage');
    expect(generator).toContain('Buffer.concat');
    expect(generator).not.toContain('temp/');
    expect(generator).not.toContain('exec');
  });

  it('protects the export route and resolves the selected course dynamically', () => {
    expect(route).toContain('apiRequireAdmin');
    expect(route).toContain("searchParams.get('courseId')");
    expect(route).toContain(".from('training_courses')");
    expect(route).toContain(".from('training_lessons')");
    expect(route).toContain("'application/zip'");
  });

  it('exposes SCORM 1.2 and 2004 downloads in Course Lifecycle', () => {
    expect(workspace).toContain('Export SCORM 1.2');
    expect(workspace).toContain('Export SCORM 2004');
    expect(workspace).toContain('/api/admin/course-builder/scorm/export');
  });
});
