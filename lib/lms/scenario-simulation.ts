/**
 * lib/lms/scenario-simulation.ts
 *
 * Generic hands-on scenario simulation engine — the shared chassis for the
 * trade scenario labs that do not need a bespoke physics model. It follows
 * the exact contract of the manifold gauge lab
 * (lib/lms/manifold-gauge-simulation.ts) and the forklift lab
 * (lib/lms/forklift-simulation.ts):
 *
 * - The authored configuration lives in a lesson's
 *   `content_json.experience` under the `simulation` key, with
 *   `simulator: 'scenario-sim'` and a unique `simId` per scenario.
 * - The learner interactions API (apps/lms/app/api/learner/interactions/
 *   route.ts) surfaces it as the `${lessonSlug}-simulation` interaction and
 *   scores attempts server-side through `scoreScenarioAttempt` below,
 *   recording score + completion in `interaction_progress`.
 * - Responses are an array of non-negative integers (the API accepts at
 *   most 50). Steps consume responses in config order:
 *     - `inspect`  — one int per item (1 = "defect — act on it",
 *       0 = "serviceable / no action").
 *     - `decide`   — one int, the chosen option index.
 *     - `calculate`— one int, the learner's numeric answer multiplied by
 *       the step's `responseScale` (default 1; use 100 for money in cents
 *       or two-decimal values).
 * - A `decide` step may declare `hardFailOptions`: choosing one ends the
 *   attempt at score 0, mirroring the real-world rule the option breaks
 *   (the manifold lab's venting hard-fail, the forklift lab's
 *   unsafe-truck hard-fail). Hard-fail messages must name the governing
 *   rule, exactly like the bespoke labs.
 *
 * Scenario content is authored per course in lib/lms/simulations/*.ts from
 * the course's own lessons; this file carries no course content itself.
 */

export const SCENARIO_SIMULATOR_KEY = 'scenario-sim';

export type ScenarioInspectStep = {
  kind: 'inspect';
  id: string;
  title: string;
  prompt: string;
  objective: string;
  items: Array<{
    id: string;
    label: string;
    observation: string;
    /** True when the observation is a defect/hazard the learner must flag. */
    defect: boolean;
  }>;
  /** Points per correctly judged item (default 3). */
  pointsEach?: number;
};

export type ScenarioDecideStep = {
  kind: 'decide';
  id: string;
  title: string;
  prompt: string;
  objective: string;
  options: string[];
  correct: number;
  /** Option indices that hard-fail the whole attempt at score 0. */
  hardFailOptions?: number[];
  /** Required when hardFailOptions is set: names the rule the choice breaks. */
  hardFailMessage?: string;
  points: number;
};

export type ScenarioCalculateStep = {
  kind: 'calculate';
  id: string;
  title: string;
  prompt: string;
  objective: string;
  /** The correct value, in the step's unit (before responseScale). */
  answer: number;
  unit: string;
  /** Full points within ±tolerancePct of the answer; half points within 2×. */
  tolerancePct: number;
  /** Responses carry round(answer × responseScale). Default 1. */
  responseScale?: number;
  points: number;
  /** Worked solution shown in feedback after scoring. */
  explanation: string;
};

export type ScenarioStep = ScenarioInspectStep | ScenarioDecideStep | ScenarioCalculateStep;

export type ScenarioSimulationConfig = {
  simulator: typeof SCENARIO_SIMULATOR_KEY;
  /** Unique scenario id, e.g. 'welding-weld-booth-lab'. */
  simId: string;
  title: string;
  description: string;
  /** One-line scene framing: where the learner is and what the job is. */
  setting: string;
  /** Short badges shown with the scenario (standard, credential, tooling). */
  badges: string[];
  objectives: string[];
  steps: ScenarioStep[];
  syllabusTopics: Array<{
    topic: string;
    coverage: 'full' | 'applied' | 'embedded' | 'partial';
    note: string;
  }>;
  instructions: string[];
};

/** Number of response ints an attempt for this config must carry. */
export function scenarioResponseCount(config: ScenarioSimulationConfig): number {
  if (!config || !Array.isArray(config.steps)) return 0;
  return config.steps.reduce((sum, step) => {
    if (step.kind === 'inspect') return sum + (Array.isArray(step.items) ? step.items.length : 0);
    return sum + 1;
  }, 0);
}

export type ScenarioScoreCheck = {
  key: string;
  label: string;
  passed: boolean;
  points: number;
  maxPoints: number;
};

export type ScenarioScoreResult = {
  score: number;
  completed: boolean;
  weakObjectives: string[];
  feedback: Record<string, unknown>;
};

function isValidConfig(config: ScenarioSimulationConfig): boolean {
  if (!config || config.simulator !== SCENARIO_SIMULATOR_KEY) return false;
  if (!Array.isArray(config.steps) || config.steps.length === 0) return false;
  const count = scenarioResponseCount(config);
  if (count < 1 || count > 50) return false;
  return config.steps.every((step) => {
    if (step.kind === 'inspect') return Array.isArray(step.items) && step.items.length > 0;
    if (step.kind === 'decide')
      return (
        Array.isArray(step.options) &&
        step.options.length >= 2 &&
        Number.isInteger(step.correct) &&
        step.correct >= 0 &&
        step.correct < step.options.length &&
        (step.hardFailOptions === undefined ||
          (step.hardFailOptions.every(
            (index) => Number.isInteger(index) && index >= 0 && index < step.options.length,
          ) &&
            typeof step.hardFailMessage === 'string' &&
            step.hardFailMessage.length > 0))
      );
    if (step.kind === 'calculate')
      return Number.isFinite(step.answer) && step.tolerancePct > 0 && step.points > 0;
    return false;
  });
}

/**
 * Server-side scorer for a scenario simulation attempt. Recomputes every
 * judgment from the authored config, so the recorded score never trusts
 * the client's arithmetic. Any hard-fail option chosen scores the attempt
 * 0 and not completed, regardless of the other answers.
 */
export function scoreScenarioAttempt(
  config: ScenarioSimulationConfig,
  responses: number[],
  passingScore: number,
): ScenarioScoreResult | null {
  if (!isValidConfig(config)) return null;
  const expected = scenarioResponseCount(config);
  if (!Array.isArray(responses) || responses.length < expected) return null;
  const get = (index: number) => Number(responses[index] ?? 0);

  // ── Hard fails (score 0) ────────────────────────────────────────────────
  let cursor = 0;
  for (const step of config.steps) {
    if (step.kind === 'inspect') {
      cursor += step.items.length;
      continue;
    }
    if (step.kind === 'decide' && step.hardFailOptions?.includes(get(cursor))) {
      return {
        score: 0,
        completed: false,
        weakObjectives: [step.objective],
        feedback: {
          hardFail: step.id,
          message:
            step.hardFailMessage ??
            'That choice breaks a rule this scenario is scored on. This attempt cannot pass.',
          checks: [],
        },
      };
    }
    cursor += 1;
  }

  // ── Scored checks ───────────────────────────────────────────────────────
  const checks: ScenarioScoreCheck[] = [];
  const weakObjectives: string[] = [];
  const miss = (objective: string) => {
    if (!weakObjectives.includes(objective)) weakObjectives.push(objective);
  };
  cursor = 0;
  for (const step of config.steps) {
    if (step.kind === 'inspect') {
      const pointsEach = step.pointsEach ?? 3;
      step.items.forEach((item, index) => {
        const flagged = get(cursor + index) === 1;
        const passed = flagged === item.defect;
        checks.push({
          key: `${step.id}-${item.id}`,
          label: `${item.label}: ${item.defect ? 'defect — act on it' : 'serviceable'}`,
          passed,
          points: passed ? pointsEach : 0,
          maxPoints: pointsEach,
        });
        if (!passed) miss(step.objective);
      });
      cursor += step.items.length;
      continue;
    }
    if (step.kind === 'decide') {
      const passed = get(cursor) === step.correct;
      checks.push({
        key: step.id,
        label: step.title,
        passed,
        points: passed ? step.points : 0,
        maxPoints: step.points,
      });
      if (!passed) miss(step.objective);
      cursor += 1;
      continue;
    }
    // calculate
    const scale = step.responseScale ?? 1;
    const reported = get(cursor) / scale;
    const tolerance = Math.abs(step.answer) * (step.tolerancePct / 100);
    const error = Math.abs(reported - step.answer);
    const points =
      error <= tolerance ? step.points : error <= tolerance * 2 ? Math.floor(step.points / 2) : 0;
    checks.push({
      key: step.id,
      label: `${step.title} (expected ${step.answer} ${step.unit})`,
      passed: points === step.points,
      points,
      maxPoints: step.points,
    });
    if (points < step.points) miss(step.objective);
    cursor += 1;
  }

  const maxPoints = checks.reduce((sum, check) => sum + check.maxPoints, 0);
  const rawPoints = checks.reduce((sum, check) => sum + check.points, 0);
  const score = maxPoints > 0 ? Math.round((rawPoints / maxPoints) * 100) : 0;

  return {
    score,
    completed: score >= passingScore,
    weakObjectives,
    feedback: {
      hardFail: null,
      checks,
      message:
        'Attempt scored against the scenario rules and the course standard. ' +
        'Review any missed step in the linked lesson and run the lab again.',
    },
  };
}
