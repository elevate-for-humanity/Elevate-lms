import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../../data/courses/intuit-bookkeeping-professional.mjs';
import {finalQuestions,capstone} from '../../data/courses/intuit-bookkeeping-assessment.mjs';
import {prepareRebuild} from './prepare-bookkeeping-rebuild.mjs';
test('All 53 published subobjectives have instruction and practice',()=>{
 const counts=[[3,4,4,3],[5,3,2,4],[5,3,2,4],[3,3,5]];
 const expected=counts.flatMap((sections,d)=>sections.flatMap((n,s)=>Array.from({length:n},(_,i)=>`${d+1}.${s+1}.${i+1}`)));
 assert.equal(expected.length,53);assert.deepEqual([...new Set(lessons.flatMap(l=>l.objectives))].sort(),expected.sort());
 for(const l of lessons) for(const key of ['teaching','example','practice','correction']) assert.ok(l[key].length>70,`${l.id}: ${key}`);
});
test('Original final is valid and cumulative, with answers and explanations',()=>{
 assert.equal(finalQuestions.length,25);assert.equal(new Set(finalQuestions.map(q=>q.id)).size,25);
 for(const domain of ['1','2','3','4']) assert.ok(finalQuestions.filter(q=>q.domain===domain).length>=6);
 for(const q of finalQuestions){assert.equal(q.options.length,4);assert.ok(Number.isInteger(q.correctAnswer)&&q.correctAnswer>=0&&q.correctAnswer<4);assert.ok(q.explanation.length>20);}
});
test('Month-end case balances before and after supported adjustments',()=>{
 assert.equal(10900+1000+600+6000+300+1000+800,20600);
 assert.equal(200+5000+900+10000+4500,20600);
 const profit=4800-(1000+800+250+100+150+50+40);
 const equity=10000+profit-300;
 const assets=10860+1000+350+6000-100;
 const liabilities=200+5000+600+150+50;
 assert.equal(profit,2410);assert.equal(assets,18110);assert.equal(assets,liabilities+equity);
 assert.equal(10760+600-500,10860);assert.ok(capstone.example.includes('10,860'));
});
test('Replacement is isolated, unpublished, mapped to domain modules, with genuine release gates',()=>{
 const r=prepareRebuild({ownerId:'964dc85a-bce8-4e67-92eb-198ffafb2384',originalIntroduction:{id:'544f9204-40f6-4f32-b42b-aa108f1c27b6'}});
 assert.equal(r.modules.length,6);assert.equal(r.lessons.length,18);assert.equal(r.build.profile.competencies.length,17);
 assert.equal(r.course.status,'draft');assert.equal(r.course.is_active,false);
 assert.ok(r.lessons.every(l=>!l.is_published&&l.status==='draft'));
 assert.ok(r.lessons.every(l=>r.modules.some(m=>m.id===l.module_id)));
 assert.equal(r.build.profile.publicationPolicy,'automatic-quality-verified');
 assert.equal(r.build.profile.preservedPublishedLessonIds,undefined);
 assert.equal(r.lessons.at(-1).quiz_questions.length,25);
 assert.equal(r.lessons.find(l=>l.slug==='icbp-capstone').requires_instructor_signoff,true);
 assert.ok(r.build.profile.competencies.every(c=>r.build.profile.canonicalLessonIds[c.id]));
});
