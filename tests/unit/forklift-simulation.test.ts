import { describe, expect, it } from 'vitest';
import {
  FORKLIFT_INSPECTION_LOAD_SIMULATION,
  FORKLIFT_RESPONSE,
  FORKLIFT_RESPONSE_COUNT,
  capacityAtLoadCenter,
  scoreForkliftAttempt,
  type ForkliftScoreCheck,
} from '@/lib/lms/forklift-simulation';

const config = FORKLIFT_INSPECTION_LOAD_SIMULATION;
const PASSING = 80;

/** Builds the response vector the simulator client submits for a fully correct attempt. */
function perfectAttempt(overrides: Record<number, number> = {}): number[] {
  const responses = new Array(FORKLIFT_RESPONSE_COUNT).fill(0);
  config.inspectionItems.forEach((item, index) => {
    responses[FORKLIFT_RESPONSE.inspectionStart + index] = item.defect ? 1 : 0;
  });
  responses[FORKLIFT_RESPONSE.postInspectionDecision] = 0;
  responses[FORKLIFT_RESPONSE.capacityAtQuestionLb] = capacityAtLoadCenter(
    config,
    config.capacityQuestionLoadCenterIn,
  );
  config.loadScenarios.forEach((scenario, index) => {
    responses[FORKLIFT_RESPONSE.loadDecisionStart + index] =
      scenario.weightLb <= capacityAtLoadCenter(config, scenario.loadCenterIn) ? 1 : 0;
  });
  responses[FORKLIFT_RESPONSE.travelDecision] = 0;
  responses[FORKLIFT_RESPONSE.pedestrianDecision] = 0;
  responses[FORKLIFT_RESPONSE.shutdownForksLowered] = 1;
  responses[FORKLIFT_RESPONSE.shutdownNeutral] = 1;
  responses[FORKLIFT_RESPONSE.shutdownBrakeSet] = 1;
  responses[FORKLIFT_RESPONSE.shutdownKeyRemoved] = 1;
  for (const [index, value] of Object.entries(overrides)) responses[Number(index)] = value;
  return responses;
}

function check(result: ReturnType<typeof scoreForkliftAttempt>, key: string): ForkliftScoreCheck {
  const found = (result?.feedback.checks as ForkliftScoreCheck[]).find((c) => c.key === key);
  if (!found) throw new Error(`check ${key} missing from feedback`);
  return found;
}

describe('forklift simulation scorer', () => {
  it('derates capacity by the load-moment rule and never above the plate', () => {
    expect(capacityAtLoadCenter(config, 24)).toBe(5000);
    expect(capacityAtLoadCenter(config, 12)).toBe(5000);
    expect(capacityAtLoadCenter(config, 30)).toBe(4000);
    expect(capacityAtLoadCenter(config, 36)).toBe(3333);
    expect(capacityAtLoadCenter(config, 48)).toBe(2500);
  });

  it('passes a fully correct attempt at 100', () => {
    const result = scoreForkliftAttempt(config, perfectAttempt(), PASSING);
    expect(result).not.toBeNull();
    expect(result?.score).toBe(100);
    expect(result?.completed).toBe(true);
    expect(result?.weakObjectives).toEqual([]);
    expect(result?.feedback.hardFail).toBeNull();
    expect(result?.feedback.expectedCapacityAtQuestion).toBe(4000);
  });

  it('hard-fails putting a truck with known safety defects into service', () => {
    for (const decision of [1, 2]) {
      const result = scoreForkliftAttempt(
        config,
        perfectAttempt({ [FORKLIFT_RESPONSE.postInspectionDecision]: decision }),
        PASSING,
      );
      expect(result?.score).toBe(0);
      expect(result?.completed).toBe(false);
      expect(result?.feedback.hardFail).toBe('unsafe-truck-in-service');
      expect(String(result?.feedback.message)).toContain('1910.178(q)(7)');
      expect(result?.weakObjectives).toEqual([config.objectives.safety]);
    }
  });

  it('hard-fails lifting a load beyond the derated capacity', () => {
    // Load B is 4,200 lb at 30 in; capacity there is 4,000 lb.
    const loadB = FORKLIFT_RESPONSE.loadDecisionStart + 1;
    const result = scoreForkliftAttempt(config, perfectAttempt({ [loadB]: 1 }), PASSING);
    expect(result?.score).toBe(0);
    expect(result?.completed).toBe(false);
    expect(result?.feedback.hardFail).toBe('exceeded-capacity');
    expect(String(result?.feedback.message)).toContain('1910.178(o)(1)');
  });

  it('hard-fails travelling with the load raised', () => {
    const result = scoreForkliftAttempt(
      config,
      perfectAttempt({ [FORKLIFT_RESPONSE.travelDecision]: 1 }),
      PASSING,
    );
    expect(result?.score).toBe(0);
    expect(result?.completed).toBe(false);
    expect(result?.feedback.hardFail).toBe('travelled-with-raised-load');
    expect(String(result?.feedback.message)).toContain('1910.178(n)(7)');
  });

  it('scores a missed defect without hard-failing when the truck is still tagged out', () => {
    // Misses the cracked fork (calls it serviceable) but still tags the truck out.
    const result = scoreForkliftAttempt(
      config,
      perfectAttempt({ [FORKLIFT_RESPONSE.inspectionStart + 0]: 0 }),
      PASSING,
    );
    expect(result?.feedback.hardFail).toBeNull();
    expect(check(result, 'inspection-forks').passed).toBe(false);
    expect(check(result, 'inspection-forks').points).toBe(0);
    expect(result?.score).toBe(97);
    expect(result?.weakObjectives).toContain(config.objectives.inspection);
  });

  it('accepts the capacity calculation within tolerance and rejects a guessed rating', () => {
    const within = scoreForkliftAttempt(
      config,
      perfectAttempt({ [FORKLIFT_RESPONSE.capacityAtQuestionLb]: 4050 }),
      PASSING,
    );
    expect(check(within, 'capacity-calculation').points).toBe(10);

    // Answering with the plate rating (5,000) ignores the longer load center.
    const guessed = scoreForkliftAttempt(
      config,
      perfectAttempt({ [FORKLIFT_RESPONSE.capacityAtQuestionLb]: 5000 }),
      PASSING,
    );
    expect(check(guessed, 'capacity-calculation').points).toBe(0);
    expect(guessed?.weakObjectives).toContain(config.objectives.capacity);
  });

  it('refuses a load that should be lifted costs points but does not hard-fail', () => {
    const loadA = FORKLIFT_RESPONSE.loadDecisionStart + 0;
    const result = scoreForkliftAttempt(config, perfectAttempt({ [loadA]: 0 }), PASSING);
    expect(result?.feedback.hardFail).toBeNull();
    expect(check(result, 'load-a').passed).toBe(false);
    expect(result?.score).toBe(95);
  });

  it('refuses attempts for another simulator or with a short response vector', () => {
    expect(
      scoreForkliftAttempt(
        { ...config, simulator: 'some-other-simulator' as never },
        perfectAttempt(),
        PASSING,
      ),
    ).toBeNull();
    expect(scoreForkliftAttempt(config, [1, 1, 1], PASSING)).toBeNull();
  });

  it('carries the syllabus topic mapping on the scenario config', () => {
    const byTopic = new Map(config.syllabusTopics.map((entry) => [entry.topic, entry.coverage]));
    expect(byTopic.get('Pre-use observations and workplace hazard decisions')).toBe('full');
    expect(byTopic.get('Capacity information, load evidence, and stability decisions')).toBe('full');
    expect(byTopic.get('Operator boundaries, truck identity, and a safe learning handoff')).toBe('applied');
    expect(byTopic.get('Incident decisions, accurate records, and the practical handoff')).toBe('partial');
  });
});
