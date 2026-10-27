import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { renderMediaUrl, renderPlaybackUrl } from '../lib/ultimate-course-builder/media/playback-source.mjs';
const source = stripTypeScriptTypes(readFileSync(new URL('../lib/ultimate-course-builder/release/release-service.ts', import.meta.url), 'utf8'), { mode: 'transform' })
  .replace(/^import .*;\n/gm, '').replace('export class ', 'class ');
const Service = new Function('assertCompleteLesson', 'ULTIMATE_LESSON_CONTRACT_VERSION', 'renderMediaUrl', 'renderPlaybackUrl', source + '\nreturn UltimateReleaseService;')(
  a => { if (!a.verified) throw new Error('QA_FAILED'); }, 'current', renderMediaUrl, renderPlaybackUrl);
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
      async maybeSingle(){return {data:table==='course_modules'?{id:'module'}:{id:'lesson',module_id:'module',slug:'lesson',lesson_type:'exam',practical_required:true,content_json:{experience:{practicalTask:{title:'Host-shop competency'}}}},error:null};},
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
  assert.equal(row.lesson_type,'exam');assert.equal(row.practical_required,true);
  assert.equal(row.content_json.experience.practicalTask.title,'Host-shop competency');
  assert.equal(row.content_json.mediaAttachment.publicationPending,false);
});

function readyLessonDatabase({published=false,broken=false,buildStatus='running'}={}) {
  const competency='competency-19';
  const profile={title:'Cosmetology',competencies:Array.from({length:19},(_,i)=>({id:i===18?competency:'competency-'+i,title:'Lesson '+(i+1)})),canonicalLessonIds:{[competency]:'canonical-19'}};
  const build={id:'build',course_id:'course',status:buildStatus,profile};
  const artifacts={verified:!broken,finished_media_qa:{mediaQA:{pass:true}},lesson_film_render:{render:{videoUrl:'https://media.example/19.mp4'}}};
  const lessons=[{id:'build-19',competency_id:competency,lesson_key:'color-theory',status:'built',artifacts}];
  const canonical=[{id:'canonical-19',status:published?'published':'draft',is_published:published}];
  const filters=[];
  const db={from(table){let requestedId,requestedIds;const q={select(){return q;},eq(k,v){filters.push([table,k,v]);if(k==='id')requestedId=v;return q;},in(_key,values){requestedIds=values;return q;},order(){return q;},single:async()=>({data:build,error:null}),then(resolve,reject){const data=table==='ultimate_lesson_builds'?lessons.filter(l=>!requestedId||l.id===requestedId):canonical.filter(row=>!requestedIds||requestedIds.includes(row.id));return Promise.resolve({data,error:null}).then(resolve,reject);}};return q;}};
  return {db,filters,build,lessons,canonical};
}
test('publishes a completed lesson at its course position while remaining lessons are unfinished',async()=>{
  const {db,filters}=readyLessonDatabase();const service=new Service(db);const packages=[];
  service.applyPackage=async(p,actor)=>{packages.push({p,actor});return 'now';};
  assert.deepEqual(await service.publishReadyLessons('build','owner'),['canonical-19']);
  assert.equal(packages.length,1);assert.equal(packages[0].p.lessons.length,1);
  assert.equal(packages[0].p.lessons[0].orderIndex,19);assert.equal(packages[0].actor,'owner');
  assert.ok(filters.some(([table,key,value])=>table==='ultimate_lesson_builds'&&key==='id'&&value==='build-19'));
});
test('already published lessons are preserved without applying a replacement package',async()=>{
  const {db}=readyLessonDatabase({published:true});const service=new Service(db);
  service.applyPackage=async()=>assert.fail('must preserve published film');
  assert.deepEqual(await service.publishReadyLessons('build','owner'),[]);
});
test('partial publication retains current lesson QA and whole-course release requirements',async()=>{
  const {db}=readyLessonDatabase({broken:true});const service=new Service(db);
  service.applyPackage=async()=>assert.fail('must not publish failed QA');
  await assert.rejects(service.publishReadyLessons('build','owner'),/QA_FAILED/);
  await assert.rejects(service.derive('build'),/BUILD_NOT_RELEASE_READY/);
});

test('whole-course release preserves the explicitly retained publications without fabricating contract artifacts',async()=>{
 const f=readyLessonDatabase({buildStatus:'built'});f.build.profile.publishCompletedLessons=true;
 const ids=[];
 for(let i=0;i<18;i++){
  const id='prior-'+i;ids.push(id);f.build.profile.canonicalLessonIds['competency-'+i]=id;
  f.canonical.push({id,title:'Prior '+i,slug:id,order_index:i+1,status:'published',is_published:true,video_status:'complete',video_url:'https://media.example/'+id+'.mp4'});
 }
 f.build.profile.preservedPublishedLessonIds=ids;
 const p=await new Service(f.db).derive('build');assert.equal(p.lessons.length,19);
 assert.equal(p.lessons.filter(l=>l.preservedPublished).length,18);
 assert.equal(p.lessons[0].contractArtifacts,undefined);assert.equal(p.lessons[18].orderIndex,19);
 f.canonical[1].is_published=false;
 await assert.rejects(new Service(f.db).derive('build'),/PRESERVED_PUBLICATION_CHANGED/);
});
test('retained publications cannot include a lesson outside the course competency map',async()=>{
 const f=readyLessonDatabase({buildStatus:'built'});f.build.profile.publishCompletedLessons=true;
 f.build.profile.preservedPublishedLessonIds=['unrelated'];
 await assert.rejects(new Service(f.db).derive('build'),/PRESERVED_PUBLICATION_MAPPING_REQUIRED/);
});
