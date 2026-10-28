import test from 'node:test';
import assert from 'node:assert/strict';
import {verifySavedCourseLessons} from '../../lib/ultimate-course-builder/worker/verify-saved-course.mjs';
function fixture(count=3) {
 const rows=Array.from({length:count},(_,i)=>({id:'saved'+i,competency_id:'c'+i,status:'built'}));
 const profile={publishCompletedLessons:true,competencies:rows.map(r=>({id:r.competency_id})),canonicalLessonIds:Object.fromEntries(rows.map(r=>[r.competency_id,'canonical'+r.id]))};
 const render={videoUrl:'https://example.com/film.mp4',captionsUrl:'https://example.com/captions.vtt',transcriptUrl:'https://example.com/transcript.txt'};
 const canonical=rows.map(r=>({id:'canonical'+r.id,status:'published',is_published:true,approved:true,video_status:'complete',media_quality_status:'approved',video_url:render.videoUrl,film:{...render},attachment:{sourceLessonBuildId:r.id}}));
 const selections=[];let validations=0,active=0,peak=0;
 const db={from(table){let fields,id;return {select(v){fields=v;selections.push(v);return this;},eq(k,v){if(k==='id')id=v;return this;},then(resolve){return Promise.resolve({data:table==='course_lessons'?canonical:rows}).then(resolve);},async single(){active++;peak=Math.max(peak,active);await Promise.resolve();active--;return {data:{artifacts:{lesson_film_render:{render}}}};}};}};
 return {db,profile,rows,canonical,selections,render,build:{id:'build',course_id:'course'},validate(){validations++;},assertActive(){},stats:()=>({validations,peak})};
}
test('validates every new lesson sequentially before retaining matching films',async()=>{
 const f=fixture(40);const result=await verifySavedCourseLessons(f);
 assert.equal(result.preservedPublishedLessonIds.length,40);
 assert.deepEqual(f.stats(),{validations:40,peak:1});
 assert.equal(f.selections.filter(s=>s==='artifacts').length,40);
 assert.ok(!f.selections.some(s=>s.includes('status,artifacts')));
 assert.equal(f.profile.preservedPublishedLessonIds,undefined);
});
test('a failed full contract cannot become a preserved publication',async()=>{
 const f=fixture();f.validate=()=>{throw Error('QA_FAILED');};
 await assert.rejects(verifySavedCourseLessons(f),/QA_FAILED/);
 assert.equal(f.profile.preservedPublishedLessonIds,undefined);
});
test('changed film, captions, transcript, attachment or quality stays unpreserved',async()=>{
 for(const field of ['video','captions','transcript','attachment','quality']){
  const f=fixture(1),c=f.canonical[0];
  if(field==='video')c.video_url='https://example.com/changed.mp4';
  if(field==='captions')c.film.captionsUrl='changed';
  if(field==='transcript')c.film.transcriptUrl='changed';
  if(field==='attachment')c.attachment.sourceLessonBuildId='other';
  if(field==='quality')c.media_quality_status='unverified';
  assert.deepEqual((await verifySavedCourseLessons(f)).preservedPublishedLessonIds,[]);
 }
});
test('missing or incomplete competencies fail course validation',async()=>{
 for(const missing of [true,false]){
  const f=fixture(1);if(missing)f.rows.length=0;else f.rows[0].status='running';
  await assert.rejects(verifySavedCourseLessons(f),/ULTIMATE_COMPETENCY_NOT_COMPLETE/);
 }
});
test('prior publications remain preserved without claiming fresh contract validation',async()=>{
 const f=fixture(1);f.profile.preservedPublishedLessonIds=['canonicalsaved0'];
 const result=await verifySavedCourseLessons(f);
 assert.deepEqual(result.preservedPublishedLessonIds,['canonicalsaved0']);assert.equal(f.stats().validations,0);
});
