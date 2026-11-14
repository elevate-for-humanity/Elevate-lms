import test from 'node:test';
import assert from 'node:assert/strict';
import {acceptedOpenHandsNeedsObservation, nextAcceptedOpenHandsObservation, superviseAcceptedOpenHandsRepair} from '../../lib/devstudio/paris-openhands-supervision.mjs';

function fixture(code = 'REPAIR_WORKFLOW_failure') {
  const repair = {id: 'repair', status: 'blocked', error_code: code, workflow_run_id: 12,
    attempt_count: 1, release_sha: null, attempt_history: [{event: 'original'}],
    candidate: {kind: 'openhands-checkpoint', checkpoint: {taskId: 'same-task', runId: 12,
      dispatchRequested: true, startedAt: 1}}, verification: {prior: 'preserved'}};
  const state = {observations: 0, claims: [], records: [], jobReads: 0};
  const jobs = {total_count: 3, jobs: [
    {name: 'prepare', status: 'completed', conclusion: 'failure'},
    {name: 'validate', status: 'completed', conclusion: 'skipped'},
    {name: 'publish', status: 'completed', conclusion: 'skipped'},
  ]};
  const deps = {now: () => 1000,
    workflow: async () => ({id: 12, path: '.github/workflows/paris-code-repair.yml',
      event: 'workflow_dispatch', head_branch: 'main', status: 'completed', conclusion: 'failure'}),
    jobs: async id => {assert.equal(id, 12); state.jobReads++; return jobs;},
    sourceEligible: async () => true,
    observe: async () => {state.observations++; return {state: 'pending', taskId: 'same-task'};},
    record: async value => state.records.push(value),
    claim: async value => {state.claims.push(value); return true;}};
  return {repair, state, jobs, deps};
}

test('generic prepare failure observes the existing accepted task without another attempt or dispatch', async () => {
  const f = fixture();
  assert.equal(Boolean(acceptedOpenHandsNeedsObservation(f.repair)), true);
  const result = await superviseAcceptedOpenHandsRepair(f.repair, f.deps);
  assert.equal(result.awaitingProvider, true);
  assert.equal(f.state.observations, 1);
  assert.equal(f.state.jobReads, 1);
  assert.equal(f.state.claims.length, 0);
  assert.equal(f.repair.attempt_count, 1);
  assert.equal(f.state.records[0].prior, 'preserved');
  assert.equal(f.state.records[0].openhandsObservation.taskId, 'same-task');
});

test('a late result after a timed-out prepare re-enters independent validation with original history', async () => {
  const f = fixture('REPAIR_WORKFLOW_timed_out');
  f.jobs.jobs[0].conclusion = 'timed_out';
  f.deps.observe = async () => ({state: 'ready', candidate: {immutable: 'candidate'}});
  const result = await superviseAcceptedOpenHandsRepair(f.repair, f.deps);
  assert.equal(result.dispatchRequired, true);
  const claim = f.state.claims[0];
  assert.equal(claim.status, 'dispatched');
  assert.equal('attempt_count' in claim, false);
  assert.equal('release_sha' in claim, false);
  assert.deepEqual(claim.attempt_history[0], {event: 'original'});
  assert.equal(claim.attempt_history[1].checkpoint.taskId, 'same-task');
});

for (const [name, change] of [
  ['validation failure', f => {f.jobs.jobs[0].conclusion = 'success'; f.jobs.jobs[1].conclusion = 'failure';}],
  ['publication failure', f => {f.jobs.jobs[0].conclusion = 'success'; f.jobs.jobs[2].conclusion = 'failure';}],
  ['cancelled prepare', f => {f.jobs.jobs[0].conclusion = 'cancelled';}],
  ['active validation', f => {f.jobs.jobs[1].status = 'in_progress';}],
  ['missing downstream evidence', f => {f.jobs.jobs.pop(); f.jobs.total_count--;}],
  ['duplicate downstream names', f => {f.jobs.jobs[2].name = 'validate';}],
  ['truncated job response', f => {f.jobs.total_count = 101;}],
]) test(`${name} cannot resume observation or validation`, async () => {
  const f = fixture(); change(f);
  await superviseAcceptedOpenHandsRepair(f.repair, f.deps);
  assert.equal(f.state.observations, 0);
  assert.equal(f.state.claims.length, 0);
  assert.equal(f.state.records[0].openhandsObservation.reason, 'FAILED_PREPARE_EVIDENCE_REQUIRED');
});

test('job lookup failure preserves the record and never observes or claims a task', async () => {
  const f = fixture(); f.deps.jobs = async () => {throw Error('HTTP 403');};
  await assert.rejects(superviseAcceptedOpenHandsRepair(f.repair, f.deps), /HTTP 403/);
  assert.equal(f.state.observations, 0);
  assert.equal(f.state.records.length, 0);
  assert.equal(f.state.claims.length, 0);
});

test('a still-required provider approval stays blocked without candidate admission', async () => {
  const f = fixture(); f.deps.observe = async () => {throw Error('PARIS_OPENHANDS_APPROVAL_REQUIRED');};
  assert.equal((await superviseAcceptedOpenHandsRepair(f.repair, f.deps)).awaitingProvider, true);
  assert.equal(f.state.claims.length, 0);
  assert.equal(f.repair.error_code, 'REPAIR_WORKFLOW_failure');
});

test('cancellation, exhausted receipt, and prior rejection cannot enter the observation path', () => {
  for (const change of [f => {f.repair.error_code = 'REPAIR_WORKFLOW_cancelled';},
    f => {delete f.repair.candidate.checkpoint.taskId;},
    f => {f.repair.verification.openhandsObservation = {state: 'rejected'};}]) {
    const f = fixture(); change(f);
    assert.equal(Boolean(acceptedOpenHandsNeedsObservation(f.repair)), false);
  }
});

test('pending observations rotate fairly without changing input order, owner, or eligibility', () => {
  const first = {...fixture().repair, id: 'a', actor_id: 'owner'};
  const second = {...fixture().repair, id: 'b', actor_id: 'owner'};
  const unrelated = {...fixture().repair, id: '0', actor_id: 'other'};
  const rejected = {...fixture().repair, id: '1', actor_id: 'owner',
    verification: {openhandsObservation: {state: 'rejected'}}};
  const rows = [unrelated, rejected, second, first];
  assert.equal(nextAcceptedOpenHandsObservation(rows, 'owner'), first);
  first.verification = {openhandsObservation: {checkedAt: '2026-11-13T20:00:00Z', state: 'pending'}};
  assert.equal(nextAcceptedOpenHandsObservation(rows, 'owner'), second);
  second.verification = {openhandsObservation: {checkedAt: '2026-11-13T20:01:00Z', state: 'pending'}};
  assert.equal(nextAcceptedOpenHandsObservation(rows, 'owner'), first);
  assert.deepEqual(rows.map(row => row.id), ['0', '1', 'b', 'a']);
  assert.equal(nextAcceptedOpenHandsObservation(rows, 'missing-owner'), undefined);
});
