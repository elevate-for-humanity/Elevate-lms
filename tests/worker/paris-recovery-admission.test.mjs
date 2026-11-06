import test from 'node:test';
import assert from 'node:assert/strict';
import {isCourseDependencyFailure,isRepairableCourseFailure} from '../../lib/ai/runtime/course-repair-policy.mjs';
import {untouchedPlannerNeedsFreshGeneration} from '../../lib/devstudio/repair-checkpoint-recovery.mjs';

test('licensed-media dependencies never become code defects, including wrapped worker errors',()=>{
 for(const code of ['MEDIA_LICENSE_REQUIRED','MEDIA_SOURCE_APPROVAL_REQUIRED','ULTIMATE_SCENE_LICENSE_RELEVANCE_ASSIGNMENT_REQUIRED','AUTHORIZATION_REQUIRED']) {
  const error='ULTIMATE_INTERNAL_REPAIR_REQUIRED:lesson:FINDINGS='+JSON.stringify([{code,message:code}]);
  assert.equal(isCourseDependencyFailure(error),true);
  assert.equal(isRepairableCourseFailure({status:'failed',monitor:{enabled:true},last_error:error}),false);
 }
 assert.equal(isRepairableCourseFailure({status:'failed',monitor:{enabled:true},last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED:CAPTION_SYNC_FAILED'}),true);
});

test('a fresh admitted attempt archives only an exhausted or expired untouched checkpoint',()=>{
 const now=Date.parse('2026-11-06T22:00:00Z');
 const checkpoint={writes:0,commits:[],changedFiles:[],baseSha:'a'.repeat(40),headSha:'a'.repeat(40),nextTurn:14};
 const repair={status:'patching',attempt_count:2,candidate:{kind:'planner-checkpoint',checkpoint}};
 assert.equal(untouchedPlannerNeedsFreshGeneration(repair,now),true);
 assert.equal(untouchedPlannerNeedsFreshGeneration({...repair,candidate:{...repair.candidate,checkpoint:{...checkpoint,nextTurn:3,startedAt:'2026-11-06T20:00:00Z'}}},now),true);
 for(const change of [{writes:1},{commits:['commit']},{changedFiles:['lib/example.ts']},{headSha:'b'.repeat(40)},{complete:true},{nextTurn:3,startedAt:'2026-11-06T21:59:00Z'}])
  assert.equal(untouchedPlannerNeedsFreshGeneration({...repair,candidate:{...repair.candidate,checkpoint:{...checkpoint,...change}}},now),false);
 for(const change of [{status:'blocked'},{status:'queued'},{attempt_count:1},{release_sha:'release'}])
  assert.equal(untouchedPlannerNeedsFreshGeneration({...repair,...change},now),false);
});
