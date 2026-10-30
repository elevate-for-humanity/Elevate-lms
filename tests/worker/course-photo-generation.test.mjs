import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';
import { recoverTeachingPhoto } from '../../lib/ultimate-course-builder/adapters/photo-repair.mjs';

const source = readFileSync(new URL('../../lib/ultimate-course-builder/adapters/teaching-photos.ts', import.meta.url), 'utf8');
function prepare(generate) {
  assert.doesNotMatch(source, /conceptualTeachingCard/);
  const code = stripTypeScriptTypes(source.replace(/^import .*;\n/gm, '').replace('export async function', 'async function'));
  const dependencies = {
    approvedReferencePhotoPicker: async () => null,
    courseSelectedStill: async () => null,
    reportCourseProgress: () => {},
    courseProgressSignal: () => null,
    selectReviewedTeachingPhoto: () => null,
    compatibleVisualTask: () => false,
    generateTeachingPhoto: generate,
    recoverTeachingPhoto,
    createHash,
    describeWorkerError: error => error.message,
    optionalStorageCacheMiss: error => error.status === 404,
  };
  return Function(...Object.keys(dependencies), code + '\nreturn prepareTeachingPhotos;')(...Object.values(dependencies));
}
const input = {
  lessonPresentation: 'approved-premium-v1', lessonId: 'lesson', courseTitle: 'EPA 608',
  artifacts: { storyboard: { storyboard: { scenes: [{
    id: 'core', recapText: 'Review recovery.',
    teachingVisual: { steps: [{ narrationQuote: 'Identify the refrigerant.' }] },
  }] } } },
};
function database() {
  const files = new Map();
  const bucket = {
    download: async path => files.has(path)
      ? { data: new Blob([files.get(path)]) }
      : { error: { status: 404 } },
    upload: async (path, bytes) => { files.set(path, bytes); return {}; },
    createSignedUrl: async path => ({ data: { signedUrl: 'https://media.example/' + path } }),
  };
  return {
    files, storage: { from: () => bucket },
    from: () => ({ select() { return this; }, eq() { return this; }, then(resolve) { resolve({ data: [] }); } }),
  };
}
test('missing saved images generate photographs and persist distinct cue assets', async () => {
  let calls = 0;
  const run = prepare(async () => ({ bytes: Buffer.from('photo-' + calls++), mimeType: 'image/jpeg', provider: 'google' }));
  const result = await run(input, database());
  assert.equal(calls, 3);
  assert.equal(result.teachingPhotos.core.length, 3);
  assert.ok(result.teachingPhotos.core.every(photo => photo.provider === 'google' && photo.storagePath.endsWith('.jpg')));
});
test('resume reuses verified photographs without repeating paid generation', async () => {
  let calls = 0;
  const run = prepare(async () => ({ bytes: Buffer.from('photo-' + calls++), mimeType: 'image/png', provider: 'google' }));
  const db = database();
  const first = await run(input, db);
  const resumed = await run(input, db);
  assert.equal(calls, 3);
  assert.deepEqual(resumed.teachingPhotos, first.teachingPhotos);
});
test('an exact cue is optional when a relevant course photograph can be generated', async () => {
  let calls = 0;
  const prompts = [];
  const run = prepare(async prompt => {
    prompts.push(prompt);
    if (calls++ % 2 === 0) throw Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED');
    return { bytes: Buffer.from('related-' + calls), mimeType: 'image/png', provider: 'google' };
  });
  const result = await run(input, database());
  assert.equal(calls, 6);
  assert.equal(result.teachingPhotos.core.length, 3);
  assert.ok(result.teachingPhotos.core.every(photo => photo.repair.method === 'course-related-photo-v1'));
  assert.match(prompts[1], /EPA 608/);
  assert.doesNotMatch(prompts[1], /salon/);
});
test('provider failures are retained without silently creating text cards', async () => {
  let calls = 0;
  const run = prepare(async () => { calls++; throw Error('GOOGLE_TEACHING_PHOTO_HTTP_403:billing'); });
  await assert.rejects(run(input, database()), /GOOGLE_TEACHING_PHOTO_HTTP_403.*core.*cue/);
  assert.equal(calls, 1);
});
test('a safety-blocked request never retries with a rewritten prompt', async () => {
  let calls = 0;
  const run = prepare(async () => { calls++; throw Object.assign(Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED'), { details: { blocked: true } }); });
  await assert.rejects(run(input, database()), /INSTRUCTIONAL_VISUAL_REPLACEMENT_REQUIRED/);
  assert.equal(calls, 1);
});

test('text-card cache from the retired v3 path cannot satisfy a photographic request', async () => {
  const prompts = [];
  let calls = 0;
  const run = prepare(async prompt => {
    prompts.push(prompt);
    return { bytes: Buffer.from('new-photo-' + calls++), mimeType: 'image/png', provider: 'google' };
  });
  await run(input, database());
  const db = database();
  const cardBytes = Buffer.from('old text card');
  const sha256 = createHash('sha256').update(cardBytes).digest('hex');
  const storagePath = 'approved-teaching-photos/' + sha256 + '.png';
  db.files.set(storagePath, cardBytes);
  prompts.forEach((prompt, index) => {
    const oldHash = createHash('sha256').update(JSON.stringify({
      version: 'storage-first-photo-cues-v3', lesson: input.lessonId, scene: 'core', index, prompt,
    })).digest('hex');
    db.files.set('approved-teaching-photo-index/' + oldHash + '.json', Buffer.from(JSON.stringify({
      storagePath, sha256, provider: 'elevate-instructional', repair: { method: 'lesson-conceptual-card-v1' },
    })));
  });
  const result = await run(input, db);
  assert.equal(calls, 6);
  assert.ok(result.teachingPhotos.core.every(photo => photo.provider === 'google' && photo.sha256 !== sha256));
  assert.ok(db.files.has(storagePath));
});
