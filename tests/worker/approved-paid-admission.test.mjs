import test from 'node:test';
import assert from 'node:assert/strict';
import { isApprovedPaidEnrollment, hasApprovedPaidLearnerEnrollment } from '../../lib/learner/approved-paid-admission.mjs';

const valid = {
  user_id:'student-1', student_id:null, status:'active', payment_status:'paid',
  approved_at:'2026-11-18T00:00:00Z', approved_by:'admin-1',
  access_granted_at:'2026-11-18T01:00:00Z', access_status:'active',
  revoked_at:null, cancelled_at:null, suspended_at:null, refunded_at:null
};

test('only active paid explicitly admin-approved enrollment unlocks the learner',()=>{
  assert.equal(isApprovedPaidEnrollment(valid),true);
  for (const field of ['approved_at','approved_by','access_granted_at']) {
    assert.equal(isApprovedPaidEnrollment({...valid,[field]:null}),false,field);
  }
  for (const field of ['revoked_at','cancelled_at','suspended_at','refunded_at']) {
    assert.equal(isApprovedPaidEnrollment({...valid,[field]:'2026-11-18T02:00:00Z'}),false,field);
  }
  for (const payment_status of [null,'pending','failed','waived','qa_test','funded']) {
    assert.equal(isApprovedPaidEnrollment({...valid,payment_status}),false,String(payment_status));
  }
  for (const status of ['pending','unassigned','suspended','withdrawn','revoked']) {
    assert.equal(isApprovedPaidEnrollment({...valid,status}),false,status);
  }
  assert.equal(isApprovedPaidEnrollment({...valid,access_status:null}),false);
});

test('checks the authenticated subject on both enrollment identity columns',async()=>{
  const db={from:()=>({select:()=>({or:()=>({limit:async()=>({data:[{...valid,user_id:'other',student_id:'student-1'}],error:null})})})})};
  assert.equal(await hasApprovedPaidLearnerEnrollment(db,'student-1'),true);
  assert.equal(await hasApprovedPaidLearnerEnrollment(db,'student-2'),false);
});

test('fails closed on read errors and does not mutate enrollment records',async()=>{
  let writes=0;
  const db={from:()=>({select:()=>({or:()=>({limit:async()=>({data:null,error:{message:'offline'}})})}),update:()=>{writes++;throw Error('must not write');}})};
  await assert.rejects(hasApprovedPaidLearnerEnrollment(db,'student-1'),/LEARNER_ENROLLMENT_ACCESS_CHECK_UNAVAILABLE/);
  assert.equal(writes,0);
});
