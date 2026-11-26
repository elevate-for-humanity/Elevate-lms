import { describe, expect, it } from 'vitest';
import {
  evaluateManufacturingSimulation,
  parseManufacturingSimulation,
  publicManufacturingSimulation,
} from '@/lib/lms/manufacturing-simulation';

import { simulationFixture, correctFixtureResponses } from '../fixtures/manufacturing-simulation';

describe('manufacturing virtual-practice scoring', () => {
  it('accepts a complete authored specification and removes answer keys from its public shape', () => {
    expect(parseManufacturingSimulation(simulationFixture)).toEqual(simulationFixture);
    const publicSpec = publicManufacturingSimulation(simulationFixture);
    expect(publicSpec.tasks[0]).not.toHaveProperty('expected');
    expect(publicSpec.tasks[0]).not.toHaveProperty('rationale');
    expect(simulationFixture.tasks[0].expected).toBe('hold');
  });
  it('records a perfect attempt as virtual practice without qualification or time credits', () => {
    const result = evaluateManufacturingSimulation(simulationFixture, correctFixtureResponses);
    expect(result).toMatchObject({
      score: 100,
      completed: true,
      feedback: { practiceOnly: true, criticalMisses: 0 },
    });
    expect(result).not.toHaveProperty('hours');
    expect(result).not.toHaveProperty('certified');
  });
  it('fails a critical safety error even when the numeric score reaches the threshold', () => {
    const result = evaluateManufacturingSimulation(simulationFixture, {
      ...correctFixtureResponses,
      safety: 'go',
    });
    expect(result).toMatchObject({ score: 80, completed: false, feedback: { criticalMisses: 1 } });
    expect(result?.weakObjectives).toEqual(['The brake fails inspection. What now?']);
  });
  it('allows a noncritical error at the stated mastery threshold and explains the correction', () => {
    const result = evaluateManufacturingSimulation(simulationFixture, {
      ...correctFixtureResponses,
      record: 'guess',
    });
    expect(result).toMatchObject({ score: 80, completed: true });
    expect(result?.feedback.tasks.at(-1)).toMatchObject({ correct: false, expected: 'lot' });
  });
  it.each([
    {},
    { ...correctFixtureResponses, extra: 'hold' },
    { ...correctFixtureResponses, safety: 'admin-approved' },
    { ...correctFixtureResponses, measure: '25' },
    { ...correctFixtureResponses, measure: Infinity },
    { ...correctFixtureResponses, measure: NaN },
    { ...correctFixtureResponses, order: ['stop', 'stop'] },
    { ...correctFixtureResponses, order: ['stop'] },
    { ...correctFixtureResponses, order: ['stop', 'report', 'extra'] },
  ])('rejects missing, extra, unsupported, or malformed responses %#', (responses) => {
    expect(evaluateManufacturingSimulation(simulationFixture, responses)).toBeNull();
  });
  it('evaluates sequence order rather than merely membership', () => {
    expect(
      evaluateManufacturingSimulation(simulationFixture, {
        ...correctFixtureResponses,
        order: ['report', 'stop'],
      })?.feedback.tasks[2].correct,
    ).toBe(false);
  });
  it('accepts zero and the numeric tolerance boundary but rejects an out-of-tolerance value', () => {
    expect(
      evaluateManufacturingSimulation(simulationFixture, {
        ...correctFixtureResponses,
        measure: 25.01,
      })?.feedback.tasks[1].correct,
    ).toBe(true);
    expect(
      evaluateManufacturingSimulation(simulationFixture, {
        ...correctFixtureResponses,
        measure: 25.011,
      })?.feedback.tasks[1].correct,
    ).toBe(false);
    expect(
      evaluateManufacturingSimulation(simulationFixture, correctFixtureResponses)?.feedback.tasks[3]
        .correct,
    ).toBe(true);
  });
  it('rejects duplicate task IDs and invalid authoring instead of awarding default credit', () => {
    expect(
      parseManufacturingSimulation({
        ...simulationFixture,
        tasks: [simulationFixture.tasks[0], simulationFixture.tasks[0]],
      }),
    ).toBeNull();
    expect(
      parseManufacturingSimulation({
        ...simulationFixture,
        tasks: [{ ...simulationFixture.tasks[0], expected: 'missing' }],
      }),
    ).toBeNull();
    expect(
      parseManufacturingSimulation({
        ...simulationFixture,
        tasks: [{ ...simulationFixture.tasks[1], tolerance: -1 }],
      }),
    ).toBeNull();
    expect(parseManufacturingSimulation({ ...simulationFixture, masteryThreshold: 0 })).toBeNull();
  });
});
