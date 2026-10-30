import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ revoked: false, direct: true, owner: 'learner' }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: (table: string) => {
      let activeOnly = false;
      let owned = false;
      let courseFilter = false;
      const q: any = {
        select: () => q,
        order: () => q,
        or: (filter: string) => {
          owned = filter.includes(`student_id.eq.${state.owner}`);
          return q;
        },
        is: (column: string, value: unknown) => {
          activeOnly = column === 'revoked_at' && value === null;
          return q;
        },
        eq: (column: string) => {
          courseFilter = column === 'course_id';
          return q;
        },
        in: () => q,
        maybeSingle: async () => ({ data: { program_id: 'program' }, error: null }),
        then: (resolve: any) =>
          resolve({
            data:
              table === 'program_courses'
                ? [{ program_id: 'program' }]
                : owned && (!activeOnly || !state.revoked) && (!courseFilter || state.direct)
                  ? [
                      {
                        id: 'enrollment',
                        student_id: 'learner',
                        status: 'active',
                        program_id: 'program',
                      },
                    ]
                  : [],
            error: null,
          }),
        limit: () => q,
      };
      return q;
    },
  }),
}));
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';
beforeEach(() => {
  state.revoked = false;
  state.direct = true;
  state.owner = 'learner';
});
it('resolves a student_id-owned direct enrollment', async () => {
  expect(await resolveCourseEnrollment('learner', 'course')).toMatchObject({ id: 'enrollment' });
});
it('preserves linked program grants without a direct course pointer', async () => {
  state.direct = false;
  expect(await resolveCourseEnrollment('learner', 'course')).toMatchObject({
    program_id: 'program',
  });
});
it('does not revive revoked or foreign enrollments through a program-course fallback', async () => {
  state.revoked = true;
  expect(await resolveCourseEnrollment('learner', 'course')).toBeNull();
  state.revoked = false;
  state.owner = 'another';
  expect(await resolveCourseEnrollment('learner', 'course')).toBeNull();
});
