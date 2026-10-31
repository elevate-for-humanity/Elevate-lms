import { describe, expect, it } from 'vitest';
import { resolveAssignedLearnerHome } from '@/lib/portal/assigned-learner-home';
import { resolvePortalForUser } from '@/lib/portal/router';
import { resolveStudentHomePath } from '@/lib/portal/resolve-student-home';

function database(enrollments: any[], cached = 'beauty', program: any = null, failure = '') {
  const calls: unknown[][] = [];
  const db = { from(table: string) {
    const q: any = {};
    for (const op of ['select', 'eq', 'or', 'in', 'order', 'limit']) q[op] = (...args: unknown[]) => {
      calls.push([table, op, ...args]); return q;
    };
    const data = table === 'program_enrollments' ? enrollments : table === 'profiles' ? { portal_type: cached, role: 'student' } : program;
    const result = () => ({ data, error: table === failure ? new Error('Unavailable') : null });
    q.then = (resolve: any) => resolve(result());
    q.maybeSingle = async () => result();
    return q;
  } };
  return { db: db as any, calls };
}

describe('one enrollment-based learner home across login, API, and dashboard', () => {
  for (const slug of ['barber-apprenticeship', 'cosmetology-apprenticeship', 'esthetician-apprenticeship', 'nail-technician-apprenticeship']) {
    it(`${slug} overrides a cached generic dashboard in both login resolvers`, async () => {
      const { db, calls } = database([{ program_slug: slug, status: 'active', enrollment_state: 'active' }]);
      expect(await resolvePortalForUser(db, 'learner')).toBe(`/apprentice?program=${slug}`);
      expect(await resolveStudentHomePath(db, 'learner', 'beauty')).toBe(`https://app.elevateforhumanity.org/apprentice?program=${slug}`);
      expect(calls).toContainEqual(['program_enrollments', 'or', 'user_id.eq.learner,student_id.eq.learner']);
    });
  }
  it('does not let an old apprentice cache override a current standard learner enrollment', async () => {
    const { db } = database([{ program_slug: 'hvac-technician', status: 'active' }], 'barber');
    expect(await resolvePortalForUser(db, 'learner')).toBe('/lms/dashboard');
    expect(await resolveStudentHomePath(db, 'learner', 'barber')).toBe('https://app.elevateforhumanity.org/lms/dashboard');
  });
  it('ignores withdrawn records even when an old workflow field still says active', async () => {
    const { db } = database([{ program_slug: 'barber-apprenticeship', status: 'withdrawn', enrollment_state: 'active' }, { program_slug: 'bookkeeping', status: 'active' }]);
    expect(await resolveAssignedLearnerHome(db, 'learner')).toBe('/lms/dashboard');
  });
  it('resolves programs with an ID and future apprenticeship programs without a special dashboard', async () => {
    const { db } = database([{ program_id: 'future-program', status: 'active' }], '', { slug: 'new-program', program_type: 'apprenticeship' });
    expect(await resolveAssignedLearnerHome(db, 'learner')).toBe('/apprentice');
  });
  for (const status of ['payment_required', 'onboarding', 'orientation', 'applied']) {
    it(`does not send ${status} enrollment into the operational workspace`, async () => {
      const { db, calls } = database([{ program_slug: 'barber-apprenticeship', status, enrollment_state: 'active' }]);
      expect(await resolveAssignedLearnerHome(db, 'learner')).toBeNull();
      expect(calls).toContainEqual(['program_enrollments', 'in', 'status', ['active', 'enrolled', 'in_progress', 'confirmed']]);
    });
  }
  it('uses operational status even while workflow onboarding is unfinished', async () => {
    const { db } = database([{ program_slug: 'barber-apprenticeship', status: 'active', enrollment_state: 'onboarding' }]);
    expect(await resolveAssignedLearnerHome(db, 'learner')).toBe('/apprentice?program=barber-apprenticeship');
  });
  it('keeps no-enrollment fallback behavior but surfaces failed assignment reads', async () => {
    expect(await resolveAssignedLearnerHome(database([]).db, 'learner')).toBeNull();
    await expect(resolveAssignedLearnerHome(database([], '', null, 'program_enrollments').db, 'learner')).rejects.toThrow('Unavailable');
  });
});
