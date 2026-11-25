/**
 * lib/lms/forklift-simulation.ts
 *
 * Forklift pre-operation inspection + safe load handling simulator — the
 * hands-on machine-work simulation for the Forklift and Manufacturing
 * Operations course, modeled on the manifold gauge lab
 * (lib/lms/manifold-gauge-simulation.ts).
 *
 * The authored configuration lives in a lesson's `content_json.experience`
 * under the `simulation` key. The learner interactions API
 * (apps/lms/app/api/learner/interactions/route.ts) surfaces it as the
 * `${lessonSlug}-simulation` interaction and scores attempts server-side
 * through `scoreForkliftAttempt` below, recording score + completion in
 * `interaction_progress` exactly like a knowledge check.
 *
 * The scenario teaches the OSHA powered-industrial-truck rules that govern
 * the real work: pre-operation inspection and removal of unsafe trucks from
 * service (29 CFR 1910.178(q)(7)), handling only loads within the truck's
 * rated capacity (1910.178(o)(1)), travelling with the load lowered and
 * tilted back (1910.178(n)(7)), and the employer's duty to train, evaluate,
 * and certify operators (1910.178(l)). It is an educational simulation —
 * it does not authorize anyone to operate a real truck.
 */

export const FORKLIFT_SIMULATOR_KEY = 'forklift-inspection-load';

export type ForkliftInspectionItem = {
  id: string;
  area: string;
  /** What the learner observes on the truck during the walk-around. */
  observation: string;
  /** True when the observation is a safety defect that grounds the truck. */
  defect: boolean;
};

export type ForkliftLoadScenario = {
  id: string;
  label: string;
  weightLb: number;
  loadCenterIn: number;
};

export type ForkliftSimulationConfig = {
  simulator: typeof FORKLIFT_SIMULATOR_KEY;
  title: string;
  description: string;
  truck: string;
  dataPlate: {
    ratedCapacityLb: number;
    ratedLoadCenterIn: number;
    note: string;
  };
  inspectionItems: ForkliftInspectionItem[];
  /** Load center (inches) the learner must calculate the capacity for. */
  capacityQuestionLoadCenterIn: number;
  loadScenarios: ForkliftLoadScenario[];
  objectives: {
    inspection: string;
    capacity: string;
    travel: string;
    shutdown: string;
    safety: string;
  };
  /**
   * Topics from the forklift course's own lessons that this scenario
   * evidences, with an honest coverage level for each: `full` (the topic
   * is the exercise), `applied` (worked inside the scenario), `embedded`
   * (required as part of the workflow), or `partial` (only part of the
   * topic is exercised — see the note).
   */
  syllabusTopics: Array<{
    topic: string;
    coverage: 'full' | 'applied' | 'embedded' | 'partial';
    note: string;
  }>;
  instructions: string[];
};

/** Post-inspection decision options, by response index. */
export const FORKLIFT_POST_INSPECTION_DECISIONS = [
  'Remove the truck from service: tag it out and report every defect before anyone uses it',
  'Operate it anyway — the defects look minor',
  'Leave it parked for the next operator to decide whether to use',
] as const;

/** Travel-position options, by response index. */
export const FORKLIFT_TRAVEL_DECISIONS = [
  'Travel with the load lowered (4–6 inches off the floor) and tilted back against the mast',
  'Travel with the load raised high so I can see underneath it',
  'Travel with the load lowered but tilted forward, ready to drop',
] as const;

/** Pedestrian-encounter options, by response index. */
export const FORKLIFT_PEDESTRIAN_DECISIONS = [
  'Stop the truck and wait until the pedestrian is clear before moving',
  'Sound the horn and keep moving slowly past the pedestrian',
  'Steer around the pedestrian and continue the route',
] as const;

/**
 * Response layout for a simulation attempt. The learner interactions API
 * accepts an array of non-negative integers, so every answer is encoded
 * as an int. Inspection items occupy indices 0..(items-1) in config
 * order (1 = "defect — ground the truck", 0 = "serviceable"); the three
 * load decisions follow the same pattern in scenario order
 * (1 = lift it, 0 = do not lift).
 */
export const FORKLIFT_RESPONSE = {
  inspectionStart: 0,
  postInspectionDecision: 10,
  capacityAtQuestionLb: 11,
  loadDecisionStart: 12,
  travelDecision: 15,
  pedestrianDecision: 16,
  shutdownForksLowered: 17,
  shutdownNeutral: 18,
  shutdownBrakeSet: 19,
  shutdownKeyRemoved: 20,
} as const;

export const FORKLIFT_RESPONSE_COUNT = 21;

/**
 * Capacity (lb) of the scenario truck for a load whose center sits
 * `loadCenterIn` inches from the fork face. Follows the load-moment rule
 * taught in the course: the truck's rated moment (capacity × load center)
 * is constant, so capacity falls in proportion as the load center grows,
 * and never exceeds the data-plate rating at or inside the rated center.
 */
export function capacityAtLoadCenter(
  config: ForkliftSimulationConfig,
  loadCenterIn: number,
): number {
  const { ratedCapacityLb, ratedLoadCenterIn } = config.dataPlate;
  if (loadCenterIn <= ratedLoadCenterIn) return ratedCapacityLb;
  return Math.floor((ratedCapacityLb * ratedLoadCenterIn) / loadCenterIn);
}

export type ForkliftScoreCheck = {
  key: string;
  label: string;
  passed: boolean;
  points: number;
  maxPoints: number;
};

export type ForkliftScoreResult = {
  score: number;
  completed: boolean;
  weakObjectives: string[];
  feedback: Record<string, unknown>;
};

function hardFail(
  config: ForkliftSimulationConfig,
  kind: string,
  message: string,
): ForkliftScoreResult {
  return {
    score: 0,
    completed: false,
    weakObjectives: [config.objectives.safety],
    feedback: { hardFail: kind, message },
  };
}

/**
 * Server-side scorer for a forklift simulation attempt. Recomputes the
 * truck's capacity at every load center from the authored data plate, so
 * the recorded score does not trust the client's arithmetic. Three
 * choices hard-fail the attempt at 0, mirroring the real rules: putting a
 * truck with known safety defects into service (1910.178(q)(7)), lifting
 * a load beyond rated capacity (1910.178(o)(1)), and travelling with the
 * load raised (1910.178(n)(7)). Mirrors the manifold gauge scorer's
 * return shape and mastery-threshold completion.
 */
export function scoreForkliftAttempt(
  config: ForkliftSimulationConfig,
  responses: number[],
  passingScore: number,
): ForkliftScoreResult | null {
  if (!config || config.simulator !== FORKLIFT_SIMULATOR_KEY) return null;
  if (!Array.isArray(responses) || responses.length < FORKLIFT_RESPONSE_COUNT) return null;
  if (!Array.isArray(config.inspectionItems) || config.inspectionItems.length !== 10) return null;
  if (!Array.isArray(config.loadScenarios) || config.loadScenarios.length !== 3) return null;

  const get = (index: number) => Number(responses[index] ?? 0);

  // ── Hard fails (score 0) ────────────────────────────────────────────────
  const defects = config.inspectionItems.filter((item) => item.defect);
  const decision = get(FORKLIFT_RESPONSE.postInspectionDecision);
  if (decision !== 0 && defects.length > 0) {
    return hardFail(
      config,
      'unsafe-truck-in-service',
      'The inspection found safety defects (' +
        defects.map((item) => item.area.toLowerCase()).join(', ') +
        '). Under OSHA 29 CFR 1910.178(q)(7), a truck found unsafe must be removed from service ' +
        'until it is restored to safe operating condition — no one may operate it, and it may not ' +
        'be left for the next operator to judge. This attempt cannot pass.',
    );
  }
  for (let i = 0; i < config.loadScenarios.length; i++) {
    const scenario = config.loadScenarios[i];
    const capacity = capacityAtLoadCenter(config, scenario.loadCenterIn);
    if (get(FORKLIFT_RESPONSE.loadDecisionStart + i) === 1 && scenario.weightLb > capacity) {
      return hardFail(
        config,
        'exceeded-capacity',
        `Load ${scenario.id.toUpperCase()} weighs ${scenario.weightLb.toLocaleString()} lb at a ` +
          `${scenario.loadCenterIn}-inch load center, but this truck's capacity there is only ` +
          `${capacity.toLocaleString()} lb. OSHA 29 CFR 1910.178(o)(1) permits handling only loads ` +
          'within the rated capacity of the truck. This attempt cannot pass.',
      );
    }
  }
  if (get(FORKLIFT_RESPONSE.travelDecision) === 1) {
    return hardFail(
      config,
      'travelled-with-raised-load',
      'Travelling with the load raised makes the truck unstable and blinds the operator. ' +
        'OSHA 29 CFR 1910.178(n)(7) requires the load to be tilted back and raised only enough ' +
        'to clear the road surface. This attempt cannot pass.',
    );
  }

  const checks: ForkliftScoreCheck[] = [];
  const addCheck = (key: string, label: string, points: number, maxPoints: number) => {
    checks.push({ key, label, passed: points === maxPoints, points, maxPoints });
  };

  // ── Inspection & tag-out (40) ───────────────────────────────────────────
  config.inspectionItems.forEach((item, index) => {
    const flagged = get(FORKLIFT_RESPONSE.inspectionStart + index) === 1;
    addCheck(
      `inspection-${item.id}`,
      `${item.area}: ${item.defect ? 'defect — ground the truck' : 'serviceable'}`,
      flagged === item.defect ? 3 : 0,
      3,
    );
  });
  addCheck(
    'post-inspection-decision',
    'Removed the truck from service and reported the defects',
    decision === 0 ? 10 : 0,
    10,
  );

  // ── Capacity & load judgment (25) ───────────────────────────────────────
  const expectedCapacity = capacityAtLoadCenter(config, config.capacityQuestionLoadCenterIn);
  const reportedCapacity = get(FORKLIFT_RESPONSE.capacityAtQuestionLb);
  const capacityPoints =
    Math.abs(reportedCapacity - expectedCapacity) <= 100
      ? 10
      : Math.abs(reportedCapacity - expectedCapacity) <= 250
        ? 5
        : 0;
  addCheck(
    'capacity-calculation',
    `Calculated the capacity at a ${config.capacityQuestionLoadCenterIn}-inch load center (${expectedCapacity.toLocaleString()} lb)`,
    capacityPoints,
    10,
  );
  config.loadScenarios.forEach((scenario, index) => {
    const capacity = capacityAtLoadCenter(config, scenario.loadCenterIn);
    const shouldLift = scenario.weightLb <= capacity;
    const lifted = get(FORKLIFT_RESPONSE.loadDecisionStart + index) === 1;
    addCheck(
      `load-${scenario.id}`,
      `Load ${scenario.id.toUpperCase()} (${scenario.weightLb.toLocaleString()} lb at ${scenario.loadCenterIn} in): ${shouldLift ? 'within capacity — lift' : 'over capacity — do not lift'}`,
      lifted === shouldLift ? 5 : 0,
      5,
    );
  });

  // ── Safe travel & pedestrians (20) ──────────────────────────────────────
  addCheck(
    'travel-position',
    'Travels with the load lowered and tilted back',
    get(FORKLIFT_RESPONSE.travelDecision) === 0 ? 10 : 0,
    10,
  );
  addCheck(
    'pedestrian-response',
    'Stops and waits when a pedestrian steps into the aisle',
    get(FORKLIFT_RESPONSE.pedestrianDecision) === 0 ? 10 : 0,
    10,
  );

  // ── Parking & shutdown (15) ─────────────────────────────────────────────
  addCheck('shutdown-forks', 'Lowers the forks fully to the floor', get(FORKLIFT_RESPONSE.shutdownForksLowered) === 1 ? 4 : 0, 4);
  addCheck('shutdown-neutral', 'Places the controls in neutral', get(FORKLIFT_RESPONSE.shutdownNeutral) === 1 ? 4 : 0, 4);
  addCheck('shutdown-brake', 'Sets the parking brake', get(FORKLIFT_RESPONSE.shutdownBrakeSet) === 1 ? 4 : 0, 4);
  addCheck('shutdown-key', 'Turns the truck off and removes the key', get(FORKLIFT_RESPONSE.shutdownKeyRemoved) === 1 ? 3 : 0, 3);

  const score = checks.reduce((sum, check) => sum + check.points, 0);
  const weakObjectives: string[] = [];
  const missed = (keys: string[], objective: string) => {
    if (checks.some((check) => keys.includes(check.key) && !check.passed)) {
      weakObjectives.push(objective);
    }
  };
  missed(
    [...config.inspectionItems.map((item) => `inspection-${item.id}`), 'post-inspection-decision'],
    config.objectives.inspection,
  );
  missed(['capacity-calculation', ...config.loadScenarios.map((s) => `load-${s.id}`)], config.objectives.capacity);
  missed(['travel-position', 'pedestrian-response'], config.objectives.travel);
  missed(['shutdown-forks', 'shutdown-neutral', 'shutdown-brake', 'shutdown-key'], config.objectives.shutdown);

  return {
    score,
    completed: score >= passingScore,
    weakObjectives: [...new Set(weakObjectives)],
    feedback: {
      hardFail: null,
      checks,
      expectedCapacityAtQuestion: expectedCapacity,
      message:
        'Attempt scored against the data plate, the OSHA pre-operation inspection rule, ' +
        'and safe travelling and shutdown practice.',
    },
  };
}

/**
 * The authored simulation for the Forklift and Manufacturing Operations
 * course. The truck, its data plate, and the three planted defects are
 * fictional training material, consistent with the course's own boundary:
 * online practice never replaces employer training, evaluation, and
 * certification under 1910.178(l).
 */
export const FORKLIFT_INSPECTION_LOAD_SIMULATION: ForkliftSimulationConfig = {
  simulator: FORKLIFT_SIMULATOR_KEY,
  title: 'Forklift Lab — Pre-Operation Inspection and Safe Load Handling',
  description:
    'Your shift starts with a walk-around inspection of a sit-down counterbalance forklift. Three of the ten ' +
    'things you check are safety defects. Call every item correctly, make the tag-out decision, then prove you ' +
    'can read the data plate: calculate what this truck may lift at longer load centers and judge three real ' +
    'loads. Finish with safe travel decisions and a full shutdown. One shortcut — running a defective truck, ' +
    'lifting past capacity, or travelling with the load raised — ends the attempt at zero.',
  truck: 'Sit-down counterbalance forklift (fictional training truck)',
  dataPlate: {
    ratedCapacityLb: 5000,
    ratedLoadCenterIn: 24,
    note: 'Data plate: 5,000 lb at a 24-inch load center. Capacity falls as the load center grows — the rated moment (capacity × load center) stays constant.',
  },
  inspectionItems: [
    {
      id: 'forks',
      area: 'Forks',
      observation: 'The left fork blade is cracked near the heel and bent downward.',
      defect: true,
    },
    {
      id: 'mast-chains',
      area: 'Mast chains',
      observation: 'One mast chain link is cracked and the chain hangs unevenly against its pair.',
      defect: true,
    },
    {
      id: 'hydraulics',
      area: 'Hydraulic hoses & lift cylinder',
      observation: 'Hydraulic fluid is weeping from a lift-cylinder hose fitting and dripping onto the floor.',
      defect: true,
    },
    {
      id: 'tires',
      area: 'Tires',
      observation: 'Tires show normal tread wear — no chunking, cuts, or flat spots.',
      defect: false,
    },
    {
      id: 'horn',
      area: 'Horn',
      observation: 'The horn sounds clearly at full volume.',
      defect: false,
    },
    {
      id: 'brakes',
      area: 'Brakes',
      observation: 'The service brake stops the truck smoothly and the parking brake holds it on the grade.',
      defect: false,
    },
    {
      id: 'steering',
      area: 'Steering',
      observation: 'Steering turns lock to lock smoothly with no excessive free play.',
      defect: false,
    },
    {
      id: 'overhead-guard',
      area: 'Overhead guard',
      observation: 'Overhead guard bars are straight, complete, and firmly mounted.',
      defect: false,
    },
    {
      id: 'data-plate',
      area: 'Data plate',
      observation: 'The data plate is legible and matches this truck and its attachment.',
      defect: false,
    },
    {
      id: 'seat-belt',
      area: 'Seat belt',
      observation: 'The seat belt pulls out, retracts, and latches correctly.',
      defect: false,
    },
  ],
  capacityQuestionLoadCenterIn: 30,
  loadScenarios: [
    { id: 'a', label: 'Pallet of boxed parts', weightLb: 3800, loadCenterIn: 24 },
    { id: 'b', label: 'Crated machine, loaded long', weightLb: 4200, loadCenterIn: 30 },
    { id: 'c', label: 'Long pallet of pipe fittings', weightLb: 2900, loadCenterIn: 36 },
  ],
  objectives: {
    inspection:
      'Perform the pre-operation inspection: judge every checklist item from the observed evidence, and remove a truck with safety defects from service and report it (29 CFR 1910.178(q)(7)).',
    capacity:
      'Read the data plate and judge loads by the load-moment rule: capacity at the rated load center, derated in proportion as the load center grows, never exceeding the plate (29 CFR 1910.178(o)(1)).',
    travel:
      'Travel safely with a load — forks 4–6 inches up, load tilted back — and protect pedestrians by stopping and waiting (29 CFR 1910.178(n)).',
    shutdown:
      'Park and shut the truck down completely: forks fully lowered, controls neutral, parking brake set, power off and key removed.',
    safety:
      'Never put an unsafe truck into service, never lift beyond rated capacity, and never travel with the load raised. Under 29 CFR 1910.178 each of these is prohibited, and each ends this lab at zero.',
  },
  syllabusTopics: [
    {
      topic: 'Pre-use observations and workplace hazard decisions',
      coverage: 'full',
      note: 'The core of the lab, attached to the lesson of the same name: the student works a ten-item pre-operation inspection with three planted defects, records a pass/defect judgment per item, and must make the remove-from-service decision the lesson teaches.',
    },
    {
      topic: 'Capacity information, load evidence, and stability decisions',
      coverage: 'full',
      note: 'The data-plate phase is scored quantitatively: the student calculates the derated capacity at a 30-inch load center from the load-moment rule and judges three loads against server-recomputed capacities, including one over-capacity load that hard-fails if lifted.',
    },
    {
      topic: 'Operator boundaries, truck identity, and a safe learning handoff',
      coverage: 'applied',
      note: 'The tag-out decision applies the operator-boundary lesson: the online lab never authorizes operation — the scenario truck is fictional, and the feedback restates that real operation requires the employer training, evaluation, and certification of 1910.178(l).',
    },
    {
      topic: 'Incident decisions, accurate records, and the practical handoff',
      coverage: 'partial',
      note: 'Defect reporting is exercised (the tag-out decision includes reporting every defect), but incident response, timelines, and the practical handoff paperwork from that lesson are not simulated here.',
    },
  ],
  instructions: [
    'Walk the inspection in order and judge each item from what you observe — three items are safety defects.',
    'A defect is not a diagnosis: record the observation, ground the truck, and let maintenance decide the repair.',
    'If anything on the truck is unsafe, it comes out of service. Nobody operates it — including the next operator.',
    'Read the data plate before judging any load: capacity belongs to a load center, and it shrinks as the center grows.',
    'Travel with the load low and tilted back, and stop for pedestrians — the load never rides high.',
    'Shut down completely: forks down, neutral, brake set, key out.',
  ],
};
