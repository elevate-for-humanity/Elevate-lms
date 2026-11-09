import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {courseDefectDisposition} from '../../lib/ai/runtime/code-repair-policy.mjs';
import {recoveredSourcePublicationAllowed} from '../../lib/ultimate-course-builder/release/recovered-source-policy.mjs';

test('completed lesson execution remains acceptance pending regardless of old findings',()=>{
  const source={id:'source',build_id:'build',status:'failed',last_error:'quality failed'};
  const latest={id:'replacement',build_id:'build',status:'completed'};
  const build={id:'build',status:'running',profile:{ownerPaused:false},findings:[]};
  assert.equal(courseDefectDisposition({source,latest,build}),'acceptance_pending');
  assert.equal(courseDefectDisposition({source,latest,build:{...build,findings:[{code:'QUALITY'}]}}),'acceptance_pending');
});

test('unrecognized findings must not silently clear an unresolved repair',()=>{
  const source={id:'source',build_id:'build',status:'failed',last_error:'new error category'};
  const latest={id:'replacement',build_id:'build',status:'running'};
  const build={id:'build',status:'running',profile:{ownerPaused:false},findings:[{code:'NEW_UNKNOWN_FAILURE'}]};
  assert.equal(courseDefectDisposition({source,latest,build}),'evidence_required');
});

test('all recovered-source envelopes require explicit dual approval',()=>{
  for(const recovery of [{}, {publicationApproved:true}, {learnerPublicationApproved:true}, 'invalid', []])
    assert.equal(recoveredSourcePublicationAllowed({existingLessonSourceRecovery:recovery}),false);
  assert.equal(recoveredSourcePublicationAllowed({existingLessonSourceRecovery:{publicationApproved:true,learnerPublicationApproved:true}}),true);
  assert.equal(recoveredSourcePublicationAllowed({}),true);
});

test('queued repair classification persists distinct non-success reasons',()=>{
 const code=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');
 assert.match(code,/SOURCE_WORKER_COMPLETED_ACCEPTANCE_PENDING/);
 assert.match(code,/SOURCE_DEFECT_EVIDENCE_REQUIRED/);
 assert.doesNotMatch(code,/SOURCE_DEFECT_RESOLVED/);
});
