import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {alignmentPlan,alignmentSql} from './align-beauty-workbooks.mjs';
const snapshot=JSON.parse(readFileSync(new URL('../../data/curriculum/beauty-workbook-before.json',import.meta.url)));
test('all 54 sections cover all 39 canonical competencies and retain identities',()=>{
 const plan=alignmentPlan(snapshot);
 assert.equal(plan.length,54);assert.equal(new Set(plan.map(p=>p.competency_id)).size,39);
 assert.equal(new Set(plan.map(p=>p.after.id)).size,54);
 for(const p of plan){assert.equal(p.after.id,p.before.id);assert.equal(p.after.section_number,p.before.section_number);assert.equal(p.after.workbook_id,p.before.workbook_id);assert.equal(p.after.prompts.length,3);assert.ok(p.after.prompts.every(t=>t.length>150));}
});
test('refuses absent, duplicate and changed canonical sources',()=>{
 for(const alter of [s=>s.lessons.pop(),s=>s.lessons.push(s.lessons[0]),s=>s.lessons[0].title='wrong']){
  const copy=structuredClone(snapshot);alter(copy);assert.throws(()=>alignmentPlan(copy));
 }
});
test('database update rejects saved answers or concurrent drift and never publishes lessons',()=>{
 const sql=alignmentSql(snapshot);
 assert.match(sql,/LOCK TABLE public.digital_workbook_responses/);
 assert.match(sql,/SAVED_RESPONSES_REQUIRE_VERSIONED_WORKBOOK/);
 assert.match(sql,/WORKBOOK_CHANGED_SINCE_AUDIT/);
 assert.match(sql,/ALIGNMENT_READBACK_FAILED/);
 assert.doesNotMatch(sql,/UPDATE public\.(courses|course_lessons|digital_workbook_responses)|DELETE FROM|INSERT INTO public/);
});
