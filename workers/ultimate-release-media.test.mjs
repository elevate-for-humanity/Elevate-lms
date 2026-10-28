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
const Service = new Function('prepareUltimatePublication','assertCompleteLesson','ULTIMATE_LESSON_CONTRACT_VERSION','renderMediaUrl','renderPlaybackUrl', serviceSource + '\nreturn UltimateReleaseService;')(
  prepare,a=>{if(!a.verified)throw new Error('QA_FAILED');},'current',renderMediaUrl,renderPlaybackUrl);
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

function readyLessonDatabase({published=false,broken=false,buildStatus='running'}={}) {
  const competency='competency-19';
  const profile={publishCompletedLessons:true,title:'Cosmetology',competencies:Array.from({length:19},(_,i)=>({id:i===18?competency:'competency-'+i,title:'Lesson '+(i+1)})),canonicalLessonIds:{[competency]:'canonical-19'}};
  const build={id:'build',course_id:'course',status:buildStatus,profile};
  const artifacts={verified:!broken,finished_media_qa:{mediaQA:{pass:true}},lesson_film_render:{render:{videoUrl:'https://media.example/19.mp4'}}};
  const lessons=[{id:'build-19',competency_id:competency,lesson_key:'color-theory',status:'built',artifacts}];
  const canonical=[{id:'canonical-19',status:published?'published':'draft',is_published:published}];
  const filters=[];
  const db={from(table){let requestedId,requestedIds;const q={select(){return q;},eq(k,v){filters.push([table,k,v]);if(k==='id')requestedId=v;return q;},in(_key,values){requestedIds=values;return q;},order(){return q;},single:async()=>({data:table==='ultimate_lesson_builds'?lessons.find(l=>l.id===requestedId):build,error:null}),then(resolve,reject){const data=table==='ultimate_lesson_builds'?lessons.filter(l=>!requestedId||l.id===requestedId):canonical.filter(row=>!requestedIds||requestedIds.includes(row.id));return Promise.resolve({data,error:null}).then(resolve,reject);}};return q;}};
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

test('partial publication uses one fenced RPC and does not create a whole-course release',async()=>{
 const calls=[];const fence={jobId:'job',workerId:'worker',generation:7};
 const db={from(){throw Error('PARTIAL_CLIENT_WRITES_FORBIDDEN');},async rpc(name,args){
  calls.push({name,args});return {data:{scope:'lesson',lessonIds:['lesson'],committedAt:'2026-10-27T00:00:00Z'},error:null};
 }};
 const service=new Service(db);
 await service.applyPackage({courseId:'course',buildId:'build',profile:{publishCompletedLessons:true},contractVersion:'current',lessons:[lesson()]},'actor',fence);
 assert.equal(calls.length,1);assert.equal(calls[0].name,'commit_ultimate_lesson_release');
 assert.deepEqual(calls[0].args.p_fence,fence);
});
test('partial transaction rejection propagates without client-side writes',async()=>{
 const failure=Error('PARTIAL_TRANSACTION_REJECTED');let calls=0;
 const service=new Service({from(){throw Error('PARTIAL_CLIENT_WRITES_FORBIDDEN');},rpc:async()=>{calls++;return {data:null,error:failure};}});
 await assert.rejects(service.applyPackage({courseId:'course',buildId:'build',profile:{publishCompletedLessons:true},contractVersion:'current',lessons:[lesson()]},'actor'),e=>e===failure);
 assert.equal(calls,1);
});
test('partial publication requires explicit course opt-in before requesting a transaction',async()=>{
 const service=new Service({rpc(){assert.fail('unexpected transaction');}});
 await assert.rejects(service.applyPackage({profile:{},lessons:[lesson()]},'actor'),/PARTIAL_PUBLICATION_NOT_ENABLED/);
});
test('whole-course row preparation retains published references without fabricating artifacts',()=>{
 const rows=prepare({courseId:'course',buildId:'build',profile:{publishCompletedLessons:true},contractVersion:'current',
   lessons:[{canonicalLessonId:'prior',preservedPublished:true},lesson()]},'actor');
 assert.equal(rows.length,1);assert.equal(rows[0].canonicalLessonId,'lesson');
});

test('ready-lesson publication carries the worker fence through derivation and commit',async()=>{
 const {db}=readyLessonDatabase();const service=new Service(db);const fence={jobId:'job',workerId:'worker',generation:7};let received;
 service.applyPackage=async(_p,_actor,value)=>{received=value;return 'now';};
 await service.publishReadyLessons('build','owner',fence);assert.deepEqual(received,fence);
});
test('missing partial transaction readback cannot advance publication',async()=>{
 const service=new Service({rpc:async()=>({data:null,error:null})});
 await assert.rejects(service.applyPackage({courseId:'course',buildId:'build',profile:{publishCompletedLessons:true},contractVersion:'current',lessons:[lesson()]},'actor'),/LESSON_RELEASE_NOT_PERSISTED/);
});
