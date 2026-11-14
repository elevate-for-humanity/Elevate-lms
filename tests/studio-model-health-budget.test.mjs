import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { probeOwnedModel } from '../lib/ai/providers/owned-model-health.mjs';
import { runHealthProbe, STUDIO_HEALTH_MODEL_MS, STUDIO_HEALTH_SECRET_MS, STUDIO_HEALTH_PROBE_MS } from '../lib/devstudio/health-probes.mjs';
const env = { ELEVATE_LLM_CPU_URL: 'https://fixture.run.app', ELEVATE_LLM_CPU_SECRET: 'fixture-private-token' };

function slowRequest(_url, { signal }) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(new Response(JSON.stringify({ data: [{ id: 'elevate-local' }] }))), 1000);
    signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
  });
}
test('a slow model returns a classified timeout before the enclosing health check expires', async () => {
  const probe = await runHealthProbe(async signal => ({
    providers: { groq: true },
    ownedModel: await probeOwnedModel({ env, request: slowRequest, signal, timeoutMs: 20 }),
  }), { timeoutMs: 250 });
  assert.equal(probe.status, 'completed');
  assert.deepEqual(probe.value.providers, { groq: true });
  assert.deepEqual(probe.value.ownedModel, { configured: true, verified: false, status: 'request_failed', reason: 'timeout' });
  assert.doesNotMatch(JSON.stringify(probe), /fixture-private-token|fixture\.run\.app/);
});
test('a responsive model retains verified model identity', async () => {
  const result = await probeOwnedModel({ env, timeoutMs: 50, request: async () => new Response(JSON.stringify({ data: [{ id: 'elevate-local' }] })) });
  assert.equal(result.verified, true);
  assert.equal(result.status, 'reachable');
});
test('Studio allocates the inner deadline within the unchanged outer budget and forwards it', () => {
  assert.ok(STUDIO_HEALTH_SECRET_MS + STUDIO_HEALTH_MODEL_MS < STUDIO_HEALTH_PROBE_MS);
  const handler = readFileSync(new URL('../lib/devstudio/health-handler.ts', import.meta.url), 'utf8');
  const runtime = readFileSync(new URL('../lib/ai/provider-runtime.ts', import.meta.url), 'utf8');
  assert.match(handler, /ownedModelTimeoutMs: STUDIO_HEALTH_MODEL_MS/);
  assert.match(runtime, /timeoutMs: options\.ownedModelTimeoutMs/);
});
