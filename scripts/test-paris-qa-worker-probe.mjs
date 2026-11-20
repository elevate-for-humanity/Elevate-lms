import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

const source = stripTypeScriptTypes(await readFile(
  new URL('../lib/devstudio/paris-code-engineer.ts', import.meta.url), 'utf8',
), { mode: 'strip' });
const start = source.indexOf('async function probeParisRepairWorkerInference()');
const end = source.indexOf('export async function stageParisCodeRepair(', start);
assert.ok(start >= 0 && end > start);

const qaUrl = 'https://isdgjcdabhxxozarmxta.supabase.co';
const worker = 'elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com';

function fixture({ url = qaUrl, hydratedUrl = url, identity = worker, inferenceError } = {}) {
  const calls = [];
  const probe = new Function(
    'process', 'resolveServerSupabaseRawEnv', 'NextResponse', 'hydrateProcessEnv',
    'getRuntimeReadiness', 'fetch', 'aiChat', 'REPAIR_INFERENCE_TIMEOUT_MS',
    source.slice(start, end) + ';return probeParisRepairWorkerInference;',
  )(
    { env: { PARIS_QA_WORKER_PROBE: 'true', AI_PROVIDER: 'elevate' } },
    () => ({ url }),
    { json: (body, options) => Response.json(body, options) },
    async () => { url = hydratedUrl; },
    () => ({ commit: 'a'.repeat(40), revision: 'qa-admin-1' }),
    async () => new Response(identity),
    async (options) => {
      calls.push(options);
      if (inferenceError) throw inferenceError;
      return { provider: 'elevate', model: 'elevate-local', content: 'PARIS_QA_WORKER_OK' };
    },
    1000,
  );
  return { probe, calls };
}

test('issues one fixed completion and returns only the verified receipt', async () => {
  const { probe, calls } = fixture();
  const receipt = await probe();
  assert.equal(receipt.status, 200);
  assert.equal(receipt.headers.get('cache-control'), 'no-store');
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].messages, [{ role: 'user', content: 'Reply with exactly PARIS_QA_WORKER_OK.' }]);
  assert.deepEqual(await receipt.json(), {
    workerIdentity: worker, provider: 'elevate', model: 'elevate-local', commit: 'a'.repeat(40),
    revision: 'qa-admin-1', passed: true, response: 'PARIS_QA_WORKER_OK',
  });
});

test('rejects a different Supabase project before and after secret hydration', async () => {
  for (const options of [{ url: 'https://example.invalid' }, { hydratedUrl: 'https://example.invalid' }]) {
    const { probe, calls } = fixture(options);
    assert.equal((await probe()).status, 404);
    assert.equal(calls.length, 0);
  }
});

test('requires the actual worker service account', async () => {
  const { probe, calls } = fixture({ identity: 'deployment@example.invalid' });
  assert.equal((await probe()).status, 503);
  assert.equal(calls.length, 0);
});

test('returns a redacted provider authentication status', async () => {
  const { probe } = fixture({ inferenceError: new Error('Elevate LLM worker 403: private provider detail') });
  const result = await probe();
  assert.equal(result.status, 502);
  const body = await result.json();
  assert.equal(body.providerHttpStatus, 403);
  assert.ok(!JSON.stringify(body).includes('private provider detail'));
});

test('the Admin route requires a primary Admin role before calling the probe', async () => {
  const route = stripTypeScriptTypes(await readFile(new URL(
    '../apps/admin/app/api/admin/dev-studio/engineering/route.ts', import.meta.url,
  ), 'utf8'), { mode: 'strip' });
  const start = route.indexOf('async function POST(');
  const end = route.indexOf('/** Dashboard status reads', start);
  assert.ok(start >= 0 && end > start);
  const post = new Function('applyRateLimit', 'apiRequireDevStudio', 'NextResponse',
    route.slice(start, end) + ';return POST;');
  const request = () => new Request('https://qa.example.invalid/api/admin/dev-studio/engineering', {
    method: 'POST',
    body: JSON.stringify({ action: 'qa-worker-inference' }),
  });
  const denied = post(async () => null, async () => ({ error: new Response(null, { status: 401 }) }), Response);
  assert.equal((await denied(request())).status, 401);
  const secondaryAdmin = post(async () => null, async () => ({ role: 'student', effectiveRoles: ['admin'] }), Response);
  assert.equal((await secondaryAdmin(request())).status, 403);
});
