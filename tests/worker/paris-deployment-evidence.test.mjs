import test from 'node:test';
import assert from 'node:assert/strict';
import { REPAIR_DEPLOYMENTS, repairDeploymentState, nextRepairDeployment, unobservedRepairDeployment } from '../../lib/ai/runtime/code-repair-policy.mjs';

const completed = () => REPAIR_DEPLOYMENTS.map((deployment, i) => ({
  id: 100 + i, name: deployment.name, head_sha: 'release', event: 'workflow_dispatch',
  status: 'completed', conclusion: 'success', created_at: '2026-10-22T04:00:00Z',
}));

test('an older failed attempt does not erase a newer successful deployment of the exact repair', () => {
  const runs = completed();
  runs.push({ ...runs[0], id: 50, conclusion: 'failure', created_at: '2026-10-22T03:00:00Z' });
  assert.equal(repairDeploymentState(runs, 'release'), 'passed');
});

test('a newer pending or failed deployment cannot reuse a stale successful receipt', () => {
  const runs = completed();
  const latest = { ...runs[0], id: 200, status: 'in_progress', conclusion: null, created_at: '2026-10-22T05:00:00Z' };
  assert.equal(repairDeploymentState([...runs, latest], 'release'), 'pending');
  assert.equal(nextRepairDeployment([...runs, latest], 'release'), null);
  assert.equal(repairDeploymentState([...runs, { ...latest, status: 'completed', conclusion: 'failure' }], 'release'), 'failed');
});

test('a successful actual course-worker push deployment does not request a redundant worker deployment', () => {
  const runs = completed().map(run => run.name === REPAIR_DEPLOYMENTS[3].name ? { ...run, event: 'push' } : run);
  assert.equal(repairDeploymentState(runs, 'release'), 'passed');
  assert.equal(nextRepairDeployment(runs, 'release'), null);
});

test('a rerun of an older run is ordered by the latest attempt start, not the original run id', () => {
  const runs = completed();
  const failed = { ...runs[0], id: 110, conclusion: 'failure', run_started_at: '2026-10-22T05:00:00Z' };
  const rerun = { ...runs[0], id: 90, run_attempt: 2, created_at: '2026-10-22T02:00:00Z', run_started_at: '2026-10-22T06:00:00Z' };
  assert.equal(repairDeploymentState([...runs, failed, rerun], 'release'), 'passed');
  assert.equal(repairDeploymentState([...runs, failed, { ...rerun, status: 'in_progress', conclusion: null }], 'release'), 'pending');
});

test('an unobserved accepted dispatch becomes reviewable instead of waiting forever or replaying', () => {
  const requested = ['deploy-admin.yml'];
  const at = { 'deploy-admin.yml': '2026-10-22T04:00:00Z' };
  assert.equal(unobservedRepairDeployment([], 'release', requested, at, undefined, Date.parse('2026-10-22T04:20:00Z')), null);
  assert.equal(unobservedRepairDeployment([], 'release', requested, at, undefined, Date.parse('2026-10-22T04:30:00Z')), 'deploy-admin.yml');
  assert.equal(nextRepairDeployment([], 'release', requested), null);
  assert.equal(unobservedRepairDeployment(completed(), 'release', requested, at, undefined, Date.parse('2026-10-22T05:00:00Z')), null);
  assert.equal(unobservedRepairDeployment([], 'release', requested, {}, '2026-10-22T04:00:00Z', Date.parse('2026-10-22T05:00:00Z')), 'deploy-admin.yml');
});
