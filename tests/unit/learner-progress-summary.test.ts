import { describe, expect, it } from 'vitest';
import { summarizeLearnerProgress } from '@/lib/learner/progress-summary';
const enrollments = [{ course_id: 'course', course_title: 'HVAC', status: 'active', continue_url: '/lms/courses/course' }];
const lessons = [{ id: 'a', course_id: 'course', title: 'Safety' }, { id: 'b', course_id: 'course', title: 'Tools' }];
const progress = (id: string, completed = true) => ({ lesson_id: id, course_id: 'course', completed, completed_at: '2026-10-27T10:00:00Z', updated_at: '2026-10-27T11:00:00Z', time_spent_seconds: 1800 });
describe('learner progress uses published lesson identities', () => {
  it('deduplicates enrollment and lesson rows and excludes draft or foreign completions', () => {
    const result = summarizeLearnerProgress([...enrollments, ...enrollments], lessons, [progress('a'), progress('a'), progress('draft'), { ...progress('b'), course_id: 'other' }], [80, 90], new Date('2026-10-27T12:00:00Z'));
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0]).toMatchObject({ progress: 50, lessonsCompleted: 1, totalLessons: 2, nextMilestone: 'Tools', continueUrl: '/lms/courses/course' });
    expect(result.overallProgress).toMatchObject({ completionRate: 50, coursesCompleted: 0, studyHours: .5, averageScore: 85, streak: 1 });
  });
  it('does not classify an unpublished empty course as completed', () => {
    const result = summarizeLearnerProgress(enrollments, [], [], []);
    expect(result.overallProgress.coursesCompleted).toBe(0);
    expect(result.courses[0].progress).toBe(0);
  });
  it('respects the latest correction to a completed lesson', () => {
    const result = summarizeLearnerProgress(enrollments, lessons, [progress('a'), { ...progress('a', false), updated_at: '2026-10-28T10:00:00Z' }], []);
    expect(result.courses[0].lessonsCompleted).toBe(0);
  });
  it('accepts a dated completion after an undated import without counting duplicate lessons', () => {
    const result = summarizeLearnerProgress(enrollments, [...lessons, lessons[0]], [{ ...progress('a', false), updated_at: null, completed_at: null }, progress('a')], []);
    expect(result.courses[0]).toMatchObject({ lessonsCompleted: 1, totalLessons: 2, progress: 50 });
  });
  it('counts a course complete only when all published lessons have completion records', () => {
    const result = summarizeLearnerProgress(enrollments, lessons, [progress('a'), progress('b')], [NaN, -1, 1000, 80]);
    expect(result.overallProgress).toMatchObject({ completionRate: 100, coursesCompleted: 1, averageScore: 80 });
  });
});
