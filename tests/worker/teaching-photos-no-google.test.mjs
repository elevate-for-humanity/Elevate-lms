import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';

const source = readFileSync(new URL('../../lib/ultimate-course-builder/adapters/teaching-photos.ts', import.meta.url), 'utf8');
function prepare(card) {
  assert.doesNotMatch(source, /import .*google-teaching-photo|import .*photo-repair|generateTeachingPhoto|recoverTeachingPhoto/);
  const code = stripTypeScriptTypes(source.replace(/^import .*;\n/gm, '').replace('export async function', 'async function'));
  const dependencies = {
    approvedReferencePhotoPicker: async () => null,
    courseSelectedStill: async () => null,
    reportCourseProgress: () => {},
    courseProgressSignal: () => null,
    selectReviewedTeachingPhoto: () => null,
    compatibleVisualTask: () => false,
    conceptualTeachingCard: card,
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
    storage: { from: () => bucket },
    from: () => ({ select() { return this; }, eq() { return this; }, then(resolve) { resolve({ data: [] }); } }),
  };
}
test('missing saved images never invoke a remote generator and persist local cue assets', async () => {
  let cards = 0;
  const run = prepare(async ({ index }) => {
    cards++;
    return { bytes: Buffer.from('cue-' + index), mimeType: 'image/png', repair: { method: 'lesson-conceptual-card-v1' } };
  });
  const result = await run(input, database());
  assert.equal(cards, 3);
  assert.equal(result.teachingPhotos.core.length, 3);
  assert.ok(result.teachingPhotos.core.every(photo => photo.provider === 'elevate-instructional'));
});
test('resume reuses verified saved bytes without generating replacement visuals', async () => {
  let cards = 0;
  const run = prepare(async ({ index }) => {
    cards++;
    return { bytes: Buffer.from('cue-' + index), mimeType: 'image/png', repair: { method: 'lesson-conceptual-card-v1' } };
  });
  const db = database();
  const first = await run(input, db);
  const resumed = await run(input, db);
  assert.equal(cards, 3);
  assert.deepEqual(resumed.teachingPhotos, first.teachingPhotos);
});
test('a missing required visual reports the exact cue without Google fallback', async () => {
  const run = prepare(async () => null);
  await assert.rejects(run(input, database()), /COURSE_VISUAL_ASSET_REQUIRED:core:cue=0/);
});
