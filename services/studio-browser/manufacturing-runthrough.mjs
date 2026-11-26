import { createHash } from 'node:crypto';

/** Browser acceptance uses only the public case, never the protected grading key. */
function requireCase(condition, message) {
  if (!condition) throw new Error(`Manufacturing QA: ${message}`);
}
const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function one(values, description) {
  requireCase(values.length === 1, `ambiguous or missing ${description}`);
  return values[0];
}
function rowsFor(spec, title) {
  return one(spec.exhibits.filter((exhibit) => exhibit.title === title), title).rows;
}
function field(rows, key, value, column) {
  return one(rows.filter((row) => row[key] === value), value)[column];
}
function numberFrom(value, expression, description) {
  const match = String(value).match(expression);
  requireCase(match && Number.isFinite(Number(match[1])), `unsupported ${description}`);
  return Number(match[1]);
}
function option(task, expression) {
  return one(task.options.filter((item) => expression.test(item.label)), task.prompt).value;
}
function sequence(task, expressions) {
  const answer = expressions.map((expression) => option(task, expression));
  requireCase(answer.length === task.options.length && new Set(answer).size === answer.length,
    `incomplete sequence for ${task.id}`);
  return answer;
}
function assertNoPrivateGradingData(value) {
  const privateFields = new Set(['expected', 'rationale', 'answerIndex', 'correctAnswer', 'answerKey', 'gradingKey']);
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      requireCase(!privateFields.has(key), 'private grading data must not enter the browser runner');
      visit(child);
    }
  };
  visit(value);
}
function assertPublicCase(spec) {
  requireCase(spec?.version === 1 && typeof spec.id === 'string' &&
    /^[0-9a-f-]{36}$/i.test(spec.gradingKeyId ?? '') &&
    Array.isArray(spec.tasks) && spec.tasks.length > 0 && spec.tasks.length <= 50 &&
    Array.isArray(spec.exhibits), 'protected public simulation reference required');
  assertNoPrivateGradingData(spec);
}
function publicSpecHash(spec) {
  const canonical = (value) => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort()
      .map((key) => [key, canonical(value[key])])) : value;
  return createHash('sha256').update(JSON.stringify(canonical(spec))).digest('hex');
}

/**
 * Bounded public-reference reader for the authored case formats. Numeric values
 * come from the displayed rows; semantic choices come from the displayed rules
 * and labels. Unknown formats fail the acceptance check instead of guessing.
 */
export function solvePublicManufacturingSimulation(spec) {
  assertPublicCase(spec);
  const task = (id) => one(spec.tasks.filter((item) => item.id === id), `task ${id}`);
  let solve;
  switch (spec.id) {
    case 'forklift-hazard-route-v1': {
      const routes = rowsFor(spec, 'Initial route review');
      const update = rowsFor(spec, 'Later supervisor update for Route B');
      requireCase(routes.length > 0 && routes.every((row) => row.missing?.trim()), 'unresolved route evidence');
      requireCase(/trainer.*review/i.test(field(update, 'field', 'Pending', 'value')), 'pending trainer review');
      solve = {
        'route-first': () => option(task('route-first'), /^None: every route has an unresolved condition$/),
        'route-pedestrian': () => option(task('route-pedestrian'), /traffic controls still need verification/),
        'route-update': () => option(task('route-update'), /Reassessment with the trainer/),
        'route-record-sequence': () => sequence(task('route-record-sequence'), [
          /^Keep the movement request on hold/, /^Record route hazards/,
          /^Request the assigned supervisor/, /^Review the authorized update/,
        ]),
      };
      break;
    }
    case 'forklift-load-plate-match-v1': {
      const capacities = rowsFor(spec, 'Fictional truck F-17 capacity card — training data only');
      const orders = rowsFor(spec, 'Orders for paperwork review');
      const order = (id) => one(orders.filter((row) => row.order === id), id);
      const matches = (row) => capacities.filter((entry) =>
        ['attachment', 'center', 'height'].every((key) => entry[key] === row[key]));
      const first = one(matches(order('P-101')), 'exact capacity-card match');
      requireCase(order('P-101').weight <= first.capacity, 'P-101 review eligibility');
      requireCase(order('P-102').weight > one(matches(order('P-102')), 'P-102 capacity').capacity &&
        order('P-104').weight > one(matches(order('P-104')), 'P-104 capacity').capacity &&
        matches(order('P-103')).length === 0, 'capacity hold conditions');
      solve = {
        'plate-entry': () => one(task('plate-entry').options.filter((item) => item.label === `Entry ${first.row}`), 'capacity entry').value,
        'plate-match-limit': () => option(task('plate-match-limit'), /^Data match for further supervised review$/),
        'plate-excess': () => option(task('plate-excess'), /^Hold:/),
        'plate-center': () => option(task('plate-center'), /^Hold: no explicit entry matches$/),
        'plate-attachment': () => option(task('plate-attachment'), /^Hold:/),
      };
      break;
    }
    case 'forklift-preuse-escalation-v1': {
      const observations = rowsFor(spec, 'Supplied observation log');
      const procedure = rowsFor(spec, 'Fictional site procedure excerpt');
      requireCase(observations.some((row) => /crack/.test(row.observation)) &&
        observations.some((row) => /Wet patch/.test(row.observation) && row.status === 'Cause unknown') &&
        /Do not operate/.test(field(procedure, 'role', 'Learner', 'instruction')), 'inspection restrictions');
      solve = {
        'inspection-fact': () => option(task('inspection-fact'), /^Wet patch.*cause unknown$/),
        'inspection-hold': () => option(task('inspection-hold'), /^Do not use; follow the site/),
        'inspection-contact': () => option(task('inspection-contact'), /^Record the supplied observation and refer/),
        'inspection-record': () => option(task('inspection-record'), /location\/time; separate observations; recipient and pending status$/),
        'inspection-release': () => option(task('inspection-release'), /^The designated authority through the site/),
      };
      break;
    }
    case 'forklift-incident-response-v1': {
      const roles = rowsFor(spec, 'Fictional site roles');
      const facts = rowsFor(spec, 'Fictional case record');
      requireCase(/Remain clear, alert/.test(field(roles, 'role', 'Learner', 'responsibility')) &&
        /refresher training\/evaluation/.test(field(roles, 'role', 'Employer and qualified trainer', 'responsibility')) &&
        facts.some((row) => row.time === '10:12') && facts.some((row) => row.time === '10:13'), 'incident evidence');
      solve = {
        'incident-response': () => option(task('incident-response'), /^Stay or move clear when safe, alert designated responders/),
        'incident-fact': () => option(task('incident-fact'), /^Pallet shifted at 10:12; lead notified at 10:13; cause unknown$/),
        'incident-nearmiss': () => option(task('incident-nearmiss'), /^No: a near miss triggers relevant refresher/),
        'incident-tipover': () => option(task('incident-tipover'), /^None: actual truck-specific emergency instruction/),
        'incident-admin': () => sequence(task('incident-admin'), [
          /^Record observed facts/, /^Employer reviews conditions/, /^Complete required corrections/,
          /^Employer records the competence/,
        ]),
      };
      break;
    }
    case 'SIM-MFG-01': {
      const packet = rowsFor(spec, 'Initial document packet');
      const stock = rowsFor(spec, 'Released usable stock at initial review');
      const events = rowsFor(spec, 'Later supplied events');
      const original = numberFrom(field(packet, 'document', 'Work order WO-CAP-01', 'value'), /^(\d+) DSK-100 units; revision B$/, 'work order');
      requireCase(field(packet, 'document', 'Work instruction', 'value') === 'Revision A' &&
        field(packet, 'document', 'Partial-run authorization', 'value') === 'Not issued at initial review', 'initial document hold');
      requireCase(stock.every((row) => Number.isFinite(row.usable) && row.usable >= 0 && row.perUnit > 0), 'stock quantities');
      const kits = Math.min(...stock.map((row) => Math.floor(row.usable / row.perUnit)));
      const limiting = one(stock.filter((row) => Math.floor(row.usable / row.perUnit) === kits), 'limiting component');
      const cap = one(stock.filter((row) => /^Cap /.test(row.component)), 'cap stock');
      const pin = one(stock.filter((row) => /^Pin /.test(row.component)), 'pin stock');
      const final = field(events, 'event', 'Final production', 'record');
      const produced = numberFrom(final, /(\d+) virtual units produced/, 'produced units');
      const ready = numberFrom(final, /(\d+) have complete check records/, 'complete check records');
      requireCase(produced <= kits && ready <= produced && /Quality lead.*no release is yet supplied/.test(field(events, 'event', 'Release rule', 'record')), 'production and release records');
      solve = {
        initial_revision: () => option(task('initial_revision'), /^Hold the start and obtain the approved revision-B instruction/),
        kit_limit: () => kits,
        limiting_component: () => one(task('limiting_component').options.filter((item) => normalize(item.label) === normalize(limiting.component.split(' ')[0])), 'limiting component label').value,
        cap_shortage: () => original * cap.perUnit - cap.usable,
        partial_authority: () => option(task('partial_authority'), /^No; the designated lead must authorize/),
        pin_use: () => produced * pin.perUnit,
        pin_remaining: () => pin.usable - produced * pin.perUnit,
        review_ready: () => ready,
        unproduced_balance: () => original - produced,
        release: () => option(task('release'), /^The designated quality lead after reviewing required evidence$/),
      };
      break;
    }
    case 'SIM-MFG-02': {
      const instruction = rowsFor(spec, 'Approved digital instruction');
      const cards = rowsFor(spec, 'Exception cards');
      const quantity = field(cards, 'id', 'Q1', 'condition');
      const units = numberFrom(quantity, /contains (\d+) units/, 'practice order quantity');
      const pins = numberFrom(quantity, /each requires (\d+) pins/, 'pins per unit');
      requireCase(/before pin-count verification/.test(field(cards, 'id', 'E1', 'condition')) &&
        /Revision-A.*revision-B/.test(field(cards, 'id', 'E2', 'condition')) &&
        /not been technically approved/.test(field(cards, 'id', 'E3', 'condition')), 'digital exception cards');
      const words = (value) => new Set(normalize(value).split(' ').filter((word) => !['the', 'all', 'and'].includes(word)));
      solve = {
        approved_sequence: () => {
          const answer = [...instruction].sort((a, b) => a.step - b.step).map((row) => {
            const wanted = words(row.requirement);
            const ranked = task('approved_sequence').options.map((item) => {
              const candidate = words(item.label);
              return { value: item.value, score: [...candidate].filter((word) => wanted.has(word)).length / new Set([...wanted, ...candidate]).size };
            }).sort((a, b) => b.score - a.score);
            requireCase(ranked[0].score >= 0.5 && ranked[0].score > ranked[1].score, 'approved instruction step');
            return ranked[0].value;
          });
          requireCase(answer.length === task('approved_sequence').options.length && new Set(answer).size === answer.length, 'complete approved sequence');
          return answer;
        },
        skipped_check: () => option(task('skipped_check'), /^Mark the run incomplete and resolve or reset/),
        wrong_revision: () => option(task('wrong_revision'), /^Reject the substitution and request the required revision/),
        pin_quantity: () => units * pins,
        fixture_change: () => option(task('fixture_change'), /^Submit the proposal for the employer/),
      };
      break;
    }
    case 'SIM-MFG-03': {
      const rules = rowsFor(spec, 'Supplied decision rule');
      const readings = rowsFor(spec, 'Synthetic readings from the approved exercise instrument');
      const range = String(field(rules, 'field', 'Specification', 'value')).match(/^([\d.]+)[–-]([\d.]+) mm, inclusive\.$/);
      requireCase(range, 'inclusive measurement specification');
      const low = Number(range[1]), high = Number(range[2]);
      const uncertainty = numberFrom(field(rules, 'field', 'Measurement interval', 'value'), /plus or minus ([\d.]+) mm/, 'measurement interval');
      requireCase(low < high && uncertainty >= 0, 'measurement boundaries');
      solve = Object.fromEntries(readings.map((row) => [`classify_${row.id.toLowerCase()}`, () => {
        requireCase(Number.isFinite(row.readingMm), 'measurement reading');
        const lower = row.readingMm - uncertainty, upper = row.readingMm + uncertainty;
        const outcome = lower >= low - 1e-9 && upper <= high + 1e-9 ? 'Conforming'
          : upper < low - 1e-9 || lower > high + 1e-9 ? 'Nonconforming' : 'Hold';
        return option(task(`classify_${row.id.toLowerCase()}`), new RegExp(`^${outcome} (under|for review under) Rule B$`));
      }]));
      solve.overdue_tool = () => {
        requireCase(/X1 is overdue/.test(field(rules, 'field', 'Instrument condition', 'value')), 'instrument hold');
        return option(task('overdue_tool'), /^No; preserve the evidence and request/);
      };
      solve.rounding = () => option(task('rounding'), /^No; preserve the supplied observation and apply/);
      break;
    }
    case 'SIM-MFG-04': {
      const rules = rowsFor(spec, 'Fictional appearance and completeness standard');
      const cards = rowsFor(spec, 'Synthetic evidence cards');
      const limits = Object.fromEntries(['A', 'B'].map((zone) => [zone,
        numberFrom(field(rules, 'criterion', `Zone ${zone} superficial marks`, 'rule'), /^At most ([\d.]+) mm, inclusive\.$/, `zone ${zone} limit`),
      ]));
      const decisions = cards.map((row) => {
        const mark = String(row.evidence).match(/Zone-([AB]) superficial mark ([\d.]+) mm/);
        let occurrences = 0;
        if (mark) occurrences += Number(mark[2]) > limits[mark[1]] ? 1 : 0;
        if (/Crack reported/.test(row.evidence)) occurrences++;
        if (/required pin missing/.test(row.evidence)) occurrences++;
        if (/lot code unreadable/.test(row.evidence)) occurrences++;
        const unresolved = /zone and length not supplied/.test(row.evidence);
        requireCase(mark || occurrences || unresolved, 'supported defect evidence card');
        return { id: row.id, occurrences, outcome: unresolved ? 'Review' : occurrences ? 'Hold' : 'Conforming' };
      });
      solve = Object.fromEntries(decisions.map((row) => [`classify_${row.id.toLowerCase()}`,
        () => option(task(`classify_${row.id.toLowerCase()}`), new RegExp(`^${row.outcome} `))]));
      solve.nonconforming_units = () => decisions.filter((row) => row.occurrences > 0).length;
      solve.defect_occurrences = () => decisions.reduce((sum, row) => sum + row.occurrences, 0);
      break;
    }
    case 'SIM-MFG-05': {
      const rules = rowsFor(spec, 'Plan SP-TRAIN-B');
      const lots = rowsFor(spec, 'Lot observations');
      const maximum = numberFrom(field(rules, 'field', 'Ordinary criterion', 'rule'), /^At most (\d+) nonconforming sampled unit/, 'sample criterion');
      const count = (description) => {
        if (/^No ordinary nonconforming units\.$/.test(description)) return 0;
        const units = String(description).match(/^Units? ([\d\s,and]+) (?:has|each have)/);
        requireCase(units, 'distinct sampled-unit evidence');
        return new Set(units[1].match(/\d+/g)).size;
      };
      const lot = (id) => one(lots.filter((row) => row.lot === id), id);
      requireCase(count(lot('S-A').ordinary) <= maximum && lot('S-A').critical === 'None' && lot('S-A').documents === 'Complete' &&
        count(lot('S-B').ordinary) > maximum && lot('S-C').critical !== 'None' &&
        /without replacement/.test(field(rules, 'field', 'Sample size', 'rule')), 'supplied sample decisions');
      solve = {
        lot_a_count: () => count(lot('S-A').ordinary),
        lot_a_status: () => option(task('lot_a_status'), /^Meets supplied sample\/document criteria/),
        lot_b_status: () => option(task('lot_b_status'), /^Hold:/),
        lot_c_status: () => option(task('lot_c_status'), /^Hold because the critical-condition gate fails/),
        sample_integrity: () => option(task('sample_integrity'), /^No; retain the selected ID and observation/),
      };
      break;
    }
    case 'SIM-MFG-06': {
      const order = rowsFor(spec, 'Order and concern');
      const trace = rowsFor(spec, 'Traceability and location');
      const records = rowsFor(spec, 'Measurement record review');
      const lot = String(field(order, 'field', 'Concern', 'value')).match(/cap lot ([A-Z]-\d+)/)?.[1];
      const quantity = (value) => {
        const match = String(value).match(/U-(\d+)[–-]U-(\d+)/);
        requireCase(match && Number(match[2]) >= Number(match[1]), 'recorded unit range');
        return Number(match[2]) - Number(match[1]) + 1;
      };
      const associated = trace.filter((row) => row.capLot === lot).reduce((sum, row) => sum + quantity(row.units), 0);
      const uncertain = trace.filter((row) => row.capLot === 'Unknown').reduce((sum, row) => sum + quantity(row.units), 0);
      const produced = numberFrom(field(order, 'field', 'Order', 'value'), /all (\d+) have been produced/, 'produced units');
      const eligible = quantity(field(order, 'field', 'Other evidence', 'value'));
      requireCase(lot && associated > 0 && produced === associated + uncertain + eligible &&
        /No release has yet been recorded/.test(field(order, 'field', 'Release', 'value')) &&
        /Retain original entry/.test(field(records, 'record', 'Correction rule', 'evidence')), 'traceability scope and release evidence');
      solve = {
        associated_count: () => associated,
        uncertain_count: () => uncertain,
        initial_review_count: () => associated + uncertain,
        scope_status: () => option(task('scope_status'), /^Held for review:/),
        eligible_review: () => eligible,
        already_released: () => 0,
        correction: () => option(task('correction'), /^Retain the original and record .* with source, reason, author, and correction time\.$/),
        packing: () => option(task('packing'), /^The affected IDs, hold status, reason, and designated review owner\.$/),
        reconciliation: () => produced,
        disposition: () => option(task('disposition'), /^The designated quality lead under the case procedure\.$/),
      };
      break;
    }
    default:
      throw new Error(`Manufacturing QA: unsupported public case ${spec.id}`);
  }
  return Object.fromEntries(spec.tasks.map((item) => {
    requireCase(typeof solve[item.id] === 'function', `unsupported task ${item.id}`);
    const answer = solve[item.id]();
    requireCase(item.type === 'number' ? Number.isFinite(answer)
      : item.type === 'choice' ? item.options.some((candidate) => candidate.value === answer)
        : Array.isArray(answer) && answer.length === item.options.length, `invalid public response for ${item.id}`);
    return [item.id, answer];
  }));
}

function sameAnswers(actual, wanted) {
  return actual && Object.keys(actual).length === Object.keys(wanted).length &&
    Object.entries(wanted).every(([id, value]) => JSON.stringify(actual[id]) === JSON.stringify(value));
}
function visibleRoot(page) {
  return page.getByTestId('staged-lesson').filter({ visible: true }).first();
}
function simulationSection(page) {
  return visibleRoot(page).getByTestId('manufacturing-simulation').filter({ visible: true }).first();
}
async function fillSimulation(page, spec, answers) {
  const section = simulationSection(page);
  for (const task of spec.tasks) {
    const fieldset = section.locator(`[data-simulation-task=${JSON.stringify(task.id)}]`);
    await fieldset.waitFor();
    const answer = answers[task.id];
    if (task.type === 'choice') {
      const label = one(task.options.filter((item) => item.value === answer), task.id).label;
      await fieldset.getByRole('radio', { name: label, exact: true }).check();
    } else if (task.type === 'number') {
      await fieldset.getByRole('spinbutton').fill(String(answer));
    } else {
      for (let target = 0; target < answer.length; target++) {
        const order = await fieldset.locator('ol').evaluate((list, options) =>
          [...list.querySelectorAll('li')].map((item) => options.find((option) =>
            [...item.querySelectorAll('span')].some((span) => span.textContent.trim() === option.label))?.value), task.options);
        let position = order.indexOf(answer[target]);
        requireCase(position >= target, `visible sequence ${task.id} differs from public options`);
        while (position > target) {
          await fieldset.getByRole('button', { name: `Move step ${position + 1} up`, exact: true }).click();
          position--;
        }
      }
      await fieldset.getByRole('button', { name: 'Confirm this sequence', exact: true }).click();
    }
  }
  await section.getByRole('button', { name: 'Check and save practice', exact: true }).click();
}

/** Actual learner controls and server readback; no attempt or score is injected. */
export async function runStagedManufacturingWorkflow({ setup, input, page, state, base }) {
  const spec = setup.snapshot.blueprint.manufacturingSimulation;
  if (spec === undefined) {
    requireCase(await visibleRoot(page).getByTestId('manufacturing-simulation').count() === 0,
      'unexpected unbound simulation UI');
    return undefined;
  }
  requireCase(setup.snapshot.qaOnly === true, 'marked QA snapshot required');
  const answers = solvePublicManufacturingSimulation(spec);
  const section = simulationSection(page);
  await section.waitFor();
  requireCase(await section.getByRole('heading', { name: spec.title, exact: true }).isVisible(), 'public simulation title not rendered');
  requireCase(await section.getByText(spec.brief, { exact: true }).isVisible(), 'public simulation brief not rendered');
  for (const exhibit of spec.exhibits) {
    const text = await section.getByRole('region', { name: exhibit.title, exact: true })
      .evaluate((element) => element.textContent);
    requireCase(exhibit.columns.every((column) => text.includes(column.label)) &&
      exhibit.rows.every((row) => exhibit.columns.every((column) => text.includes(String(row[column.key])))),
    `public reference ${exhibit.title} is not rendered completely`);
  }
  const denyCompletion = async () => {
    const result = await page.request.post(`${base.origin}/api/learner-testing/runs/${setup.runId}`,
      { data: { action: 'complete' } });
    const body = await result.json();
    requireCase(result.status() === 409 && body.code === 'MANUFACTURING_SIMULATION_REQUIRED',
      'completion must be denied specifically for required manufacturing practice');
    requireCase((await state()).completed !== true, 'denied completion was persisted as complete');
  };
  requireCase(!(await state()).manufacturingSimulation, 'fresh QA simulation attempt required');
  await denyCompletion();
  const critical = spec.tasks.find((task) => task.critical);
  const incorrect = { ...answers };
  for (const task of critical ? [critical] : spec.tasks) {
    if (task.type === 'choice') incorrect[task.id] = task.options.find((item) => item.value !== answers[task.id]).value;
    else if (task.type === 'number') incorrect[task.id] = answers[task.id] + Math.max(1, (task.tolerance ?? 0) * 2 + 1);
    else incorrect[task.id] = [...answers[task.id]].reverse();
  }
  await fillSimulation(page, spec, incorrect);
  await section.getByRole('status').filter({ hasText: 'Review and retry' }).waitFor();
  const failed = (await state()).manufacturingSimulation;
  assertNoPrivateGradingData(failed);
  const failedCorrectCount = critical ? spec.tasks.length - 1 : 0;
  requireCase(failed?.completed === false && failed.feedback?.criticalMisses === (critical ? 1 : 0) &&
    failed.feedback.correctCount === failedCorrectCount && failed.score === Math.round(failedCorrectCount / spec.tasks.length * 100) &&
    sameAnswers(failed.answers, incorrect),
  'critical mistake must be server-graded and retained');
  await denyCompletion();
  await fillSimulation(page, spec, answers);
  await section.getByRole('status').filter({ hasText: 'Practice passed' }).waitFor();
  const passed = (await state()).manufacturingSimulation;
  assertNoPrivateGradingData(passed);
  requireCase(passed?.completed === true && passed.score === 100 && passed.feedback?.criticalMisses === 0 &&
    passed.feedback.correctCount === spec.tasks.length && passed.gradingKeyId === spec.gradingKeyId &&
    passed.simulationId === spec.id && passed.lessonBuildId === input.lessonBuildId &&
    passed.artifactHash === input.artifactHash && passed.attempts === failed.attempts + 1 &&
    sameAnswers(passed.answers, answers), 'passing simulation must match this exact staged lesson and public problem');
  await page.reload();
  await simulationSection(page).getByRole('status').filter({ hasText: 'Practice passed' }).waitFor();
  const restored = (await state()).manufacturingSimulation;
  assertNoPrivateGradingData(restored);
  requireCase(restored?.completed === true && restored.attempts === passed.attempts &&
    restored.gradingKeyId === spec.gradingKeyId && sameAnswers(restored.answers, answers), 'simulation attempt did not survive reload');
  return {
    version: 'staged-manufacturing-qa-v1', submittedThroughUI: true,
    simulationId: spec.id, gradingKeyId: spec.gradingKeyId, specHash: publicSpecHash(spec), taskCount: spec.tasks.length,
    criticalTaskId: critical?.id, deniedBefore: true, deniedCritical: Boolean(critical),
    failedScore: failed.score, failedCriticalMisses: failed.feedback.criticalMisses,
    score: passed.score, criticalMisses: passed.feedback.criticalMisses,
    attempts: passed.attempts, persisted: true,
  };
}
