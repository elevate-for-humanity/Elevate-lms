import { describe, it, expect } from 'vitest';
import { buildSceneAssignments } from '@/lib/ultimate-course-builder/instructional/scene-assignments';
const scenes = [{ id: 'scene:consultation', visualRequirement: 'A client consultation' }];
const asset = {
  id: 'clip',
  entitlement_id: 'license',
  provider_item_id: 'item',
  public_url: 'https://media.example/clip.mp4',
  license_evidence_url: 'https://media.example/license.pdf',
  visual_coverage_verified: true,
  visual_requirements: ['A client consultation'],
};
describe('automatic licensed scene assignment', () => {
  it('uses inspected visible actions instead of a misleading title for semantic assignment', () => {
    const inspected = {
      ...asset,
      visual_coverage_verified: false,
      lesson_match_verified: true,
      title: 'A client consultation',
      observed_visual_actions: ['Shampooing hair at a basin'],
    };
    expect(buildSceneAssignments(scenes, [inspected]).gaps).toHaveLength(1);
    expect(
      buildSceneAssignments([{ id: 'shampoo', visualRequirement: 'Shampooing hair' }], [inspected])
        .gaps,
    ).toEqual([]);
  });
  it('does not count derivatives of the same licensed item as different source clips', () => {
    const copies = [
      { ...asset, content_sha256: 'original' },
      { ...asset, id: 'derived', content_sha256: 'converted' },
    ];
    expect(
      buildSceneAssignments([...scenes, { ...scenes[0], id: 'second' }], copies).gaps,
    ).toHaveLength(1);
  });
  it("finds complete coverage when first-fit would consume another scene's only clip", () => {
    const boards = [
      { id: 'first', visualRequirement: 'Consultation' },
      { id: 'second', visualRequirement: 'Safety' },
    ];
    const shared = { ...asset, id: 'a', visual_requirements: ['Consultation', 'Safety'] };
    const limited = {
      ...asset,
      id: 'b',
      provider_item_id: 'second-item',
      visual_requirements: ['Consultation'],
    };
    const result = buildSceneAssignments(boards, [shared, limited]);
    expect(result.gaps).toEqual([]);
    expect(result.assignments.map((a) => [a.sceneId, a.assetId])).toEqual([
      ['first', 'b'],
      ['second', 'a'],
    ]);
  });
  it('does not count identical bytes under separate item IDs as distinct footage', () => {
    const copies = [asset, { ...asset, id: 'copy', provider_item_id: 'other-item' }].map((a) => ({
      ...a,
      content_sha256: 'same-digest',
    }));
    expect(
      buildSceneAssignments([...scenes, { ...scenes[0], id: 'second' }], copies).gaps,
    ).toHaveLength(1);
  });
  it('creates an assignment without pre-existing scene metadata and preserves the license', () => {
    const result = buildSceneAssignments(scenes, [asset]);
    expect(result.gaps).toEqual([]);
    expect(result.assignments[0]).toMatchObject({
      sceneId: 'scene:consultation',
      assetId: 'clip',
      licenseEvidenceUrl: asset.license_evidence_url,
      assignmentMethod: 'verified-coverage',
    });
    expect(asset).not.toHaveProperty('scene_id');
  });
  it('does not treat a title or an unverified description as visual proof', () => {
    expect(
      buildSceneAssignments(scenes, [
        { ...asset, visual_coverage_verified: false, title: 'A client consultation' },
      ]).gaps,
    ).toHaveLength(1);
  });
  it('reports every uncovered scene rather than stopping at the first', () => {
    expect(
      buildSceneAssignments(
        [...scenes, { id: 'scene:assessment', visualRequirement: 'Knowledge assessment' }],
        [],
      ).gaps.map((g) => g.sceneId),
    ).toEqual(['scene:consultation', 'scene:assessment']);
  });
  it('rejects missing license evidence and repeated source footage', () => {
    expect(
      buildSceneAssignments(scenes, [{ ...asset, license_evidence_url: '' }]).gaps,
    ).toHaveLength(1);
    expect(
      buildSceneAssignments([...scenes, { ...scenes[0], id: 'second' }], [asset]).gaps,
    ).toHaveLength(1);
  });
  it('uses lesson-scoped mappings without rewriting global license metadata', () => {
    expect(
      buildSceneAssignments(
        scenes,
        [asset],
        [
          {
            sceneId: scenes[0].id,
            assetId: 'clip',
            relevanceReason: 'Consultation supports clarification practice.',
          },
        ],
      ).assignments[0].assignmentMethod,
    ).toBe('lesson-scoped');
  });
});


describe('reviewed scene assignment producer', () => {
  const reviewed = {
    ...asset, visual_coverage_verified: false,
    content_sha256: 'a'.repeat(64),
    visual_observation: {
      contentSha256: 'a'.repeat(64),
      method: 'sampled-frame-inspection', reviewedAt: '2026-10-03T22:36:32Z',
      sampleFractions: [0.05, 0.35, 0.65, 0.9],
      visibleActions: ['Shampooing and massaging hair at a basin'],
      scope: 'Visible actions at sampled times only; not proof of a complete procedure.',
    },
  };
  const context = [{ id: 'basin', sceneType: 'system_diagram',
    visualRequirement: 'Show shampooing and massaging hair at a basin.' }];
  it('produces a grounded assignment from inspected actions without a pre-existing lesson UUID', () => {
    const result = buildSceneAssignments(context, [reviewed]);
    expect(result.gaps).toEqual([]);
    expect(result.assignments[0]).toMatchObject({
      assignmentMethod: 'reviewed-action-coverage',
      visualEvidence: { contentSha256: reviewed.content_sha256,
        matchedActions: reviewed.visual_observation.visibleActions,
        sampleFractions: [0.05, 0.35, 0.65, 0.9] },
    });
  });
  it('does not turn sampled footage into a full procedural demonstration', () => {
    expect(buildSceneAssignments([{ ...context[0], sceneType: 'demonstration' }], [reviewed]).gaps).toHaveLength(1);
    expect(buildSceneAssignments([{ ...context[0], title: 'Demonstration' }], [reviewed]).gaps).toHaveLength(1);
  });
  it('requires every requested action, not shared keywords or a misleading title', () => {
    expect(buildSceneAssignments([{ ...context[0], visualRequirement:
      'Show shampooing and massaging hair at a basin and supervisor approval.' }], [reviewed]).gaps).toHaveLength(1);
    expect(buildSceneAssignments([{ ...context[0], visualRequirement:
      'Show shampooing and massaging hair at a basin and supervisor approval.' }], [{
        ...reviewed, lesson_match_verified: true,
        observed_visual_actions: reviewed.visual_observation.visibleActions,
      }]).gaps).toHaveLength(1);
  });
  it('rejects observations with no source hash, date or sampled frame provenance', () => {
    for (const candidate of [
      { ...reviewed, content_sha256: undefined },
      { ...reviewed, content_sha256: 'b'.repeat(64) },
      { ...reviewed, visual_observation: { ...reviewed.visual_observation, reviewedAt: 'invalid' } },
      { ...reviewed, visual_observation: { ...reviewed.visual_observation, sampleFractions: [] } },
    ]) expect(buildSceneAssignments(context, [candidate]).gaps).toHaveLength(1);
  });
});
