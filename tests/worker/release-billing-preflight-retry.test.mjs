import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyBilling, BILLING_READ_ATTEMPTS, BILLING_READ_RETRY_MS, BILLING_READ_TIMEOUT_MS, BILLING_READ_BUDGET_MS} from '../../scripts/gcp/preflight-billing.mjs';

const project = 'elegant-racer-299721';
const describeArgs = ['billing', 'projects', 'describe', project, '--format=json'];
const activePayload = JSON.stringify({projectId: project, billingEnabled: true, billingAccountName: 'billingAccounts/private'});

// execFileSync kills a child that outlives its timeout and reports ETIMEDOUT plus
// the kill signal. Production release 42947036013 failed this way after 30.05s.
const unanswered = () => Object.assign(new Error('gcloud billing describe timed out'), {code: 'ETIMEDOUT', signal: 'SIGTERM'});

function countingRun(sequence) {
  const calls = [];
  return {
    calls,
    run(cmd, args, opts) {
      calls.push({cmd, args, opts});
      const step = sequence[Math.min(calls.length, sequence.length) - 1];
      if (typeof step === 'function') return step();
      return step;
    },
  };
}

test('an unanswered billing read is retried and then passes without weakening the read', () => {
  const {calls, run} = countingRun([() => { throw unanswered(); }, activePayload]);
  const sleeps = [];
  assert.deepEqual(verifyBilling(project, run, {sleep: ms => sleeps.push(ms)}), {project, billingEnabled: true});
  assert.equal(calls.length, 2, 'one transient fault must be retried exactly once');
  assert.deepEqual(sleeps, [BILLING_READ_RETRY_MS]);
  for (const call of calls) {
    assert.equal(call.cmd, 'gcloud');
    assert.deepEqual(call.args, describeArgs, 'every retry must repeat the same read-only describe');
    assert.equal(call.opts.timeout, 30000, 'the read timeout must not be extended to hide a stall');
    assert.deepEqual(call.opts.stdio, ['ignore', 'pipe', 'pipe']);
  }
});

test('a read killed by a signal is treated as unanswered and retried', () => {
  const {calls, run} = countingRun([
    () => { throw Object.assign(new Error('killed'), {signal: 'SIGKILL'}); },
    activePayload,
  ]);
  assert.deepEqual(verifyBilling(project, run, {sleep: () => {}}), {project, billingEnabled: true});
  assert.equal(calls.length, 2);
});

test('persistent unanswered reads still fail closed after the bounded attempts', () => {
  const {calls, run} = countingRun([() => { throw unanswered(); }]);
  const sleeps = [];
  const error = (() => {
    try { verifyBilling(project, run, {sleep: ms => sleeps.push(ms)}); } catch (thrown) { return thrown; }
  })();
  assert.ok(error, 'an unverified billing read must never let the release continue');
  assert.equal(calls.length, BILLING_READ_ATTEMPTS, 'retries must be bounded');
  assert.equal(sleeps.length, BILLING_READ_ATTEMPTS - 1);
  assert.match(error.message, /timed out without returning a result/);
  assert.doesNotMatch(error.message, /not confirmed active/, 'a stalled read must not be reported as a billing verdict');
  assert.doesNotMatch(error.message, /billingAccounts/, 'the billing account must never be published');
});

test('definitive answers are never retried', () => {
  for (const [label, answer, expected] of [
    ['a disabled-billing verdict', () => JSON.stringify({projectId: project, billingEnabled: false, billingAccountName: 'billingAccounts/private'}), /not confirmed active/],
    ['an unlinked billing verdict', () => JSON.stringify({projectId: project, billingEnabled: true}), /not confirmed active/],
    ['a wrong-project verdict', () => JSON.stringify({projectId: 'another-project', billingEnabled: true, billingAccountName: 'billingAccounts/private'}), /not confirmed active/],
    ['a malformed payload', () => 'invalid', /Cannot verify/],
    ['a CLI that returned a status', () => Object.assign(new Error('exit 1'), {status: 1}), /Cannot verify/],
    ['a missing gcloud binary', () => Object.assign(new Error('spawn gcloud ENOENT'), {code: 'ENOENT'}), /Cannot verify/],
  ]) {
    const {calls, run} = countingRun([answer]);
    const sleeps = [];
    assert.throws(() => verifyBilling(project, run, {sleep: ms => sleeps.push(ms)}), expected, label);
    assert.equal(calls.length, 1, label + ' must be reported without retrying');
    assert.deepEqual(sleeps, [], label + ' must not back off');
  }
});

test('an invalid project ID still runs no command', () => {
  assert.throws(() => verifyBilling('$(unsafe)', () => assert.fail('must not execute'), {sleep: () => {}}), /valid Google project/);
});

test('the retried preflight stays read-only', () => {
  const source = readFileSync(new URL('../../scripts/gcp/preflight-billing.mjs', import.meta.url), 'utf8');
  assert.match(source, /'billing', 'projects', 'describe'/);
  assert.doesNotMatch(source, /'billing',\s*'projects',\s*'(?:link|unlink|update|enable|disable)'/, 'billing must never be changed by a preflight');
});

test('the read timeout is never extended and never shortened below the remaining budget', () => {
  // A healthy read keeps the full generous per-attempt timeout.
  const healthy = countingRun([activePayload]);
  verifyBilling(project, healthy.run, {sleep: () => {}});
  assert.equal(healthy.calls[0].opts.timeout, BILLING_READ_TIMEOUT_MS);

  // A virtual clock that consumes 30s on the first stalled read leaves only 5s
  // of the 35s budget, so the retry must be clamped to what the budget covers.
  let clock = 0;
  const run = (cmd, args, opts) => {
    clock += opts.timeout;
    throw unanswered();
  };
  assert.throws(() => verifyBilling(project, run, {sleep: () => {}, now: () => clock}), /timed out/);
});

test('a spent wall-clock budget stops the loop instead of burning CI minutes', () => {
  let clock = 0;
  let calls = 0;
  const run = () => { calls++; clock += 30000; throw unanswered(); };
  const sleeps = [];
  const error = (() => {
    try { verifyBilling(project, run, {sleep: ms => sleeps.push(ms), now: () => clock}); } catch (thrown) { return thrown; }
  })();
  assert.ok(error);
  // 35s budget / 30s reads: the second attempt cannot be covered, so it stops.
  assert.equal(calls, 2, 'a budget that cannot cover another read must not start one');
  assert.deepEqual(sleeps, [BILLING_READ_RETRY_MS]);
  assert.match(error.message, /timed out/);
});

test('the whole stall path is bounded far below three full-length attempts', () => {
  assert.ok(BILLING_READ_BUDGET_MS < BILLING_READ_ATTEMPTS * BILLING_READ_TIMEOUT_MS,
    'the budget must be cheaper than three full-length attempts');
  assert.ok(BILLING_READ_BUDGET_MS >= BILLING_READ_TIMEOUT_MS,
    'the budget must still allow one complete read');
  assert.ok(BILLING_READ_BUDGET_MS - BILLING_READ_TIMEOUT_MS >= BILLING_READ_RETRY_MS,
    'the budget must leave room for at least one backoff');
});

test('the released gate keeps the billing guard and validates this retry contract', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/deploy-google-course-worker.yml', import.meta.url), 'utf8');
  const guard = workflow.indexOf('node scripts/gcp/preflight-billing.mjs');
  assert.ok(guard > 0, 'the billing guard must remain in the worker release');
  assert.ok(workflow.indexOf('google-github-actions/auth@v3') < guard, 'billing must be read with the federated identity');
  assert.ok(guard < workflow.indexOf('Build existing CPU Course Builder image'), 'billing must be confirmed before the build spends money');
  assert.ok(guard < workflow.indexOf('Upload immutable worker image'), 'billing must gate the image upload');
  assert.match(workflow, /node --test tests\/worker\/release-billing-preflight-retry\.test\.mjs/, 'the failed gate must run this regression');
  const ci = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const requiredStep = ci.split('      - name: Teaching panel layout and measured repair recovery')[1]?.split('      - name: ')[0] ?? '';
  assert.match(requiredStep, /if: \$\{\{ !cancelled\(\) && steps\.dependencies\.outcome == 'success' \}\}/, 'the regression must run inside required CI');
  assert.match(requiredStep, /node --test [^\n]*tests\/worker\/release-billing-preflight-retry\.test\.mjs/, 'required CI must run this regression');
});
