import { expect, it } from 'vitest';
import { hasRequiredManufacturingSimulation } from '@/lib/lms/manufacturing-simulation-progress';
import { MANUFACTURING_COURSE_ID } from '@/lib/lms/manufacturing-workbook-contract';
import { simulationFixture, correctFixtureResponses } from '../fixtures/manufacturing-simulation';

function dbWith(answers: unknown, spec: unknown = simulationFixture, error: unknown = null) {
  const filters: Array<[string, unknown]> = [];
  const db: any = {
    from(table: string) {
      const q: any = {
        select: () => q,
        eq: (key: string, value: unknown) => {
          filters.push([key, value]);
          return q;
        },
        maybeSingle: async () => ({
          data:
            table === 'course_lessons'
              ? {
                  id: 'lesson',
                  slug: 'inspection',
                  content_json: {
                    experience: spec === undefined ? {} : { manufacturingSimulation: spec },
                  },
                }
              : { score: 100, completed: true, answers },
          error,
        }),
      };
      return q;
    },
  };
  return { db, filters };
}
it('requires the assigned virtual task before completion and ignores forged completion flags', async () => {
  const empty = dbWith(null);
  expect(
    await hasRequiredManufacturingSimulation(
      empty.db,
      MANUFACTURING_COURSE_ID,
      'lesson',
      'learner',
    ),
  ).toBe(false);
  const critical = dbWith({ ...correctFixtureResponses, safety: 'go' });
  expect(
    await hasRequiredManufacturingSimulation(
      critical.db,
      MANUFACTURING_COURSE_ID,
      'lesson',
      'learner',
    ),
  ).toBe(false);
  const good = dbWith(correctFixtureResponses);
  expect(
    await hasRequiredManufacturingSimulation(good.db, MANUFACTURING_COURSE_ID, 'lesson', 'learner'),
  ).toBe(true);
  expect(good.filters).toContainEqual(['learner_id', 'learner']);
  expect(good.filters).toContainEqual(['course_id', MANUFACTURING_COURSE_ID]);
  expect(good.filters).toContainEqual(['interaction_id', 'inspection-manufacturing']);
});
it('fails closed for invalid authoring or query errors and leaves unrelated courses unchanged', async () => {
  const invalid = dbWith(correctFixtureResponses, { version: 1 });
  expect(
    await hasRequiredManufacturingSimulation(
      invalid.db,
      MANUFACTURING_COURSE_ID,
      'lesson',
      'learner',
    ),
  ).toBe(false);
  const failure = dbWith(
    correctFixtureResponses,
    simulationFixture,
    new Error('Database unavailable'),
  );
  await expect(
    hasRequiredManufacturingSimulation(failure.db, MANUFACTURING_COURSE_ID, 'lesson', 'learner'),
  ).rejects.toThrow('could not be verified');
  expect(
    await hasRequiredManufacturingSimulation({} as any, 'unrelated-course', 'lesson', 'learner'),
  ).toBe(true);
});
