import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => readFileSync(path.resolve(relativePath), 'utf8');

describe('PARIS learner scope', () => {
  it('labels the learner assistant instead of rendering an unexplained dot', () => {
    const button = source('components/paris/ParisFloatingButton.tsx');

    expect(button).toContain('Ask PARIS · Course help');
    expect(button).toContain('PARIS Learning Assistant');
    expect(button).toContain('sm:w-[min(480px,calc(100vw-3rem))]');
  });

  it('correlates the dashboard assistant with the active course', () => {
    const dashboard = source('apps/lms/app/lms/(app)/dashboard/page.tsx');

    expect(dashboard).toContain('surface="learner"');
    expect(dashboard).toContain('courseTitle={activeCourse?.title}');
    expect(dashboard).toContain('nextLessonTitle={nextLesson?.title}');
    expect(dashboard).toContain('courseProgress={courseProgress}');
  });

  it('mounts the floating PARIS experience only on the learner dashboard', () => {
    const home = source('apps/marketing/app/page.tsx');
    const contact = source('apps/marketing/app/contact/page.tsx');
    const enrollment = source('apps/lms/app/enrollment/page.tsx');
    const apprenticeHours = source('apps/lms/app/apprentice/hours/page.tsx');
    const apprenticeBoard = source('apps/lms/app/apprentice/state-board/page.tsx');

    for (const publicOrNonDashboardSurface of [home, contact, enrollment, apprenticeHours, apprenticeBoard]) {
      expect(publicOrNonDashboardSurface).not.toContain('ParisFloating');
    }
  });

  it('derives learner context from the authenticated enrollment and protects graded work', () => {
    const route = source('apps/lms/app/api/ai-chat/route.ts');

    expect(route).toContain(".from('course_enrollments')");
    expect(route).toContain(".eq('student_id', user.id)");
    expect(route).toContain('Never complete a graded assignment');
    expect(route).toContain('Authenticated learner course context is unavailable.');
  });
});
