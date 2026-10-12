import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { authorGoogleLesson, validateGoogleAuthoringEvidence } from '../../lib/ultimate-course-builder/instructional/google-lesson-author';
import { contractHash } from '../../lib/ultimate-course-builder/core/lesson-contract';

function fixture() {
  const blueprint = JSON.parse(readFileSync(new URL('../../docs/ultimate-course-builder/lessons/cosmetology-welcome.blueprint.json', import.meta.url), 'utf8'));
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
