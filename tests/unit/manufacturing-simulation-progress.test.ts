import { beforeEach, expect, it, vi } from 'vitest';
import { MANUFACTURING_COURSE_ID } from '@/lib/lms/manufacturing-workbook-contract';
import { correctFixtureResponses } from '../fixtures/manufacturing-simulation';
import { manufacturingPracticeStore, fixtureGradingKey } from '../fixtures/manufacturing-practice-store';
const { privateClient } = vi.hoisted(() => ({ privateClient: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: privateClient }));
import { hasRequiredManufacturingSimulation } from '@/lib/lms/manufacturing-simulation-progress';

function fixture(answers: unknown = null, attemptKey = fixtureGradingKey) {
  const store = manufacturingPracticeStore(MANUFACTURING_COURSE_ID, 'lesson', 'inspection');
  privateClient.mockResolvedValue(store.privateDb);
  if (answers !== null) store.tables.manufacturing_simulation_progress.push({
    learner_id: 'learner', course_id: MANUFACTURING_COURSE_ID, lesson_id: 'lesson',
    interaction_id: 'inspection-manufacturing', spec_id: attemptKey,
    score: 100, completed: true, answers, attempts: 1,
  });
  return store;
}
const completed = (store: ReturnType<typeof fixture>) => hasRequiredManufacturingSimulation(
  store.learnerDb as any, MANUFACTURING_COURSE_ID, 'lesson', 'learner',
);
beforeEach(() => vi.clearAllMocks());

it('requires server-recorded practice and ignores forged learner-owned progress', async () => {
  const forged = fixture();
  forged.tables.interaction_progress.push({ learner_id: 'learner', lesson_id: 'lesson',
    course_id: MANUFACTURING_COURSE_ID, interaction_id: 'inspection-manufacturing',
    answers: correctFixtureResponses, score: 100, completed: true });
  expect(await completed(forged)).toBe(false);
  expect(forged.accesses.some((entry) => entry.table === 'interaction_progress')).toBe(false);
  expect(await completed(fixture({ ...correctFixtureResponses, safety: 'go' }))).toBe(false);
  const good = fixture(correctFixtureResponses);
  expect(await completed(good)).toBe(true);
  expect(good.filters).toContainEqual(['learner_id', 'learner']);
  expect(good.filters).toContainEqual(['course_id', MANUFACTURING_COURSE_ID]);
  expect(good.filters).toContainEqual(['interaction_id', 'inspection-manufacturing']);
  expect(good.filters).toContainEqual(['spec_id', fixtureGradingKey]);
});
it('rejects an attempt for a previous grading version', async () => {
  expect(await completed(fixture(correctFixtureResponses, 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'))).toBe(false);
});
it('fails closed on missing keys, mismatch and query errors', async () => {
  const missing = fixture(correctFixtureResponses);
  missing.tables.manufacturing_simulation_specs = [];
  await expect(completed(missing)).rejects.toThrow('does not match');
  const mismatch = fixture(correctFixtureResponses);
  mismatch.tables.course_lessons[0].content_json.experience.manufacturingSimulation.brief += ' Changed problem.';
  await expect(completed(mismatch)).rejects.toThrow('does not match');
  const failure = fixture();
  failure.errors.manufacturing_simulation_progress = new Error('Database unavailable');
  await expect(completed(failure)).rejects.toThrow('could not be verified');
});
it('leaves unrelated courses and lessons without an assigned simulation unchanged', async () => {
  expect(await hasRequiredManufacturingSimulation({} as any, 'unrelated-course', 'lesson', 'learner')).toBe(true);
  expect(privateClient).not.toHaveBeenCalled();
  const ordinary = fixture();
  ordinary.tables.course_lessons[0].content_json.experience = {};
  expect(await completed(ordinary)).toBe(true);
  expect(privateClient).not.toHaveBeenCalled();
});
