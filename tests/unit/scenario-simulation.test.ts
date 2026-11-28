import { describe, expect, it } from 'vitest';
import {
  SCENARIO_SIMULATOR_KEY,
  scenarioResponseCount,
  scoreScenarioAttempt,
  type ScenarioSimulationConfig,
} from '@/lib/lms/scenario-simulation';
import { WELDING_WELD_BOOTH_SIMULATION } from '@/lib/lms/simulations/welding-simulation';
import { SCENARIO_SIMULATIONS } from '@/lib/lms/simulations/index';

const PASS = 80;

/** Build the all-correct response vector for a config from its own data. */
function correctResponses(config: ScenarioSimulationConfig): number[] {
  const responses: number[] = [];
  for (const step of config.steps) {
    if (step.kind === 'inspect') {
      step.items.forEach((item) => responses.push(item.defect ? 1 : 0));
    } else if (step.kind === 'decide') {
      responses.push(step.correct);
    } else {
      responses.push(Math.round(step.answer * (step.responseScale ?? 1)));
    }
  }
  return responses;
}

describe('scenario simulation engine', () => {
  it('scores a perfect welding attempt at 100 and completed', () => {
    const result = scoreScenarioAttempt(
      WELDING_WELD_BOOTH_SIMULATION,
      correctResponses(WELDING_WELD_BOOTH_SIMULATION),
      PASS,
    );
    expect(result).not.toBeNull();
    expect(result!.score).toBe(100);
    expect(result!.completed).toBe(true);
    expect(result!.weakObjectives).toEqual([]);
    expect(result!.feedback.hardFail).toBeNull();
  });

  it('hard-fails the welding attempt that strikes an arc by unprotected combustibles', () => {
    const responses = correctResponses(WELDING_WELD_BOOTH_SIMULATION);
    // Step order: 8 inspection ints, then the hot-work decision.
    responses[8] = 1;
    const result = scoreScenarioAttempt(WELDING_WELD_BOOTH_SIMULATION, responses, PASS);
    expect(result!.score).toBe(0);
    expect(result!.completed).toBe(false);
    expect(result!.feedback.hardFail).toBe('hot-work-call');
    expect(String(result!.feedback.message)).toMatch(/1910\.252/);
  });

  it('hard-fails accepting or concealing the coupon crack', () => {
    for (const bad of [1, 2]) {
      const responses = correctResponses(WELDING_WELD_BOOTH_SIMULATION);
      responses[responses.length - 1] = bad;
      const result = scoreScenarioAttempt(WELDING_WELD_BOOTH_SIMULATION, responses, PASS);
      expect(result!.score).toBe(0);
      expect(result!.feedback.hardFail).toBe('crack-disposition');
    }
  });

  it('gives partial credit inside the doubled calculation tolerance and names the objective', () => {
    const responses = correctResponses(WELDING_WELD_BOOTH_SIMULATION);
    // Diagonal answer is 60 in, tolerance 1% (0.6 in): 61.1 in is within 2x, not within 1x.
    // Layout: 8 inspection + hot-work + machine-setup = index 10 is the calculation.
    responses[10] = 61;
    const result = scoreScenarioAttempt(WELDING_WELD_BOOTH_SIMULATION, responses, PASS);
    const calc = (result!.feedback.checks as Array<any>).find((c) => c.key === 'diagonal-check');
    expect(calc.points).toBe(5);
    expect(result!.weakObjectives).toContain('Measurement and squareness');
    expect(result!.score).toBeLessThan(100);
  });

  it('rejects attempts that are too short or configs that are not scenario sims', () => {
    expect(scoreScenarioAttempt(WELDING_WELD_BOOTH_SIMULATION, [1, 0], PASS)).toBeNull();
    expect(
      scoreScenarioAttempt(
        { ...WELDING_WELD_BOOTH_SIMULATION, simulator: 'other' } as any,
        correctResponses(WELDING_WELD_BOOTH_SIMULATION),
        PASS,
      ),
    ).toBeNull();
  });

  it('keeps every registered scenario within the API response budget', () => {
    for (const config of Object.values(SCENARIO_SIMULATIONS)) {
      expect(config.simulator).toBe(SCENARIO_SIMULATOR_KEY);
      const count = scenarioResponseCount(config);
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(50);
      // A perfect attempt must be able to pass for every registered sim.
      const result = scoreScenarioAttempt(config, correctResponses(config), PASS);
      expect(result!.score).toBe(100);
      expect(result!.completed).toBe(true);
    }
  });
});
