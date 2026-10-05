import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { compatibleVisualTask, reviewedSceneEvidence } from '@/lib/ultimate-course-builder/instructional/reviewed-scene-evidence';
import { buildSceneAssignments } from '@/lib/ultimate-course-builder/instructional/scene-assignments';

const cases = [
  ['reordered actions', 'Show shampooing and massaging hair at a basin.', 'At the sink, massaging and shampooing client hair', true],
  ['shorter requirement', 'Show shampooing hair', 'Applying shampoo foam to client hair at a basin', true],
  ['paraphrase', 'Washing the client hair', 'Shampooing hair at the basin', true],
  ['boilerplate wrapper', 'Show a relevant, non-looping instructional visual for Shampooing Hair during why it matters.', 'Applying shampoo foam to client hair at a basin', true],
  ['consultation wording', 'A client consultation', 'Barber talking to a seated customer', true],
  ['plural objects', 'Organizing clippers and scissors', 'Arranging a clipper and shears on a workstation', true],
  ['technical paraphrase', 'Recovery of refrigerant with equipment', 'Equipment recovering refrigerant from a system', true],
  ['filler is not evidence', 'Show the gauge and a compressor', 'The barber and a client', false],
  ['duplicated words do not increase coverage', 'hair hair hair and calibration pressure', 'hair at a basin', false],
  ['unrelated task', 'Client consultation', 'Shampooing client hair at a basin', false],
  ['missing requested action', 'Shampooing and massaging hair', 'Shampooing hair at a basin', false],
  ['approval is not implied', 'Shampooing and massaging hair at a basin and supervisor approval', 'Shampooing and massaging hair at a basin', false],
  ['washing is not disinfection', 'Disinfecting clippers and scissors', 'Cleaning clippers and scissors', false],
  ['evacuation is not recovery', 'Refrigerant recovery equipment', 'Refrigerant evacuation equipment', false],
  ['same action different subject', 'Cleaning a gauge', 'Cleaning a basin', false],
  ['low is not high pressure', 'High pressure refrigerant system', 'Low pressure refrigerant system', false],
  ['contradictory qualifier', 'High pressure gauge', 'Low and high pressure gauges', false],
  ['single-digit number matters', 'Gauge set to 2 bar', 'Gauge set to 3 bar', false],
  ['non-prefixed qualifier is not positive evidence', 'Conductive safety glove', 'Non-conductive safety glove', false],
  ['explicit number matters', 'Gauge set to 50 psi', 'Gauge set to 30 psi', false],
  ['negation in observation', 'Connecting a gauge', 'Not connecting a gauge', false],
  ['negation in requirement', 'Do not connect the gauge', 'Connecting the gauge', false],
  ['order requires more evidence', 'Disinfect clippers before cutting hair', 'Disinfect clippers and cutting hair', false],
  ['empty requirement', '', 'Shampooing hair', false],
  ['filler-only requirement', 'Show a relevant instructional visual', 'Client hair', false],
  ['single specific concept', 'Consultation', 'A client consultation', true],
] as const;

const scene = { id: 'hair', sceneType: 'context', visualRequirement: 'Show shampooing hair' };
const asset = {
  id: 'clip', entitlement_id: 'license', license_evidence_url: 'https://media.example/license',
  public_url: 'https://media.example/clip.mp4', content_sha256: 'a'.repeat(64),
  visual_observation: {
    method: 'sampled-frame-inspection', contentSha256: 'a'.repeat(64),
    reviewedAt: '2026-10-03T22:36:32Z', sampleFractions: [0.05, 0.35, 0.65, 0.9],
    visibleActions: ['Applying shampoo foam to client hair at a basin'],
    scope: 'Visible actions at sampled times only; not proof of a complete procedure.',
  },
};

describe('task-compatible footage without sentence equality', () => {
  for (const [name, requirement, action, expected] of cases) {
    it(name, () => assert.equal(Boolean(compatibleVisualTask(requirement, action)), expected));
  }
  it('records compatible terms and original observation rather than claiming an exact match', () => {
    const result = buildSceneAssignments([scene], [asset]);
    assert.equal(result.gaps.length, 0);
    assert.equal(result.assignments[0].visualEvidence.matchMethod, 'task-compatible');
    assert.deepEqual(result.assignments[0].visualEvidence.matchedActions, asset.visual_observation.visibleActions);
    assert.ok(!result.assignments[0].relevanceReason.includes('exactly matches'));
  });
  it('also accepts paraphrased already-verified visual coverage', () => {
    const result = buildSceneAssignments([scene], [{
      ...asset, visual_observation: undefined, visual_coverage_verified: true,
      visual_requirements: ['Washing hair at a sink'],
    }]);
    assert.equal(result.gaps.length, 0);
    assert.equal(result.assignments[0].assignmentMethod, 'verified-coverage');
  });
  it('does not use a filename or lesson match to override contrary inspected footage', () => {
    const misleading = { ...asset, title: 'Client consultation', lesson_match_verified: true };
    const result = buildSceneAssignments([{ ...scene, visualRequirement: 'Client consultation' }], [misleading]);
    assert.equal(result.assignments.some((entry) => entry.assetId === misleading.id), false);
    assert.equal(result.assignments[0].assignmentMethod, 'instructional-render');
  });
  it('retains every demonstration guard', () => {
    for (const field of ['sceneType', 'scene_type', 'stage', 'title']) {
      assert.equal(reviewedSceneEvidence({ ...scene, [field]: ' Demonstration ' }, asset), null);
    }
  });
  it('retains source hash, inspection timestamp, method and sample validation', () => {
    for (const candidate of [
      { ...asset, content_sha256: undefined },
      { ...asset, content_sha256: 'b'.repeat(64) },
      { ...asset, visual_observation: { ...asset.visual_observation, method: 'filename' } },
      { ...asset, visual_observation: { ...asset.visual_observation, reviewedAt: 'invalid' } },
      { ...asset, visual_observation: { ...asset.visual_observation, sampleFractions: [] } },
      { ...asset, visual_observation: { ...asset.visual_observation, sampleFractions: [-1] } },
    ]) assert.equal(reviewedSceneEvidence(scene, candidate), null);
  });
  it('retains licensing and distinct-source checks', () => {
    const unlicensed = buildSceneAssignments([scene], [{ ...asset, license_evidence_url: '' }]);
    assert.equal(unlicensed.assignments.some((entry) => entry.assetId === asset.id), false);
    const duplicated = buildSceneAssignments([scene, { ...scene, id: 'second' }], [asset, { ...asset, id: 'copy' }]);
    assert.equal(duplicated.assignments.filter((entry) => entry.assignmentMethod === 'reviewed-action-coverage').length, 1);
    assert.equal(duplicated.assignments.filter((entry) => entry.assignmentMethod === 'instructional-render').length, 1);
  });
  it('does not mutate the scene requirement or inspection metadata', () => {
    const before = JSON.stringify({ scene, asset });
    assert.ok(reviewedSceneEvidence(scene, asset));
    assert.equal(JSON.stringify({ scene, asset }), before);
  });
});
