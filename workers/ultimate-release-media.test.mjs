import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { renderMediaUrl, renderPlaybackUrl } from '../lib/ultimate-course-builder/media/playback-source.mjs';

const prepareSource = stripTypeScriptTypes(readFileSync(new URL('../lib/ultimate-course-builder/release/prepare-publication.ts', import.meta.url), 'utf8'), { mode: 'transform' })
  .replace(/^import .*;\n/gm, '').replace('export function ', 'function ');
const prepare = new Function('assertCompleteLesson', 'ULTIMATE_LESSON_CONTRACT_VERSION', 'renderMediaUrl', 'renderPlaybackUrl', prepareSource + '\nreturn prepareUltimatePublication;')(
  a => { if (!a.verified) throw new Error('QA_FAILED'); }, 'current', renderMediaUrl, renderPlaybackUrl);
const serviceSource = stripTypeScriptTypes(readFileSync(new URL('../lib/ultimate-course-builder/release/release-service.ts', import.meta.url), 'utf8'), { mode: 'transform' })
  .replace(/^import .*;\n/gm, '').replace('export class ', 'class ');
const Service = new Function('prepareUltimatePublication', serviceSource + '\nreturn UltimateReleaseService;')(prepare);
const lesson = () => ({
  title: 'Lesson', videoUrl: 'https://media.example/film.mp4', script: 'Verified narration',
  canonicalLessonId: 'lesson', slug: 'lesson', orderIndex: 1, competencyId: 'competency',
  objectives: ['Objective'], content: { activities: [] }, assessment: { questions: [], reassessment: [] },
  timeline: { segments: [] }, storyboard: { scenes: [{ id: 'scene' }] },
  segments: [{ stage: 'problem_hook', text: 'Teaching' }], sourceLessonBuildId: 'lesson-build',
  contractArtifacts: { verified: true, lesson_film_render: { render: { videoUrl: 'https://media.example/film.mp4', duration: 249.2 } },
    finished_media_qa: { mediaQA: { inspection: { mediaSha256: 'verified-hash' } } } },
});
function scenario({ error = null, film = lesson() } = {}) {
  const calls = [];
  const db = {
    from() { throw new Error('CLIENT_SIDE_PARTIAL_PUBLICATION_FORBIDDEN'); },
    async rpc(name, args) { calls.push({ name, args }); return { data: [{ id: 'release', version: 1 }], error }; },
  };
  const service = new Service(db);
  service.derive = async () => ({ courseId: 'course', buildId: 'build', profile: {}, contractVersion: 'current', lessons: [film] });
  return { service, calls };
}
test('sends the verified finished film with its QA evidence in the one release transaction', async () => {
  const { service, calls } = scenario();
  await service.publish('build', 'actor');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'commit_ultimate_release');
  const media = calls[0].args.p_rows[0].media;
  assert.equal(media.status, 'complete'); assert.equal(media.review_status, 'approved');
  assert.equal(media.lesson_id, 'lesson'); assert.equal(media.duration_seconds, 250);
  assert.equal(media.quality_evidence.mediaSha256, 'verified-hash');
  assert.equal(media.quality_evidence.sourceLessonBuildId, 'lesson-build');
});
test('rejects incomplete QA before requesting the publication transaction', async () => {
  const film = lesson(); film.contractArtifacts.verified = false;
  const { service, calls } = scenario({ film });
  await assert.rejects(service.publish('build', 'actor'), /QA_FAILED/);
  assert.equal(calls.length, 0);
});
test('rejects a release URL that differs from the verified film before any request', async () => {
  const film = lesson(); film.videoUrl = 'https://media.example/unverified.mp4';
  const { service, calls } = scenario({ film });
  await assert.rejects(service.publish('build', 'actor'), /FILM_MISMATCH/);
  assert.equal(calls.length, 0);
});
// Actual row preservation and fencing are exercised in the rollback-only SQL
// regression. Here the client must propagate rejection without partial writes.
for (const state of ['rendering', 'queued-with-live-lease']) test('propagates active media rejection: ' + state, async () => {
  const error = new Error('ULTIMATE_PRIMARY_MEDIA_JOB_ACTIVE');
  const { service, calls } = scenario({ error });
  await assert.rejects(service.publish('build', 'actor'), e => e === error);
  assert.equal(calls.length, 1);
});
test('propagates a concurrently changed primary-media rejection without a partial fallback', async () => {
  const error = new Error('ULTIMATE_PRIMARY_MEDIA_JOB_CHANGED');
  const { service, calls } = scenario({ error });
  await assert.rejects(service.publish('build', 'actor'), e => e === error);
  assert.equal(calls.length, 1);
});
test('canonical lesson and media identities travel in the same transaction request', async () => {
  const { service, calls } = scenario();
  const fence = { jobId: 'job', workerId: 'worker', generation: 7 };
  await service.publish('build', 'actor', fence);
  const args = calls[0].args, prepared = args.p_rows[0];
  assert.equal(prepared.canonicalLessonId, prepared.media.lesson_id);
  assert.equal(prepared.row.video_url, prepared.media.video_url);
  assert.equal(prepared.row.content_json.contractVersion, args.p_package.contractVersion);
  assert.equal(prepared.row.status, 'published');
  assert.deepEqual(args.p_fence, fence);
});
