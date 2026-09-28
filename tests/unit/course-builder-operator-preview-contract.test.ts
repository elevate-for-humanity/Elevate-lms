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
    expect(learnerLayout).toContain('showLearnerNotices && !photoProfile?.avatar_url');
    expect(learnerLayout).toContain('{showLearnerNotices ? (');
    expect(courseLayout).toContain('isAdminCoursePreview = isAdmin && coursePreview.active');
    expect(courseLayout).toContain('showLearnerNotices={!isAdminCoursePreview}');
  });

  it('bypasses paid-generation authorization for platform operators', () => {
    const route = read('apps/admin/app/api/admin/course-builder/route.ts');

    expect(route).toContain('const paidAuthorization = creditOwner.operator');
    expect(route).toContain('const result = creditOwner.operator');
    expect(route).toContain('? await runFactory()');
    expect(route).toContain('dispatch: runFactory');
  });
});
