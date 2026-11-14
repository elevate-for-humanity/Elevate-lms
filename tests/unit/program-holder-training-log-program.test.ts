import { expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/auth/require-program-holder', () => ({
  requireProgramHolder: async () => ({
    mode: 'holder',
    holderId: 'holder',
    programIds: ['bookkeeping'],
    db: { from: mocks.from },
  }),
}));
import { POST } from '@/apps/lms/app/api/program-holder/training-logs/route';

it('rejects an HVAC milestone for an owned bookkeeping enrollment before writing hours', async () => {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({
      data: {
        id: 'enrollment',
        user_id: 'student',
        program_id: 'bookkeeping',
        program_slug: 'bookkeeping-quickbooks',
        status: 'active',
      },
    })),
  };
  mocks.from.mockReturnValue(query);
  const response = await POST(
    new Request('https://example.test/api/program-holder/training-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: '11111111-1111-4111-8111-111111111111',
        hour_entry_id: '22222222-2222-4222-8222-222222222222',
        work_date: '2026-01-01',
        milestone: 'Refrigerant handling and environmental rules',
        work_completed: 'Completed supervised practice',
        skills_learned: 'Learned program requirements',
        progress_percent: 10,
        attested: 'true',
      }),
    }),
  );
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
    error: expect.stringContaining('student’s program'),
  });
  expect(mocks.from.mock.calls.map((call) => call[0])).toEqual(['program_enrollments']);
});

it('preserves an explicit zero accepted-hour decision instead of falling back to claimed hours', async () => {
  const enrollment = {
    id: 'enrollment',
    user_id: 'student',
    program_id: 'bookkeeping',
    program_slug: 'bookkeeping-quickbooks',
    status: 'active',
  };
  mocks.from.mockImplementation((table) => {
    const q: any = {
      select: () => q,
      eq: () => q,
      maybeSingle: async () => ({
        data:
          table === 'program_enrollments'
            ? enrollment
            : {
                id: 'clock',
                program_slug: enrollment.program_slug,
                work_date: '2026-01-01',
                approval_status: 'approved',
                accepted_hours: 0,
                hours_claimed: 8,
              },
      }),
    };
    return q;
  });
  const response = await POST(
    new Request('https://example.test/api/program-holder/training-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: '11111111-1111-4111-8111-111111111111',
        hour_entry_id: '22222222-2222-4222-8222-222222222222',
        work_date: '2026-01-01',
        milestone: 'Orientation and program requirements',
        work_completed: 'Completed supervised practice',
        skills_learned: 'Learned program requirements',
        progress_percent: 10,
        attested: 'true',
      }),
    }),
  );
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
    error: expect.stringContaining('no accepted hours'),
  });
});
