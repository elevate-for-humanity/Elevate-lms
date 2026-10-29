import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isApprovedDocument, uploadedW9Status, getUploadedW9Status } from '../lib/program-holder/document-review.ts';

test('approved uploads remain approved independently of payout setup', () => {
  assert.equal(uploadedW9Status([{ document_type: 'w9', status: 'approved', approved: true }]), 'approved');
  assert.equal(uploadedW9Status([{ document_type: 'w9', status: 'approved', approved: false }]), 'approved');
  assert.equal(uploadedW9Status([{ document_type: 'w9', status: null, approved: true }]), 'approved');
});

test('explicit pending or rejected review cannot inherit a stale approval', () => {
  for (const status of ['pending', 'rejected', 'under_review']) {
    assert.equal(isApprovedDocument({ status, approved: true }), false);
  }
  assert.equal(uploadedW9Status([{ document_type: 'w9', status: 'pending', approved: true }]), 'pending');
  assert.equal(uploadedW9Status([{ document_type: 'w9', status: 'rejected', approved: true }]), 'rejected');
});

test('an upload waiting on review is not reported missing', () => {
  assert.equal(uploadedW9Status([{ document_type: 'w9', approved: false }]), 'pending');
  assert.equal(uploadedW9Status([{ document_type: 'insurance', status: 'approved' }]), 'missing');
  assert.equal(uploadedW9Status([]), 'missing');
});

test('a duplicate pending upload does not erase an approved W-9', () => {
  assert.equal(uploadedW9Status([
    { document_type: 'w9', status: 'pending' },
    { document_type: 'w9', status: 'approved' },
  ]), 'approved');
});

test('queries only the authorized holder and returns review state without tax details', async () => {
  const db = { from(table) {
    assert.equal(table, 'program_holder_documents');
    return { select(columns) {
      assert.equal(columns, 'document_type,status,approved');
      return { eq(column, value) {
        assert.equal(column, 'user_id'); assert.equal(value, 'holder-user');
        return Promise.resolve({ data: [{ document_type: 'w9', status: 'approved' }], error: null });
      } };
    } };
  } };
  assert.equal(await getUploadedW9Status(db, 'holder-user'), 'approved');
});

test('lookup failure never becomes a missing upload or a false approval', async () => {
  const db = { from: () => ({ select: () => ({ eq: async () => ({ data: null, error: new Error('offline') }) }) }) };
  await assert.rejects(getUploadedW9Status(db, 'holder-user'), /could not be verified/);
});
