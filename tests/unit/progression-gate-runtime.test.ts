import { describe, expect, it, vi } from 'vitest';
import { evaluateUnlockRule } from '@/lib/lms/progression-gate';
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

function database(responses: Array<{ table: string; data?: unknown; error?: unknown }>) {
  const calls: Array<[string, ...unknown[]]> = [];
  return {
    calls,
    from(table: string) {
      const response = responses.shift();
      expect(table).toBe(response?.table);
      const result = { data: response?.data ?? null, error: response?.error ?? null };
      const query: any = { then: (resolve: any) => Promise.resolve(result).then(resolve), maybeSingle: async () => result };
      for (const method of ['select', 'eq', 'lt', 'order', 'limit', 'in']) query[method] = (...args: unknown[]) => { calls.push([method, ...args]); return query; };
      return query;
    },
  };
}
const evaluate = (db: any) => evaluateUnlockRule(db, { userId: 'learner', lessonId: 'next-lesson' });
const prefix = () => [
  { table: 'course_lessons', data: { unlock_rule: { type: 'complete_previous_module' } } },
  { table: 'course_lessons', data: { module_id: 'module-two', course_id: 'course', order_index: 1 } },
  { table: 'course_modules', data: { order_index: 1, course_id: 'course' } },
];
describe('actual lesson progression against canonical columns', () => {
  it('blocks a zero-indexed second module until required prior lessons are complete', async () => {
    const db = database([...prefix(), { table: 'course_modules', data: { id: 'module-zero' } },
      { table: 'course_lessons', data: [{ id: 'required' }] }, { table: 'lesson_progress', data: [] }]);
    expect((await evaluate(db)).unlocked).toBe(false);
    expect(db.calls).toContainEqual(['eq', 'module_id', 'module-zero']);
    expect(db.calls).toContainEqual(['lt', 'order_index', 1]);
  });
  it('unlocks when every required predecessor lesson is complete', async () => {
    const db = database([...prefix(), { table: 'course_modules', data: { id: 'previous' } },
      { table: 'course_lessons', data: [{ id: 'required' }] }, { table: 'lesson_progress', data: [{ lesson_id: 'required' }] }]);
    expect((await evaluate(db)).unlocked).toBe(true);
  });
  it('does not treat a predecessor query failure as an unlocked first module', async () => {
    const db = database([...prefix(), { table: 'course_modules', error: { message: 'unavailable' } }]);
    await expect(evaluate(db)).rejects.toThrow('previous module lookup failed');
  });
  it('rejects an explicitly failed assessment even when its score reaches the threshold', async () => {
    const db = database([{ table: 'course_lessons', data: { unlock_rule: { type: 'pass_assessment', minimumScore: 80 } } },
      { table: 'checkpoint_scores', data: { score: 90, passed: false } }]);
    expect((await evaluate(db)).unlocked).toBe(false);
  });
  it('keeps an unsupported configured rule locked', async () => {
    const db = database([{ table: 'course_lessons', data: { unlock_rule: { type: 'unsupported' } } }]);
    expect((await evaluate(db)).unlocked).toBe(false);
  });
});
