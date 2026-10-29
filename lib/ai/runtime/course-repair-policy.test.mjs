import test from 'node:test';
import assert from 'node:assert/strict';
import {isRepairableCourseFailure, courseRepairOutcome} from './course-repair-policy.mjs';
const failed = {status:'failed',monitor:{enabled:true},last_error:'ULTIMATE_INTERNAL_REPAIR_REQUIRED:FINDINGS=[{"code":"PICTURE_CUE_NOT_ALIGNED_TO_SPEECH"}]'};
test('picture alignment failure reaches code repair rather than being stranded', () => {
  assert.equal(isRepairableCourseFailure(failed),true);
  assert.equal(isRepairableCourseFailure({...failed,last_error:'ULTIMATE_VIDEO_RENDER_FAILED:PREMIUM_TEACHING_CUE_NOT_ALIGNED:0'}),true);
  assert.equal(isRepairableCourseFailure({...failed,last_error:'TEACHING_PHOTO_REPLACEMENT_REQUIRED:legacy-scene'}),true);
  assert.equal(isRepairableCourseFailure({...failed,last_error:'INSTRUCTIONAL_VISUAL_REPLACEMENT_REQUIRED:scene'}),true);
  for(const change of [{status:'running'},{monitor:{enabled:false}},{monitor:{enabled:true,reason:'Owner paused'}},{last_error:'MEDIA_LICENSE_REQUIRED'},{last_error:'ULTIMATE_GOOGLE_AUTHORING_HTTP_403'}])
    assert.equal(isRepairableCourseFailure({...failed,...change}),false);
});
const evidence = {repairId:'repair',releaseSha:'release',sourceJobId:'failed-job',build:{id:'build',status:'published'},job:{id:'resumed-job',build_id:'build',status:'completed',payload:{codeRepairId:'repair',codeRepairSha:'release'}}};
test('only correlated completed execution with canonical publication verifies the repair', () => {
  assert.equal(courseRepairOutcome(evidence).state,'passed');
  for(const job of [null,{...evidence.job,id:'failed-job'},{...evidence.job,status:'running'},{...evidence.job,payload:{}},{...evidence.job,build_id:'other'},{...evidence.job,payload:{codeRepairId:'other',codeRepairSha:'release'}}])
    assert.equal(courseRepairOutcome({...evidence,job}).state,'pending');
  assert.equal(courseRepairOutcome({...evidence,build:{id:'build',status:'blocked'}}).state,'pending');
  assert.equal(courseRepairOutcome({...evidence,job:{...evidence.job,status:'failed'}}).state,'failed');
});
