import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { resolveCourseVideoPlayback } from '../../lib/video/course-video-playback.mjs';

const courseId = 'e9a2547c-ae03-418e-97fc-51377d438f8c';
const lessonId = 'c3aba828-774a-4c35-a592-7f1b9d85a6c2';
const key = `course-videos/manual-lessons/${courseId}/${lessonId}/71bf6654-42c8-46e5-8f16-40f5f45e089b.mp4`;
const video = { course_id: courseId, lesson_id: lessonId, storage_path: key, video_url: 'https://media.example/expired?X-Amz-Expires=3600' };

test('manual films renew their durable key even when a saved signed URL exists', async () => {
  const result = await resolveCourseVideoPlayback(video, {
    signExternal: async (actual) => { assert.equal(actual, key); return 'https://media.example/fresh'; },
    signLegacy: () => assert.fail('manual media must not use Supabase storage'),
  });
  assert.equal(result, 'https://media.example/fresh');
});
test('failed renewal cannot expose an expired URL or redirect the film to another bucket', async () => {
  await assert.rejects(resolveCourseVideoPlayback(video, {
    signExternal: async () => null,
    signLegacy: () => assert.fail('no bucket fallback'),
  }), /RENEWAL_FAILED/);
});
test('manual keys must match both canonical identities and a safe stored filename', async () => {
  for (const changed of [{ lesson_id: 'another-lesson' }, { course_id: 'another-course' }, { storage_path: key.replace('71bf6654-42c8-46e5-8f16-40f5f45e089b.mp4', '../private.mp4') }]) {
    await assert.rejects(resolveCourseVideoPlayback({ ...video, ...changed }, {
      signExternal: () => assert.fail('mismatched identity must not be signed'),
      signLegacy: () => assert.fail('mismatched identity must not be signed'),
    }), /IDENTITY_MISMATCH/);
  }
});
test('legacy public URLs and private Supabase records retain their existing behavior', async () => {
  const signExternal = () => assert.fail('legacy video must not use external signer');
  assert.equal(await resolveCourseVideoPlayback({ video_url: 'https://legacy.example/film.mp4' }, { signExternal }), 'https://legacy.example/film.mp4');
  assert.equal(await resolveCourseVideoPlayback({ storage_path: 'legacy/film.mp4' }, { signExternal, signLegacy: async () => 'https://legacy.example/signed' }), 'https://legacy.example/signed');
});

const source = stripTypeScriptTypes(readFileSync(new URL('../../apps/admin/app/api/admin/videos/route.ts', import.meta.url), 'utf8'), { mode: 'transform' })
  .replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm, '').replace(/^export /gm, '');
function route({ authorized = true, storedVideo = video } = {}) {
  const calls = [];
  const query = { select() { return this; }, eq() { return this; }, order() { return this; }, async limit() { return { data: [storedVideo], error: null }; } };
  const values = {
    NextResponse: Response,
    apiRequireAdmin: async () => { calls.push('auth'); return authorized ? { id: 'admin' } : { error: new Response(null, { status: 403 }) }; },
    requireAdminClient: async () => ({ from: () => query, storage: { from: () => assert.fail('manual film cannot enter Supabase signer') } }),
    applyRateLimit: async () => null,
    safeError: (error, status) => Response.json({ error }, { status }),
    safeInternalError: () => Response.json({ error: 'failed' }, { status: 500 }),
    withApiAudit: (_path, handler) => handler,
    getSignedElevateMediaUrl: async (actual, expiry) => { calls.push('sign'); assert.equal(actual, storedVideo.storage_path); assert.equal(expiry, 3600); return 'https://media.example/fresh'; },
    resolveCourseVideoPlayback,
  };
  return { handler: new Function(...Object.keys(values), source + ';return GET;')(...Object.values(values)), calls };
}
test('the actual admin route authenticates and returns renewed manual playback', async () => {
  const f = route();
  const response = await f.handler({ nextUrl: new URL(`https://admin.example/api/admin/videos?courseId=${courseId}`) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data[0].url, 'https://media.example/fresh');
  assert.deepEqual(f.calls, ['auth', 'sign']);
});
test('the actual route rejects unauthorized requests before signing media', async () => {
  const f = route({ authorized: false });
  const response = await f.handler({ nextUrl: new URL(`https://admin.example/api/admin/videos?courseId=${courseId}`) });
  assert.equal(response.status, 403);
  assert.deepEqual(f.calls, ['auth']);
});

const reviewedKey = `course-videos/manual-lessons/${courseId}/${lessonId}/reviewed-${'a'.repeat(64)}/completed-lesson-manual.mp4`;
test('the authenticated route renews an exact source-hashed reviewed film folder', async () => {
  const f = route({ storedVideo: { ...video, storage_path: reviewedKey } });
  const response = await f.handler({ nextUrl: new URL(`https://admin.example/api/admin/videos?courseId=${courseId}`) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data[0].url, 'https://media.example/fresh');
  assert.deepEqual(f.calls, ['auth', 'sign']);
});
test('review folders reject malformed hashes, unrelated files, extra nesting and cross-lesson keys', async () => {
  for (const invalid of [reviewedKey.replace('a'.repeat(64),'short'),reviewedKey.replace('completed-lesson-manual.mp4','source.mp4'),reviewedKey.replace('/completed-lesson-manual.mp4','/extra/completed-lesson-manual.mp4'),reviewedKey.replace(lessonId,'00000000-0000-4000-8000-000000000000')]) {
    await assert.rejects(resolveCourseVideoPlayback({ ...video, storage_path: invalid }, {
      signExternal: () => assert.fail('invalid identity must not be signed'),
      signLegacy: () => assert.fail('no fallback'),
    }), /IDENTITY_MISMATCH/);
  }
});
