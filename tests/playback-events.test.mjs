import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { sendPlaybackEvent } from '../lib/video/send-playback-event.mjs';

test('failed saves are visible and transient errors retry at most three times', async () => {
  let calls = 0;
  const waits = [];
  const result = await sendPlaybackEvent({ eventType: 'play' }, {
    fetchImpl: async () => { calls++; return new Response('{"error":"Unavailable"}', { status: 503 }); },
    wait: async ms => { waits.push(ms); },
  });
  assert.equal(calls, 3);
  assert.deepEqual(waits, [250, 500]);
  assert.equal(result.saved, false);
  assert.equal(result.error, 'Unavailable');
});

test('auth and schedule denials do not retry; success requires save acknowledgement', async () => {
  for (const status of [401, 403]) {
    let calls = 0;
    const result = await sendPlaybackEvent({ eventType: 'play' }, {
      fetchImpl: async () => { calls++; return new Response('{"code":"SCHEDULE_REQUIRED","error":"Choose study times"}', { status }); },
    });
    assert.equal(calls, 1);
    assert.equal(result.saved, false);
    assert.equal(result.code, 'SCHEDULE_REQUIRED');
  }
  assert.equal((await sendPlaybackEvent({}, {
    fetchImpl: async () => new Response('{"saved":true}'),
  })).saved, true);
});

const routeSource = readFileSync(new URL('../apps/lms/app/api/video-playback-events/route.ts', import.meta.url), 'utf8');
async function routeFixture(options = {}) {
  const inserts = [];
  const query = {
    select() { return this; }, eq() { return this; },
    async maybeSingle() {
      return { data: this.table === 'profiles' ? { role: options.role || 'student' } :
        { course_id: 'course', status: 'published', is_published: true }, error: null };
    },
    async insert(row) { inserts.push(row); return { error: options.insertError || null }; },
  };
  const db = { from(table) { return { ...query, table }; } };
  const deps = {
    NextResponse: { json: (body, init) => Response.json(body, init) },
    applyRateLimit: async () => null,
    createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: options.anonymous ? null : { id: 'learner' } }, error: null }) },
      rpc: async () => ({ data: options.pacing || { theoryWindow: { allowed: true }, lessons: [{ id: 'lesson', available: true }] }, error: null }),
    }),
    resolveCoursePreview: async () => ({ active: !!options.preview }),
    resolvePortalPreviewSubject: async () => ({ previewing: !!options.portalPreview }),
    resolveCourseEnrollment: async () => options.noEnrollment ? null : ({ status: 'active' }),
    assertLessonAccess: async () => { if (options.denied) throw new Error('ACCESS_DENIED'); },
    accessErrorResponse: () => ({ status: 403, body: { error: 'Locked' } }),
    requireAdminClient: async () => db,
    logger: { error() {} },
  };
  const names = Object.keys(deps);
  const source = stripTypeScriptTypes(routeSource.replace(/^import .*;\n/gm, ''))
    .replace(/export const /g, 'const ').replace('export async function POST', 'async function POST');
  const POST = new Function(...names, source + '\nreturn POST;')(...names.map(name => deps[name]));
  const response = await POST(new Request('https://app.elevateforhumanity.org/api/video-playback-events', {
    method: 'POST', body: JSON.stringify({
      courseId: 'course', lessonId: 'lesson', sessionId: 'session', eventType: 'heartbeat', currentTime: 31, duration: 300,
    }),
  }));
  return { response, inserts };
}

test('actual route denies anonymous, preview, staff, unenrolled, closed schedules and prerequisites before insertion', async () => {
  for (const options of [
    { anonymous: true }, { preview: true }, { portalPreview: true }, { role: 'admin' },
    { noEnrollment: true }, { denied: true },
    { pacing: { theoryWindow: { allowed: false, reason: 'SCHEDULE_REQUIRED' } } },
    { pacing: { lessons: [{ id: 'lesson', available: false }] } },
  ]) {
    const { response, inserts } = await routeFixture(options);
    assert.ok([401, 403].includes(response.status));
    assert.equal(inserts.length, 0);
  }
});

test('actual route saves authenticated accessible learner evidence and reports database failures', async () => {
  const { response, inserts } = await routeFixture();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).saved, true);
  assert.equal(inserts[0].user_id, 'learner');
  assert.equal(inserts[0].current_time, 31);
  assert.equal(inserts[0].details.evidenceType, 'client_media_event');
  assert.equal((await routeFixture({ insertError: { message: 'db down' } })).response.status, 500);
});
