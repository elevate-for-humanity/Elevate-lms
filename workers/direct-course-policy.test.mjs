import test from 'node:test';
import assert from 'node:assert/strict';
import {runDirectLessonPass,directCourseComplete,runDirectCourseSequence} from './direct-course-policy.mjs';
function harness(overrides={}) {
 const calls=[],saved=new Map([['script','original-script'],['narration','original-audio']]);
 return {calls,saved,input:{steps:['script','narration','render','qa','publish'],
  reusable:async step=>saved.has(step),fingerprint:async step=>step+':same-input',attempted:async()=>false,
  execute:async step=>{calls.push(step);return step;},validate:async step=>{if(step==='qa')throw Error('VISUAL_CHANGE_MISSING');},
  save:async(step,value)=>saved.set(step,value),reject:async()=>{},...overrides}};
}
test('a media failure preserves narration and film and never rewinds or publishes',async()=>{
 const h=harness();const result=await runDirectLessonPass(h.input);
 assert.equal(result.blockedAt,'qa');assert.deepEqual(h.calls,['render','qa']);
 assert.equal(h.saved.get('narration'),'original-audio');assert.equal(h.saved.get('render'),'render');
});
test('unchanged failed input does not repeat the expensive component',async()=>{
 const h=harness({attempted:async step=>step==='render'});
 assert.equal((await runDirectLessonPass(h.input)).reason,'unchanged-failure');assert.deepEqual(h.calls,[]);
});
test('passing components run once in order before publication',async()=>{
 const h=harness({validate:async()=>{}});assert.equal((await runDirectLessonPass(h.input)).complete,true);
 assert.deepEqual(h.calls,['render','qa','publish']);
});
test('failed persistence does not advance to QA or publication',async()=>{
 const h=harness({save:async()=>{throw Error('WRITE_FAILED');}});
 assert.equal((await runDirectLessonPass(h.input)).blockedAt,'render');assert.deepEqual(h.calls,['render']);
});
test('a three-lesson production manifest cannot certify a seventeen-lesson course',()=>{
 const learnerLessonIds=Array.from({length:17},(_,i)=>String(i));
 assert.equal(directCourseComplete({learnerLessonIds,acceptedLessonIds:learnerLessonIds,manifestLessonIds:learnerLessonIds.slice(0,3)}),false);
 assert.equal(directCourseComplete({learnerLessonIds,acceptedLessonIds:learnerLessonIds,manifestLessonIds:learnerLessonIds}),true);
 assert.equal(directCourseComplete({learnerLessonIds,acceptedLessonIds:learnerLessonIds.slice(0,16),manifestLessonIds:learnerLessonIds}),false);
});

test('course snapshots execute sequentially with both HVAC snapshots before Barber',async()=>{
 const calls=[];let active=0;
 const results=await runDirectCourseSequence({groups:[['core','supplement'],['barber'],['business']],execute:async id=>{
  assert.equal(active++,0);calls.push(id);await Promise.resolve();active--;
  return {courseId:['core','supplement'].includes(id)?'hvac':id,complete:id!=='core'};
 }});
 assert.deepEqual(calls,['core','supplement','barber','business']);assert.equal(results.length,4);
});
test('an incomplete course stops before another course starts',async()=>{
 const calls=[];
 await assert.rejects(runDirectCourseSequence({groups:[['core','supplement'],['barber']],execute:async id=>{
  calls.push(id);return {courseId:'hvac',complete:false};
 }}),/DIRECT_COURSE_INCOMPLETE:hvac/);
 assert.deepEqual(calls,['core','supplement']);
});
test('unrelated courses cannot be silently grouped as one completed course',async()=>{
 await assert.rejects(runDirectCourseSequence({groups:[['core','barber']],execute:async id=>({courseId:id,complete:true})}),/DIRECT_COURSE_GROUP_MISMATCH/);
});
