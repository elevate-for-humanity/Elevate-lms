import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  user: { id: 'learner' } as any,
  enrollment: { id: 'enrollment', status: 'confirmed' } as any,
  existing: null as any,
  writes: [] as any[],
  fail: false,
}));
vi.mock('@/lib/auth', () => ({ getCurrentUser: async () => state.user }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_: string, fn: any) => fn }));
vi.mock('@/lib/enrollment/resolve-course-enrollment', () => ({
  resolveCourseEnrollment: async () => state.enrollment,
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: (table: string) => {
      const q: any = {
        select: () => q,
        eq: () => q,
        is: () => q,
        or: () => q,
        order: () => q,
        limit: () => q,
        maybeSingle: async () => ({
          data:
            table === 'assignments'
              ? { id: 'assignment', course_id: 'course', due_date: null }
              : state.existing,
          error: null,
        }),
        insert: (payload: any) => {
          state.writes.push(payload);
          return q;
        },
        update: (payload: any) => {
          state.writes.push(payload);
          return q;
        },
        single: async () => ({
          data: { id: 'submission', status: 'submitted' },
          error: state.fail ? new Error('offline') : null,
        }),
      };
      return q;
    },
  }),
}));
import { POST } from '@/apps/lms/app/api/assignments/[id]/submit/route';
const params = { params: Promise.resolve({ id: 'assignment' }) };
const request = (body: any) =>
  new Request('https://app.example.test/api/assignments/assignment/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  state.user = { id: 'learner' };
  state.enrollment = { id: 'enrollment', status: 'confirmed' };
  state.existing = null;
  state.writes = [];
  state.fail = false;
});
it('saves both learner identity columns and derives the course from the assignment', async () => {
  const response = await POST(
    request({ submissionText: 'Completed consultation', course_id: 'foreign', grade: 100 }),
    params,
  );
  expect(response.status).toBe(201);
  expect(state.writes[0]).toMatchObject({
    course_id: 'course',
    user_id: 'learner',
    student_id: 'learner',
    submission_text: 'Completed consultation',
  });
  expect(state.writes[0]).not.toHaveProperty('grade');
});
it('rejects another learner or inactive enrollment before writing', async () => {
  state.enrollment = null;
  expect((await POST(request({ submissionText: 'work' }), params)).status).toBe(403);
  expect(state.writes).toHaveLength(0);
});
it('requires evidence and protects instructor grades', async () => {
  expect((await POST(request({}), params)).status).toBe(400);
  state.existing = { id: 'saved', grade: 90 };
  expect((await POST(request({ submissionText: 'replacement' }), params)).status).toBe(409);
  expect(state.writes).toHaveLength(0);
});
it('rejects unsafe URLs and never reports a failed write as submitted', async () => {
  expect((await POST(request({ submissionUrl: 'javascript:alert(1)' }), params)).status).toBe(400);
  state.fail = true;
  expect((await POST(request({ submissionText: 'work' }), params)).status).toBe(500);
});
