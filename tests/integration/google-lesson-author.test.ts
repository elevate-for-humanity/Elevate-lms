import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { authorGoogleLesson, validateGoogleAuthoringEvidence } from '../../lib/ultimate-course-builder/instructional/google-lesson-author';
import { contractHash } from '../../lib/ultimate-course-builder/core/lesson-contract';

function fixture() {
  const blueprint = JSON.parse(readFileSync(new URL('../../docs/ultimate-course-builder/lessons/cosmetology-welcome.blueprint.json', import.meta.url), 'utf8'));
  blueprint.assessment.questions.push(...blueprint.assessment.reassessment.slice(0, 2).map((q: any, i: number) => ({...q, id: 'recap-extra-' + i, prompt: ['Your first client asks for work beyond the assignment your supervisor verified. What is the professional response?', 'A dashboard marks one training module complete. Which conclusion can you support from that record alone?'][i]})));
  for (const segment of blueprint.segments) segment.teachingVisual.steps = segment.teachingVisual.steps.slice(0,4);
  const competency: any = { id: blueprint.competencyId, title: 'Welcome to Cosmetology Apprenticeship', type: 'knowledge', authorityRequirementIds: [], requiresDemonstration: false, requiresPracticalEvidence: false };
  const sources = [{ id: `course-lesson:${competency.id}`, text: blueprint.segments.map((segment: any) => segment.text).join('\n') }];
  const input: any = { profile: { title: 'Cosmetology', authority: 'course-defined' }, competency, sources };
  const result = { blueprint, grounding: blueprint.segments.map((segment: any) => ({ segmentId: segment.id, sourceId: sources[0].id, excerpt: segment.text })) };
  return { input, result };
}
test('one reviewed source-bound blueprint supplies all instructional stages', async () => {
  const { input, result } = fixture();
  let calls = 0;
  const output: any = await authorGoogleLesson(input, async (_system, request: any) => {
    calls++;
    return calls === 1 ? result : { pass: true, findings: [], competencyId: input.competency.id, blueprintHash: request.blueprintHash };
  });
  assert.equal(calls, 2);
  assert.equal(output.authoringEvidence.sourceHash, contractHash(input.sources));
  assert.equal(output.segments.length, 13);
  assert.deepEqual(output.assessment, result.blueprint.assessment);
  validateGoogleAuthoringEvidence(output, input.sources);
  output.segments[0].text += ' Unreviewed instructional change.';
  assert.throws(() => validateGoogleAuthoringEvidence(output, input.sources), /ULTIMATE_CURRENT_AUTHORING_EVIDENCE_REQUIRED/);
});
test('fabricated citation is rejected before review or media generation', async () => {
  const { input, result } = fixture();
  result.grounding[0].excerpt = 'This invented source passage was never in the authoritative curriculum provided.';
  await assert.rejects(authorGoogleLesson(input, async () => result), /ULTIMATE_SOURCE_CITATION_INVALID/);
});
test('a critical reviewer finding blocks the blueprint', async () => {
  const { input, result } = fixture();
  let calls = 0;
  await assert.rejects(authorGoogleLesson(input, async (_system, request: any) => ++calls === 1 ? result : {
    pass: true, competencyId: input.competency.id, blueprintHash: request.blueprintHash, findings: ['Assessment tests something not taught'],
  }), /ULTIMATE_INSTRUCTIONAL_REVIEW_FAILED/);
});
test('missing sources never produce a generic successful lesson', async () => {
  const { input } = fixture(); input.sources = [];
  await assert.rejects(authorGoogleLesson(input, async () => { throw new Error('must not call provider'); }), /ULTIMATE_INSTRUCTIONAL_SOURCES_REQUIRED/);
});
test('full-narration graphics cannot silently replace a concise visual plan', async () => {
  const {input,result} = fixture();
  delete result.blueprint.segments[0].teachingVisual;
  await assert.rejects(authorGoogleLesson(input, async () => result), /ULTIMATE_CONCISE_TEACHING_VISUAL_REQUIRED/);
});
test('authoring schema includes mandatory activities, reassessment and practical evidence', async () => {
  const { input, result } = fixture();
  input.competency.requiresPracticalEvidence = true;
  result.blueprint.assessment.practicalRubric = { criteria: ['Observed performance'] };
  let calls = 0;
  await authorGoogleLesson(input, async (_system, request: any) => {
    if (++calls === 1) {
      assert.deepEqual(request.blueprintSchema.activities.map((a: any) => a.type),
        ['guided_practice','independent_practice','knowledge_check','remediation','reassessment']);
      assert.equal(request.blueprintSchema.stages.length, 13);
      assert.deepEqual(request.blueprintSchema.stages.map((s: any) => s.stage), request.sequence);
      assert.ok(request.blueprintSchema.assessment.reassessment[0].explanation);
      assert.ok(request.blueprintSchema.assessment.practicalRubric.criteria.length);
      return result;
    }
    return {pass:true, findings:[], competencyId:input.competency.id, blueprintHash:request.blueprintHash};
  });
});

test('invalid visual receives targeted repair and still requires independent review', async () => {
  const {input,result}=fixture();
  const invalid=structuredClone(result);
  invalid.blueprint.segments[0].teachingVisual.steps[0].value='Disconnect the energized compressor';
  let calls=0;
  const output=await authorGoogleLesson(input,async (_system,request:any)=>{
    calls++;
    if(calls===1)return invalid;
    if(calls===2){
      assert.equal(request.repair.code,'BLUEPRINT_TEACHING_VISUAL_NOT_SCRIPT_BOUND');
      assert.equal(request.repair.invalidVisuals[0].segmentId,result.blueprint.segments[0].id);
      assert.deepEqual(request.sources,input.sources);
      return result;
    }
    return {pass:true,findings:[],competencyId:input.competency.id,blueprintHash:request.blueprintHash};
  });
  assert.equal(calls,3);
  validateGoogleAuthoringEvidence(output,input.sources);
});
test('repeated unsupported visual cannot bypass validation or reach independent approval',async()=>{
  const {input,result}=fixture();
  result.blueprint.segments[0].teachingVisual.steps[0].value='Disconnect the energized compressor';
  let calls=0;
  await assert.rejects(authorGoogleLesson(input,async()=>{calls++;return result;}),/BLUEPRINT_TEACHING_VISUAL_NOT_SCRIPT_BOUND/);
  assert.equal(calls,3);
});

test('missing scene objective evidence is repaired before a lesson can be reviewed',async()=>{
 const {input,result}=fixture();
 const invalid=structuredClone(result);
 invalid.blueprint.segments[0].objectiveIds=['invented-objective'];
 let calls=0;
 const output=await authorGoogleLesson(input,async(_system,request:any)=>{
  calls++;
  if(calls===1)return invalid;
  if(calls===2){assert.equal(request.repair.code,'BLUEPRINT_SCRIPT_SCENES_REQUIRED');return result;}
  return {pass:true,findings:[],competencyId:input.competency.id,blueprintHash:request.blueprintHash};
 });
 assert.equal(calls,3);
 validateGoogleAuthoringEvidence(output,input.sources);
});

test('a three-question generation is repaired to five before independent review',async()=>{
 const {input,result}=fixture();const short=structuredClone(result);short.blueprint.assessment.questions=short.blueprint.assessment.questions.slice(0,3);let calls=0;
 const output=await authorGoogleLesson(input,async(_system,request:any)=>{
  calls++;if(calls===1)return short;
  if(calls===2){assert.equal(request.repair.code,'BLUEPRINT_FIVE_QUESTION_RECAP_REQUIRED');return result;}
  return {pass:true,findings:[],competencyId:input.competency.id,blueprintHash:request.blueprintHash};
 });
 assert.equal(calls,3);assert.equal(output.assessment.questions.length,5);validateGoogleAuthoringEvidence(output,input.sources);
});
test('repeated three-question output cannot reach independent approval',async()=>{
 const {input,result}=fixture();result.blueprint.assessment.questions=result.blueprint.assessment.questions.slice(0,3);let calls=0;
 await assert.rejects(authorGoogleLesson(input,async()=>{calls++;return result;}),/BLUEPRINT_FIVE_QUESTION_RECAP_REQUIRED/);assert.equal(calls,3);
});
