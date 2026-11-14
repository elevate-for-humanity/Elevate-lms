import test from 'node:test';
import assert from 'node:assert/strict';
import {bookkeepingWorkbook} from './bookkeeping-workbook.mjs';
import {lessons} from '../../data/courses/intuit-bookkeeping-professional.mjs';
test('workbook covers every authored lesson and all 53 bookkeeping objectives',()=>{
 const w=bookkeepingWorkbook();
 assert.equal(w.sections.length,18);
 assert.equal(new Set(w.sections.map(s=>s.competency_id)).size,18);
 assert.deepEqual(w.sections.map(s=>s.section_number),Array.from({length:18},(_,i)=>i+1));
 const expected=[...new Set(lessons.flatMap(l=>l.objectives))].sort();
 assert.equal(expected.length,53);
 assert.deepEqual([...new Set(w.sections.flatMap(s=>s.objective_ids))].sort(),expected);
 for(const section of w.sections){assert.equal(section.prompts.length,3);assert.ok(section.prompts.every(p=>p.length>100&&p.length<6000));}
});
test('applied readiness requires original work and practical review rather than an exam-pass claim',()=>{
 const final=bookkeepingWorkbook().sections.at(-1).prompts.join(' ');
 assert.match(final,/bank reconciliation/);assert.match(final,/instructor to review/);assert.match(final,/not the external credential/);
 assert.match(final,/cash stays unchanged/);
});
