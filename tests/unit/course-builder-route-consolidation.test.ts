import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const SOURCE_ROOTS = ['apps/admin/app', 'apps/lms/app', 'components', 'lib/routes'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

function collectSourceFiles(relativeDir: string): string[] {
  const absoluteDir = path.join(root, relativeDir);
  if (!existsSync(absoluteDir)) return [];

  const files: string[] = [];
  for (const name of readdirSync(absoluteDir)) {
    const absolute = path.join(absoluteDir, name);
    const relative = path.relative(root, absolute).replaceAll('\\', '/');
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(relative));
    } else if (SOURCE_EXTENSIONS.has(path.extname(name))) {
      files.push(relative);
    }
  }
  return files;
}

const retiredUiPatterns = [
  /href\s*=\s*["'`]\/admin(?:\/|["'`])/,
  /redirect\(\s*["'`]\/admin(?:\/|["'`])/,
  /permanentRedirect\(\s*["'`]\/admin(?:\/|["'`])/,
  /router\.(?:push|replace)\(\s*["'`]\/admin(?:\/|["'`])/,
  /window\.location(?:\.href)?\s*=\s*["'`]\/admin(?:\/|["'`])/,
];

describe('Admin UI route consolidation', () => {
  it('has no parallel apps/admin/app/admin route tree', () => {
    expect(existsSync(path.join(root, 'apps/admin/app/admin'))).toBe(false);
  });

  it('keeps the canonical Studio and Course Builder entries', () => {
    expect(existsSync(path.join(root, 'apps/admin/app/studio/page.tsx'))).toBe(true);
    expect(existsSync(path.join(root, 'apps/admin/app/course-builder/page.tsx'))).toBe(true);
  });

  it('keeps legacy CourseBuilderClient operations wired into the canonical builder', () => {
    const canonical = readFileSync(
      path.join(root, 'components/admin/course-builder/UnifiedCourseBuilder.tsx'),
      'utf8',
    );
    expect(existsSync(path.join(root, 'apps/admin/app/admin/course-builder/CourseBuilderClient.tsx'))).toBe(false);
    expect(canonical).toContain('/api/admin/courses/${course.id}/clone');
    expect(canonical).toContain('/api/admin/lms/courses/${course.id}/publish');
    expect(canonical).toContain("method: action === 'delete' ? 'DELETE'");
    expect(canonical).toContain("JSON.stringify({ status: 'draft' })");
    expect(canonical).toContain('runCourseFactoryPipeline');
    expect(canonical).toContain('CourseInstructorMediaPanel');
  });

  it('does not expose retired /admin UI links or redirects from executable source', () => {
    const violations: string[] = [];
    for (const sourceRoot of SOURCE_ROOTS) {
      for (const file of collectSourceFiles(sourceRoot)) {
        const content = readFileSync(path.join(root, file), 'utf8');
        if (retiredUiPatterns.some((pattern) => pattern.test(content))) {
          violations.push(file);
        }
      }
    }

    expect(violations, `Retired /admin UI route references found:\n${violations.join('\n')}`).toEqual([]);
  });

  it('does not confuse the valid /api/admin namespace with retired UI routes', () => {
    const example = "fetch('/api/admin/studio/workflows')";
    expect(retiredUiPatterns.some((pattern) => pattern.test(example))).toBe(false);
  });
});
