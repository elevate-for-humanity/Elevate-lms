import test from 'node:test';
import assert from 'node:assert/strict';
import {attachCompletedLessonMedia} from '../../lib/ultimate-course-builder/worker/attach-lesson-media.mjs';
const fixture=()=>({job:{id:'job'},workerId:'worker',generation:3,profile:{canonicalLessonIds:{competency:'canonical'}},result:{completed:true,lessons:[{competencyId:'competency',lessonBuildId:'saved',result:{artifacts:{accepted:true}}}]},validate:()=>{},assertActive:()=>{}});
test('completed lesson media is validated and attached to the canonical ID under its lease',async()=>{
 const input=fixture();let calls=0;
 const rows=await attachCompletedLessonMedia({...input,db:{rpc:async(name,args)=>{
  calls++;assert.equal(name,'ultimate_attach_lesson_media');
  assert.deepEqual(args,{p_lesson:'saved',p_artifacts:{accepted:true},p_job:'job',p_worker:'worker',p_generation:3});
  return {data:{lessonId:'canonical',videoUrl:'/playback',sourceLessonBuildId:'saved'}};
 }}});
 assert.equal(calls,1);assert.equal(rows.length,1);
});
test('failed QA, owner preview, and unfinished lessons never attach',async()=>{
 let calls=0;const db={rpc:async()=>{calls++;throw Error('unexpected call');}};
 for(const result of [{completed:false},{completed:true,previewReady:true}])
  assert.deepEqual(await attachCompletedLessonMedia({...fixture(),result,db}),[]);
 await assert.rejects(attachCompletedLessonMedia({...fixture(),db,validate:()=>{throw Error('QA_FAILED');}}),/QA_FAILED/);
 assert.equal(calls,0);
});
test('lease loss, database errors and incorrect readback stop advancement',async()=>{
 for(const response of [{error:{message:'ULTIMATE_JOB_LEASE_LOST'}},{data:{lessonId:'wrong',videoUrl:'/playback'}},{data:{lessonId:'canonical',videoUrl:'/playback',sourceLessonBuildId:'other'}}])
  await assert.rejects(attachCompletedLessonMedia({...fixture(),db:{rpc:async()=>response}}),/ATTACHMENT/);
});
test('already published films are preserved by the handoff',async()=>{
 const rows=await attachCompletedLessonMedia({...fixture(),db:{rpc:async()=>({data:{lessonId:'canonical',videoUrl:'/approved',preservedPublished:true}})}});
 assert.equal(rows[0].videoUrl,'/approved');
});
