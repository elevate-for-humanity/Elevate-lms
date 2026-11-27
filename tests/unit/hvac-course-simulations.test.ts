import { describe, expect, it } from 'vitest';
import workbook from '@/lib/lms/hvac-workbook-content.json';
import { HVAC_PRACTICAL_SOURCE_ALLOCATION } from '@/lib/lms/hvac-practical-plan';
import {
  HVAC_SIMULATION_DEFINITIONS,
  HVAC_SIMULATION_MAX_ACTIONS,
  HVAC_SIMULATION_SOURCE_TOPIC_COVERAGE,
  HvacSimulationActionError,
  applyHvacSimulationAction,
  buildHvacSimulationView,
  getHvacSimulationDefinition,
  replayHvacSimulation,
  type HvacSimulationDefinition,
  type HvacSimulationState,
} from '@/lib/lms/hvac-course-simulations';
import type { HvacSimulationAction } from '@/lib/lms/hvac-simulation-types';

function definition(chapter: number): HvacSimulationDefinition {
  const found = HVAC_SIMULATION_DEFINITIONS.find((item) => item.chapter === chapter);
  if (!found) throw new Error(`Missing chapter ${chapter}`);
  return found;
}

function run(chapter: number, actions: HvacSimulationAction[]) {
  const spec = definition(chapter);
  return buildHvacSimulationView(spec, replayHvacSimulation(spec, actions));
}

function readingValue(chapter: number, id: string, actions: HvacSimulationAction[] = []) {
  return run(chapter, actions).readings.find((reading) => reading.id === id)?.value;
}

function successfulActions(spec: HvacSimulationDefinition): HvacSimulationAction[] {
  return spec.stages.flatMap((stage): HvacSimulationAction[] => [
    ...stage.requirements.map(
      (requirement): HvacSimulationAction => ({
        type: 'set-control',
        controlId: requirement.controlId,
        value: requirement.value,
      }),
    ),
    { type: 'observe' },
    {
      type: 'choose',
      stageId: stage.id,
      optionId: stage.options.find((option) => option.correct)!.id,
    },
  ]);
}

describe('the full canonical HVAC course simulation catalog', () => {
  it('covers every instructional chapter once without assigning a replacement course or an exam', () => {
    const expectedIds = workbook.chapters.map((chapter) => chapter.lesson_id).sort();
    expect(HVAC_SIMULATION_DEFINITIONS.map((item) => item.lessonId).sort()).toEqual(expectedIds);
    expect(HVAC_SIMULATION_DEFINITIONS).toHaveLength(17);
    expect(new Set(HVAC_SIMULATION_DEFINITIONS.map((item) => item.id)).size).toBe(17);
    expect(getHvacSimulationDefinition('e47bab32-5d13-5d53-b525-135c6ecd4d48')).toBeUndefined();
    expect(getHvacSimulationDefinition('unrelated-lesson')).toBeUndefined();
    for (const spec of HVAC_SIMULATION_DEFINITIONS) {
      expect(spec.id).toBe(`hvac-sim:chapter-${String(spec.chapter).padStart(2, '0')}:v1`);
      expect(spec.stages.length).toBeGreaterThanOrEqual(3);
      expect(spec.controls.length).toBeGreaterThanOrEqual(2);
      expect(spec.sources.length).toBeGreaterThan(0);
      expect(spec.sources.every((source) => source.url.startsWith('https://'))).toBe(true);
    }
  });

  it.each(HVAC_SIMULATION_DEFINITIONS.map((spec) => [spec.chapter, spec.title, spec] as const))(
    'chapter %s (%s) supports a complete observable practice path and exact replay',
    (_chapter, _title, spec) => {
      const actions = successfulActions(spec);
      let incremental = replayHvacSimulation(spec, []);
      for (const action of actions)
        incremental = applyHvacSimulationAction(spec, incremental, action);
      const replayed = replayHvacSimulation(spec, actions);
      expect(replayed).toEqual(incremental);
      const view = buildHvacSimulationView(spec, replayed);
      expect(view.finished).toBe(true);
      expect(view.passed).toBe(true);
      expect(view.score).toBe(100);
      expect(view.stage).toBeNull();
      expect(actions.length).toBeLessThan(HVAC_SIMULATION_MAX_ACTIONS);
      expect('hours' in view).toBe(false);
      expect('credentialIssued' in view).toBe(false);
    },
  );

  it('explicitly maps every source-photo topic to working stages or its separate external provider', () => {
    expect(Object.keys(HVAC_SIMULATION_SOURCE_TOPIC_COVERAGE).sort()).toEqual(
      HVAC_PRACTICAL_SOURCE_ALLOCATION.map((item) => item.topic).sort(),
    );
    expect(HVAC_SIMULATION_SOURCE_TOPIC_COVERAGE.interplay_online).toMatchObject({
      delivery: 'external_provider',
      stages: [],
    });
    for (const [topic, coverage] of Object.entries(HVAC_SIMULATION_SOURCE_TOPIC_COVERAGE)) {
      if (topic === 'interplay_online') continue;
      expect(coverage.delivery).toBe('native_simulation');
      expect(coverage.stages.length, topic).toBeGreaterThan(0);
      for (const reference of coverage.stages) {
        expect(
          definition(reference.chapter).stages.some((stage) => stage.id === reference.stageId),
          `${topic}: chapter ${reference.chapter}, ${reference.stageId}`,
        ).toBe(true);
      }
    }
    expect(
      HVAC_SIMULATION_SOURCE_TOPIC_COVERAGE.pump_down.stages.map((stage) => stage.stageId),
    ).toEqual([
      'pump-down-scope',
      'pump-down-suitability',
      'pump-down-alternative',
      'pump-down-containment',
    ]);
    expect(
      HVAC_SIMULATION_SOURCE_TOPIC_COVERAGE.brazing.stages.map((stage) => stage.stageId),
    ).toEqual([
      'joint-preparation',
      'brazing-process',
      'joint-inspection',
      'joint-verification',
      'handoff',
    ]);
    expect(HVAC_SIMULATION_DEFINITIONS.reduce((total, spec) => total + spec.stages.length, 0)).toBe(
      64,
    );
  });

  it('changes a domain observation in every chapter when its relevant control changes', () => {
    const cases: Array<[number, string, string | number]> = [
      [1, 'appointment', 'confirmed'],
      [2, 'component', 'evaporator'],
      [3, 'switch', 'closed'],
      [4, 'vent', 'clear'],
      [5, 'suctionLine', 60],
      [6, 'refrigerant', 'r410a'],
      [7, 'grossMass', 24],
      [8, 'charge', 6],
      [9, 'elapsed', 10],
      [10, 'internalPressure', 18],
      [11, 'appliance', 'high'],
      [12, 'tool', 'detector'],
      [13, 'restriction', 0],
      [14, 'filter', 'clear'],
      [15, 'ladder', 'inspected'],
      [16, 'scene', 'safe'],
      [17, 'diagnosis', 'supported'],
    ];
    for (const [chapter, controlId, value] of cases) {
      expect(
        run(chapter, [{ type: 'set-control', controlId, value }]).readings,
        `chapter ${chapter}`,
      ).not.toEqual(run(chapter, []).readings);
    }
  });

  it('strips answer keys, future stages and grading requirements from transport views', () => {
    for (const spec of HVAC_SIMULATION_DEFINITIONS) {
      const view = buildHvacSimulationView(spec, replayHvacSimulation(spec, []));
      expect(
        view.stage?.options.every((option) => Object.keys(option).sort().join(',') === 'id,label'),
      ).toBe(true);
      expect(view).not.toHaveProperty('stages');
      expect(view.stage).not.toHaveProperty('requirements');
      expect(JSON.stringify(view)).not.toContain('"correct":');
      expect(view.score).toBeNull();
      expect(view.passed).toBe(false);
    }
  });
});

describe('HVAC modeled instrument behavior', () => {
  it('models an open path, Ohm law, resistance change and opposing-conductor cancellation', () => {
    expect(readingValue(3, 'actual-current')).toBe(0);
    const closed: HvacSimulationAction[] = [
      { type: 'set-control', controlId: 'switch', value: 'closed' },
    ];
    expect(readingValue(3, 'actual-current', closed)).toBe(2);
    expect(readingValue(3, 'meter', closed)).toBe(2);
    const higherResistance: HvacSimulationAction[] = [
      ...closed,
      { type: 'set-control', controlId: 'resistance', value: 24 },
    ];
    expect(readingValue(3, 'actual-current', higherResistance)).toBe(1);
    const cancelled: HvacSimulationAction[] = [
      ...higherResistance,
      { type: 'set-control', controlId: 'clamp', value: 'both' },
    ];
    expect(readingValue(3, 'actual-current', cancelled)).toBe(1);
    expect(readingValue(3, 'meter', cancelled)).toBe(0);
    expect(
      readingValue(3, 'meter', [
        ...closed,
        { type: 'set-control', controlId: 'meter', value: 'resistance' },
      ]),
    ).toBe('Unsafe mode for energized case');
  });

  it('uses the existing difference functions for superheat and subcooling', () => {
    expect(readingValue(5, 'superheat')).toBe(15);
    expect(readingValue(5, 'subcooling')).toBe(10);
    expect(
      readingValue(5, 'superheat', [{ type: 'set-control', controlId: 'suctionLine', value: 60 }]),
    ).toBe(20);
    expect(
      readingValue(5, 'subcooling', [{ type: 'set-control', controlId: 'liquidLine', value: 100 }]),
    ).toBe(5);
  });

  it('flags negative temperature differences for phase/reference verification instead of accepting them as valid targets', () => {
    const view = run(5, [
      { type: 'set-control', controlId: 'suctionLine', value: 30 },
      { type: 'set-control', controlId: 'liquidLine', value: 110 },
    ]);
    expect(view.readings.find((reading) => reading.id === 'superheat')).toMatchObject({
      value: -10,
      status: 'warning',
    });
    expect(view.readings.find((reading) => reading.id === 'subcooling')).toMatchObject({
      value: -5,
      status: 'warning',
    });
    expect(view.readings.find((reading) => reading.id === 'phase-check')).toMatchObject({
      status: 'warning',
      value: expect.stringContaining('verify phase'),
    });
    expect(run(5, []).readings.find((reading) => reading.id === 'phase-check')?.status).toBe(
      'neutral',
    );
  });

  it('requires all modeled furnace inputs instead of allowing heat demand to bypass safeties', () => {
    expect(readingValue(4, 'sequence')).toBe('Stopped: airflow not proven');
    const clear: HvacSimulationAction[] = [
      { type: 'set-control', controlId: 'vent', value: 'clear' },
    ];
    expect(readingValue(4, 'sequence', clear)).toBe('Stopped: flame not proven');
    expect(
      readingValue(4, 'sequence', [
        ...clear,
        { type: 'set-control', controlId: 'flame', value: 'proven' },
      ]),
    ).toBe('Heating permitted by modeled inputs');
    expect(
      readingValue(4, 'sequence', [{ type: 'set-control', controlId: 'request', value: 'off' }]),
    ).toBe('Idle');
  });

  it('calculates cylinder headroom from the supplied fictional limit, including over-limit status', () => {
    expect(readingValue(7, 'headroom')).toBe(0);
    expect(readingValue(7, 'material-mass')).toBe(20);
    expect(
      readingValue(7, 'headroom', [{ type: 'set-control', controlId: 'grossMass', value: 24 }]),
    ).toBe(8);
    const over = run(7, [{ type: 'set-control', controlId: 'grossMass', value: 36 }]);
    expect(over.readings.find((reading) => reading.id === 'headroom')).toMatchObject({
      value: -4,
      status: 'danger',
    });
  });

  it('does not classify an appliance by charge quantity alone', () => {
    expect(readingValue(8, 'category')).toBe('Facts fit the case definition');
    expect(
      readingValue(8, 'category', [{ type: 'set-control', controlId: 'assembly', value: 'field' }]),
    ).toBe('Facts do not establish this category');
    expect(
      readingValue(8, 'category', [{ type: 'set-control', controlId: 'charge', value: 6 }]),
    ).toBe('Facts do not establish this category');
  });

  it('distinguishes pressure loss, isolated vacuum rise and pump-on readings', () => {
    expect(readingValue(9, 'current')).toBe(139);
    const vacuum: HvacSimulationAction[] = [
      { type: 'set-control', controlId: 'measurement', value: 'vacuum' },
    ];
    expect(readingValue(9, 'current', vacuum)).toBe(1400);
    expect(
      readingValue(9, 'current', [
        ...vacuum,
        { type: 'set-control', controlId: 'specimen', value: 'sealed' },
      ]),
    ).toBe(410);
    expect(
      readingValue(9, 'current', [
        ...vacuum,
        { type: 'set-control', controlId: 'pump', value: 'running' },
      ]),
    ).toBe(260);
    expect(
      readingValue(9, 'pump', [
        ...vacuum,
        { type: 'set-control', controlId: 'pump', value: 'running' },
      ]),
    ).toContain('not an isolated test');
  });

  it('exposes actual adjacent time samples for pressure and vacuum comparisons', () => {
    expect(readingValue(9, 'previous')).toBe(141.2);
    expect(readingValue(9, 'current')).toBe(139);
    expect(readingValue(9, 'sample-change')).toBe(-2.2);
    const vacuum: HvacSimulationAction[] = [
      { type: 'set-control', controlId: 'measurement', value: 'vacuum' },
    ];
    expect(readingValue(9, 'previous', vacuum)).toBe(1200);
    expect(readingValue(9, 'current', vacuum)).toBe(1400);
    expect(readingValue(9, 'sample-change', vacuum)).toBe(200);
    const outgassing: HvacSimulationAction[] = [
      ...vacuum,
      { type: 'set-control', controlId: 'specimen', value: 'moisture' },
      { type: 'set-control', controlId: 'elapsed', value: 10 },
    ];
    expect(readingValue(9, 'previous', outgassing)).toBe(449.4);
    expect(readingValue(9, 'current', outgassing)).toBe(449.7);
    expect(readingValue(9, 'sample-change', outgassing)).toBe(0.3);
    const initial: HvacSimulationAction[] = [
      ...vacuum,
      { type: 'set-control', controlId: 'elapsed', value: 0 },
    ];
    expect(readingValue(9, 'previous', initial)).toBe(400);
    expect(readingValue(9, 'sample-change', initial)).toBe(0);
  });

  it('distinguishes pump-down planning from recovery and holds unverified containment', () => {
    expect(readingValue(9, 'handling-method')).toContain('manufacturer-designated');
    expect(
      run(9, []).readings.find((reading) => reading.id === 'pump-down-eligibility')?.status,
    ).toBe('danger');
    const suitability: HvacSimulationAction[] = [
      { type: 'set-control', controlId: 'pumpDownSuitability', value: 'verified' },
    ];
    const view = run(9, suitability);
    expect(view.readings.find((reading) => reading.id === 'pump-down-eligibility')?.status).toBe(
      'normal',
    );
    expect(view.readings.find((reading) => reading.id === 'containment')).toMatchObject({
      status: 'danger',
      value: expect.stringContaining('opening refrigerant piping is not authorized'),
    });
    expect(
      readingValue(9, 'handling-method', [
        { type: 'set-control', controlId: 'handlingPlan', value: 'external-recovery' },
      ]),
    ).toContain('suitable recovery container');
    expect(
      readingValue(9, 'containment', [
        ...suitability,
        { type: 'set-control', controlId: 'containment', value: 'verified' },
      ]),
    ).toContain('physical work still needs qualified verification');
  });

  it('requires both a pressure difference and a flow path for modeled air ingress', () => {
    expect(readingValue(10, 'flow')).toBe('Air moves inward');
    expect(
      readingValue(10, 'flow', [{ type: 'set-control', controlId: 'seal', value: 'sealed' }]),
    ).toBe('No flow path');
    expect(
      readingValue(10, 'flow', [{ type: 'set-control', controlId: 'internalPressure', value: 18 }]),
    ).toBe('Contents tend outward');
  });

  it('uses instrument location to distinguish background from a localized detector indication', () => {
    const detector: HvacSimulationAction[] = [
      { type: 'set-control', controlId: 'case', value: 'leak' },
      { type: 'set-control', controlId: 'tool', value: 'detector' },
    ];
    expect(readingValue(12, 'indicator', detector)).toBe('No indication in selected location');
    expect(
      readingValue(12, 'indicator', [
        ...detector,
        { type: 'set-control', controlId: 'detectorLocation', value: 'fitting' },
      ]),
    ).toBe('Localized indication');
  });

  it('shows airflow improving when the modeled restriction is removed without changing blower input', () => {
    expect(readingValue(13, 'airflow')).toBe(32);
    expect(
      readingValue(13, 'airflow', [{ type: 'set-control', controlId: 'restriction', value: 0 }]),
    ).toBe(80);
    expect(
      readingValue(13, 'airflow', [{ type: 'set-control', controlId: 'restriction', value: 50 }]),
    ).toBe(40);
    expect(
      readingValue(13, 'airflow', [{ type: 'set-control', controlId: 'restriction', value: 100 }]),
    ).toBe(0);
    expect(readingValue(14, 'capacity')).toBe(50);
    expect(
      readingValue(14, 'capacity', [{ type: 'set-control', controlId: 'filter', value: 'clear' }]),
    ).toBe(100);
  });

  it('requires brazing preparation, process controls and both inspection and leak verification for virtual handoff', () => {
    const processOnly: HvacSimulationAction[] = [
      { type: 'set-control', controlId: 'processPlan', value: 'verified' },
    ];
    expect(
      run(13, processOnly).readings.find((reading) => reading.id === 'brazing-process')?.status,
    ).toBe('danger');
    const prepared: HvacSimulationAction[] = [
      ...processOnly,
      { type: 'set-control', controlId: 'hotwork', value: 'protected' },
      { type: 'set-control', controlId: 'preparation', value: 'ready' },
      { type: 'set-control', controlId: 'jointPreparation', value: 'ready' },
    ];
    expect(
      run(13, prepared).readings.find((reading) => reading.id === 'brazing-process')?.status,
    ).toBe('normal');
    expect(
      run(13, [
        ...prepared,
        { type: 'set-control', controlId: 'jointInspection', value: 'defect' },
      ]).readings.find((reading) => reading.id === 'joint-inspection')?.status,
    ).toBe('danger');
    const visuallyAcceptable: HvacSimulationAction[] = [
      ...prepared,
      { type: 'set-control', controlId: 'jointInspection', value: 'acceptable' },
      { type: 'set-control', controlId: 'leakVerification', value: 'failed' },
    ];
    const failedVerification = run(13, visuallyAcceptable);
    expect(
      failedVerification.readings.find((reading) => reading.id === 'leak-verification')?.status,
    ).toBe('danger');
    expect(failedVerification.readings.find((reading) => reading.id === 'handoff')?.status).toBe(
      'warning',
    );
    const verified = run(13, [
      ...visuallyAcceptable,
      { type: 'set-control', controlId: 'leakVerification', value: 'passed' },
    ]);
    expect(verified.readings.find((reading) => reading.id === 'handoff')).toMatchObject({
      status: 'normal',
      value: expect.stringContaining('physical signoff remains separate'),
    });
    expect(verified.finished).toBe(false);
    expect(verified).not.toHaveProperty('physicalSignoff');
  });
});

describe('server-owned HVAC progression and grading', () => {
  it('will not advance without observation or with stale observations after changing a control', () => {
    const spec = definition(3);
    const decision: HvacSimulationAction = { type: 'choose', stageId: 'open', optionId: 'b' };
    const untouched = replayHvacSimulation(spec, []);
    const noObservation = applyHvacSimulationAction(spec, untouched, decision);
    expect(noObservation.stageIndex).toBe(0);
    expect(noObservation.feedback?.kind).toBe('retry');
    const stale = replayHvacSimulation(spec, [
      { type: 'observe' },
      { type: 'set-control', controlId: 'resistance', value: 24 },
      decision,
    ]);
    expect(stale.stageIndex).toBe(0);
    expect(stale.feedback?.message).toContain('Run the virtual check');
    expect(untouched.actionsProcessed).toBe(0);
    expect(untouched.controls.resistance).toBe(12);
  });

  it('rejects a memorized correct answer when the requested comparison is not configured', () => {
    const spec = definition(3);
    const state = replayHvacSimulation(spec, [
      { type: 'set-control', controlId: 'switch', value: 'closed' },
      { type: 'observe' },
      { type: 'choose', stageId: 'open', optionId: 'b' },
    ]);
    expect(state.stageIndex).toBe(0);
    expect(state.feedback?.message).toContain('Virtual switch');
    expect(state.feedback?.kind).toBe('retry');
  });

  it('stops an unsafe choice at the current stage with corrective feedback', () => {
    const spec = definition(4);
    const state = replayHvacSimulation(spec, [
      { type: 'observe' },
      { type: 'choose', stageId: 'airflow', optionId: 'a' },
    ]);
    expect(state.stageIndex).toBe(0);
    expect(state.mistakes).toBe(1);
    expect(state.feedback?.kind).toBe('safety');
    expect(buildHvacSimulationView(spec, state).passed).toBe(false);
  });

  it.each([
    [9, 'pump-down-suitability', 'b'],
    [9, 'pump-down-containment', 'b'],
    [13, 'brazing-process', 'a'],
    [13, 'joint-verification', 'b'],
  ] as const)(
    'holds chapter %s stage %s when a dangerous alternative is selected',
    (chapter, stageId, optionId) => {
      const spec = definition(chapter);
      const stageIndex = spec.stages.findIndex((stage) => stage.id === stageId);
      const current = spec.stages[stageIndex];
      const prior = successfulActions({ ...spec, stages: spec.stages.slice(0, stageIndex) });
      const actions: HvacSimulationAction[] = [
        ...prior,
        ...current.requirements.map(
          (requirement): HvacSimulationAction => ({
            type: 'set-control',
            controlId: requirement.controlId,
            value: requirement.value,
          }),
        ),
        { type: 'observe' },
        { type: 'choose', stageId, optionId },
      ];
      const state = replayHvacSimulation(spec, actions);
      expect(state.stageIndex).toBe(stageIndex);
      expect(state.mistakes).toBe(1);
      expect(state.feedback?.kind).toBe('safety');
      expect(buildHvacSimulationView(spec, state).finished).toBe(false);
    },
  );

  it('grades corrected attempts and distinguishes finishing from mastery', () => {
    const spec = definition(1);
    const wrong: HvacSimulationAction[] = [
      { type: 'observe' },
      { type: 'choose', stageId: 'evidence', optionId: 'a' },
      { type: 'choose', stageId: 'evidence', optionId: 'a' },
    ];
    const eighty = buildHvacSimulationView(
      spec,
      replayHvacSimulation(spec, [...wrong, ...successfulActions(spec)]),
    );
    expect(eighty).toMatchObject({ finished: true, passed: true, score: 80 });
    const seventy = buildHvacSimulationView(
      spec,
      replayHvacSimulation(spec, [
        ...wrong,
        { type: 'choose', stageId: 'evidence', optionId: 'a' },
        ...successfulActions(spec),
      ]),
    );
    expect(seventy).toMatchObject({ finished: true, passed: false, score: 70 });
  });

  it.each([
    { type: 'set-control', controlId: 'not-a-control', value: 24 },
    { type: 'set-control', controlId: '__proto__', value: 24 },
    { type: 'set-control', controlId: 'voltage', value: Number.NaN },
    { type: 'set-control', controlId: 'voltage', value: Number.POSITIVE_INFINITY },
    { type: 'set-control', controlId: 'voltage', value: 240 },
    { type: 'set-control', controlId: 'voltage', value: 13 },
    { type: 'set-control', controlId: 'voltage', value: '24' },
    { type: 'set-control', controlId: 'switch', value: 'bypassed' },
    { type: 'choose', stageId: 'clamp', optionId: 'b' },
    { type: 'choose', stageId: 'open', optionId: 'invented' },
    { type: 'observe', score: 100, completed: true },
    { type: 'complete', score: 100 },
  ])('rejects malformed, arbitrary or out-of-order action %j', (input) => {
    expect(() => replayHvacSimulation(definition(3), [input as HvacSimulationAction])).toThrow(
      HvacSimulationActionError,
    );
  });

  it('enforces bounded histories and rejects actions after finishing', () => {
    const spec = definition(1);
    expect(() =>
      replayHvacSimulation(
        spec,
        Array.from({ length: HVAC_SIMULATION_MAX_ACTIONS + 1 }, () => ({
          type: 'observe' as const,
        })),
      ),
    ).toThrow(/history/);
    const atLimit = replayHvacSimulation(
      spec,
      Array.from({ length: HVAC_SIMULATION_MAX_ACTIONS }, () => ({ type: 'observe' as const })),
    );
    expect(() => applyHvacSimulationAction(spec, atLimit, { type: 'observe' })).toThrow(
      /action limit/,
    );
    const finished = replayHvacSimulation(spec, successfulActions(spec));
    expect(() => applyHvacSimulationAction(spec, finished, { type: 'observe' })).toThrow(
      /finished/,
    );
  });

  it('returns detached public objects so display edits cannot modify the grading catalog or state', () => {
    const spec = definition(3);
    const initial: HvacSimulationState = replayHvacSimulation(spec, []);
    const view = buildHvacSimulationView(spec, initial);
    view.controls[0].value = 9000;
    view.controls
      .find((control) => control.options)
      ?.options?.push({ value: 'injected', label: 'Injected' });
    view.stage?.options.splice(0, 1);
    view.sources[0].label = 'Changed';
    const fresh = buildHvacSimulationView(spec, initial);
    expect(fresh.controls[0].value).toBe(24);
    expect(
      fresh.controls.some((control) =>
        control.options?.some((option) => option.value === 'injected'),
      ),
    ).toBe(false);
    expect(fresh.stage?.options).toHaveLength(3);
    expect(fresh.sources[0].label).not.toBe('Changed');
  });
});
