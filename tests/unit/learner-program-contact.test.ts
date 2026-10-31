import { expect, it } from 'vitest';
import { loadLearnerProgramContact } from '@/lib/learner/program-contact';

function database(tables: Record<string, any[]>, failure = '') {
  const filters: unknown[][] = [];
  const db = { from(table: string) {
    const q: any = {};
    for (const op of ['select', 'or', 'in', 'eq']) q[op] = (...args: unknown[]) => {
      filters.push([table, op, ...args]); return q;
    };
    q.then = (resolve: any) => resolve({ data: tables[table] || [], error: table === failure ? new Error('Unavailable') : null });
    return q;
  } };
  return { db: db as any, filters };
}
it('uses current enrollment assignments and active holder mailboxes, never application roster links', async () => {
  const { db, filters } = database({
    program_enrollments: [{ program_holder_id: 'assigned-holder' }],
    program_holders: [{ id: 'assigned-holder' }],
    communication_email_mailboxes: [{ address: 'assigned@example.org' }],
    program_holder_students: [{ program_holder_id: 'old-holder' }],
  });
  expect(await loadLearnerProgramContact(db, 'learner')).toBe('assigned@example.org');
  expect(filters).toContainEqual(['program_enrollments', 'or', 'user_id.eq.learner,student_id.eq.learner']);
  expect(filters).toContainEqual(['program_enrollments', 'in', 'status', ['active', 'enrolled', 'in_progress', 'confirmed']]);
  expect(filters).toContainEqual(['communication_email_mailboxes', 'in', 'program_holder_id', ['assigned-holder']]);
  expect(filters.some(row => row[0] === 'program_holder_students')).toBe(false);
});
it('routes unassigned or ambiguous contacts to Admissions instead of guessing', async () => {
  expect(await loadLearnerProgramContact(database({}).db, 'learner')).toBe('admissions@elevateforhumanity.org');
  const { db } = database({ program_enrollments: [{ program_holder_id: 'a' }, { program_holder_id: 'b' }], program_holders: [{ id: 'a' }, { id: 'b' }], communication_email_mailboxes: [{ address: 'a@example.org' }, { address: 'b@example.org' }] });
  expect(await loadLearnerProgramContact(db, 'learner')).toBe('admissions@elevateforhumanity.org');
});
it('surfaces database failure instead of silently selecting an unrelated contact', async () => {
  await expect(loadLearnerProgramContact(database({}, 'program_enrollments').db, 'learner')).rejects.toThrow('Unavailable');
});
