import { describe, expect, it } from 'vitest';
import {
  EPA608_MANIFOLD_GAUGE_SIMULATION,
  MANIFOLD_RESPONSE,
  MANIFOLD_RESPONSE_COUNT,
  readingsAtCharge,
  saturationTempForPressure,
  scoreManifoldGaugeAttempt,
  subcoolingForReadings,
  superheatForReadings,
  type ManifoldScoreCheck,
} from '@/lib/lms/manifold-gauge-simulation';

const config = EPA608_MANIFOLD_GAUGE_SIMULATION;
const PASSING = 80;

const initialSuperheat = superheatForReadings(config.refrigerant, config.initialReadings);
const initialSubcooling = subcoolingForReadings(config.refrigerant, config.initialReadings);

/**
 * Builds the response vector the simulator client submits for an honest
 * attempt that adds `oz` ounces and reports the readings the system model
 * predicts for that charge.
 */
function honestAttempt(oz: number, overrides: Record<number, number> = {}): number[] {
  const final = readingsAtCharge(oz);
  const responses = new Array(MANIFOLD_RESPONSE_COUNT).fill(0);
  responses[MANIFOLD_RESPONSE.airflowVerified] = 1;
  responses[MANIFOLD_RESPONSE.gaugesConnectedAndPurged] = 1;
  responses[MANIFOLD_RESPONSE.stabilizedBeforeReadings] = 1;
  responses[MANIFOLD_RESPONSE.initialSuperheatTenths] = Math.round(initialSuperheat * 10);
  responses[MANIFOLD_RESPONSE.initialSubcoolingTenths] = Math.round(initialSubcooling * 10);
  responses[MANIFOLD_RESPONSE.decision] = config.correctDecision;
  responses[MANIFOLD_RESPONSE.chargeMethod] = config.acceptableMethods[0];
  responses[MANIFOLD_RESPONSE.incrementsRespected] = 1;
  responses[MANIFOLD_RESPONSE.finalSuctionPressure] = Math.round(final.suctionPressure);
  responses[MANIFOLD_RESPONSE.finalDischargePressure] = Math.round(final.dischargePressure);
  responses[MANIFOLD_RESPONSE.finalSuctionLineTempTenths] = Math.round(final.suctionLineTemp * 10);
  responses[MANIFOLD_RESPONSE.finalLiquidLineTempTenths] = Math.round(final.liquidLineTemp * 10);
  responses[MANIFOLD_RESPONSE.finalSuperheatTenths] = Math.round(
    superheatForReadings(config.refrigerant, final) * 10,
  );
  responses[MANIFOLD_RESPONSE.finalSubcoolingTenths] = Math.round(
    subcoolingForReadings(config.refrigerant, final) * 10,
  );
  responses[MANIFOLD_RESPONSE.vented] = 0;
  responses[MANIFOLD_RESPONSE.disconnectCompleted] = 1;
  responses[MANIFOLD_RESPONSE.totalAddedOzTenths] = Math.round(oz * 10);
  for (const [index, value] of Object.entries(overrides)) responses[Number(index)] = value;
  return responses;
}

function check(result: ReturnType<typeof scoreManifoldGaugeAttempt>, key: string): ManifoldScoreCheck {
  const found = (result?.feedback.checks as ManifoldScoreCheck[]).find((c) => c.key === key);
  if (!found) throw new Error(`check ${key} missing from feedback`);
  return found;
}

describe('manifold gauge simulation scorer', () => {
  it('derives superheat and subcooling from the PT chart', () => {
    // R-410A at 118 psig saturates at ~40°F — the correct-charge suction side.
    expect(saturationTempForPressure('R-410A', 118)).toBeGreaterThanOrEqual(39);
    expect(saturationTempForPressure('R-410A', 118)).toBeLessThanOrEqual(41);
    // The as-found system is undercharged: high superheat, almost no subcooling.
    expect(initialSuperheat).toBeGreaterThan(18);
    expect(initialSubcooling).toBeLessThan(5);
  });

  it('passes a correct charge to the subcooling target', () => {
    const result = scoreManifoldGaugeAttempt(config, honestAttempt(config.correctChargeOz), PASSING);
    expect(result).not.toBeNull();
    expect(result?.score).toBe(100);
    expect(result?.completed).toBe(true);
    expect(result?.weakObjectives).toEqual([]);
    expect(result?.feedback.readingsVerified).toBe(true);
    expect(result?.feedback.actualFinalSubcooling).toBe(config.targetSubcooling);
  });

  it('hard-fails any attempt that vents refrigerant', () => {
    const byFlag = scoreManifoldGaugeAttempt(
      config,
      honestAttempt(config.correctChargeOz, { [MANIFOLD_RESPONSE.vented]: 1 }),
      PASSING,
    );
    expect(byFlag?.score).toBe(0);
    expect(byFlag?.completed).toBe(false);
    expect(byFlag?.feedback.vented).toBe(true);
    expect(String(byFlag?.feedback.message)).toContain('Clean Air Act');
    expect(byFlag?.weakObjectives).toEqual([config.objectives.safety]);

    // Choosing "vent the excess" as the service decision fails the same way.
    const byDecision = scoreManifoldGaugeAttempt(
      config,
      honestAttempt(config.correctChargeOz, { [MANIFOLD_RESPONSE.decision]: 3 }),
      PASSING,
    );
    expect(byDecision?.score).toBe(0);
    expect(byDecision?.completed).toBe(false);
  });

  it('scores fabricated final readings zero on the outcome checks', () => {
    // Reports adding the correct 10 oz but submits the as-found readings as
    // the "final" readings — the server re-derives the expected readings
    // from the reported ounces, so the outcome cannot be verified.
    const fabricated = honestAttempt(config.correctChargeOz, {
      [MANIFOLD_RESPONSE.finalSuctionPressure]: config.initialReadings.suctionPressure,
      [MANIFOLD_RESPONSE.finalDischargePressure]: config.initialReadings.dischargePressure,
      [MANIFOLD_RESPONSE.finalSuctionLineTempTenths]: Math.round(
        config.initialReadings.suctionLineTemp * 10,
      ),
      [MANIFOLD_RESPONSE.finalLiquidLineTempTenths]: Math.round(
        config.initialReadings.liquidLineTemp * 10,
      ),
    });
    const result = scoreManifoldGaugeAttempt(config, fabricated, PASSING);
    expect(result?.feedback.readingsVerified).toBe(false);
    expect(check(result, 'final-subcooling').points).toBe(0);
    expect(check(result, 'final-superheat').points).toBe(0);
    expect(result?.weakObjectives).toContain(config.objectives.outcome);
  });

  it('accepts superheat/subcooling math within ±2°F and rejects it beyond', () => {
    const withinTolerance = scoreManifoldGaugeAttempt(
      config,
      honestAttempt(config.correctChargeOz, {
        [MANIFOLD_RESPONSE.initialSuperheatTenths]: Math.round((initialSuperheat + 1.9) * 10),
        [MANIFOLD_RESPONSE.initialSubcoolingTenths]: Math.round((initialSubcooling - 1.9) * 10),
      }),
      PASSING,
    );
    expect(check(withinTolerance, 'initial-superheat').passed).toBe(true);
    expect(check(withinTolerance, 'initial-subcooling').passed).toBe(true);

    const beyondTolerance = scoreManifoldGaugeAttempt(
      config,
      honestAttempt(config.correctChargeOz, {
        [MANIFOLD_RESPONSE.initialSuperheatTenths]: Math.round((initialSuperheat + 2.1) * 10),
        [MANIFOLD_RESPONSE.initialSubcoolingTenths]: Math.round((initialSubcooling + 2.1) * 10),
      }),
      PASSING,
    );
    expect(check(beyondTolerance, 'initial-superheat').passed).toBe(false);
    expect(check(beyondTolerance, 'initial-subcooling').passed).toBe(false);
  });

  it('refuses attempts for another simulator or with a short response vector', () => {
    expect(
      scoreManifoldGaugeAttempt(
        { ...config, simulator: 'some-other-simulator' as never },
        honestAttempt(config.correctChargeOz),
        PASSING,
      ),
    ).toBeNull();
    expect(scoreManifoldGaugeAttempt(config, [1, 1, 1], PASSING)).toBeNull();
  });

  it('carries the syllabus topic mapping on the scenario config', () => {
    const byTopic = new Map(config.syllabusTopics.map((entry) => [entry.topic, entry.coverage]));
    expect(byTopic.get('Compare superheat and subcooling readings')).toBe('full');
    expect(byTopic.get('Charging with manifold gauges and leak detection')).toBe('partial');
    expect(byTopic.get('Trace the four stages of the refrigeration cycle')).toBe('applied');
    expect(byTopic.get('Record observations from hands-on work')).toBe('embedded');
  });
});
