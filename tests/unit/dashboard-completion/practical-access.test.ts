// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ auth: vi.fn(), gate: vi.fn(), submit: vi.fn() }));
vi.mock('@/lib/auth/requireAuth', () => ({ requireAuth: state.auth }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/lib/lms/course-practical-workflow', () => ({ submitCoursePractical: state.submit }));
vi.mock('@/lib/lms/access-control', () => ({
  assertLessonAccess: state.gate,
  accessErrorResponse: () => ({ body: { error: 'Lesson locked' }, status: 403 }),
}));
import { POST } from '@/apps/lms/app/api/learner/practical-submissions/route';
const lessonId = '11111111-1111-4111-8111-111111111111',
  courseId = '22222222-2222-4222-8222-222222222222';
const request = () =>
  new NextRequest('https://app.example/api/learner/practical-submissions', {
    method: 'POST',
    body: JSON.stringify({
      courseId,
      lessonId,
      interactionId: 'practice',
      competencyKeys: ['safe-work'],
      evidence: [{ type: 'text', value: 'My evidence' }],
      learnerAttestation: true,
    }),
  });
beforeEach(() => {
  vi.clearAllMocks();
  state.auth.mockResolvedValue({ user: { id: 'learner' }, error: null });
  state.gate.mockResolvedValue(undefined);
  state.submit.mockResolvedValue({ id: 'saved' });
});
it('rejects a locked lesson before attempting an evidence write', async () => {
  state.gate.mockRejectedValue(new Error('ACCESS_DENIED'));
  expect((await POST(request())).status).toBe(403);
  expect(state.submit).not.toHaveBeenCalled();
});
it('preserves a valid owned evidence submission without awarding completion', async () => {
  expect((await POST(request())).status).toBe(201);
  expect(state.gate).toHaveBeenCalledWith('learner', lessonId);
  expect(state.submit).toHaveBeenCalledWith(
    {},
    'learner',
    expect.objectContaining({ lessonId, courseId }),
  );
});
it('does not process evidence for an anonymous request', async () => {
  state.auth.mockResolvedValue({ user: null, error: null });
  expect((await POST(request())).status).toBe(401);
  expect(state.gate).not.toHaveBeenCalled();
  expect(state.submit).not.toHaveBeenCalled();
});
