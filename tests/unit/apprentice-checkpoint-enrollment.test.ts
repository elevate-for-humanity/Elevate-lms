import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({
  enrollment: { id: 'enrollment', status: 'confirmed', student_id: 'learner' } as any,
  resolve: vi.fn(),
  record: vi.fn(),
  lessonType: 'checkpoint',
  passingScore: 80 as number | null,
  questions: [{ id: 'q', options: ['a', 'b'], correctAnswer: 1 }] as any[],
}));
vi.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ id: 'learner' }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/lms/access-control', () => ({
  assertLessonAccess: async () => {},
  accessErrorResponse: () => ({ status: 403, body: { error: 'Locked' } }),
}));
vi.mock('@/lib/enrollment/resolve-course-enrollment', () => ({
  resolveCourseEnrollment: (...args: any[]) => {
    state.resolve(...args);
    return state.enrollment;
  },
}));
vi.mock('@/lib/lms/engine', () => ({
  recordCheckpointAttempt: (...args: any[]) => {
    state.record(...args);
    return Promise.resolve({ passed: args[4] >= 80, score: args[4], attemptNumber: 1 });
  },
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => {
      const q: any = {
        select: () => q,
        eq: () => q,
        maybeSingle: async () => ({
          data: {
            id: 'lesson',
            course_id: 'course',
            lesson_type: state.lessonType,
            is_published: true,
            passing_score: state.passingScore,
            quiz_questions: state.questions,
          },
          error: null,
        }),
      };
      return q;
    },
  }),
}));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/notifications/teams', () => ({ sendTeamsMessage: async () => {} }));
import { POST } from '@/apps/lms/app/api/lessons/[lessonId]/checkpoint/route';
function request(answer: number) {
  return new NextRequest('https://app.example.test/api/lessons/lesson/checkpoint', {
    method: 'POST',
    body: JSON.stringify({ courseId: 'course', answers: { q: answer }, score: 100 }),
  });
}
beforeEach(() => {
  state.enrollment = { id: 'enrollment', status: 'confirmed', student_id: 'learner' };
  state.lessonType = 'checkpoint';
  state.passingScore = 80;
  state.questions = [{ id: 'q', options: ['a', 'b'], correctAnswer: 1 }];
  state.record.mockClear();
  state.resolve.mockClear();
});
it('uses the canonical enrollment resolver for confirmed and student_id program grants', async () => {
  const response = await POST(request(1), { params: Promise.resolve({ lessonId: 'lesson' }) });
  expect(response.status).toBe(200);
  expect(state.resolve).toHaveBeenCalledWith('learner', 'course');
  expect(state.record).toHaveBeenCalledWith('learner', 'lesson', 'course', 0, 100, 80, { q: 1 });
});
it('keeps scoring authoritative on the server', async () => {
  const response = await POST(request(0), { params: Promise.resolve({ lessonId: 'lesson' }) });
  expect(await response.json()).toMatchObject({ score: 0, passed: false });
});
it('does not record credit for an inactive enrollment', async () => {
  state.enrollment.status = 'suspended';
  expect((await POST(request(1), { params: Promise.resolve({ lessonId: 'lesson' }) })).status).toBe(
    403,
  );
  expect(state.record).not.toHaveBeenCalled();
});

it('records authored quick checks on regular lesson rows without trusting client scores', async () => {
  state.lessonType = 'lesson';
  const response = await POST(request(1), { params: Promise.resolve({ lessonId: 'lesson' }) });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ score: 100, passed: true });
});

it('scores the authored answerIndex format and consistent generated question IDs', async () => {
  state.questions = [{ options: ['a', 'b'], answerIndex: 1 }];
  const req = new NextRequest('https://app.example.test/api/lessons/lesson/checkpoint', {
    method: 'POST',
    body: JSON.stringify({ courseId: 'course', answers: { 'q-1': 1 } }),
  });
  const response = await POST(req, { params: Promise.resolve({ lessonId: 'lesson' }) });
  expect(await response.json()).toMatchObject({ score: 100, passed: true });
});

it('uses the established 80% default when a lesson has no configured threshold', async () => {
  state.passingScore = null;
  const response = await POST(request(0), { params: Promise.resolve({ lessonId: 'lesson' }) });
  expect(await response.json()).toMatchObject({ score: 0, passed: false });
  expect(state.record.mock.calls[0][5]).toBe(80);
});
