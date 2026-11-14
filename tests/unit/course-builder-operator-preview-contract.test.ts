import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('Course Builder operator preview contract', () => {
  it('hides learner profile and billing notices in administrator course previews', () => {
    const learnerLayout = read('components/lms/LearnerWorkspaceLayout.tsx');
    const courseLayout = read('apps/lms/app/lms/courses/layout.tsx');

    expect(learnerLayout).toContain('showLearnerNotices = true');
    expect(learnerLayout).toContain('showLearnerNotices && !isAdmin && !photoProfile?.avatar_url');
    expect(learnerLayout).not.toContain('/apprentice/billing');
    expect(courseLayout).toContain('isAdminCoursePreview = isAdmin && coursePreview.active');
    expect(courseLayout).toContain('showLearnerNotices={!isAdminCoursePreview}');
  });

  it('uses the authenticated production boundary for platform operator generation', () => {
    const route = read('apps/admin/app/api/admin/course-builder/route.ts');

    expect(route).toContain('const auth = await apiRequireAdmin(req)');
    expect(route).toContain('assertCourseBuilderGenerationEnabled(db, body.courseId)');
    expect(route).toContain('requestCanonicalGeneration(db,');
    expect(route).not.toContain('runFactory(');
    const starter = read('lib/ultimate-course-builder/core/start-course.ts');
    expect(starter).toContain('assertCourseBuilderGenerationEnabled(db, body.courseId)');
    expect(starter).toContain('requestedBy: actorId');
  });

  it('routes canonical programs through the Ultimate profile authority', () => {
    const workspace = read('components/admin/course-builder/UnifiedCourseBuilder.tsx');
    const profile = read('lib/ultimate-course-builder/core/course-profile.ts');
    expect(workspace).toContain("action: 'queue-course'");
    expect(workspace).toContain('programSlug: input.programSlug');
    expect(workspace).not.toContain('runCourseFactoryPipeline');
    expect(profile).toContain('registeredSource.supports({ programSlug: input.programSlug })');
    expect(profile).toContain('UltimateAppendixAStandardsSource');
  });
});
