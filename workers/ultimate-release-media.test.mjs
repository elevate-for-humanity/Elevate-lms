import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(readFileSync(new URL('../lib/ultimate-course-builder/release/release-service.ts', import.meta.url), 'utf8'), { mode: 'transform' })
  .replace(/^import .*;\n/gm, '').replace('export class ', 'class ');
const Service = new Function('assertCompleteLesson', 'ULTIMATE_LESSON_CONTRACT_VERSION', source + '\nreturn UltimateReleaseService;')(
  a => { if (!a.verified) throw new Error('QA_FAILED'); }, 'current');
const lesson = () => ({
  title: 'Lesson', videoUrl: 'https://media.example/film.mp4', script: 'Verified narration',
  storyboard: { scenes: [{ id: 'scene' }] }, segments: [{ stage: 'problem_hook', text: 'Teaching' }], sourceLessonBuildId: 'lesson-build',
  contractArtifacts: { verified: true, lesson_film_render: { render: { videoUrl: 'https://media.example/film.mp4', duration: 249.2 } },
    finished_media_qa: { mediaQA: { inspection: { mediaSha256: 'verified-hash' } } } }
});
const pkg = { courseId: 'course', buildId: 'build', profile: {}, contractVersion: 'current' };
function database(existing = null, result = { id: 'media' }) {
  const writes = []; const filters = [];
  return { writes, filters, from(table) {
    assert.equal(table, 'video_jobs');
    let writing = false;
    const q = {
      select() { return q; }, eq(k,v) { filters.push([k,v]); return q; },
      is(k,v) { filters.push([k,v]); return q; },
      update(v) { writing = true; writes.push(['update',v]); return q; },
      insert(v) { writing = true; writes.push(['insert',v]); return q; },
      async maybeSingle() { return { data: writing ? result : existing, error: null }; }
    }; return q;
  } };
}
test('records the verified finished film without enqueueing a renderer', async () => {
  const db = database();
  assert.equal(await new Service(db).recordApprovedFilm(pkg, lesson(), 'lesson', 'actor', new Date().toISOString()), 'media');
  const media = db.writes[0][1];
  assert.equal(media.status, 'complete'); assert.equal(media.review_status, 'approved');
  assert.equal(media.lesson_id, 'lesson'); assert.equal(media.duration_seconds, 250);
  assert.equal(media.quality_evidence.mediaSha256, 'verified-hash');
  assert.equal(media.quality_evidence.sourceLessonBuildId, 'lesson-build');
});
test('rejects incomplete QA before any media write', async () => {
  const db = database(); const l = lesson(); l.contractArtifacts.verified = false;
  await assert.rejects(new Service(db).recordApprovedFilm(pkg,l,'lesson','actor','now'), /QA_FAILED/);
  assert.equal(db.writes.length,0);
});
test('rejects a release URL that differs from the verified film', async () => {
  const db = database(); const l = lesson(); l.videoUrl = 'https://media.example/unverified.mp4';
  await assert.rejects(new Service(db).recordApprovedFilm(pkg,l,'lesson','actor','now'), /FILM_MISMATCH/);
  assert.equal(db.writes.length,0);
});
for (const existing of [
  { id: 'old', status: 'rendering', lease_expires_at: null },
  { id: 'old', status: 'queued', lease_expires_at: new Date(Date.now()+600000).toISOString() }
]) test('preserves an active media job: '+existing.status, async () => {
  const db=database(existing);
  await assert.rejects(new Service(db).recordApprovedFilm(pkg,lesson(),'lesson','actor','now'), /JOB_ACTIVE/);
  assert.equal(db.writes.length,0);
});
test('conditional write preserves a concurrently claimed media job', async () => {
  const db=database({ id:'old',status:'queued' },null);
  await assert.rejects(new Service(db).recordApprovedFilm(pkg,lesson(),'lesson','actor','now'), /JOB_CHANGED/);
  assert.ok(db.filters.some(([k,v])=>k==='status'&&v==='queued'));
  assert.ok(db.filters.some(([k,v])=>k==='lease_token'&&v===null));
});

test('canonical lesson publication attaches the verified primary media record', async () => {
  const mediaDb=database(); const writes=[];
  const l={...lesson(),canonicalLessonId:'lesson',slug:'lesson',orderIndex:1,objectives:['Objective'],
    content:{activities:[]},assessment:{questions:[],reassessment:[]},timeline:{segments:[]}};
  const db={ from(table) {
    if(table==='video_jobs') return mediaDb.from(table);
    let value;
    const q={
      select(){return q;},eq(){return q;},
      update(v){value=v; writes.push([table,v]);return q;},
      async maybeSingle(){return {data:table==='course_modules'?{id:'module'}:{id:'lesson',module_id:'module',slug:'lesson'},error:null};},
      async single(){return {data:{video_url:l.videoUrl,content_json:{contractVersion:'current'},status:'published'},error:null};},
      then(resolve){resolve({error:null});}
    };return q;
  }};
  await new Service(db).applyPackage({...pkg,lessons:[l]},'actor');
  const row=writes.find(([table])=>table==='course_lessons')[1];
  assert.equal(row.video_job_id,'media');
  assert.equal(row.video_status,'complete');assert.equal(row.media_quality_status,'approved');
  assert.equal(row.module_id,'module');assert.equal(row.status,'published');
  assert.equal(row.media_quality_evidence.mediaSha256,'verified-hash');
});
