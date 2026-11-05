import test from 'node:test';
import assert from 'node:assert/strict';
import {courseRepairOutcome} from '../../lib/ai/runtime/course-repair-policy.mjs';

const repairId='repair-id', releaseSha='a'.repeat(40), sourceJobId='original-id';
const build={id:'build-1',status:'published'};
function outcome(job,lessonAcceptance){
 return courseRepairOutcome({repairId,releaseSha,sourceJobId,job,build,lessonAcceptance});
}
const job={id:'replacement',build_id:build.id,status:'completed',payload:{
 codeRepairId:repairId,codeRepairSha:releaseSha,autopilot:{competencyId:'comp-1'}}};

test('published parent does not override failed or missing learner acceptance',()=>{
 for(const acceptance of [undefined,{}, {published:true,learnerPassed:false},
   {published:false,learnerPassed:true}])
   assert.equal(outcome(job,acceptance).state,'pending');
});

test('published canonical lesson AND successful learner runthrough certify recovery',()=>{
 assert.equal(outcome(job,{published:true,learnerPassed:true}).state,'passed');
});

test('nonlesson course build still requires verified parent publication',()=>{
 assert.equal(outcome({...job,payload:{codeRepairId:repairId,codeRepairSha:releaseSha}},undefined).state,'passed');
});
test('uncorrelated job cannot be accepted',()=>{
 assert.equal(outcome({...job,payload:{...job.payload,codeRepairSha:'b'.repeat(40)}},{published:true,learnerPassed:true}).state,'pending');
});