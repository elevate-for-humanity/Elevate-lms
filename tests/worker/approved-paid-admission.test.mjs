import test from 'node:test';
import assert from 'node:assert/strict';
import { isApprovedPaidEnrollment, hasApprovedPaidLearnerEnrollment, hasAdmissionPaymentOrFunding } from '../../lib/learner/approved-paid-admission.mjs';

const valid = {
  user_id:'student-1', student_id:null, status:'active', payment_status:'paid',
  approved_at:'2026-11-18T00:00:00Z', approved_by:'admin-1',
  access_granted_at:'2026-11-18T01:00:00Z', access_status:'active',
  revoked_at:null, cancelled_at:null, suspended_at:null, refunded_at:null
};

test('legacy paid enrollment requires approval and active access',()=>{
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

// Minimal Supabase-style chain mock: program rows come from the
// program_enrollments table, direct rows from course_enrollments.
function mockDb(programRows, directRows = [], programError = null) {
  // Chain mock that actually applies the .in(status) and .is(revoked_at, null)
  // filters PostgREST would apply, so tests exercise the query as written.
  const chain = (rows, error) => {
    const state = { statuses: null, revokedNull: false };
    const c = { select: () => c, or: () => c, eq: () => c,
      is: (_col, value) => { if (value === null) state.revokedNull = true; return c; },
      in: (_col, values) => { state.statuses = new Set(values); return c; },
      limit: async () => ({ data: rows.filter((r) =>
        (!state.statuses || state.statuses.has(r.status)) &&
        (!state.revokedNull || r.revoked_at === null)), error }) };
    return c;
  };
  return { from: (table) => table === 'course_enrollments'
    ? chain(directRows, null)
    : chain(programRows, programError) };
}

test('checks the authenticated subject on both enrollment identity columns',async()=>{
  const db=mockDb([{...valid,user_id:'other',student_id:'student-1'}]);
  assert.equal(await hasApprovedPaidLearnerEnrollment(db,'student-1'),true);
  assert.equal(await hasApprovedPaidLearnerEnrollment(db,'student-2'),false);
});

// Direct course enrollment (e.g. verified paid store fulfillment, which
// creates ONLY a course_enrollments row) admits a learner with no program
// enrollment row at all — previously the workspace layout bounced them to
// /lms/access-pending even though their course was listed.
test('direct course enrollment admits a learner with no program enrollment',async()=>{
  const direct = [{ id: 'ce-1', status: 'active', revoked_at: null }];
  assert.equal(await hasApprovedPaidLearnerEnrollment(mockDb([], direct), 'student-1'), true);
  assert.equal(await hasApprovedPaidLearnerEnrollment(mockDb([], [{ ...direct[0], status: 'pending' }]), 'student-1'), false);
  assert.equal(await hasApprovedPaidLearnerEnrollment(mockDb([], [{ ...direct[0], revoked_at: '2026-11-18T02:00:00Z' }]), 'student-1'), false);
  assert.equal(await hasApprovedPaidLearnerEnrollment(mockDb([], []), 'student-1'), false);
});

test('program gate still governs when a program enrollment exists',async()=>{
  const unapproved = { ...valid, approved_at: null, approved_by: null };
  const direct = [{ id: 'ce-1', status: 'active', revoked_at: null }];
  // Mirrored direct rows must not bypass the approved-paid check.
  assert.equal(await hasApprovedPaidLearnerEnrollment(mockDb([unapproved], direct), 'student-1'), false);
});

test('fails closed on read errors and does not mutate enrollment records',async()=>{
  let writes=0;
  const db={from:()=>({select:()=>({or:()=>({limit:async()=>({data:null,error:{message:'offline'}})})}),update:()=>{writes++;throw Error('must not write');}})};
  await assert.rejects(hasApprovedPaidLearnerEnrollment(db,'student-1'),/LEARNER_ENROLLMENT_ACCESS_CHECK_UNAVAILABLE/);
  assert.equal(writes,0);
});


test('verified self-pay and manually approved state funding grant access independently', () => {
  const selfPay = {
    ...valid, funding_source: 'self_pay', approved_at: null, approved_by: null,
    payment_reference: 'invoice', self_pay_application_verified_at: '2026-11-18T01:00:00Z',
  };
  assert.equal(isApprovedPaidEnrollment(selfPay), true);
  assert.equal(isApprovedPaidEnrollment({ ...selfPay, self_pay_application_verified_at: null }), false);
  assert.equal(isApprovedPaidEnrollment({ ...selfPay, payment_reference: null }), false);
  assert.equal(isApprovedPaidEnrollment({ ...selfPay, funding_source: 'wioa' }), false);
  assert.equal(isApprovedPaidEnrollment({ ...selfPay, refunded_at: valid.access_granted_at }), false);
  const stateFunded = { ...valid, funding_source: 'wioa', funding_verified: true, eligibility_status: 'eligible', payment_status: 'pending' };
  assert.equal(isApprovedPaidEnrollment(stateFunded), true);
  assert.equal(isApprovedPaidEnrollment({ ...stateFunded, approved_by: null }), false);
  for (const funding_source of ['wioa', 'wrg', 'workone', 'jri']) {
    const paidFunded = { ...stateFunded, funding_source, payment_status: 'paid' };
    assert.equal(hasAdmissionPaymentOrFunding(paidFunded), true);
    assert.equal(hasAdmissionPaymentOrFunding({ ...paidFunded, funding_verified: false }), false);
    assert.equal(hasAdmissionPaymentOrFunding({ ...paidFunded, eligibility_status: null }), false);
  }
  assert.equal(isApprovedPaidEnrollment({ ...stateFunded, funding_verified: false, payment_status: 'paid' }), false);
});
