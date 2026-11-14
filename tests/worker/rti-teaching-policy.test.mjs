import test from 'node:test';
import assert from 'node:assert/strict';
import {assertRtiSubjectTeaching,lessonInstructionalSources,RTI_TEACHING_REQUIREMENTS} from '../../lib/ultimate-course-builder/instructional/rti-teaching-policy.mjs';
const rti={id:'course:a6b0b712-1cf0-475a-ba79-ee2023dea8ec'};
const blueprint=text=>({segments:[{text}],assessment:{questions:[{prompt:'Which disinfectant is suitable for this tool?'}],reassessment:[]}});
test('rejects navigation lectures and checkpoint-purpose questions before media generation',()=>{
 for(const text of ['Click the next button.','Press the play button to start this lesson.','Here is how to answer multiple-choice questions.','Use this assessment to verify your understanding before continuing.','Read the checkpoint prompt carefully.'])
  assert.throws(()=>assertRtiSubjectTeaching(blueprint(text),rti),/RTI_NAVIGATION_FILLER/);
 const b=blueprint('Keep clean and used tools separate.');
 b.assessment.questions=[{prompt:'What is the purpose of this checkpoint?'}];
 assert.throws(()=>assertRtiSubjectTeaching(b,rti),/RTI_NAVIGATION_FILLER/);
});
test('retains subject instruction, actual questions, and a brief pause cue unchanged',()=>{
 const b=blueprint('Pause and answer: which disinfectant is appropriate? Select the product for the tool material, then follow the manufacturer instructions. Review the scalp before choosing a service. Press the start button on the device according to its instructions.');
 const before=structuredClone(b);assertRtiSubjectTeaching(b,rti);assert.deepEqual(b,before);
});
test('keeps other programs and approved stored material outside the new-authoring policy',()=>{
 assert.doesNotThrow(()=>assertRtiSubjectTeaching(blueprint('Click the next button.'),{id:'course:other'}));
});
test('checkpoint sources come only from its own preceding module, preserving source identity',()=>{
 const items=[['a','Welcome'],['b','Ethics'],['c','Orientation — Checkpoint'],['d','Infection Control'],['e','Tool Cleaning'],['f','Safety — Checkpoint'],['g','Nails']].map(([id,title])=>({id,title,authorityRequirementIds:[]}));
 const sources=items.map(c=>({id:'course-lesson:'+c.id,text:c.title}));
 const p={...rti,competencies:items,instructionalSources:sources};
 assert.deepEqual(lessonInstructionalSources(p,items[5]),[sources[3],sources[4]]);
 assert.deepEqual(lessonInstructionalSources(p,items[2]),[sources[0],sources[1]]);
 assert.deepEqual(lessonInstructionalSources(p,items[4]),[sources[4]]);
 assert.deepEqual(lessonInstructionalSources({...p,id:'course:other'},items[5]),[sources[5]]);
});
test('RTI requirements retain all subjects and shop-based performance verification',()=>{
 assert.match(RTI_TEACHING_REQUIREMENTS,/hair, skin, nails, makeup, safety and business/);
 assert.match(RTI_TEACHING_REQUIREMENTS,/picture sequences/);
 assert.match(RTI_TEACHING_REQUIREMENTS,/verified by the shop supervisor/);
 assert.match(RTI_TEACHING_REQUIREMENTS,/not practical signoff/);
});

test('final exam uses all subject modules rather than checkpoint instructions',()=>{
 const items=[['a','Hair Care'],['b','Hair — Checkpoint'],['c','Skin Care'],['d','Cosmetology Final Examination']].map(([id,title])=>({id,title,authorityRequirementIds:[]}));
 const sources=items.map(c=>({id:'course-lesson:'+c.id,text:c.title}));
 assert.deepEqual(lessonInstructionalSources({...rti,competencies:items,instructionalSources:sources},items[3]),[sources[0],sources[2]]);
});
