import test from 'node:test';
import assert from 'node:assert/strict';
import {isWithdrawnProgram, isWithdrawnProgramRequest} from './withdrawn-programs.mjs';
test('withdrawn offering cannot be reached through details or enrollment aliases', () => {
  for (const slug of ['bookkeeping','bookkeeping-quickbooks','bookkeeping-fundamentals','elevate-bookkeeping-financial-accounting']) {
    assert.equal(isWithdrawnProgram(slug),true);
    assert.equal(isWithdrawnProgramRequest('/programs/'+slug+'/apply',null),true);
    assert.equal(isWithdrawnProgramRequest('/apply/student',slug),true);
  }
  assert.equal(isWithdrawnProgramRequest('/enroll/bd503ebf-d8e1-4c79-9efe-a72c001589b4',null),true);
});
test('other programs and private operational records remain available', () => {
  assert.equal(isWithdrawnProgramRequest('/programs/business-administration',null),false);
  assert.equal(isWithdrawnProgramRequest('/admin/programs/bookkeeping',null),false);
  assert.equal(isWithdrawnProgramRequest('/programs',null),false);
});
