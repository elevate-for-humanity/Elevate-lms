// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ lessons: [] as any[], error: null as any, practicalError: null as any }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (table: string) => {
  const query: any = {
    select: (projection: string) => { if (table === 'course_lessons') expect(projection).toContain('requires_signoff:requires_instructor_signoff'); return query; },
    eq: () => query, in: () => query, or: () => query,
    then: (resolve: any, reject: any) => Promise.resolve({ data: table === 'course_lessons' ? mocks.lessons : [], error: table === 'course_lessons' ? mocks.error : table === 'practical_requirements' ? mocks.practicalError : null }).then(resolve, reject),
  }; return query;
} }) }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
import { checkCertificationEligibility } from '@/lib/services/course-certification-eligibility';
beforeEach(() => { mocks.lessons = []; mocks.error = null; mocks.practicalError = null; });
it('does not turn a schema or database failure into permission to issue a certificate', async () => {
  mocks.error = { message: 'column does not exist' };
  expect(await checkCertificationEligibility('user', 'course')).toMatchObject({ eligible: false, unmetRequirements: [{ code: 'REQUIREMENTS_UNAVAILABLE' }] });
});
it('requires configured course requirements before issuing a certificate', async () => {
  expect(await checkCertificationEligibility('user', 'missing-course')).toMatchObject({ eligible: false, unmetRequirements: [{ code: 'REQUIREMENTS_NOT_CONFIGURED' }] });
});
it('does not bypass unfinished required lessons after the query succeeds', async () => {
  mocks.lessons = [{ id: 'lesson', title: 'Safety', lesson_type: 'lesson', is_required: true }];
  expect(await checkCertificationEligibility('user', 'course')).toMatchObject({ eligible: false, unmetRequirements: [expect.objectContaining({ code: 'LESSON_NOT_COMPLETE' })] });
});
