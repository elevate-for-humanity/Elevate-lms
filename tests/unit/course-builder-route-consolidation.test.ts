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
    expect(existsSync(path.join(root, 'apps/admin/app/studio/courses/page.tsx'))).toBe(true);
    expect(existsSync(path.join(root, 'apps/admin/app/course-builder/page.tsx'))).toBe(true);
    expect(existsSync(path.join(root, 'apps/admin/app/course-studio/page.tsx'))).toBe(true);

    const builderAlias = readFileSync(
      path.join(root, 'apps/admin/app/course-builder/page.tsx'),
      'utf8',
    );
    const studioAlias = readFileSync(
      path.join(root, 'apps/admin/app/course-studio/page.tsx'),
      'utf8',
    );
    expect(builderAlias).toContain("redirect('/studio/courses')");
    expect(studioAlias).toContain("redirect('/studio/courses')");
  });

  it('surfaces the complete per-course Studio workspace inside the canonical builder shell', () => {
    const unified = readFileSync(
      path.join(root, 'components/admin/course-builder/UnifiedCourseBuilder.tsx'),
      'utf8',
    );
    expect(unified).toContain("id: 'workspace'");
    expect(unified).toContain('/studio/courses/');
    expect(unified).toContain('Unified course workspace');
    expect(unified).toContain('Live learner browser');
  });

  it('declares one Course Builder authority and routes generated courses into it', () => {
    const contracts = JSON.parse(
      readFileSync(path.join(root, 'lib/routes/platform-surface-contracts.json'), 'utf8'),
    );
    const catalog = readFileSync(path.join(root, 'lib/platform/capability-catalog.ts'), 'utf8');
    const automaticBuilder = readFileSync(
      path.join(root, 'components/course/AutomaticCourseBuilder.tsx'),
      'utf8',
    );

    expect(contracts.surfaces.courseBuilder.canonical.path).toBe('/studio/courses');
    expect(contracts.surfaces.courseBuilder.compatibility).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/course-builder', target: '/studio/courses' }),
        expect.objectContaining({ path: '/course-studio', target: '/studio/courses' }),
      ]),
    );
    expect(catalog).toContain("adminHref: '/studio/courses'");
    expect(catalog).not.toContain("adminHref: '/admin/dev-studio'");
    expect(automaticBuilder).toContain('`/studio/courses/${result.course_id}`');
    expect(automaticBuilder).not.toContain('`/curriculum/${result.course_id}`');
  });

  it('keeps course operations wired into the canonical builder', () => {
    const canonical = readFileSync(
      path.join(root, 'components/admin/course-builder/UnifiedCourseBuilder.tsx'),
      'utf8',
    );
    expect(existsSync(path.join(root, 'apps/admin/app/admin/course-builder/CourseBuilderClient.tsx'))).toBe(false);
    expect(canonical).toContain('/api/admin/courses/${course.id}/clone');
    expect(canonical).toContain("? '/api/admin/course-builder'");
    expect(canonical).toContain("action: 'publish-persisted', courseId: course.id");
    expect(canonical).toContain("method: action === 'delete' ? 'DELETE'");
    expect(canonical).toContain("JSON.stringify({ status: 'draft', is_published: false })");
    expect(canonical).toContain('runCourseFactoryPipeline');
    expect(canonical).toContain('CourseInstructorMediaPanel');
    expect(canonical).toContain('overflow-x-clip');
    expect(canonical).toContain('xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26.25rem)]');
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
