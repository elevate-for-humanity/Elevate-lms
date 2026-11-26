import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { verifyCourseAccess } from '@/lib/guards/course-access';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

const paid = {
  id: 'fixture-enrollment',
  program_id: 'fixture-program',
  status: 'active',
  payment_status: 'paid',
  funding_source: 'self_pay',
  payment_reference: 'fixture-invoice',
  self_pay_application_verified_at: '2026-01-01',
  access_status: 'active',
  access_granted_at: '2026-01-01',
};

function mockLinked(row: Record<string, unknown>, directError: unknown = null) {
  let programReads = 0;
  const update = vi.fn();
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: 'fixture-user' } }, error: null }) },
    from(table: string) {
      const call = table === 'program_enrollments' ? ++programReads : 0;
      const query = {
        select: () => query,
        eq: () => query,
        is: () => query,
        in: () => query,
        not: () => query,
        limit: () => query,
        update: (values: unknown) => { update(values); return query; },
        maybeSingle: async () => ({
          data: table === 'program_courses' ? { program_id: 'fixture-program' } : null,
          error: table === 'course_enrollments' ? directError : null,
        }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({
          data: table === 'program_enrollments' && call === 2 ? [row] : null,
          error: null,
        }).then(resolve),
      };
      return query;
    },
  };
  vi.mocked(createClient).mockResolvedValue(db as never);
  return update;
}

describe('linked program course access with no direct course enrollment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the actual approved, paid linked program row rather than dereferencing null', async () => {
    const update = mockLinked(paid);
    const result = await verifyCourseAccess('fixture-course');
    expect(result).toEqual({ hasAccess: true, enrollment: paid });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('rejects an unpaid linked program through the existing approval/payment predicate', async () => {
    const row = { ...paid, payment_status: 'pending' };
    const update = mockLinked(row);
    expect(await verifyCourseAccess('fixture-course')).toMatchObject({
      hasAccess: false, reason: 'enrollment_not_approved_or_paid',
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects an expired linked program instead of granting access', async () => {
    const update = mockLinked({ ...paid, end_date: '2000-01-01' });
    expect(await verifyCourseAccess('fixture-course')).toMatchObject({
      hasAccess: false, reason: 'expired',
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('still evaluates a successfully resolved program when the direct lookup fails', async () => {
    const update = mockLinked(paid, { message: 'fixture lookup error' });
    expect(await verifyCourseAccess('fixture-course')).toEqual({
      hasAccess: true, enrollment: paid,
    });
    expect(update).toHaveBeenCalledTimes(1);
  });
});
