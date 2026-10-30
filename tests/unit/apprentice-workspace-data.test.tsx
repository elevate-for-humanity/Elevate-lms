import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const state = vi.hoisted(() => ({
  tables: {} as Record<string, any[]>,
  failedTable: '',
  calls: [] as Array<{ table: string; op: string; args: any[] }>,
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'learner' } } }) },
    from: (table: string) => {
      const q: any = {};
      for (const op of ['select', 'eq', 'or', 'in', 'is', 'not', 'order', 'gte', 'limit'])
        q[op] = (...args: any[]) => {
          state.calls.push({ table, op, args });
          if (table === 'quizzes' && op === 'select' && /\btime_limit\b/.test(args[0]))
            throw new Error('column quizzes.time_limit does not exist');
          return q;
        };
      q.then = (resolve: any) =>
        resolve({
          data: state.tables[table] || [],
          error: state.failedTable === table ? { message: 'Database unavailable' } : null,
        });
      q.maybeSingle = async () => ({ data: state.tables[table]?.[0] || null, error: null });
      return q;
    },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => (await import('@/lib/supabase/server')).createClient(),
}));
vi.mock('@/components/ui/Breadcrumbs', () => ({ Breadcrumbs: () => null }));
vi.mock('@/components/lms/LmsHeroBanner', () => ({
  LmsHeroBanner: ({ title }: any) => <h1>{title}</h1>,
}));
vi.mock('@/components/AssignmentSubmission', () => ({ default: () => null }));
vi.mock('@/components/LearningAnalyticsDashboard', () => ({ default: () => null }));
vi.mock('@/components/StudentEngagementAnalytics', () => ({ default: () => null }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
import QuizzesPage from '@/apps/lms/app/lms/(app)/quizzes/page';
import GradesPage from '@/apps/lms/app/lms/(app)/grades/page';
import AssignmentsPage from '@/apps/lms/app/lms/(app)/assignments/page';
import AnalyticsPage from '@/apps/lms/app/lms/(app)/analytics/page';

beforeEach(() => {
  state.calls = [];
  state.failedTable = '';
  state.tables = {
    program_enrollments: [{ id: 'e', course_id: 'c', status: 'confirmed' }],
    courses: [{ id: 'c', title: 'Cosmetology', total_lessons: 40, duration_hours: 154 }],
  };
});
describe('shared learner coursework connections', () => {
  it('loads canonical published lesson assessments and both enrollment identity columns', async () => {
    state.tables.course_lessons = [
      { id: 'q', course_id: 'c', title: 'Sanitation exam', lesson_type: 'exam', passing_score: 80 },
    ];
    const html = renderToStaticMarkup(await QuizzesPage());
    expect(html).toContain('Sanitation exam');
    expect(state.calls.some((call) => call.table === 'quizzes')).toBe(false);
    expect(state.calls).toContainEqual({
      table: 'program_enrollments',
      op: 'or',
      args: ['user_id.eq.learner,student_id.eq.learner'],
    });
    expect(state.calls).toContainEqual({
      table: 'program_enrollments',
      op: 'in',
      args: ['status', ['active', 'enrolled', 'in_progress', 'confirmed']],
    });
  });
  it('does not halve a quiz-only grade average or lose its course title', async () => {
    state.tables.quiz_attempts = [
      {
        id: 'a',
        quiz_id: 'q',
        course_id: 'c',
        score: 90,
        completed_at: '2026-10-29T12:00:00Z',
        quizzes: { course_id: 'c', title: 'Sanitation exam' },
      },
    ];
    const html = renderToStaticMarkup(await GradesPage());
    expect(html).toContain('90');
    expect(html).not.toContain('45%');
    expect(html).not.toContain('Unknown Course');
    expect(html).toContain('Cosmetology');
  });
  it('includes confirmed enrollment assignments and fails visibly on a database error', async () => {
    state.tables.assignments = [
      {
        id: 'a',
        course_id: 'c',
        title: 'Client consultation',
        due_date: '2027-01-01T12:00:00Z',
        max_points: 100,
      },
    ];
    expect(renderToStaticMarkup(await AssignmentsPage())).toContain('Client consultation');
    expect(state.calls).toContainEqual({
      table: 'program_enrollments',
      op: 'is',
      args: ['revoked_at', null],
    });
  });
  it('surfaces database failures instead of reporting no assignments', async () => {
    state.failedTable = 'assignments';
    await expect(AssignmentsPage()).rejects.toThrow('Your assignments could not be loaded');
  });
  it('includes canonical lesson assessment results alongside standalone quizzes', async () => {
    state.tables.course_lessons = [
      {
        id: 'lesson',
        course_id: 'c',
        title: 'Infection control checkpoint',
        lesson_type: 'lesson',
        passing_score: 80,
      },
    ];
    state.tables.checkpoint_scores = [{ lesson_id: 'lesson', score: 90, passed: true }];
    const html = renderToStaticMarkup(await QuizzesPage());
    expect(html).toContain('/lms/courses/c/lessons/lesson');
    expect(html).toContain('Best score: 90%');
    expect(html).toContain('Passed');
    expect(state.calls).toContainEqual({
      table: 'course_lessons',
      op: 'or',
      args: ['lesson_type.in.(checkpoint,quiz,exam),quiz_questions.not.eq.[]'],
    });
    const grades = renderToStaticMarkup(await GradesPage());
    expect(grades).toContain('Infection control checkpoint');
    expect(grades).not.toContain('No Grades Yet');
  });
  it('shows completed lessons from the same ledger written by lesson completion', async () => {
    state.tables.lesson_progress = [
      { course_id: 'c', lesson_id: 'l', completed: true, updated_at: '2026-10-29T12:00:00Z' },
    ];
    const html = renderToStaticMarkup(await AnalyticsPage());
    expect(html).toContain('1');
    expect(
      state.calls.some(
        (c) =>
          c.table === 'lesson_progress' &&
          c.op === 'eq' &&
          c.args[0] === 'user_id' &&
          c.args[1] === 'learner',
      ),
    ).toBe(true);
    expect(state.calls.some((c) => c.table === 'student_progress')).toBe(false);
  });
  it('inherits program course grants when the direct course pointer is missing', async () => {
    state.tables.program_enrollments = [
      { id: 'enrollment', program_id: 'program', course_id: null, status: 'confirmed' },
    ];
    state.tables.program_courses = [{ course_id: 'c' }];
    state.tables.course_lessons = [
      {
        id: 'linked',
        course_id: 'c',
        title: 'Program-granted checkpoint',
        lesson_type: 'checkpoint',
      },
    ];
    expect(renderToStaticMarkup(await QuizzesPage())).toContain('Program-granted checkpoint');
    expect(state.calls).toContainEqual({
      table: 'program_courses',
      op: 'in',
      args: ['program_id', ['program']],
    });
  });
});
