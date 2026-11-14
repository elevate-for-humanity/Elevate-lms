import { expect, it } from 'vitest';
import { loadLearnerQuizGrades } from '@/lib/lms/learner-quiz-grades';

function database(attempts: any[], quizzes: any[] = [], failure = '') {
  const calls: unknown[][] = [];
  return { calls, db: { from(table: string) {
    const q: any = {};
    for (const op of ['select', 'eq', 'in', 'order']) q[op] = (...args: unknown[]) => {
      if (op === 'select' && String(args[0]).includes('(')) throw new Error('No relationship');
      calls.push([table, op, ...args]); return q;
    };
    q.then = (resolve: any) => resolve({ data: table === 'quiz_attempts' ? attempts : quizzes, error: failure === table ? new Error('Unavailable') : null });
    return q;
  } } as any };
}
it('renders an empty grade ledger without requiring a nonexistent quiz relationship', async () => {
  const { db, calls } = database([]);
  expect(await loadLearnerQuizGrades(db, 'selected-learner')).toEqual([]);
  expect(calls).toContainEqual(['quiz_attempts', 'eq', 'user_uuid', 'selected-learner']);
  expect(calls.some(row => row[0] === 'quizzes')).toBe(false);
});
it('joins only quiz metadata referenced by this learner’s attempts and preserves UUID course identity', async () => {
  const { db, calls } = database([{ id: 4, quiz_id: 12, course_id: 'uuid-course', score: 82, completed_at: null, submitted_at: '2026-10-30' }], [{ id: 12, title: 'Safety' }]);
  expect(await loadLearnerQuizGrades(db, 'learner')).toEqual([{ id: 4, quiz_id: 12, course_id: 'uuid-course', score: 82, completed_at: '2026-10-30', submitted_at: '2026-10-30', quizzes: { title: 'Safety' } }]);
  expect(calls).toContainEqual(['quizzes', 'in', 'id', [12]]);
});
it('surfaces ledger read failures rather than inventing no grades', async () => {
  await expect(loadLearnerQuizGrades(database([], [], 'quiz_attempts').db, 'learner')).rejects.toThrow('Unavailable');
});
