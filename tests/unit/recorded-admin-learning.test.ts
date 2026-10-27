import { expect, it } from 'vitest';
import { summarizeAdminLearning } from '@/lib/analytics/recorded-learning-summary';
const now = new Date('2026-10-27T12:00:00Z');
const enrollment = { user_id: 'learner', program_id: 'program', course_id: 'course', status: 'active', updated_at: '2026-10-01' };
it('counts distinct learners and completions without exceeding 100 percent on duplicate enrollments', () => {
  const result = summarizeAdminLearning({ learners: [{ id: 'learner' }], enrollments: [enrollment, enrollment], courses: [{ id: 'course', title: 'Training' }], lessons: [{ id: 'lesson', course_id: 'course' }], progress: [{ user_id: 'learner', lesson_id: 'lesson' }], activity: [{ user_id: 'learner', activity_date: '2026-10-27', seconds_watched: 3600 }, { user_id: 'learner', activity_date: '2026-10-27', seconds_watched: 3600 }] }, now);
  expect(result).toMatchObject({ totalLearners: 1, activeThisWeek: 1, completionRate: 100, averageTimePerWeekHours: 2, byProgram: [{ learners: 1, completionRate: 100 }] });
});
it('excludes staff activity and does not use foreign lesson completions or empty courses as proof', () => {
  const result = summarizeAdminLearning({ learners: [{ id: 'learner' }], enrollments: [enrollment], courses: [{ id: 'course', title: 'Training' }], lessons: [{ id: 'required', course_id: 'course' }], progress: [{ user_id: 'learner', lesson_id: 'foreign' }], activity: [{ user_id: 'staff', activity_date: '2026-10-27', seconds_watched: 3600 }] }, now);
  expect(result).toMatchObject({ activeThisWeek: 0, completionRate: 0, averageTimePerWeekHours: 0 });
});
it('uses the latest enrollment status and records certified external completions without inventing lessons', () => {
  const result = summarizeAdminLearning({ learners: [{ id: 'learner' }], enrollments: [enrollment, { ...enrollment, status: 'completed', updated_at: '2026-10-27' }], courses: [{ id: 'course', title: 'Training' }], lessons: [], progress: [], activity: [] }, now);
  expect(result.byProgram[0].completionRate).toBe(100);
});
