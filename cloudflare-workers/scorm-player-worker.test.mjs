import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from './scorm-player-worker.js';
const user = '11111111-1111-4111-8111-111111111111',
  course = '22222222-2222-4222-8222-222222222222',
  enrollment = '33333333-3333-4333-8333-333333333333';
const env = { SUPABASE_PUBLISHABLE_KEY: 'public-test-key' };
function request(data = { courseId: course, progress: 50, completed: false }, extra = {}) {
  return new Request('https://scorm.elevateforhumanity.org/api/scorm/track', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer user-session',
      'Content-Type': 'application/json',
      Origin: 'https://lms.elevateforhumanity.org',
      ...extra,
    },
    body: JSON.stringify(data),
  });
}
async function run(req, responses, config = env) {
  const original = globalThis.fetch,
    calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), ...options });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    assert.ok(next, 'unexpected upstream request');
    return next;
  };
  try {
    const response = await worker.fetch(req, config);
    return { response, body: await response.json(), calls };
  } finally {
    globalThis.fetch = original;
  }
}
const auth = () => Response.json({ id: user });
const lookup = () => Response.json([{ id: enrollment, user_id: user, scorm_package_id: course }]);
const receipt = () =>
  Response.json([{ id: enrollment, user_id: user, progress_percentage: 50, status: 'incomplete' }]);
test('anonymous and mismatched identities cannot write progress', async () => {
  let r = await run(request(undefined, { Authorization: '' }), []);
  assert.equal(r.response.status, 401);
  assert.equal(r.calls.length, 0);
  r = await run(request({ courseId: course, progress: 50, completed: false, userId: course }), [
    auth(),
  ]);
  assert.equal(r.response.status, 403);
  assert.equal(r.calls.length, 1);
});
test('a verified user writes only their existing canonical enrollment and receives a durable receipt', async () => {
  const r = await run(request(), [auth(), lookup(), receipt()]);
  assert.equal(r.response.status, 200);
  assert.equal(r.body.success, true);
  assert.equal(r.body.enrollmentId, enrollment);
  assert.ok(r.calls.every((c) => c.headers.Authorization === 'Bearer user-session'));
  assert.equal(r.calls[2].method, 'PATCH');
  assert.match(r.calls[2].url, /user_id=eq\./);
  assert.equal(r.response.headers.get('Cache-Control'), 'no-store');
  assert.equal(
    r.response.headers.get('Access-Control-Allow-Origin'),
    'https://lms.elevateforhumanity.org',
  );
});
test('missing storage configuration never reports success', async () => {
  const r = await run(request(), [], {});
  assert.equal(r.response.status, 503);
  assert.equal(r.body.success, undefined);
});
test('empty enrollment and zero-row writes are rejected', async () => {
  let r = await run(request(), [auth(), Response.json([])]);
  assert.equal(r.response.status, 403);
  r = await run(request(), [auth(), lookup(), Response.json([])]);
  assert.equal(r.response.status, 503);
  assert.equal(r.body.error, 'TRACKING_WRITE_UNCONFIRMED');
});
test('failed database writes and mismatched receipts never report success', async () => {
  for (const result of [
    new Response('', { status: 500 }),
    Response.json([
      { id: enrollment, user_id: course, progress_percentage: 50, status: 'incomplete' },
    ]),
    Response.json([
      { id: enrollment, user_id: user, progress_percentage: 0, status: 'incomplete' },
    ]),
  ]) {
    const r = await run(request(), [auth(), lookup(), result]);
    assert.equal(r.response.status, 503);
    assert.equal(r.body.success, undefined);
  }
});
test('expired sessions and provider outages are distinguished without disclosing payloads', async () => {
  let r = await run(request(), [new Response('', { status: 401 })]);
  assert.equal(r.response.status, 401);
  r = await run(request(), [new Error('private upstream details')]);
  assert.equal(r.response.status, 503);
  assert.doesNotMatch(JSON.stringify(r.body), /private upstream/);
});
test('unapproved origins and invalid completion/progress are rejected before upstream access', async () => {
  const foreign = await run(request(undefined, { Origin: 'https://untrusted.example' }), []);
  assert.equal(foreign.response.status, 403);
  for (const data of [
    { courseId: course, progress: 101, completed: false },
    { courseId: course, progress: 50, completed: true },
    { courseId: 'invalid', progress: 50, completed: false },
    { courseId: course, progress: '50', completed: false },
  ]) {
    const r = await run(request(data), []);
    assert.equal(r.response.status, 400);
    assert.equal(r.calls.length, 0);
  }
});
test('preflight explicitly supports authorization only for approved origins', async () => {
  let r = await worker.fetch(
    new Request('https://scorm.elevateforhumanity.org/api/scorm/track', {
      method: 'OPTIONS',
      headers: { Origin: 'https://lms.elevateforhumanity.org' },
    }),
    env,
  );
  assert.equal(r.status, 204);
  assert.match(r.headers.get('Access-Control-Allow-Headers'), /Authorization/);
  r = await worker.fetch(
    new Request('https://scorm.elevateforhumanity.org/api/scorm/track', {
      method: 'OPTIONS',
      headers: { Origin: 'https://untrusted.example' },
    }),
    env,
  );
  assert.equal(r.status, 403);
});
