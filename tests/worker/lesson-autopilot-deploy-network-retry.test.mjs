import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {autopilotRpcVerdict, transientAutopilotTransportError, AUTOPILOT_RPC_ATTEMPTS, AUTOPILOT_RPC_RETRY_MS, AUTOPILOT_RPC_TIMEOUT_MS} from '../../scripts/gcp/deploy-lesson-autopilots.mjs';

const URL_READY = 'https://cuxzzpsyufcewtmicszk.supabase.co/rest/v1/rpc/ultimate_autopilot_ready';

// Production release 43423656667 failed the deploy step with exactly this
// shape: an undici "fetch failed" whose cause chain ends in a DNS lookup
// failure for the Supabase host. The read never answered.
const dnsUnavailable = () => Object.assign(new TypeError('fetch failed'), {
  cause: Object.assign(new Error('getaddrinfo ENOTFOUND cuxzzpsyufcewtmicszk.supabase.co'), {
    errno: -3008, code: 'ENOTFOUND', syscall: 'getaddrinfo', hostname: 'cuxzzpsyufcewtmicszk.supabase.co',
  }),
});
const jsonVerdict = value => ({ok: true, status: 200, json: async () => value});

test('the production DNS failure is classified as a retryable transport fault', () => {
  assert.equal(transientAutopilotTransportError(dnsUnavailable()), true);
  assert.equal(transientAutopilotTransportError(Object.assign(new Error('reset'), {code: 'ECONNRESET'})), true);
  assert.equal(transientAutopilotTransportError(Object.assign(new Error('again'), {code: 'EAI_AGAIN'})), true);
  assert.equal(transientAutopilotTransportError(Object.assign(new Error('slow'), {name: 'TimeoutError'})), true);
  assert.equal(transientAutopilotTransportError(Object.assign(new Error('cancelled'), {name: 'AbortError'})), false);
  assert.equal(transientAutopilotTransportError(new Error('ULTIMATE_AUTOPILOT_DATABASE_MIGRATION_REQUIRED')), false);
});

test('an unanswered readiness read recovers instead of failing the release', async () => {
  const calls = [], waits = [];
  const result = await autopilotRpcVerdict(URL_READY, () => ({method: 'POST', body: '{}'}), {
    request: async (url, options) => {
      calls.push({url, options});
      if (calls.length === 1) throw dnsUnavailable();
      return jsonVerdict(true);
    },
    wait: async ms => waits.push(ms),
  });
  assert.deepEqual(result, {answered: true, value: true, status: 200});
  assert.equal(calls.length, 2, 'one transient DNS fault must be retried exactly once');
  assert.deepEqual(waits, [AUTOPILOT_RPC_RETRY_MS]);
  assert.ok(calls.every(call => call.url === URL_READY), 'every retry must repeat the same read-only RPC');
  assert.ok(calls.every(call => call.options.method === 'POST' && call.options.body === '{}'), 'the retried request must be rebuilt, not replayed');
});

test('each attempt builds a fresh request so a spent timeout is never reused', async () => {
  const signals = [];
  await autopilotRpcVerdict(URL_READY, () => ({signal: AbortSignal.timeout(AUTOPILOT_RPC_TIMEOUT_MS)}), {
    request: async (url, options) => {
      signals.push(options.signal);
      if (signals.length === 1) throw dnsUnavailable();
      return jsonVerdict(true);
    },
    wait: async () => {},
  });
  assert.equal(signals.length, 2);
  assert.notEqual(signals[0], signals[1], 'a consumed AbortSignal must never be reused');
  assert.ok(signals.every(signal => signal.aborted === false));
});

test('persistent transport faults still fail closed after the bounded attempts', async () => {
  let calls = 0;
  const waits = [];
  const original = dnsUnavailable();
  await assert.rejects(
    autopilotRpcVerdict(URL_READY, () => ({}), {
      request: async () => { calls++; throw original; },
      wait: async ms => waits.push(ms),
    }),
    thrown => thrown === original,
    'the final transport fault must surface unchanged so the release fails closed',
  );
  assert.equal(calls, AUTOPILOT_RPC_ATTEMPTS, 'retries must be bounded');
  assert.equal(waits.length, AUTOPILOT_RPC_ATTEMPTS - 1);
});

test('a definitive verdict is reported without retrying or hiding it', async () => {
  // A real HTTP status answered the read; it must be surfaced, never retried.
  let statusCalls = 0;
  const verdict = await autopilotRpcVerdict(URL_READY, () => ({}), {
    request: async () => { statusCalls++; return {ok: false, status: 503, json: async () => { throw new SyntaxError('private'); }}; },
    wait: async () => assert.fail('an answered read must not back off'),
  });
  assert.deepEqual(verdict, {answered: true, value: null, status: 503});
  assert.equal(statusCalls, 1);

  // A parsed body that is not the required verdict stays a definitive answer.
  let bodyCalls = 0;
  const rejected = await autopilotRpcVerdict(URL_READY, () => ({}), {
    request: async () => { bodyCalls++; return jsonVerdict(false); },
    wait: async () => assert.fail('a parsed verdict must not back off'),
  });
  assert.deepEqual(rejected, {answered: true, value: false, status: 200});
  assert.equal(bodyCalls, 1);
});

test('cancellation and non-transport failures are never retried', async () => {
  for (const error of [Object.assign(new Error('cancelled'), {name: 'AbortError'}), new Error('ULTIMATE_AUTOPILOT_DATABASE_MIGRATION_REQUIRED')]) {
    let calls = 0;
    await assert.rejects(
      autopilotRpcVerdict(URL_READY, () => ({}), {
        request: async () => { calls++; throw error; },
        wait: async () => assert.fail('a non-transport failure must not back off'),
      }),
      thrown => thrown === error,
    );
    assert.equal(calls, 1);
  }
});

test('the deploy entrypoint retries both RPC reads and keeps its fail-closed codes', () => {
  const source = readFileSync(new URL('../../scripts/gcp/deploy-lesson-autopilots.mjs', import.meta.url), 'utf8');
  assert.match(source, /rest\/v1\/rpc\/ultimate_autopilot_ready/);
  assert.match(source, /rest\/v1\/rpc\/register_ultimate_autopilot_runtime/);
  assert.ok(!/await fetch\(/.test(source), 'both readiness reads must go through the retrying verdict helper');
  assert.match(source, /ULTIMATE_AUTOPILOT_DATABASE_MIGRATION_REQUIRED/);
  assert.match(source, /ULTIMATE_AUTOPILOT_RUNTIME_NOT_RECORDED/);
  assert.match(source, /ULTIMATE_AUTOPILOT_RUNTIME_IMAGE_MISMATCH/);
  assert.match(source, /VERIFIED_REPAIR_IMAGE_REQUIRED/);
});

test('the release gate still runs this deploy step and its regressions', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/deploy-google-course-worker.yml', import.meta.url), 'utf8');
  const step = workflow.indexOf('Deploy three lesson autopilot roles and verify immutable configurations');
  assert.ok(step > 0, 'the three-role deploy step must remain in the release');
  const body = workflow.slice(step, workflow.indexOf('Verify all five deployed worker image digests', step));
  assert.match(body, /node scripts\/gcp\/deploy-lesson-autopilots\.mjs/, 'the failed script must still run');
  assert.match(body, /IMAGE_SHA: \$\{\{ github\.sha \}\}/, 'the immutable image identity must still be supplied');
  assert.match(body, /SUPABASE_SERVICE_ROLE_KEY: \$\{\{ secrets\.SUPABASE_SERVICE_ROLE_KEY \}\}/, 'the approved runtime credential must still be supplied');
  assert.match(workflow, /node --test [^\n]*scripts\/gcp\/deploy-lesson-autopilots\.test\.mjs/);
});
