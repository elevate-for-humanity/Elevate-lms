import { expect, it } from 'vitest';
import { loadCareerPlan } from '@/lib/career/plan';

function database(rows: Record<string, unknown[]>, broken?: string) {
  const calls: Array<[string, string, unknown]> = [];
  return {
    calls,
    from(table: string) {
      const query: any = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          calls.push([table, key, value]);
          return query;
        },
        is: (key: string, value: unknown) => {
          calls.push([table, key, value]);
          return query;
        },
        in: (key: string, value: unknown) => {
          calls.push([table, key, value]);
          return query;
        },
        or: () => query,
        order: () => query,
        limit: () => query,
        then: (resolve: any) =>
          resolve({
            data: broken === table ? null : (rows[table] ?? []),
            error: broken === table ? { message: 'unavailable' } : null,
          }),
      };
      return query;
    },
  };
}
it('loads only the selected learner and verified credentials; an empty résumé row is not a saved résumé', async () => {
  const db = database({ resumes: [{ id: 'empty-row', resume_data: null }] });
  const result = await loadCareerPlan(db as any, 'selected-learner');
  expect(result.credentialEarned).toBe(false);
  expect(result.resumeSaved).toBe(false);
  for (const table of [
    'certificates',
    'student_credential_uploads',
    'resumes',
    'scorm_enrollments',
  ])
    expect(db.calls).toContainEqual([table, 'user_id', 'selected-learner']);
  expect(db.calls).toContainEqual(['learner_credentials', 'learner_id', 'selected-learner']);
  expect(db.calls).toContainEqual([
    'student_credential_uploads',
    'verification_status',
    ['approved', 'verified'],
  ]);
  expect(db.calls).toContainEqual(['certificates', 'revoked_at', null]);
});
it('recognizes a verified credential and distinguishes a read failure from no progress', async () => {
  const db = database(
    {
      student_credential_uploads: [{ id: 'approved-credential' }],
      resumes: [{ resume_data: { skills: ['HVAC'] } }],
    },
    'scorm_enrollments',
  );
  const result = await loadCareerPlan(db as any, 'selected-learner');
  expect(result.credentialEarned).toBe(true);
  expect(result.resumeSaved).toBe(true);
  expect(result.jriUnavailable).toBe(true);
});
