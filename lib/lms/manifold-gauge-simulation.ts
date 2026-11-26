/**
 * lib/lms/manifold-gauge-simulation.ts
 *
 * Manifold gauge + refrigerant charging simulator — the platform's first
 * hands-on machine-work simulation for the EPA 608 course.
 *
 * The authored configuration lives in a lesson's `content_json.experience`
 * under the `simulation` key (the lesson-experience contract already accepts
 * a free-form `simulation` object — see lib/course-factory/experience-contract.ts).
 * The learner interactions API (apps/lms/app/api/learner/interactions/route.ts)
 * surfaces it as the `${lessonSlug}-simulation` interaction and scores attempts
 * server-side through `scoreManifoldGaugeAttempt` below, recording score +
 * completion in `interaction_progress` exactly like a knowledge check.
 *
 * The system-response model is an educational steady-state approximation
 * anchored to the authored readings in lib/courses/hvac-diagnostic-exercises.ts
 * (charging scenario cs-01 and gauge exercise gr-01). It is not a service
 * procedure for real equipment.
 */

import { PT_CHART } from '../courses/hvac-diagnostic-exercises';
import { subcooling, superheat } from './hvac-system-model';

export const MANIFOLD_GAUGE_SIMULATOR_KEY = 'manifold-gauge-charging';

export type ManifoldReadings = {
  suctionPressure: number; // psig
  dischargePressure: number; // psig
  suctionLineTemp: number; // °F
  liquidLineTemp: number; // °F
};

export type ManifoldGaugeSimulationConfig = {
  simulator: typeof MANIFOLD_GAUGE_SIMULATOR_KEY;
  title: string;
  description: string;
  systemType: string;
  refrigerant: 'R-410A' | 'R-22';
  meteringDevice: 'TXV' | 'piston';
  outdoorTemp: number;
  indoorTemp: number;
  nameplateCharge: string;
  /** As-found (undercharged) readings before the student changes anything. */
  initialReadings: ManifoldReadings;
  /** Ounces of refrigerant added at which the system is correctly charged. */
  correctChargeOz: number;
  targetSubcooling: number;
  subcoolingWindow: [number, number];
  superheatWindow: [number, number];
  /** Decision index that fixes this scenario (see MANIFOLD_DECISIONS). */
  correctDecision: number;
  /** Charge-method indices that are safe/correct for this scenario. */
  acceptableMethods: number[];
  objectives: {
    procedure: string;
    measurement: string;
    charging: string;
    outcome: string;
    safety: string;
  };
  /**
   * Hands-on topics from Elevate's HVAC Certification Syllabus that this
   * scenario evidences, with an honest coverage level for each: `full`
   * (the topic is the exercise), `applied` (worked quantitatively inside
   * the scenario), `embedded` (required as part of the workflow), or
   * `partial` (only part of the topic is exercised — see the note).
   */
  syllabusTopics: Array<{
    topic: string;
    coverage: 'full' | 'applied' | 'embedded' | 'partial';
    note: string;
  }>;
  instructions: string[];
};

/** Decision options presented to the student, by response index. */
export const MANIFOLD_DECISIONS = [
  'Add refrigerant — the system is undercharged',
  'Recover refrigerant — the system is overcharged',
  'No change — the charge is correct',
  'Vent the excess refrigerant to the air',
] as const;

/** Charging methods presented to the student, by response index. */
export const MANIFOLD_CHARGE_METHODS = [
  'Liquid into the high (liquid) side with the system off, cylinder inverted on a scale',
  'Vapor into the low (suction) side with the system running, cylinder upright on a scale',
  'Liquid into the low (suction) side with the system running',
] as const;

/**
 * Response layout for a simulation attempt. The learner interactions API
 * accepts an array of non-negative integers, so every value is encoded as
 * an int (temperatures and ounces are stored in tenths).
 */
export const MANIFOLD_RESPONSE = {
  airflowVerified: 0,
  gaugesConnectedAndPurged: 1,
  stabilizedBeforeReadings: 2,
  initialSuperheatTenths: 3,
  initialSubcoolingTenths: 4,
  decision: 5,
  chargeMethod: 6,
  incrementsRespected: 7,
  finalSuctionPressure: 8,
  finalDischargePressure: 9,
  finalSuctionLineTempTenths: 10,
  finalLiquidLineTempTenths: 11,
  finalSuperheatTenths: 12,
  finalSubcoolingTenths: 13,
  vented: 14,
  disconnectCompleted: 15,
  totalAddedOzTenths: 16,
} as const;

export const MANIFOLD_RESPONSE_COUNT = 17;

/** Saturation temperature (°F) for a pressure (psig), interpolated from the repo PT chart. */
export function saturationTempForPressure(
  refrigerant: keyof typeof PT_CHART,
  pressure: number,
): number {
  const chart = PT_CHART[refrigerant];
  if (!chart?.length) return NaN;
  if (pressure <= chart[0].pressure) return chart[0].satTemp;
  for (let i = 1; i < chart.length; i++) {
    if (pressure <= chart[i].pressure) {
      const prev = chart[i - 1];
      const next = chart[i];
      const ratio = (pressure - prev.pressure) / (next.pressure - prev.pressure);
      return prev.satTemp + ratio * (next.satTemp - prev.satTemp);
    }
  }
  return chart[chart.length - 1].satTemp;
}

export function superheatForReadings(
  refrigerant: keyof typeof PT_CHART,
  readings: ManifoldReadings,
): number {
  return superheat(
    readings.suctionLineTemp,
    saturationTempForPressure(refrigerant, readings.suctionPressure),
  );
}

export function subcoolingForReadings(
  refrigerant: keyof typeof PT_CHART,
  readings: ManifoldReadings,
): number {
  return subcooling(
    saturationTempForPressure(refrigerant, readings.dischargePressure),
    readings.liquidLineTemp,
  );
}

/**
 * System-response anchors: readings at a given number of ounces added
 * relative to the as-found state (negative = recovered). Anchored to the
 * authored cs-01 as-found readings, the gr-01 normal system at the correct
 * charge, and the gr-03 overcharge pattern beyond it.
 */
const RESPONSE_ANCHORS: Array<{ oz: number; readings: ManifoldReadings }> = [
  {
    oz: -6,
    readings: { suctionPressure: 96, dischargePressure: 338, suctionLineTemp: 63, liquidLineTemp: 101 },
  },
  {
    oz: 0,
    readings: { suctionPressure: 105, dischargePressure: 360, suctionLineTemp: 58, liquidLineTemp: 102 },
  },
  {
    oz: 10,
    readings: { suctionPressure: 118, dischargePressure: 418, suctionLineTemp: 52, liquidLineTemp: 103 },
  },
  {
    oz: 18,
    readings: { suctionPressure: 127, dischargePressure: 462, suctionLineTemp: 49, liquidLineTemp: 98 },
  },
];

/** Modelled gauge/line readings after `chargeOz` ounces have been added (or recovered, when negative). */
export function readingsAtCharge(chargeOz: number): ManifoldReadings {
  const clamped = Math.max(-10, Math.min(24, chargeOz));
  const anchors = RESPONSE_ANCHORS;
  if (clamped <= anchors[0].oz) return { ...anchors[0].readings };
  for (let i = 1; i < anchors.length; i++) {
    if (clamped <= anchors[i].oz) {
      const prev = anchors[i - 1];
      const next = anchors[i];
      const ratio = (clamped - prev.oz) / (next.oz - prev.oz);
      const mix = (a: number, b: number) => a + ratio * (b - a);
      return {
        suctionPressure: mix(prev.readings.suctionPressure, next.readings.suctionPressure),
        dischargePressure: mix(prev.readings.dischargePressure, next.readings.dischargePressure),
        suctionLineTemp: mix(prev.readings.suctionLineTemp, next.readings.suctionLineTemp),
        liquidLineTemp: mix(prev.readings.liquidLineTemp, next.readings.liquidLineTemp),
      };
    }
  }
  return { ...anchors[anchors.length - 1].readings };
}

export type ManifoldScoreCheck = {
  key: string;
  label: string;
  passed: boolean;
  points: number;
  maxPoints: number;
};

export type ManifoldScoreResult = {
  score: number;
  completed: boolean;
  weakObjectives: string[];
  feedback: Record<string, unknown>;
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function within(value: number, target: number, tolerance: number): boolean {
  return Math.abs(value - target) <= tolerance;
}

function windowPoints(
  value: number,
  window: [number, number],
  full: number,
  partial: number,
): number {
  if (value >= window[0] && value <= window[1]) return full;
  if (value >= window[0] - 3 && value <= window[1] + 3) return partial;
  return 0;
}

/**
 * Server-side scorer for a manifold gauge simulation attempt. Recomputes
 * every derived value from the authored configuration and the PT chart —
 * including re-deriving the expected final readings from the total ounces
 * the student reports adding — so the recorded score does not trust the
 * client's arithmetic. Mirrors the knowledge-check branch of the learner
 * interactions route: same return shape, same mastery-threshold completion.
 */
export function scoreManifoldGaugeAttempt(
  config: ManifoldGaugeSimulationConfig,
  responses: number[],
  passingScore: number,
): ManifoldScoreResult | null {
  if (!config || config.simulator !== MANIFOLD_GAUGE_SIMULATOR_KEY) return null;
  if (!Array.isArray(responses) || responses.length < MANIFOLD_RESPONSE_COUNT) return null;

  const get = (index: number) => Number(responses[index] ?? 0);
  const vented = get(MANIFOLD_RESPONSE.vented) === 1 || get(MANIFOLD_RESPONSE.decision) === 3;

  const safetyFeedback = {
    vented,
    message:
      'Venting refrigerant to the atmosphere is prohibited by Section 608 of the Clean Air Act. ' +
      'Excess refrigerant must be recovered into an approved recovery cylinder. This attempt cannot pass.',
  };
  if (vented) {
    return {
      score: 0,
      completed: false,
      weakObjectives: [config.objectives.safety],
      feedback: safetyFeedback,
    };
  }

  const checks: ManifoldScoreCheck[] = [];
  const addCheck = (
    key: string,
    label: string,
    points: number,
    maxPoints: number,
  ) => {
    checks.push({ key, label, passed: points === maxPoints, points, maxPoints });
  };

  // ── Procedure (40) ──────────────────────────────────────────────────────
  addCheck('airflow', 'Verified airflow before charging', get(MANIFOLD_RESPONSE.airflowVerified) === 1 ? 10 : 0, 10);
  addCheck('setup', 'Connected gauges and purged the hoses', get(MANIFOLD_RESPONSE.gaugesConnectedAndPurged) === 1 ? 10 : 0, 10);
  addCheck('stabilize', 'Let the system stabilize before taking readings', get(MANIFOLD_RESPONSE.stabilizedBeforeReadings) === 1 ? 10 : 0, 10);
  addCheck('disconnect', 'Closed the valves, cleared the hoses and replaced the caps', get(MANIFOLD_RESPONSE.disconnectCompleted) === 1 ? 10 : 0, 10);

  // ── Measurement & diagnosis (25) ────────────────────────────────────────
  const actualInitialSuperheat = superheatForReadings(config.refrigerant, config.initialReadings);
  const actualInitialSubcooling = subcoolingForReadings(config.refrigerant, config.initialReadings);
  addCheck(
    'initial-superheat',
    'Calculated the as-found superheat',
    within(get(MANIFOLD_RESPONSE.initialSuperheatTenths) / 10, actualInitialSuperheat, 2) ? 8 : 0,
    8,
  );
  addCheck(
    'initial-subcooling',
    'Calculated the as-found subcooling',
    within(get(MANIFOLD_RESPONSE.initialSubcoolingTenths) / 10, actualInitialSubcooling, 2) ? 7 : 0,
    7,
  );
  addCheck(
    'decision',
    'Chose the correct service decision',
    get(MANIFOLD_RESPONSE.decision) === config.correctDecision ? 10 : 0,
    10,
  );

  // ── Charging practice (15) ──────────────────────────────────────────────
  addCheck(
    'method',
    'Used an EPA-safe charging method for this refrigerant',
    config.acceptableMethods.includes(get(MANIFOLD_RESPONSE.chargeMethod)) ? 10 : 0,
    10,
  );
  addCheck(
    'increments',
    'Adjusted in small increments and re-stabilized between them',
    get(MANIFOLD_RESPONSE.incrementsRespected) === 1 ? 5 : 0,
    5,
  );

  // ── Outcome (20) — only on readings the server can verify ───────────────
  const submittedFinal: ManifoldReadings = {
    suctionPressure: get(MANIFOLD_RESPONSE.finalSuctionPressure),
    dischargePressure: get(MANIFOLD_RESPONSE.finalDischargePressure),
    suctionLineTemp: get(MANIFOLD_RESPONSE.finalSuctionLineTempTenths) / 10,
    liquidLineTemp: get(MANIFOLD_RESPONSE.finalLiquidLineTempTenths) / 10,
  };
  const predictedFinal = readingsAtCharge(get(MANIFOLD_RESPONSE.totalAddedOzTenths) / 10);
  const readingsVerified =
    within(submittedFinal.suctionPressure, predictedFinal.suctionPressure, 7) &&
    within(submittedFinal.dischargePressure, predictedFinal.dischargePressure, 10) &&
    within(submittedFinal.suctionLineTemp, predictedFinal.suctionLineTemp, 4) &&
    within(submittedFinal.liquidLineTemp, predictedFinal.liquidLineTemp, 4);

  const actualFinalSuperheat = superheatForReadings(config.refrigerant, submittedFinal);
  const actualFinalSubcooling = subcoolingForReadings(config.refrigerant, submittedFinal);

  addCheck(
    'final-subcooling',
    `Finished inside the target subcooling window (${config.subcoolingWindow[0]}–${config.subcoolingWindow[1]}°F)`,
    readingsVerified ? windowPoints(actualFinalSubcooling, config.subcoolingWindow, 10, 5) : 0,
    10,
  );
  addCheck(
    'final-superheat',
    `Finished inside the expected superheat window (${config.superheatWindow[0]}–${config.superheatWindow[1]}°F)`,
    readingsVerified ? windowPoints(actualFinalSuperheat, config.superheatWindow, 6, 3) : 0,
    6,
  );
  const finalCalcPoints =
    (within(get(MANIFOLD_RESPONSE.finalSuperheatTenths) / 10, actualFinalSuperheat, 2) ? 2 : 0) +
    (within(get(MANIFOLD_RESPONSE.finalSubcoolingTenths) / 10, actualFinalSubcooling, 2) ? 2 : 0);
  addCheck('final-calculations', 'Final superheat/subcooling calculations are correct', finalCalcPoints, 4);

  const score = checks.reduce((sum, check) => sum + check.points, 0);
  const weakObjectives: string[] = [];
  const missed = (keys: string[], objective: string) => {
    if (checks.some((check) => keys.includes(check.key) && !check.passed)) {
      weakObjectives.push(objective);
    }
  };
  missed(['airflow', 'setup', 'stabilize', 'disconnect'], config.objectives.procedure);
  missed(['initial-superheat', 'initial-subcooling'], config.objectives.measurement);
  missed(['decision', 'method', 'increments'], config.objectives.charging);
  missed(['final-subcooling', 'final-superheat', 'final-calculations'], config.objectives.outcome);

  return {
    score,
    completed: score >= passingScore,
    weakObjectives: [...new Set(weakObjectives)],
    feedback: {
      vented: false,
      readingsVerified,
      checks,
      actualInitialSuperheat: round1(actualInitialSuperheat),
      actualInitialSubcooling: round1(actualInitialSubcooling),
      actualFinalSuperheat: round1(actualFinalSuperheat),
      actualFinalSubcooling: round1(actualFinalSubcooling),
      targetSubcooling: config.targetSubcooling,
      message: readingsVerified
        ? 'Attempt scored against the target subcooling window and the EPA-safe procedure.'
        : 'The submitted final readings do not match the charge you reported adding, so the outcome could not be verified. Retake the final readings and resubmit.',
    },
  };
}

/**
 * The authored simulation for the EPA 608 course, built from charging
 * scenario cs-01 in lib/courses/hvac-diagnostic-exercises.ts (TXV system,
 * charge by subcooling) and the Type II charging guidance in
 * lib/courses/hvac-epa608-prep.ts.
 */
export const EPA608_MANIFOLD_GAUGE_SIMULATION: ManifoldGaugeSimulationConfig = {
  simulator: MANIFOLD_GAUGE_SIMULATOR_KEY,
  title: 'Manifold Gauge Lab — Charge by Subcooling',
  description:
    'A 3-ton R-410A split system with a TXV is not cooling well on a 95°F day. Connect your manifold gauge set, measure the system, calculate superheat and subcooling, then charge it to the manufacturer subcooling target — without venting a single ounce.',
  systemType: '3-ton split system with TXV',
  refrigerant: 'R-410A',
  meteringDevice: 'TXV',
  outdoorTemp: 95,
  indoorTemp: 75,
  nameplateCharge: '7 lbs 8 oz (add 0.6 oz per foot of line set over 15 feet)',
  initialReadings: {
    suctionPressure: 105,
    dischargePressure: 360,
    suctionLineTemp: 58,
    liquidLineTemp: 102,
  },
  correctChargeOz: 10,
  targetSubcooling: 12,
  subcoolingWindow: [10, 15],
  superheatWindow: [8, 15],
  correctDecision: 0,
  acceptableMethods: [0, 1],
  objectives: {
    procedure: 'Follow the safe service procedure: verify airflow, connect and purge gauges, stabilize before reading, and disconnect without losing refrigerant.',
    measurement: 'Use the pressure-temperature chart to calculate superheat and subcooling from gauge readings.',
    charging: 'Charge a TXV system by subcooling, in small increments, using an EPA-safe method — recover, never vent.',
    outcome: 'Bring the system into the target subcooling window and verify the final readings.',
    safety: 'Never vent refrigerant. Section 608 of the Clean Air Act prohibits knowingly releasing refrigerant to the atmosphere.',
  },
  syllabusTopics: [
    {
      topic: 'Compare superheat and subcooling readings',
      coverage: 'full',
      note: 'The core of the lab: the student calculates as-found superheat and subcooling from gauge pressures and line temperatures via the PT chart, compares both against the target windows, then re-calculates and compares the final readings after charging. Both calculations are scored server-side within ±2°F.',
    },
    {
      topic: 'Charging with manifold gauges and leak detection',
      coverage: 'partial',
      note: 'Charging is fully exercised and scored: gauge connection, hose purge, stabilization, charge-method selection, scale-based increments, recovery-cylinder use, and the EPA no-venting rule enforced as a hard fail. Leak detection appears only in the final disconnect step (replace caps, check for leaks) — there is no dedicated leak-detection exercise.',
    },
    {
      topic: 'Trace the four stages of the refrigeration cycle',
      coverage: 'applied',
      note: 'Readings are taken at the evaporator outlet (suction line → superheat) and the condenser outlet (liquid line → subcooling), and the PT-chart saturation work ties both pressures to the evaporation and condensing stages, so the student works the cycle quantitatively rather than tracing it stage by stage.',
    },
    {
      topic: 'Record observations from hands-on work',
      coverage: 'embedded',
      note: 'The workflow requires recording as-found and final observations (pressures, line temperatures, calculations), and the scored attempt is persisted in interaction_progress — observation-recording is a required means inside the scenario rather than a standalone assessed exercise.',
    },
  ],
  instructions: [
    'Verify airflow first — a dirty filter or blocked coil makes every gauge reading a lie.',
    'Connect the manifold gauges and purge the air from the hoses.',
    'Run the system and let it stabilize before trusting any reading.',
    'Read both gauges, clamp a thermometer on each line, and calculate superheat and subcooling with the PT chart.',
    'Decide: add, recover, or leave the charge alone. Venting is a federal violation — recover instead.',
    'Charge by subcooling (TXV system) in small increments, re-stabilizing between additions.',
    'Verify the final readings, close the valves, clear the hoses and replace the caps.',
  ],
};
