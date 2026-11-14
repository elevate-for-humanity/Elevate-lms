import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registeredBeautySources,registeredBeautyLessons} from './index.mjs';
import {lessonInstructionalSources} from '../../ultimate-course-builder/instructional/rti-teaching-policy.mjs';
const standards=readFileSync(new URL('../../compliance/appendix-a-standards.ts',import.meta.url),'utf8');
for(const [occupation,slug,count] of [['esthetician','esthetician-apprenticeship',20],['manicurist','nail-technician-apprenticeship',19]]){
 test(`${occupation}: every signed competency resolves only its own substantive teaching`,()=>{
  const expected=[...standards.matchAll(new RegExp(`id: '(${occupation}-[^']+)'`,'g'))].map(m=>m[1]);
  const sources=registeredBeautySources(slug);
  assert.equal(expected.length,count); assert.deepEqual(sources.map(s=>s.id),expected);
  const profile={instructionalSources:sources};
  for(const id of expected){
   const selected=lessonInstructionalSources(profile,{id,authorityRequirementIds:[id]});
   assert.equal(selected.length,1); assert.equal(selected[0].id,id);
   const payload=JSON.parse(selected[0].text.split('Authorized course content: ')[1]);
   assert.equal(payload.provenance.competencyId,id);
   assert.ok(payload.html.split(/\s+/).length>180,`${id}: substantive teaching`);
   assert.equal(payload.experience.knowledgeChecks.length,2);
   for(const q of payload.experience.knowledgeChecks){assert.ok(q.options.length>=3);assert.ok(q.options[q.correct]);assert.ok(q.explanation);}
  }
 });
 test(`${occupation}: curriculum does not award hours or replace authority`,()=>{
  for(const lesson of registeredBeautyLessons(occupation)){
   assert.equal(lesson.content.hours,undefined);
   assert.equal(lesson.content.provenance.version,'efh-beauty-2026-11-01-v1');
   assert.match(lesson.content.provenance.approval,/not a new agency approval/);
  }
 });
}
test('unknown occupations do not inherit unrelated teaching',()=>assert.deepEqual(registeredBeautySources('hvac-technician'),[]));
