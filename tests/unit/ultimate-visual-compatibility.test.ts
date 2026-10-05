import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { visualRequirementCompatibility } from '@/lib/ultimate-course-builder/instructional/visual-compatibility';
import { reviewedSceneEvidence } from '@/lib/ultimate-course-builder/instructional/reviewed-scene-evidence';
import { buildSceneAssignments } from '@/lib/ultimate-course-builder/instructional/scene-assignments';

const hash = 'a'.repeat(64);
const asset = {
  id: 'inspected-clip', entitlement_id: 'license',
  public_url: 'https://media.example/clip.mp4',
  license_evidence_url: 'https://media.example/license.pdf',
  content_sha256: hash,
  visual_observation: {
    contentSha256: hash, method: 'sampled-frame-inspection',
    reviewedAt: '2026-10-03T22:36:32Z', sampleFractions: [0.05, 0.35, 0.65, 0.9],
    visibleActions: ['Shampooing and massaging hair at a basin'],
    scope: 'Sampled visible actions only; not proof of a complete procedure.',
  },
};
const scene = {
  id: 'hair-wash-context', sceneType: 'context',
  visualRequirement: 'Show a relevant, non-looping instructional visual for hair washing basics during why it matters.',
};

describe('instructional visual compatibility rather than full-string equality', () => {
  const positives = [
    ['Hair washing', 'Shampooing and massaging hair at a basin'],
    ['Show a relevant, non-looping instructional visual for Hair Washing during why it matters.', 'A stylist shampoos hair at the basin'],
    ['A customer consultation', 'Barber talking to a seated client'],
    ['Haircut with shears', 'Cutting hair with scissors'],
    ['Clippers selection', 'Choosing clippers for a haircut'],
    ['Compressor inspection', 'A technician inspects a compressor'],
    ['Measuring voltage', 'Voltage is measured'],
    ['Invoice review', 'Review of invoices'],
    ['Hair at a basin', 'Hair is washed at a sink'],
    ['Show hair washing and scalp massage.', ['Washing hair at the sink', 'Massaging the scalp']],
    ['SHOW   SHAMPOOING HAIR!', 'Shampooing hair'],
    ['Applying bleach to hair on foil', 'Bleach product is applied to hair on foil'],
    ['Hair brushing and blow-drying', 'Brushing and blow drying client hair'],
  ];
  for (const [requirement, observations] of positives) {
    it(`accepts compatible content: ${requirement}`, () => {
      const result = visualRequirementCompatibility(String(requirement), observations);
      assert.equal(result.compatible, true, JSON.stringify(result));
      assert.ok(result.matchedConcepts.length > 0);
    });
  }
  const negatives = [
    ['Client consultation', 'Shampooing client hair'],
    ['Washing hair', 'Washing client feet at a basin'],
    ['Shampooing hair and supervisor approval', 'Shampooing hair at a basin'],
    ['Disinfecting tools', 'Spraying tools on a salon cart'],
    ['Sterilizing tools', 'Cleaning tools'],
    ['Recovering refrigerant', 'Charging refrigerant'],
    ['Opening a valve', 'Closing a valve'],
    ['Connecting a wire', 'Disconnecting a wire'],
    ['Washing hair', 'The stylist is not washing hair'],
    ['Washing hair', 'Hair is washed without gloves'],
    ['Never disconnect the wire', 'Disconnecting the wire'],
    ['Measure 24 volts', 'Measuring 12 volts'],
    ['Applying bleach to hair', 'Applying product to hair on foil'],
    ['Compressor inspection', 'Inspecting a salon chair'],
    ['Connecting a red wire', 'Connecting a blue wire'],
    ['High pressure refrigerant recovery', 'Low pressure refrigerant recovery'],
    ['Washing hair', ['Washing feet at a sink', 'Cutting hair']],
    ['Inspecting the supply valve', 'Inspecting the return valve'],
    ['Inspecting a de-energized wire', 'Inspecting a live wire'],
    ['', 'Washing hair'],
    ['Show a relevant instructional visual.', 'Washing hair'],
    ['Customer consultation and invoice approval', ['Client consultation', 'Preparing an invoice']],
  ];
  for (const [requirement, observations] of negatives) {
    it(`does not manufacture coverage: ${requirement || '(empty)'}`, () => {
      assert.equal(visualRequirementCompatibility(String(requirement), observations).compatible, false);
    });
  }
});

describe('reviewed footage assignment integration', () => {
  it('assigns compatible inspected footage and retains the original evidence', () => {
    const result = buildSceneAssignments([scene], [asset]);
    assert.deepEqual(result.gaps, []);
    const assignment = result.assignments[0];
    assert.equal(assignment.assignmentMethod, 'reviewed-action-coverage');
    assert.equal(assignment.licenseEvidenceUrl, asset.license_evidence_url);
    assert.equal(assignment.visualEvidence.contentSha256, hash);
    assert.deepEqual(assignment.visualEvidence.matchedActions, asset.visual_observation.visibleActions);
    assert.equal(assignment.visualEvidence.compatibility.method, 'instructional-compatibility-v1');
    assert.ok(!assignment.relevanceReason.includes('exactly matches'));
  });
  it('accepts paraphrased explicitly verified coverage too', () => {
    const result = buildSceneAssignments([scene], [{
      id: 'verified', entitlement_id: 'license', public_url: asset.public_url,
      license_evidence_url: asset.license_evidence_url,
      visual_coverage_verified: true, visual_requirements: ['Shampooing hair'],
    }]);
    assert.deepEqual(result.gaps, []);
    assert.equal(result.assignments[0].assignmentMethod, 'verified-coverage');
  });
  it('does not treat a title as an inspection', () => {
    const result = buildSceneAssignments([scene], [{
      id: 'title-only', title: 'Hair washing', entitlement_id: 'license',
      public_url: asset.public_url, license_evidence_url: asset.license_evidence_url,
    }]);
    assert.equal(result.gaps.length, 1);
  });
  it('does not reuse a clip with the same hash for two scenes', () => {
    const result = buildSceneAssignments([scene, { ...scene, id: 'second' }],
      [asset, { ...asset, id: 'copy' }]);
    assert.equal(result.assignments.length, 1);
    assert.equal(result.gaps.length, 1);
  });
  it('still requires an entitlement, a license record, and usable source URL', () => {
    for (const missing of ['entitlement_id', 'license_evidence_url', 'public_url']) {
      assert.equal(buildSceneAssignments([scene], [{ ...asset, [missing]: '' }]).gaps.length, 1);
    }
  });
  it('does not bypass a failed inspection using a matching title or lesson keyword', () => {
    const misleading = { ...asset, title: 'Supervisor approval', lesson_match_verified: true };
    assert.equal(buildSceneAssignments([{ ...scene,
      visualRequirement: 'Shampooing hair and supervisor approval',
    }], [misleading]).gaps.length, 1);
  });
  it('retains hash, timestamp and sampled-frame provenance checks', () => {
    const variations = [
      { ...asset, content_sha256: undefined },
      { ...asset, content_sha256: 'b'.repeat(64) },
      { ...asset, visual_observation: { ...asset.visual_observation, reviewedAt: 'invalid' } },
      { ...asset, visual_observation: { ...asset.visual_observation, sampleFractions: [] } },
      { ...asset, visual_observation: { ...asset.visual_observation, sampleFractions: [-0.1] } },
      { ...asset, visual_observation: { ...asset.visual_observation, sampleFractions: [1.1] } },
      { ...asset, visual_observation: { ...asset.visual_observation, method: 'title-inference' } },
    ];
    for (const variation of variations) assert.equal(reviewedSceneEvidence(scene, variation), null);
  });
  it('does not claim sampled frames prove a complete procedural demonstration', () => {
    for (const key of ['sceneType', 'scene_type', 'stage', 'title']) {
      assert.equal(reviewedSceneEvidence({ ...scene, [key]: 'demonstration' }, asset), null);
    }
  });
  it('does not mutate persisted observations, configured mappings or assets', () => {
    const before = JSON.stringify({ scene, asset });
    buildSceneAssignments([scene], [asset]);
    assert.equal(JSON.stringify({ scene, asset }), before);
  });
});
