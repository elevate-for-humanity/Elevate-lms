import test from 'node:test';
import assert from 'node:assert/strict';
import { assertQaApprenticeshipEnrollment, scopeQaHolderAssignmentAlert } from './qa-host-shop-alert-cleanup.mjs';

const enrollmentId = '00000000-0000-4000-8000-000000000001';
const apprenticeId = '00000000-0000-4000-8000-000000000002';
const otherId = '00000000-0000-4000-8000-000000000003';
const state = { enrollmentId, runId: '123-shop-0', marker: 'qa-e2e-123-shop-0', apprentice: { id: apprenticeId, email: 'qa-e2e-123-shop-0-apprentice@qa.invalid' } };
const row = { id: enrollmentId, user_id: apprenticeId, student_id: apprenticeId, email: state.apprentice.email, source: 'qa_e2e', draft_data: { qa_e2e: true, qa_run_id: state.runId, disposable: true } };

test('only exact run-owned disposable enrollment is eligible for cleanup', () => {
  assert.doesNotThrow(() => assertQaApprenticeshipEnrollment(state, row));
  for (const mismatch of [{id: otherId}, {student_id: otherId}, {user_id: otherId}, {email: 'actual@example.com'}, {source: 'application'}, {draft_data: {...row.draft_data, qa_run_id: 'other'}}, {draft_data: {...row.draft_data, disposable: false}}]) {
    assert.throws(() => assertQaApprenticeshipEnrollment(state, {...row, ...mismatch}), /non-fixture enrollment/);
  }
});

test('idempotent cleanup accepts an absent row but never an invalid checkpoint', () => {
  assert.doesNotThrow(() => assertQaApprenticeshipEnrollment(state, null));
  assert.throws(() => assertQaApprenticeshipEnrollment({...state, marker: 'other'}, null), /incomplete enrollment identity/);
  assert.throws(() => assertQaApprenticeshipEnrollment({...state, apprentice: null}, null), /incomplete enrollment identity/);
});

test('delete and verification can share an exact alert scope without touching other notifications', () => {
  const filters = [];
  const query = { eq(k,v) {filters.push(['eq',k,v]); return this;}, like(k,v) {filters.push(['like',k,v]); return this;} };
  assert.equal(scopeQaHolderAssignmentAlert(query, enrollmentId, apprenticeId), query);
  assert.deepEqual(filters, [
    ['eq','type','system'], ['eq','title','New Student Assigned'],
    ['eq','metadata->>enrollment_id',enrollmentId], ['eq','metadata->>student_id',apprenticeId],
    ['like','idempotency_key',`program-holder-enrollment:${enrollmentId}:%`],
  ]);
  assert.throws(() => scopeQaHolderAssignmentAlert(query, '%', apprenticeId), /exact enrollment and apprentice IDs/);
  assert.throws(() => scopeQaHolderAssignmentAlert(query, enrollmentId, undefined), /exact enrollment and apprentice IDs/);
});
