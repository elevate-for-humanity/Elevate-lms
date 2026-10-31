// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
  enrollment: null as unknown,
}));
vi.mock('@/lib/auth/require-program-holder', () => ({ requireProgramHolder: mocks.context }));
import { POST } from '@/apps/lms/app/api/program-holder/student-progress-reports/route';
const enrollmentId = '11111111-1111-4111-8111-111111111111';
const body = {
  enrollmentId,
  start: '2026-10-26',
  end: '2026-10-30',
  hours: 0,
  progress: 'needs_support',
  checks: ['instruction'],
  notes: 'Review the next bookkeeping practice task.',
};
const request = (value: unknown = body) =>
  new Request('https://lms.elevateforhumanity.org/api/program-holder/student-progress-reports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(value),
  });
let filters: [string, unknown][];
beforeEach(() => {
  vi.clearAllMocks();
  filters = [];
  mocks.enrollment = {
    id: enrollmentId,
    full_name: 'Assigned learner',
    program_id: 'program',
    status: 'active',
  };
  mocks.insert.mockResolvedValue({ error: null });
  mocks.from.mockImplementation((table: string) => {
    if (table === 'program_holder_reports') return { insert: mocks.insert };
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => {
        filters.push([key, value]);
        return query;
      },
      in: () => query,
      maybeSingle: async () => ({ data: mocks.enrollment, error: null }),
    };
    return query;
  });
  mocks.context.mockResolvedValue({
    mode: 'holder',
    holderId: 'holder',
    user: { id: 'holder-user' },
    db: { from: mocks.from },
  });
});

it('saves an assigned learner observation for review without needing or crediting clock hours', async () => {
  const response = await POST(
    request({ ...body, user_id: 'spoofed-author', program_holder_id: 'other-holder' }),
  );
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ ok: true });
  expect(filters).toContainEqual(['program_holder_id', 'holder']);
  expect(filters).toContainEqual(['id', enrollmentId]);
  expect(mocks.insert).toHaveBeenCalledWith(
    expect.objectContaining({
      program_holder_id: 'holder',
      user_id: 'holder-user',
      report_type: 'student_progress',
      status: 'submitted',
      hours_worked: 0,
      metadata: expect.objectContaining({
        enrollment_id: enrollmentId,
        progress: 'needs_support',
        reported_hours_unverified: true,
      }),
    }),
  );
  expect(mocks.from.mock.calls.map(([table]) => table)).toEqual([
    'program_enrollments',
    'program_holder_reports',
  ]);
});
it('rejects an enrollment outside the authenticated holder roster', async () => {
  mocks.enrollment = null;
  expect((await POST(request())).status).toBe(403);
  expect(mocks.insert).not.toHaveBeenCalled();
});
it('keeps administrator preview read-only', async () => {
  mocks.context.mockResolvedValue({ mode: 'preview' });
  expect((await POST(request())).status).toBe(403);
  expect(mocks.from).not.toHaveBeenCalled();
});
it('does not claim success when report persistence fails', async () => {
  mocks.insert.mockResolvedValue({ error: { code: '23514' } });
  const response = await POST(request());
  expect(response.status).toBe(500);
  expect(await response.json()).not.toHaveProperty('ok', true);
});
