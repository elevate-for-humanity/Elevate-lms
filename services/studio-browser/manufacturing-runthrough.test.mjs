import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { getByTestId } from './cdp-dom.mjs';
import { canonicalHash, completeStagedLesson } from './learner-runthrough.mjs';
import { solvePublicManufacturingSimulation, runStagedManufacturingWorkflow } from './manufacturing-runthrough.mjs';

// Exact saved public problem statements. There are no protected answers or keys
// in this fixture; gradingKeyId is only the immutable public reference.
const cases = JSON.parse(fs.readFileSync(new URL('./fixtures/manufacturing-public-cases.json', import.meta.url), 'utf8'));
const clone = (value) => structuredClone(value);
const byId = (id) => clone(cases.find((spec) => spec.id === id));

for (const spec of cases) test(`public reference solver covers every ${spec.id} task without changing the problem`, () => {
  const before = canonicalHash(spec);
  const answer = solvePublicManufacturingSimulation(spec);
  assert.deepEqual(Object.keys(answer), spec.tasks.map((task) => task.id));
  for (const task of spec.tasks) {
    if (task.type === 'number') assert.ok(Number.isFinite(answer[task.id]));
    else if (task.type === 'choice') assert.ok(task.options.some((option) => option.value === answer[task.id]));
    else assert.deepEqual([...answer[task.id]].sort(), task.options.map((option) => option.value).sort());
  }
  assert.equal(canonicalHash(spec), before);
});

test('the public cases contain all 69 tasks and exercise quantities, uncertainty boundaries, zero and sequencing', () => {
  assert.equal(cases.reduce((total, spec) => total + spec.tasks.length, 0), 69);
  // Every initial route still has unresolved evidence. Keep the movement held
  // before preparing its administrative record or requesting reassessment.
  const route = solvePublicManufacturingSimulation(byId('forklift-hazard-route-v1'));
  assert.deepEqual(route['route-record-sequence'], ['hold', 'record', 'request', 'reassess']);
  const kit = solvePublicManufacturingSimulation(byId('SIM-MFG-01'));
  assert.deepEqual([kit.kit_limit, kit.cap_shortage, kit.pin_use, kit.pin_remaining, kit.review_ready, kit.unproduced_balance], [23, 1, 46, 3, 22, 1]);
  const assembly = solvePublicManufacturingSimulation(byId('SIM-MFG-02'));
  assert.deepEqual(assembly.approved_sequence, ['order', 'kit', 'base', 'pins', 'verify_pins', 'cap', 'review']);
  assert.equal(assembly.pin_quantity, 24);
  const measurement = solvePublicManufacturingSimulation(byId('SIM-MFG-03'));
  assert.deepEqual(Array.from({ length: 8 }, (_, index) => measurement[`classify_m${index + 1}`]),
    ['nonconforming', 'hold', 'conforming', 'conforming', 'conforming', 'hold', 'hold', 'nonconforming']);
  const defects = solvePublicManufacturingSimulation(byId('SIM-MFG-04'));
  assert.deepEqual([defects.nonconforming_units, defects.defect_occurrences, defects.classify_v7], [4, 5, 'review']);
  const sampling = solvePublicManufacturingSimulation(byId('SIM-MFG-05'));
  assert.equal(sampling.lot_a_count, 1); // Two defects on one unit are one nonconforming unit.
  const trace = solvePublicManufacturingSimulation(byId('SIM-MFG-06'));
  assert.deepEqual([trace.associated_count, trace.uncertain_count, trace.initial_review_count, trace.eligible_review, trace.already_released, trace.reconciliation], [4, 2, 6, 4, 0, 10]);
});

test('numeric answers are recalculated from the displayed values rather than saved answers', () => {
  const assembly = byId('SIM-MFG-02');
  assembly.exhibits[1].rows.find((row) => row.id === 'Q1').condition = 'Practice order contains 15 units; each requires 3 pins.';
  assert.equal(solvePublicManufacturingSimulation(assembly).pin_quantity, 45);
  const kit = byId('SIM-MFG-01');
  kit.exhibits[1].rows.find((row) => row.component.startsWith('Pin ')).usable = 51;
  assert.equal(solvePublicManufacturingSimulation(kit).pin_remaining, 5);
  const measurement = byId('SIM-MFG-03');
  measurement.exhibits[1].rows.find((row) => row.id === 'M4').readingMm = 100.18;
  assert.equal(solvePublicManufacturingSimulation(measurement).classify_m4, 'hold');
  const defects = byId('SIM-MFG-04');
  defects.exhibits[1].rows.find((row) => row.id === 'V3').evidence = 'All required evidence complete; Zone-A superficial mark 3.0 mm; no other condition.';
  assert.deepEqual([solvePublicManufacturingSimulation(defects).nonconforming_units, solvePublicManufacturingSimulation(defects).defect_occurrences], [3, 4]);
});

test('unsupported problems, tasks, missing references and private grading fields fail closed', () => {
  const unsupported = byId('SIM-MFG-02');
  unsupported.id = 'unreviewed-new-case';
  assert.throws(() => solvePublicManufacturingSimulation(unsupported), /unsupported public case/);
  const task = byId('SIM-MFG-02');
  task.tasks[0].id = 'unreviewed-task';
  assert.throws(() => solvePublicManufacturingSimulation(task), /unsupported task/);
  const reference = byId('SIM-MFG-02');
  reference.exhibits = [];
  assert.throws(() => solvePublicManufacturingSimulation(reference), /missing/);
  for (const field of ['expected', 'rationale', 'answerIndex', 'correctAnswer', 'gradingKey']) {
    const privateProblem = byId('SIM-MFG-02');
    privateProblem.tasks[0][field] = 'must never be read';
    assert.throws(() => solvePublicManufacturingSimulation(privateProblem), /private grading data/);
  }
});

/**
 * Real CdpLocator query, field, click and fill operations against a DOM fixture.
 * The HTTP boundary is isolated; it never calls live services or learner tables.
 * React and deterministic server grading are covered by the sibling UI/API suites.
 */
function workflowHarness(t, options = {}) {
  const spec = byId('SIM-MFG-02');
  const correct = {
    approved_sequence: ['order', 'kit', 'base', 'pins', 'verify_pins', 'cap', 'review'],
    skipped_check: 'hold', wrong_revision: 'resolve', pin_quantity: 24, fixture_change: 'submit',
  };
  const events = [];
  const progress = {};
  const input = { lessonBuildId: 'lesson-build', artifactHash: 'artifact-hash' };
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const { document } = dom.window;
  const hit = { element: undefined };
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  dom.window.HTMLElement.prototype.getBoundingClientRect = function () {
    hit.element = this;
    return { x: 0, y: 0, top: 0, left: 0, right: 500, bottom: 100,
      width: this.closest('[hidden]') ? 0 : 500, height: this.closest('[hidden]') ? 0 : 100 };
  };
  document.elementFromPoint = () => hit.element;
  let responses = {};
  function element(tag, text, attributes = {}) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    return node;
  }
  function render() {
    document.body.replaceChildren();
    const hidden = element('div', '', { 'data-testid': 'staged-lesson', hidden: '' });
    hidden.append(element('section', 'Hidden streamed copy', { 'data-testid': 'manufacturing-simulation' }));
    document.body.append(hidden);
    const root = element('div', '', { 'data-testid': 'staged-lesson' });
    document.body.append(root);
    const section = element('section', '', { 'data-testid': 'manufacturing-simulation' });
    root.append(section);
    section.append(element('h2', spec.title), element('p', spec.brief));
    for (const exhibit of spec.exhibits) {
      const region = element('div', '', { role: 'region', 'aria-label': exhibit.title });
      region.textContent = [...exhibit.columns.map((column) => column.label),
        ...exhibit.rows.flatMap((row) => exhibit.columns.map((column) => row[column.key]))].join(' ');
      if (options.missingReference && exhibit === spec.exhibits[0]) region.textContent = 'Reference missing';
      section.append(region);
    }
    const form = element('form');
    section.append(form);
    for (const task of spec.tasks) {
      const field = element('fieldset', '', { 'data-simulation-task': task.id });
      field.append(element('legend', task.prompt));
      form.append(field);
      if (task.type === 'choice') {
        for (const option of task.options) {
          const label = element('label');
          const radio = element('input', '', { type: 'radio', name: task.id, value: option.value });
          radio.checked = responses[task.id] === option.value;
          radio.addEventListener('change', () => { responses[task.id] = radio.value; events.push(`choice:${task.id}`); });
          label.append(radio, element('span', option.label));
          field.append(label);
        }
      } else if (task.type === 'number') {
        const input = element('input', '', { type: 'number', 'aria-label': task.prompt });
        input.value = responses[task.id] === undefined ? '' : String(responses[task.id]);
        input.addEventListener('input', () => { responses[task.id] = Number(input.value); events.push(`number:${task.id}`); });
        field.append(input);
      } else {
        let order = [...(responses[task.id] ?? task.options.map((option) => option.value))];
        const list = element('ol');
        field.append(list);
        const draw = () => {
          list.replaceChildren();
          for (const [position, value] of order.entries()) {
            const item = element('li');
            item.append(element('span', String(position + 1)), element('span', task.options.find((option) => option.value === value).label));
            for (const [direction, delta] of [['up', -1], ['down', 1]]) {
              const arrow = element('button', direction, { type: 'button', 'aria-label': `Move step ${position + 1} ${direction}` });
              arrow.disabled = position + delta < 0 || position + delta >= order.length;
              arrow.addEventListener('click', () => {
                [order[position], order[position + delta]] = [order[position + delta], order[position]];
                responses[task.id] = [...order];
                events.push(`sequence-move:${task.id}`);
                draw();
              });
              item.append(arrow);
            }
            list.append(item);
          }
        };
        draw();
        const confirm = element('button', 'Confirm this sequence', { type: 'button' });
        confirm.addEventListener('click', () => { responses[task.id] = [...order]; events.push(`sequence-confirm:${task.id}`); });
        field.append(confirm);
      }
    }
    form.append(element('button', 'Check and save practice', { type: 'submit' }));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      assert.deepEqual(Object.keys(responses).sort(), spec.tasks.map((task) => task.id).sort());
      const tasks = spec.tasks.map((task) => ({ taskId: task.id, critical: task.critical === true,
        correct: JSON.stringify(responses[task.id]) === JSON.stringify(correct[task.id]) }));
      const criticalMisses = tasks.filter((task) => task.critical && !task.correct).length;
      const correctCount = tasks.filter((task) => task.correct).length;
      const score = Math.round(correctCount / tasks.length * 100);
      progress.manufacturingSimulation = {
        ...input, simulationId: spec.id, gradingKeyId: spec.gradingKeyId,
        answers: clone(responses), attempts: (progress.manufacturingSimulation?.attempts ?? 0) + 1,
        score, completed: score >= spec.masteryThreshold && criticalMisses === 0,
        feedback: { criticalMisses, correctCount, taskCount: tasks.length, tasks },
      };
      if (options.privateFeedback) progress.manufacturingSimulation.feedback.tasks[0].expected = 'forbidden';
      if (options.wrongScope && progress.manufacturingSimulation.completed)
        progress.manufacturingSimulation.artifactHash = 'another-artifact';
      progress.completed = false;
      events.push(`ui-submit:${score}:${criticalMisses}`);
      render();
    });
    if (progress.manufacturingSimulation) section.append(element('div',
      progress.manufacturingSimulation.completed ? 'Practice passed' : 'Review and retry', { role: 'status' }));
    const complete = element('button', 'Complete lesson', { type: 'button' });
    complete.addEventListener('click', () => {
      assert.equal(progress.manufacturingSimulation?.completed, true);
      events.push('ui-complete');
      progress.completed = true;
      render();
    });
    root.append(complete);
    if (progress.completed) root.append(element('p', 'Lesson completed', { role: 'status' }));
  }
  render();
  const frame = {
    offset: async () => ({ x: 0, y: 0 }),
    evaluate: async (fn, arg) => {
      dom.window.__argument = arg;
      return dom.window.eval(`(${fn.toString()})(__argument)`);
    },
    page: {
      mouse: { click: async () => hit.element.click() },
      keyboard: {
        press: async (key) => { if (key === 'Backspace') document.activeElement.value = ''; },
        insertText: async (text) => {
          document.activeElement.value = text;
          document.activeElement.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
        },
      },
    },
  };
  const page = {
    getByTestId: (id) => getByTestId(frame, id),
    reload: async () => {
      events.push('reload');
      responses = clone(progress.manufacturingSimulation?.answers ?? {});
      render();
      if (options.forgetPersistence) delete progress.manufacturingSimulation;
    },
    request: { post: async (url, body) => {
      assert.equal(url, 'https://app.elevateforhumanity.org/api/learner-testing/runs/run');
      assert.deepEqual(body, { data: { action: 'complete' } });
      events.push(`api-complete-denied:${progress.manufacturingSimulation?.attempts ?? 0}`);
      const bypass = options.bypassBefore || (options.bypassCritical && progress.manufacturingSimulation);
      return { status: () => bypass ? 200 : 409,
        json: async () => ({ code: options.unrelatedDenial ? 'OTHER_INCOMPLETE_WORK' : 'MANUFACTURING_SIMULATION_REQUIRED' }) };
    } },
  };
  const args = { setup: { runId: 'run', snapshot: { qaOnly: true, blueprint: { manufacturingSimulation: spec } } },
    input, page, state: async () => clone(progress), base: new URL('https://app.elevateforhumanity.org') };
  return { args, events, progress, spec };
}

test('real locator actions submit every task, observe the 80% critical hold, correct and reload before normal completion', async (t) => {
  const { args, events, spec, progress } = workflowHarness(t);
  const evidence = await runStagedManufacturingWorkflow(args);
  assert.deepEqual(evidence, {
    version: 'staged-manufacturing-qa-v1', submittedThroughUI: true,
    simulationId: spec.id, gradingKeyId: spec.gradingKeyId, specHash: canonicalHash(spec), taskCount: 5,
    criticalTaskId: 'approved_sequence', deniedBefore: true, deniedCritical: true,
    failedScore: 80, failedCriticalMisses: 1, score: 100, criticalMisses: 0, attempts: 2, persisted: true,
  });
  assert.deepEqual(events.filter((event) => /^(api-complete|ui-submit|reload)/.test(event)),
    ['api-complete-denied:0', 'ui-submit:80:1', 'api-complete-denied:1', 'ui-submit:100:0', 'reload']);
  for (const task of spec.tasks) assert.ok(events.some((event) => event.endsWith(`:${task.id}`)), task.id);
  assert.ok(events.filter((event) => event.startsWith('sequence-move:')).length > 0);
  assert.equal(await completeStagedLesson(args.page, args.state), 'Completion persisted across reload');
  assert.equal(progress.completed, true);
  assert.equal(events.filter((event) => event === 'ui-complete').length, 1);
});

for (const [options, message] of [
  [{ bypassBefore: true }, /denied specifically/],
  [{ unrelatedDenial: true }, /denied specifically/],
  [{ bypassCritical: true }, /denied specifically/],
  [{ privateFeedback: true }, /private grading data/],
  [{ wrongScope: true }, /exact staged lesson/],
  [{ forgetPersistence: true }, /survive reload/],
  [{ missingReference: true }, /not rendered completely/],
]) test(`manufacturing runner rejects ${Object.keys(options)[0]} without certifying completion`, async (t) => {
  const { args, events } = workflowHarness(t, options);
  await assert.rejects(runStagedManufacturingWorkflow(args), message);
  assert.equal(events.includes('ui-complete'), false);
});

test('unmarked simulation runs are rejected before learner actions', async (t) => {
  const { args, events } = workflowHarness(t);
  args.setup.snapshot.qaOnly = false;
  await assert.rejects(runStagedManufacturingWorkflow(args), /marked QA snapshot/);
  assert.deepEqual(events, []);
});

test('ordinary lessons keep their existing completion path without synthetic simulation evidence', async () => {
  const page = { getByTestId: () => ({ filter: () => ({ first: () => ({ getByTestId: () => ({ count: async () => 0 }) }) }) }) };
  assert.equal(await runStagedManufacturingWorkflow({ setup: { snapshot: { blueprint: {} } }, page }), undefined);
});
