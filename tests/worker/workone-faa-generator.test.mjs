import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { FAA_PROGRAMS,FAA_COST_ROWS,faaEndDate,faaTotalCents } from '../../lib/workone/faa-programs.mjs';

const route=readFileSync(new URL('../../apps/admin/app/api/admin/faa/generate/route.ts',import.meta.url),'utf8');
const signature=readFileSync(new URL('../../apps/admin/app/api/admin/faa/signature/route.ts',import.meta.url),'utf8');
const pdf=readFileSync(new URL('../../lib/workone/faa-pdf.mjs',import.meta.url),'utf8');

test('two audited program snapshots preserve required totals and zero rows',()=>{
  assert.deepEqual(Object.keys(FAA_PROGRAMS).sort(),['bookkeeping','hvac']);
  assert.equal(faaTotalCents(FAA_PROGRAMS.hvac),500000);
  assert.equal(faaTotalCents(FAA_PROGRAMS.bookkeeping),492500);
  assert.equal(FAA_PROGRAMS.hvac.weeks,6);
  assert.equal(FAA_PROGRAMS.bookkeeping.weeks,8);
  assert.equal(FAA_COST_ROWS.length,12);
  assert.equal(FAA_PROGRAMS.hvac.costs.transportation,0);
  assert.equal(FAA_PROGRAMS.bookkeeping.costs.lab,0);
});
test('end date uses UTC weeks and validates illegal dates',()=>{
  assert.equal(faaEndDate('2026-12-07',6),'2027-01-18');
  assert.equal(faaEndDate('2026-12-07',8),'2027-02-01');
  assert.throws(()=>faaEndDate('2026-02-30',6),/FAA_START_DATE_INVALID/);
  assert.throws(()=>faaEndDate('bad',6),/FAA_START_DATE_INVALID/);
});
test('generating cannot sign without fresh per-document approval',()=>{
  assert.match(route,/input\.sign===true/);
  assert.match(route,/input\.approved!==true/);
  assert.match(route,/input\.confirmName\.trim\(\)!==actor\.full_name/);
  assert.match(route,/\.eq\('id',studentId\)/);
  assert.match(route,/from\('profiles'\)/);
  assert.match(route,/upsert:false/);
  assert.match(route,/student_binder_documents/);
  assert.match(route,/admin_audit_events/);
  assert.doesNotMatch(route,/has_workone_approval\s*:\s*true/);
});
test('private signature cannot be stored without owner consent',()=>{
  assert.match(signature,/input\.consent!==true/);
  assert.match(signature,/image\/png/);
  assert.match(signature,/faa-signatures/);
  assert.match(signature,/from\('documents'\)/);
  assert.match(signature,/\['admin','super_admin'\]/);
});
test('PDF retains blank fund assignment column and separate agency signature',()=>{
  assert.match(pdf,/Fund Assignments \(#1-6\)/);
  assert.match(pdf,/\[label,'','','',cents/);
  assert.match(pdf,/Regional staff signature/);
  assert.match(pdf,/signaturePng/);
});
