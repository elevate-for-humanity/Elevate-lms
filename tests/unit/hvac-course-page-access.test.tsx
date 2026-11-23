import { beforeEach, expect, it, vi } from 'vitest';
import HvacCoursePage from '@/apps/lms/app/programs/hvac-technician/course/page';

const state = vi.hoisted(() => ({
  direct: null as { id: string; student_id: string; course_id: string; status: string; revoked_at: string | null } | null,
  from: vi.fn(),
}));

vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
vi.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ id: 'learner' }) }));
vi.mock('@/lib/courses/resolvers', () => ({ findPublishedHvacCourseId: async () => 'published-course' }));
vi.mock('@/lib/enrollment/resolve-course-enrollment', () => ({ resolveCourseEnrollment: async () => null }));
vi.mock('@/lib/learner/course-activity', () => ({ loadCourseActivity: async () => [] }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: state.from }) }));
vi.mock('@/apps/lms/app/programs/hvac-technician/course/CanonicalHvacCourseHome', () => ({ default: () => null }));

beforeEach(() => {
  state.direct = { id: 'entitlement', student_id: 'learner', course_id: 'published-course', status: 'active', revoked_at: null };
  state.from.mockClear().mockImplementation((table: string) => {
    const filters: Array<(row: Record<string, unknown>) => boolean> = [];
    const query = {
      select: () => query,
      eq: (key: string, expected: unknown) => {
        filters.push(row => row[key] === expected);
        return query;
      },
      in: (key: string, expected: unknown[]) => {
        filters.push(row => expected.includes(row[key]));
        return query;
      },
      is: (key: string, expected: unknown) => query.eq(key, expected),
      limit: () => query,
      order: () => query,
      maybeSingle: async () => ({
        data: table === 'courses'
          ? { id: 'published-course', title: 'HVAC Technician' }
          : state.direct && filters.every(filter => filter(state.direct!)) ? state.direct : null,
        error: null,
      }),
      then: (resolve: (result: { data: unknown[]; error: null }) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
    };
    return query;
  });
});

it('opens the published HVAC course for a buyer with only an active individual enrollment', async () => {
  const course = await HvacCoursePage();
  expect(course.props.courseId).toBe('published-course');
  expect(state.from).toHaveBeenCalledWith('course_modules');
});

it.each(['revoked', 'different learner', 'different course'])(
  'denies a %s entitlement before reading HVAC course content',
  async (invalid) => {
    if (invalid === 'revoked') state.direct!.revoked_at = '2026-11-20T00:00:00Z';
    if (invalid === 'different learner') state.direct!.student_id = 'other-learner';
    if (invalid === 'different course') state.direct!.course_id = 'other-course';
    await expect(HvacCoursePage()).rejects.toThrow('NOT_FOUND');
    expect(state.from).not.toHaveBeenCalledWith('course_modules');
    expect(state.from).not.toHaveBeenCalledWith('course_lessons');
  },
);
