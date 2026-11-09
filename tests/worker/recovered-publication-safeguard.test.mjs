import test from 'node:test';
import assert from 'node:assert/strict';
import {recoveredSourcePublicationAllowed as allowed} from '../../lib/ultimate-course-builder/release/recovered-source-policy.mjs';
import {inspectCourseAutopilot as inspect} from '../../lib/ultimate-course-builder/worker/paris-monitor.mjs';
test('recovered source requires two explicit approvals; ordinary sources retain existing gates',()=>{
 for(const recovery of [null,[],false,'invalid',{}, {publicationApproved:true},{learnerPublicationApproved:true},{publicationApproved:false,learnerPublicationApproved:true},{publicationApproved:true,learnerPublicationApproved:false}])
  assert.equal(allowed({existingLessonSourceRecovery:recovery}),false);
 assert.equal(allowed({existingLessonSourceRecovery:{publicationApproved:true,learnerPublicationApproved:true}}),true);
 assert.equal(allowed({}),true);
});
test('approval failures cannot auto-requeue with capacity or a historical repair receipt',()=>{
 for(const repairId of [undefined,'historical'])for(const attempts of [0,2,5]){
  const job={status:'failed',last_error:'ULTIMATE_SOURCE_PUBLICATION_APPROVAL_REQUIRED',monitor:{enabled:true,repairId},attempts,max_attempts:5};
  const before=JSON.stringify(job);
  assert.deepEqual(inspect(job,{status:'running'}),{state:'attention_required',action:'none',reason:'ULTIMATE_SOURCE_PUBLICATION_APPROVAL_REQUIRED'});
  assert.equal(JSON.stringify(job),before);
 }
});
test('fresh active leases remain observed and ordinary transient recovery is preserved',()=>{
 const now=Date.parse('2026-11-08T21:00:00Z');
 assert.equal(inspect({status:'running',monitor:{enabled:true},heartbeat_at:'2026-11-08T20:59:59Z',lease_expires_at:'2026-11-08T21:04:59Z'},{status:'running'},now).action,'observe');
 assert.equal(inspect({status:'failed',last_error:'HTTP 503',monitor:{enabled:true},attempts:1,max_attempts:5},{status:'running'},now).action,'requeue');
});
