import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  csvCell,
  enrollmentSummary,
  filterEnrollments,
  isPlatformOversight,
  learnerId,
  enrollmentNeedsReview,
} from '@/lib/workforce/records';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), db: { from: vi.fn() } }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: mocks.auth }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
import { allRows, getWorkforceContext, getWorkforceEnrollments } from '@/lib/workforce/workspace';

function query(rows: any[], fail = false) {
  const predicates: Array<(row: any) => boolean> = [];
  const q: any = {
    select: () => q,
    order: () => q,
    eq: (key: string, value: unknown) => {
      predicates.push((row) => row[key] === value);
      return q;
    },
    is: (key: string, value: unknown) => {
      predicates.push((row) => row[key] === value);
      return q;
    },
    in: (key: string, ids: unknown[]) => {
      predicates.push((row) => ids.includes(row[key]));
      return q;
    },
    range: async (from: number, to: number) => ({
      data: rows.filter((row) => predicates.every((p) => p(row))).slice(from, to + 1),
      error: fail ? { code: 'unavailable' } : null,
    }),
  };
  return q;
}

describe('Workforce records', () => {
  it('counts people separately from enrollments and uses historical student_id', () => {
    const rows = [
      { user_id: 'a', enrollment_state: 'active' },
      { user_id: 'a', enrollment_state: 'completed' },
      { student_id: 'b', enrollment_state: 'active', at_risk: true },
    ];
    expect(enrollmentSummary(rows)).toEqual({
      participants: 2,
      enrollments: 3,
      active: 2,
      activeParticipants: 2,
      completed: 1,
      atRisk: 1,
    });
    expect(learnerId({ user_id: 'a', student_id: 'b' })).toBe('a');
    expect(filterEnrollments(rows, 'completed')).toHaveLength(1);
    expect(filterEnrollments(rows, 'at-risk')).toHaveLength(1);
  });
  it.each(['=1+1', '+cmd', '@SUM(1)', '-1+2', '  =HYPERLINK("x")'])(
    'neutralizes spreadsheet formulas: %s',
    (value) => {
      expect(csvCell(value)).toMatch(/^"'/);
    },
  );
  it('quotes CSV delimiters, quotes and line breaks', () => {
    expect(csvCell('A,"B"\nC')).toBe('"A,""B""\nC"');
    expect(csvCell(null)).toBe('""');
  });
  it('separates test, staff and unlinked records without changing their statuses', () => {
    const profile = {
      id: 'learner',
      role: 'student',
      email: 'learner@school.edu',
      full_name: 'Learner',
    };
    expect(enrollmentNeedsReview({ profile })).toBe(false);
    expect(enrollmentNeedsReview({ profile, source: 'qa_e2e' })).toBe(true);
    expect(enrollmentNeedsReview({ profile: { ...profile, role: 'staff' } })).toBe(true);
    expect(enrollmentNeedsReview({ profile: { ...profile, email: 'learner@qa.invalid' } })).toBe(
      true,
    );
    expect(enrollmentNeedsReview({})).toBe(true);
    expect(
      enrollmentSummary([
        { user_id: 'same', enrollment_state: 'enrolled' },
        { user_id: 'same', enrollment_state: 'active' },
      ]).activeParticipants,
    ).toBe(1);
  });
  it('limits platform oversight to platform administrators', () => {
    expect(isPlatformOversight(['super_admin'])).toBe(true);
    expect(isPlatformOversight(['workforce_partner', 'org_admin'])).toBe(false);
  });
});

describe('Workforce server scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      user: { id: 'actor' },
      profile: { tenant_id: 'tenant-a' },
      effectiveRoles: ['staff'],
    });
  });
  it('loads beyond the first API page without truncation', async () => {
    expect(
      await allRows(() => query(Array.from({ length: 1201 }, (_, id) => ({ id })))),
    ).toHaveLength(1201);
  });
  it('throws database failures rather than returning a false empty state', async () => {
    await expect(allRows(() => query([], true))).rejects.toThrow('WORKFORCE_QUERY_FAILED');
  });
  it('fails closed when a tenant-scoped staff member has no tenant', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'actor' }, profile: {}, effectiveRoles: ['staff'] });
    await expect(getWorkforceContext()).rejects.toThrow('WORKFORCE_TENANT_REQUIRED');
    expect(mocks.db.from).not.toHaveBeenCalled();
  });
  it('rejects inactive accounts', async () => {
    mocks.auth.mockResolvedValue({
      user: { id: 'actor' },
      profile: { is_active: false },
      effectiveRoles: ['admin'],
    });
    await expect(getWorkforceContext()).rejects.toThrow('WORKFORCE_ACCOUNT_INACTIVE');
  });
  it('loads only enrollments in the staff tenant', async () => {
    const tables: Record<string, any[]> = {
      program_enrollments: [
        { id: 'a', user_id: 'one', tenant_id: 'tenant-a' },
        { id: 'b', user_id: 'two', tenant_id: 'tenant-b' },
      ],
      profiles: [{ id: 'one' }, { id: 'two' }],
      programs: [],
    };
    mocks.db.from.mockImplementation((table: string) => query(tables[table] ?? []));
    const ctx = await getWorkforceContext();
    expect((await getWorkforceEnrollments(ctx)).map((row) => row.id)).toEqual(['a']);
  });
  it('scopes partners by persisted assignments, with no email-based identity guessing', async () => {
    mocks.auth.mockResolvedValue({
      user: { id: 'actor' },
      profile: {},
      effectiveRoles: ['workforce_partner'],
    });
    const tables: Record<string, any[]> = {
      case_manager_assignments: [
        { id: '1', case_manager_id: 'actor', application_id: 'app1' },
        { id: '2', case_manager_id: 'other', application_id: 'app2' },
      ],
      applications: [
        { id: 'app1', user_id: 'one' },
        { id: 'app2', user_id: 'two' },
      ],
      wioa_participants: [],
      program_enrollments: [
        { id: 'a', user_id: 'one' },
        { id: 'b', user_id: 'two' },
        { id: 'c', user_id: null, student_id: 'one' },
      ],
      profiles: [{ id: 'one' }, { id: 'two' }],
      programs: [],
    };
    mocks.db.from.mockImplementation((table: string) => query(tables[table] ?? []));
    const ctx = await getWorkforceContext();
    expect(ctx.ids).toEqual(['one']);
    expect((await getWorkforceEnrollments(ctx)).map((row) => row.id)).toEqual(['a', 'c']);
  });
  it('returns no records for an unassigned partner without querying enrollments', async () => {
    mocks.auth.mockResolvedValue({
      user: { id: 'actor' },
      profile: {},
      effectiveRoles: ['workforce_partner'],
    });
    mocks.db.from.mockImplementation(() => query([]));
    const ctx = await getWorkforceContext();
    expect(await getWorkforceEnrollments(ctx)).toEqual([]);
    expect(mocks.db.from.mock.calls.map((call) => call[0])).not.toContain('program_enrollments');
  });
});
