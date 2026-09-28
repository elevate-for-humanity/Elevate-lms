import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Ultimate Course Builder production cutover', () => {
  it('makes Ultimate the only active Admin build surface', () => {
    const page = read('apps/admin/app/studio/courses/page.tsx');
    const builder = read('components/admin/course-builder/UnifiedCourseBuilder.tsx');
    const ultimateRoute = read('apps/admin/app/api/admin/ultimate-course-builder/route.ts');
    const coursesRoute = read('apps/admin/app/api/admin/courses/route.ts');
    const productionHandlers = read('lib/ultimate-course-builder/core/production-handlers.ts');

    expect(page).toContain('Ultimate Course Builder');
    expect(page).not.toContain('Course Factory');
    expect(builder).toContain("label: 'Ultimate Build'");
    expect(builder).toContain("action: 'queue-course'");
    expect(builder).toContain('/api/admin/ultimate-course-builder');
    expect(builder).not.toContain('runCourseFactoryPipeline');
    expect(ultimateRoute).toContain('UltimateJobQueue');
    expect(ultimateRoute).toContain("body.action === 'queue-course'");
    expect(ultimateRoute).not.toContain('is_published: false');
    expect(ultimateRoute).toContain('UltimateAppendixAStandardsSource');
    expect(productionHandlers).toContain("ctx.profile.authority==='course-defined'");
    expect(productionHandlers).toContain("ctx.profile.id.startsWith('course:')");
    expect(productionHandlers).toContain("status:'course-defined',verified:true");
    expect(coursesRoute).toContain(".from('programs')");
    expect(coursesRoute).toContain('slug: courseSlug');
  });

  it('retires public Course Factory pages and legacy generation actions', () => {
    const lms = read('apps/lms/app/ai/course-factory/page.tsx');
    const marketing = read('apps/marketing/app/ai/course-factory/page.tsx');
    const legacyRoute = read('apps/admin/app/api/admin/course-builder/route.ts');

    expect(lms).toContain("redirect('https://admin.elevateforhumanity.org/studio/courses?tab=ultimate')");
    expect(marketing).toContain("getAdminUrl('/studio/courses?tab=ultimate')");
    expect(legacyRoute).toContain('COURSE_FACTORY_ARCHIVED');
    expect(legacyRoute).toContain("status: 410");
  });
});
