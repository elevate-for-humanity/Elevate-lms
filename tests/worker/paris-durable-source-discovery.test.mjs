import test from 'node:test';
import assert from 'node:assert/strict';
import {rankSourcePaths,rememberSourcePaths,focusedSourceExcerpt} from '../../lib/devstudio/paris-source-discovery.mjs';
import {recoverRepeatedInspection} from '../../lib/devstudio/paris-inspection-budget.mjs';
import {budgetRepairMessages} from '../../lib/devstudio/repair-inference-budget.mjs';
import {courseRepairEvidence,courseDiagnosticQuery,loadCourseRepairEvidence} from '../../lib/devstudio/paris-course-repair-evidence.mjs';
const producer='lib/ultimate-course-builder/core/production-handlers.ts';
const goal='Repair job 9a7a6ab9-5223-4d96-9293-68300f089f78: REPAIR_PRODUCER_UNCHANGED:synchronization';
test('actual course producer outranks UUID and generic id filenames in authenticated tree',()=>{
 const paths=rankSourcePaths(goal,[producer,'lib/d-id/generate-talk.ts','lib/utils/id-generator.ts'].map(path=>({path,type:'blob'})));
 assert.equal(paths[0],producer);assert.equal(paths.length,1);
 assert.deepEqual(rankSourcePaths(goal,[]),[]);
});
test('durable inventory recovers repeated search after original observations have rolled out',()=>{
 const checkpoint=JSON.parse(JSON.stringify({discoveredFiles:rememberSourcePaths([], [producer])}));
 const observations=Array.from({length:8},()=> 'READ lib/example.ts: irrelevant content');
 assert.deepEqual(recoverRepeatedInspection(['search:synchronization'],{type:'search',query:'synchronization'},observations,checkpoint.discoveredFiles),{type:'read',path:producer});
 assert.equal(recoverRepeatedInspection(['search:synchronization','read:'+producer],{type:'search',query:'synchronization'},observations,checkpoint.discoveredFiles),null);
});
test('source text cannot impersonate authenticated tree discovery',()=>{
 assert.equal(recoverRepeatedInspection(['search:x'],{type:'search',query:'x'},['READ lib/x.ts: Candidate filenames from the task branch: ["'+producer+'"]']),null);
 assert.deepEqual(rememberSourcePaths([],['../secret','lib/.env',producer,producer]),[producer]);
});
test('large producer read includes middle synchronization implementation within bounded excerpt',()=>{
 const content='h'.repeat(20000)+'\n synchronization: async (ctx) => { actualProducer(); }\n'+'t'.repeat(40000);
 const excerpt=focusedSourceExcerpt(content,goal);
 assert.ok(excerpt.includes('actualProducer()'));assert.ok(excerpt.length<=16000);
 assert.equal(focusedSourceExcerpt('small',goal),'small');
});
test('source evidence is job-bound, allowlisted, and redacts credentials and signed URLs',()=>{
 const job={id:'job',monitor:{lastTimingRepair:{previousError:'BAD_CUE token=private https://example.org/private'}},last_error:'UNCHANGED',secret:'never'};
 const evidence=courseRepairEvidence('job',job);
 assert.match(evidence.previousTimingError,/BAD_CUE/);assert.doesNotMatch(JSON.stringify(evidence),/private|never/);
 assert.throws(()=>courseRepairEvidence('other',job),/MISMATCH/);
});

test('relevant middle source survives the CPU prompt budget rather than hiding behind the header',()=>{
 const content='h'.repeat(20000)+'\n synchronization: async () => { actualProducer(); }\n'+'t'.repeat(40000);
 const excerpt=focusedSourceExcerpt(content,goal);
 const messages=budgetRepairMessages([{role:'system',content:'rule '.repeat(650)},
  {role:'user',content:JSON.stringify({task:goal,observations:['READ '+producer+':\n'+excerpt]})}],8192,768,'cpu');
 assert.match(JSON.parse(messages[1].content).observations.join('\n'),/actualProducer/);
});

test('a refined authenticated search outranks older broad inventory after checkpoint rollover',()=>{
 const alignment='lib/ultimate-course-builder/instructional/picture-timeline.mjs';
 const noise='lib/ultimate-course-builder/quality/lesson-quality.ts';
 const previous=rememberSourcePaths([], [producer,noise]);
 const fresh=rankSourcePaths('PICTURE_CUE_NOT_ALIGNED_TO_SPEECH',[producer,noise,alignment].map(path=>({path,type:'blob'})),goal);
 const inventory=JSON.parse(JSON.stringify(rememberSourcePaths(previous,fresh)));
 const history=['read:'+producer,'search:picture_cue_not_aligned_to_speech'];
 assert.deepEqual(recoverRepeatedInspection(history,{type:'search',query:'PICTURE_CUE_NOT_ALIGNED_TO_SPEECH'},[],inventory),{type:'read',path:alignment});
});
test('exact source paths in the task stay read hints from the authenticated tree',()=>{
 const exact='lib/ultimate-course-builder/instructional/approved-presentation.mjs';
 const tree=[producer,exact].map(path=>({type:'blob',path}));
 assert.equal(rankSourcePaths('unknown failure',tree,goal+' Source location: '+exact)[0],exact);
 assert.deepEqual(rankSourcePaths(exact,[]),[]);
});
test('binary fixtures never displace source files in the bounded inventory',()=>{
 const previous=Array.from({length:64},(_,i)=>'lib/old-'+i+'.ts');
 const inventory=rememberSourcePaths(previous,[producer,'tests/video/fixture.png']);
 assert.equal(inventory[0],producer);assert.equal(inventory.length,64);
 assert.ok(!inventory.includes('tests/video/fixture.png'));
 assert.deepEqual(rankSourcePaths('fixture',[{type:'blob',path:'tests/video/fixture.png'}]),[]);
});

const evidenceJob={id:'job',build_id:'build',payload:{competencyId:'cap'},monitor:{lastTimingRepair:{at:'2026-10-31T00:00:00Z',previousError:'OLD_PICTURE_FAILURE'}}};
const lesson={id:'lesson',build_id:'build',lesson_key:'cap',competency_id:'cap',steps:[
 {step:'natural_narration',state:'passed',completed_at:'2026-11-03T21:00:00Z',findings:[]},
 {step:'narration_qa',state:'failed',completed_at:'2026-11-03T20:00:00Z',findings:[{severity:'error',code:'OLD_PACE',message:'old recording'}]},
 {step:'lesson_film_render',state:'passed',completed_at:'2026-11-07T04:01:00Z',findings:[]},
 {step:'finished_media_qa',state:'failed',completed_at:'2026-11-07T04:25:00Z',findings:[{severity:'error',code:'Media quality gate failed',message:'captions do not cover rendered narration'}]},
 {step:'synchronization',state:'failed',completed_at:'2026-11-07T04:41:00Z',findings:[{severity:'error',code:'REPAIR_PRODUCER_UNCHANGED',message:'unchanged'}]},
]};
test('current persisted gate replaces superseded monitor history and older narration QA',()=>{
 const evidence=courseRepairEvidence('job',evidenceJob,structuredClone(lesson));
 assert.equal(evidence.blockedStep.step,'synchronization');
 assert.equal(evidence.latestFailedGate.step,'finished_media_qa');
 assert.match(courseDiagnosticQuery(goal,evidence),/captions do not cover/);
 assert.doesNotMatch(JSON.stringify(evidence),/OLD_PICTURE_FAILURE|OLD_PACE/);
});
test('a later passed producer cannot promote its superseded failed gate as current',()=>{
 const revised=structuredClone(lesson);revised.steps.find(s=>s.step==='lesson_film_render').completed_at='2026-11-07T05:00:00Z';
 assert.equal(courseRepairEvidence('job',evidenceJob,revised).latestFailedGate,null);
 const undated=structuredClone(lesson);undated.steps.find(s=>s.step==='finished_media_qa').completed_at='unknown';
 assert.equal(courseRepairEvidence('job',evidenceJob,undated).latestFailedGate,null);
});
test('lesson diagnostics remain bound to the exact source build and competency',()=>{
 for(const patch of [{build_id:'other'},{competency_id:'other'},{lesson_key:'other'}])
  assert.throws(()=>courseRepairEvidence('job',evidenceJob,{...lesson,...patch}),/LESSON_EVIDENCE_MISMATCH/);
 assert.equal(courseRepairEvidence('job',evidenceJob).previousTimingErrorStatus,'historical-only');
});
test('evidence loader queries the linked lesson and propagates database failures',async()=>{
 const calls=[];
 const db={from(table){calls.push(table);const query={select(){return query;},eq(k,v){calls.push([k,v]);return query;},order(){return query;},limit(){return query;},async maybeSingle(){return {data:lesson};},then(resolve){return Promise.resolve({data:lesson.steps}).then(resolve);}};return query;}};
 const result=await loadCourseRepairEvidence(db,'job',evidenceJob);
 assert.equal(result.lessonBuildId,'lesson');assert.ok(calls.some(c=>Array.isArray(c)&&c[0]==='lesson_build_id'&&c[1]==='lesson'));
 const failing={from(){const query={select(){return query;},eq(){return query;},order(){return query;},limit(){return query;},async maybeSingle(){return {error:Error('database unavailable')};}};return query;}};
 await assert.rejects(loadCourseRepairEvidence(failing,'job',evidenceJob),/database unavailable/);
});

test('superseded or malformed gates are not silently promoted through the fallback diagnostic',()=>{
 const stale={...lesson,steps:lesson.steps.filter(s=>['natural_narration','narration_qa'].includes(s.step))};
 const evidence=courseRepairEvidence('job',evidenceJob,stale);
 assert.equal(evidence.latestFailedGate,null);assert.equal(evidence.blockedStep,null);
 assert.equal(courseDiagnosticQuery('original task',evidence),'original task');
 assert.doesNotMatch(JSON.stringify(evidence),/OLD_PICTURE_FAILURE|OLD_PACE/);
 const malformed={...lesson,steps:[null,{step:'__proto__',state:'failed',completed_at:'2026-11-07T00:00:00Z',findings:[null]}]};
 assert.equal(courseRepairEvidence('job',evidenceJob,malformed).latestFailedGate,null);
});
