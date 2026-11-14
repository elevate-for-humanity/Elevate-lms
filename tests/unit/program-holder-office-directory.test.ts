import { describe, it, expect } from 'vitest';
import { loadHolderOfficeStudents } from '@/lib/program-holder/office-students';
import { curriculumProgress } from '@/lib/program-holder/curriculum-progress';

function fixture(failure = '') {
  const calls: any[] = [];
  const rows: Record<string, any[]> = {
    program_enrollments: [
      { id: 'e', user_id: 'student', full_name: 'Canonical Learner' },
      { id: 'staff-enrollment', user_id: 'staff' },
    ],
    program_holder_students: [
      { id: 'old', user_id: 'student', applicant_name: 'Duplicate' },
      { id: 'pending', user_id: null, applicant_name: 'Applicant' },
    ],
    profiles: [
      { id: 'student', role: 'student', email: 'student@school.org' },
      { id: 'staff', role: 'staff', email: 'staff@school.org' },
    ],
  };
  const db = {
    from(table: string) {
      const filters: any[] = [];
      calls.push({ table, filters });
      const q: any = {
        select: () => q,
        order: () => q,
        eq: (...args: any[]) => {
          filters.push(args);
          return q;
        },
        in: (...args: any[]) => {
          filters.push(args);
          return q;
        },
        is: (...args: any[]) => {
          filters.push(args);
          return q;
        },
        then: (resolve: any) =>
          Promise.resolve({
            data: rows[table],
            error: table === failure ? { message: 'Unavailable' } : null,
          }).then(resolve),
      };
      return q;
    },
  };
  return { ctx: { mode: 'holder', holderId: 'holder', programIds: ['program'], db } as any, calls };
}
describe('office directory uses canonical holder enrollments', () => {
  it('includes canonical students once, excludes staff and preserves assigned applicants', async () => {
    const { ctx, calls } = fixture();
    const people = await loadHolderOfficeStudents(ctx);
    expect(people.map((p) => p.id)).toEqual(['enrollment:e', 'pending']);
    expect(people[0].applicant_email).toBe('student@school.org');
    for (const call of calls.filter((c) => c.table !== 'profiles')) {
      expect(call.filters).toContainEqual(['program_holder_id', 'holder']);
      expect(call.filters).toContainEqual(['program_id', ['program']]);
    }
    expect(calls[0].filters).toContainEqual(['revoked_at', null]);
  });
  it.each(['program_enrollments', 'program_holder_students', 'profiles'])(
    'surfaces %s failure rather than an empty successful directory',
    async (table) => {
      const { ctx } = fixture(table);
      await expect(loadHolderOfficeStudents(ctx)).rejects.toThrow(/could not load/);
    },
  );
  it('does not query without a selected holder and assigned program', async () => {
    const { ctx, calls } = fixture();
    ctx.programIds = [];
    expect(await loadHolderOfficeStudents(ctx)).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});
describe('course delivery publication is independent of builder state', () => {
  it('shows an existing published course without an authoring row', () =>
    expect(curriculumProgress(null, { status: 'published', is_published: true })).toMatchObject({
      published: true,
      status: 'Build record unavailable',
    }));
  it('uses the live delivery row when the authoring copy remains draft', () =>
    expect(
      curriculumProgress(
        { status: 'draft', is_active: false, generation_progress: 40 },
        { status: 'published', is_published: true },
      ),
    ).toMatchObject({ published: true, percent: 40 }));
  it.each([
    { status: 'draft', is_published: true },
    { status: 'published', is_published: false },
    { status: 'published', is_published: true, is_active: false },
  ])('does not call inconsistent or inactive delivery published', (delivery) =>
    expect(curriculumProgress({ status: 'published' }, delivery).published).toBe(false),
  );
});

import { loadHolderOnlineStudy } from '@/lib/program-holder/online-study';
describe('holder clocks use the exact enrollment and learner identity', () => {
  it('includes open and closed sessions but excludes another enrollment or learner', async () => {
    let ids: any[] = [];
    const sessions = [
      { id: 'open', enrollment_id: 'enrollment', user_id: 'student', clock_out_at: null },
      { id: 'closed', enrollment_id: 'enrollment', user_id: 'student', clock_out_at: '2026-01-01' },
      { id: 'foreign', enrollment_id: 'other', user_id: 'student' },
      { id: 'mismatch', enrollment_id: 'enrollment', user_id: 'other' },
    ];
    const q: any = {
      select: () => q,
      in: (_key: string, values: any[]) => {
        ids = values;
        return q;
      },
      order: () => q,
      limit: async () => ({ data: sessions, error: null }),
    };
    const result = await loadHolderOnlineStudy({ from: () => q }, [
      { id: 'enrollment', user_id: 'student' },
    ]);
    expect(ids).toEqual(['enrollment']);
    expect(result.map((r: any) => r.id)).toEqual(['open', 'closed']);
  });
  it('does not hide query failures as an empty clock history', async () => {
    const q: any = {
      select: () => q,
      in: () => q,
      order: () => q,
      limit: async () => ({ data: null, error: { message: 'Unavailable' } }),
    };
    await expect(
      loadHolderOnlineStudy({ from: () => q }, [{ id: 'enrollment', user_id: 'student' }]),
    ).rejects.toThrow('could not load');
  });
});
