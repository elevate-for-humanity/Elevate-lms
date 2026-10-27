import { describe, it, expect } from 'vitest';
import { UltimateBuildRunner } from '../../lib/ultimate-course-builder/core/build-runner';
import { ULTIMATE_BUILD_STEPS } from '../../lib/ultimate-course-builder/core/types';
import { fixtureArtifact, fixtureCheckpoint } from '../fixtures/ultimate-contract';
describe('Ultimate durable resume', () => {
  it('reuses only passes bound to unchanged contract inputs', async () => {
    const calls: string[] = [];
    const profile: any = {
      id: 'p',
      title: 'P',
      authority: 'A',
      standardVersion: '1',
      sourceDocuments: [],
      competencies: [],
    };
    const handlers = Object.fromEntries(
      ULTIMATE_BUILD_STEPS.map((step) => [
        step,
        async () => {
          calls.push(step);
          return { artifacts: fixtureArtifact(step) };
        },
      ]),
    ) as any;
    await new UltimateBuildRunner(handlers).run({
      buildId: 'b:c',
      courseId: 'c',
      profile,
      artifacts: fixtureCheckpoint(profile, 7),
      findings: [],
      passedSteps: new Set(ULTIMATE_BUILD_STEPS.slice(0, 7)),
    });
    expect(calls).toEqual(ULTIMATE_BUILD_STEPS.slice(7));
  });
});
