// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  enrollment: null as null | { status: string },
  direct: null as null | { id: string },
  error: null as null | { message: string },
  licensed: false,
  license: vi.fn(),
}));
vi.mock('@/lib/enrollment/resolve-course-enrollment', () => ({
  resolveCourseEnrollment: async () => m.enrollment,
}));
vi.mock('@/lib/legal/instructorCurriculumLicense', () => ({
  getInstructorCurriculumLicenseStatus: m.license,
}));
import { getHvacAccessMode } from '@/lib/lms/hvac-access-mode';
const query: any = {
  select: () => query,
  eq: () => query,
  in: () => query,
  is: () => query,
  limit: () => query,
  maybeSingle: async () => ({ data: m.direct, error: m.error }),
};
const db = { from: () => query };
beforeEach(() => {
  m.enrollment = null;
  m.direct = null;
  m.error = null;
  m.licensed = false;
  m.license
    .mockReset()
    .mockImplementation(async () => ({ authorized: m.licensed, licenseReference: 'LICENSE' }));
});
it.each(['active', 'enrolled', 'in_progress', 'confirmed', 'completed'])(
  'keeps an enrolled instructor in learner mode (%s)',
  async (status) => {
    m.enrollment = { status };
    m.licensed = true;
    expect((await getHvacAccessMode(db, 'user', 'course')).mode).toBe('learner');
    expect(m.license).not.toHaveBeenCalled();
  },
);
it('preserves direct course purchasers as learners', async () => {
  m.direct = { id: 'direct' };
  expect((await getHvacAccessMode(db, 'user', 'course')).mode).toBe('learner');
});
it('denies unlicensed teaching even if an assignment exists', async () => {
  expect((await getHvacAccessMode(db, 'user', 'course')).mode).toBe('denied');
});
it('permits assigned licensed teaching only without learner enrollment', async () => {
  m.enrollment = { status: 'pending' };
  m.licensed = true;
  expect((await getHvacAccessMode(db, 'user', 'course')).mode).toBe('instructor');
});
it('fails closed on enrollment lookup errors instead of downgrading to demonstration', async () => {
  m.error = { message: 'offline' };
  m.licensed = true;
  await expect(getHvacAccessMode(db, 'user', 'course')).rejects.toThrow('ENROLLMENT_UNAVAILABLE');
});
