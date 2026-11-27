import { beforeEach, describe, expect, it, vi } from 'vitest';
import HvacCoursePage from '@/apps/lms/app/programs/hvac-technician/course/page';
import { INSTRUCTOR_CURRICULUM_IP_VERSION_HASHES } from '@/lib/legal/instructorCurriculumLicense';

const state = vi.hoisted(() => ({
  courseId: 'published-course',
  direct: null as {
    id: string;
    student_id: string;
    course_id: string;
    status: string;
    revoked_at: string | null;
  } | null,
  profile: null as { id: string; role: string } | null,
  versionRow: null as Record<string, unknown> | null,
  acceptance: null as Record<string, unknown> | null,
  license: null as Record<string, unknown> | null,
  assignment: null as Record<string, unknown> | null,
  from: vi.fn(),
  learnerFrom: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));
vi.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ id: 'learner' }) }));
vi.mock('@/lib/courses/resolvers', () => ({
  findPublishedHvacCourseId: async () => state.courseId,
}));
vi.mock('@/lib/enrollment/resolve-course-enrollment', () => ({
  resolveCourseEnrollment: async () => null,
}));
vi.mock('@/lib/learner/course-activity', () => ({ loadCourseActivity: async () => [] }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: state.from }) }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: state.learnerFrom }),
}));
vi.mock('@/apps/lms/app/programs/hvac-technician/course/CanonicalHvacCourseHome', () => ({
  default: () => null,
}));

beforeEach(() => {
  state.courseId = 'published-course';
  state.direct = {
    id: 'entitlement',
    student_id: 'learner',
    course_id: 'published-course',
    status: 'active',
    revoked_at: null,
  };
  state.profile = null;
  state.versionRow = null;
  state.acceptance = null;
  state.license = null;
  state.assignment = null;
  const makeQuery = (table: string) => {
    const filters: Array<(row: Record<string, unknown>) => boolean> = [];
    const query = {
      select: () => query,
      eq: (key: string, expected: unknown) => {
        filters.push((row) => row[key] === expected);
        return query;
      },
      in: (key: string, expected: unknown[]) => {
        filters.push((row) => expected.includes(row[key]));
        return query;
      },
      is: (key: string, expected: unknown) => query.eq(key, expected),
      like: () => query,
      limit: () => query,
      order: () => query,
      maybeSingle: async () => {
        if (table === 'courses') {
          return { data: { id: state.courseId, title: 'HVAC Technician' }, error: null };
        }
        const fixtures: Record<string, unknown> = {
          profiles: state.profile,
          agreement_versions: state.versionRow,
          license_agreement_acceptances: state.acceptance,
          instructor_curriculum_licenses: state.license,
          instructor_assignments: state.assignment,
        };
        if (table in fixtures) {
          const row = fixtures[table] as Record<string, unknown> | null;
          return {
            data: row && filters.every((filter) => filter(row)) ? row : null,
            error: null,
          };
        }
        return {
          data:
            state.direct && filters.every((filter) => filter(state.direct!))
              ? state.direct
              : null,
          error: null,
        };
      },
      then: (resolve: (result: { data: unknown[]; error: null }) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
    };
    return query;
  };
  state.from.mockClear().mockImplementation(makeQuery);
  state.learnerFrom.mockClear().mockImplementation(makeQuery);
});

it('opens the published HVAC course for a buyer with only an active individual enrollment', async () => {
  const course = await HvacCoursePage();
  expect(course.props.courseId).toBe('published-course');
  expect(state.from).toHaveBeenCalledWith('course_modules');
});

it('reads new simulation evidence through the authenticated client so owner and MFA policies still apply', async () => {
  state.courseId = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
  state.direct!.course_id = state.courseId;
  await HvacCoursePage();
  expect(state.learnerFrom).toHaveBeenCalledWith('interaction_progress');
  expect(state.from).not.toHaveBeenCalledWith('interaction_progress');
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

describe('instructor license gate on the HVAC course page', () => {
  function seedLicensedInstructor() {
    state.direct = null;
    state.profile = { id: 'learner', role: 'instructor' };
    state.versionRow = {
      agreement_type: 'instructor_curriculum_ip',
      version: '1.0',
      current_version: '1.0',
      is_current: true,
      document_hash: INSTRUCTOR_CURRICULUM_IP_VERSION_HASHES['1.0'],
      created_at: '2026-11-25T00:00:00Z',
    };
    state.acceptance = {
      id: 'acc-1',
      user_id: 'learner',
      agreement_type: 'instructor_curriculum_ip',
      document_version: '1.0',
    };
    state.license = {
      id: 'lic-1',
      user_id: 'learner',
      agreement_type: 'instructor_curriculum_ip',
      agreement_version: '1.0',
      status: 'active',
      license_reference: 'ELV-INST-TEST1234',
      scope: { course_ids: ['published-course'], program_ids: [] },
      created_at: '2026-11-25T00:00:00Z',
    };
    state.assignment = {
      id: 'assign-1',
      instructor_id: 'learner',
      course_id: 'published-course',
      active: true,
    };
  }

  it('opens the course for a licensed, assigned instructor with no learner enrollment', async () => {
    seedLicensedInstructor();
    const course = await HvacCoursePage();
    expect(course.props.courseId).toBe('published-course');
    expect(course.props.instructorLicenseRef).toBe('ELV-INST-TEST1234');
    expect(state.from).toHaveBeenCalledWith('course_modules');
  });

  it('shows the license panel, not course content, to an unsigned instructor', async () => {
    seedLicensedInstructor();
    state.acceptance = null;
    state.license = null;
    const panel = await HvacCoursePage();
    expect(panel.props.reason).toBe('unsigned');
    expect(panel.props.version).toBe('1.0');
    expect(state.from).not.toHaveBeenCalledWith('course_modules');
    expect(state.from).not.toHaveBeenCalledWith('course_lessons');
  });

  it('shows the license panel to a licensed instructor whose license was revoked', async () => {
    seedLicensedInstructor();
    (state.license as Record<string, unknown>).status = 'revoked';
    const panel = await HvacCoursePage();
    expect(panel.props.reason).toBe('revoked');
    expect(state.from).not.toHaveBeenCalledWith('course_modules');
  });

  it('does not let the old general services agreement open the course for an instructor', async () => {
    seedLicensedInstructor();
    state.acceptance = {
      id: 'acc-old',
      user_id: 'learner',
      agreement_type: 'instructor_services',
      document_version: '1.0',
    };
    const panel = await HvacCoursePage();
    expect(panel.props.reason).toBe('unsigned');
    expect(state.from).not.toHaveBeenCalledWith('course_modules');
  });
});
