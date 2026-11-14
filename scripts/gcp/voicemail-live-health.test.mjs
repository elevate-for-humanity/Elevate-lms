import test from 'node:test';
import assert from 'node:assert/strict';
import {readVoicemailAdminHealth} from './voicemail-live-health.mjs';
const healthy = {commit: 'a'.repeat(40), ready: true, healthy: true};
const timeout = () => new DOMException('request timed out', 'TimeoutError');

test('retrieves a validated public Admin identity without supplying credentials', async () => {
  const calls = [];
  const health = await readVoicemailAdminHealth('https://admin.elevateforhumanity.org', async (url, options) => {
    calls.push({url, options});
    return Response.json(healthy);
  });
  assert.deepEqual(health, healthy);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://admin.elevateforhumanity.org/api/health');
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.ok(calls[0].options.signal instanceof AbortSignal);
  assert.equal('headers' in calls[0].options, false);
});

test('recovers from one transient read timeout with a bounded wait', async () => {
  let reads = 0;
  const pauses = [];
  const result = await readVoicemailAdminHealth('https://admin.elevateforhumanity.org', async () => {
    if (++reads === 1) throw timeout();
    return Response.json(healthy);
  }, async (ms) => { pauses.push(ms); });
  assert.equal(result.commit, healthy.commit);
  assert.equal(reads, 2);
  assert.deepEqual(pauses, [500]);
});

test('fails closed after three timeouts without an unbounded retry loop', async () => {
  let reads = 0;
  const pauses = [];
  await assert.rejects(readVoicemailAdminHealth('https://admin.elevateforhumanity.org', async () => {
    reads++;
    throw timeout();
  }, async (ms) => { pauses.push(ms); }), /VOICEMAIL_ADMIN_HEALTH_TIMEOUT_EXHAUSTED/);
  assert.equal(reads, 3);
  assert.deepEqual(pauses, [500, 1000]);
});

test('never retries HTTP errors or accepts malformed live identity', async () => {
  let reads = 0;
  await assert.rejects(readVoicemailAdminHealth('https://admin.elevateforhumanity.org', async () => {
    reads++;
    return new Response(null, {status: 503});
  }, async () => {}), /VOICEMAIL_ADMIN_HEALTH_HTTP_503/);
  assert.equal(reads, 1);
  reads = 0;
  await assert.rejects(readVoicemailAdminHealth('https://admin.elevateforhumanity.org', async () => {
    reads++;
    return Response.json({commit: 'stale'});
  }, async () => {}), /VOICEMAIL_ADMIN_HEALTH_IDENTITY_INVALID/);
  assert.equal(reads, 1);
});
