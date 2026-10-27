import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const root=new URL('../../',import.meta.url);
const strip=path=>stripTypeScriptTypes(readFileSync(new URL(path,root),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?;\n/gm,'').replaceAll('export ','');
const {validateTeachingVisual}=new Function('compatibleVisualTask',strip('lib/ultimate-course-builder/instructional/teaching-visual.ts')+';return {validateTeachingVisual};')(()=>{throw Error('The sample uses exact narration excerpts');});
const sequence=['why_it_matters','activate_prior_knowledge','terminology','concept_explanation','instructor_example','demonstration','guided_practice','knowledge_check','independent_practice','mistake_and_correction','assessment','remediation','recap'];
const {validateLessonBlueprint}=new Function('ULTIMATE_TEACHING_SEQUENCE','contractHash','validateTeachingVisual',strip('lib/ultimate-course-builder/instructional/lesson-blueprint.ts')+';return {validateLessonBlueprint};')(sequence,()=>{throw Error('Hashing is not exercised');},validateTeachingVisual);
const sample=JSON.parse(readFileSync(new URL('docs/ultimate-course-builder/lessons/cosmetology-welcome.blueprint.json',root),'utf8'));
const competency={id:sample.competencyId,authorityRequirementIds:[],requiresPracticalEvidence:false};
test('the authored cosmetology sample has valid visual evidence and practice for every objective',()=>{
 assert.doesNotThrow(()=>validateLessonBlueprint(sample,competency));
});
test('removing independent professional practice restores the original failure',()=>{
 const copy=structuredClone(sample);
 copy.activities=copy.activities.filter(a=>a.id!=='independent-response');
 assert.throws(()=>validateLessonBlueprint(copy,competency),/BLUEPRINT_OBJECTIVE_PRACTICE_REQUIRED:professional-action:independent_practice/);
});
