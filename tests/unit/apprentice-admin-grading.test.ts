import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ allowed: true, fail: false, writes: [] as any[] }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_: string, fn: any) => fn }));
vi.mock('@/lib/audit/ferpa', () => ({ logStaffRecordAccess: vi.fn() }));
vi.mock('@/lib/authGuards', () => ({ canEditCourse: async () => state.allowed }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'admin' } } }) },
    from: () => ({
      select() {
        return this;
      },
      eq() {
        return this;
      },
      maybeSingle: async () => ({ data: { role: 'admin' } }),
    }),
  }),
}));
const submissionId = '12345678-1234-1234-1234-123456789abc';
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: (table: string) => {
      let updating = false;
      const q: any = {
        select: () => q,
        eq: () => q,
        update: (payload: any) => {
          updating = true;
          state.writes.push(payload);
          return q;
        },
        maybeSingle: async () => ({
          data: updating
            ? state.fail
              ? null
              : { id: submissionId }
            : table === 'assignments'
              ? { id: 'assignment', max_points: 50 }
              : {
                  id: submissionId,
                  assignment_id: 'assignment',
                  course_id: 'owned-course',
                  user_id: 'learner',
                },
          error: updating && state.fail ? new Error('offline') : null,
        }),
      };
      return q;
    },
  }),
}));
import { POST } from '@/apps/admin/app/api/grade/upsert/route';
const request = (body: any) =>
  new Request('https://admin.example.test/api/grade/upsert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignmentSubmissionId: submissionId, ...body }),
  });
beforeEach(() => {
  state.allowed = true;
  state.fail = false;
  state.writes = [];
});
it('writes real assignment points to the canonical submission grade ledger', async () => {
  expect(
    (await POST(request({ points: 40, feedback: 'Good work', student_id: 'foreign' }))).status,
  ).toBe(200);
  expect(state.writes[0]).toMatchObject({
    grade: 40,
    feedback: 'Good work',
    graded_by: 'admin',
    status: 'graded',
  });
  expect(state.writes[0]).not.toHaveProperty('student_id');
});
it('rejects an unassigned grader before any write', async () => {
  state.allowed = false;
  expect((await POST(request({ points: 40 }))).status).toBe(403);
  expect(state.writes).toHaveLength(0);
});
it('uses the actual assignment maximum and validates score types', async () => {
  for (const points of [51, -1, '40', null])
    expect((await POST(request({ points }))).status).toBe(400);
  expect(state.writes).toHaveLength(0);
});
it('never reports a failed grade write as saved', async () => {
  state.fail = true;
  expect((await POST(request({ points: 40 }))).status).toBe(500);
});
