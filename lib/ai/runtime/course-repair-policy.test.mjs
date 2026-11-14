import test from 'node:test';
import assert from 'node:assert/strict';
import {isRepairableCourseFailure, courseRepairOutcome} from './course-repair-policy.mjs';
const failed = {status:'failed',monitor:{enabled:true},last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED:FINDINGS=[{"code":"PICTURE_CUE_NOT_ALIGNED_TO_SPEECH"}]'};
test('picture alignment failure reaches code repair rather than being stranded', () => {
  assert.equal(isRepairableCourseFailure(failed),true);
  assert.equal(isRepairableCourseFailure({...failed,last_error:'ULTIMATE_VIDEO_RENDER_FAILED:PREMIUM_TEACHING_CUE_NOT_ALIGNED:0'}),true);
  assert.equal(isRepairableCourseFailure({...failed,last_error:'TEACHING_PHOTO_REPLACEMENT_REQUIRED:legacy-scene'}),true);
  assert.equal(isRepairableCourseFailure({...failed,last_error:'INSTRUCTIONAL_VISUAL_REPLACEMENT_REQUIRED:scene'}),true);
  for(const change of [{status:'running'},{monitor:{enabled:false}},{monitor:{enabled:true,reason:'Owner paused'}},{last_error:'MEDIA_LICENSE_REQUIRED'},{last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED:barber-d:FINDINGS=[{"code":"ULTIMATE_SCENE_LICENSE_RELEVANCE_ASSIGNMENT_REQUIRED","message":"gapCount:4"}]'},{last_error:'ULTIMATE_GOOGLE_AUTHORING_HTTP_403'}])
    assert.equal(isRepairableCourseFailure({...failed,...change}),false);
});
test('a deterministic producer that re-ran unchanged is never sent to code repair', () => {
  // No repository change can alter a deterministic producer's output, so a code
  // repair for REPAIR_PRODUCER_UNCHANGED always finishes "without a verifiable
  // repository change" — the observed 160-blocked stall. Route it to content.
  for (const last_error of [
    'ULTIMATE_INTERNAL_REPAIR_REQUIRED:esthetician-a:FINDINGS=[{"step":"synchronization","severity":"error","code":"REPAIR_PRODUCER_UNCHANGED","message":"REPAIR_PRODUCER_UNCHANGED:synchronization"}]',
    'ULTIMATE_INTERNAL_REPAIR_REQUIRED:manicurist-a:FINDINGS=[{"step":"visual_assignment","severity":"error","code":"REPAIR_PRODUCER_UNCHANGED","message":"REPAIR_PRODUCER_UNCHANGED:visual_assignment"}]',
  ])
    assert.equal(isRepairableCourseFailure({...failed, last_error}), false);
  // A genuine rendering/quality defect in application code still reaches repair.
  assert.equal(
    isRepairableCourseFailure({...failed, last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED:FINDINGS=[{"code":"Media quality gate failed","message":"frozen interval detected"}]'}),
    true,
  );
});
const evidence = {repairId:'repair',releaseSha:'release',sourceJobId:'failed-job',build:{id:'build',status:'published'},job:{id:'resumed-job',build_id:'build',status:'completed',payload:{codeRepairId:'repair',codeRepairSha:'release'}}};
test('the original job can verify only after its correlated new generation',()=>{
 const job={...evidence.job,id:'failed-job',execution_generation:10,payload:{...evidence.job.payload,codeRepairSourceGeneration:8}};
 assert.equal(courseRepairOutcome({...evidence,job}).state,'passed');
 assert.equal(courseRepairOutcome({...evidence,job:{...job,execution_generation:8}}).state,'pending');
});
test('only correlated completed execution with canonical publication verifies the repair', () => {
  assert.equal(courseRepairOutcome(evidence).state,'passed');
  for(const job of [null,{...evidence.job,id:'failed-job'},{...evidence.job,status:'running'},{...evidence.job,payload:{}},{...evidence.job,build_id:'other'},{...evidence.job,payload:{codeRepairId:'other',codeRepairSha:'release'}}])
    assert.equal(courseRepairOutcome({...evidence,job}).state,'pending');
  assert.equal(courseRepairOutcome({...evidence,build:{id:'build',status:'blocked'}}).state,'pending');
  assert.equal(courseRepairOutcome({...evidence,job:{...evidence.job,status:'failed'}}).state,'failed');
});
