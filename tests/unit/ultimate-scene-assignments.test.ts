import { describe, it, expect } from 'vitest';
import { buildSceneAssignments } from '@/lib/ultimate-course-builder/instructional/scene-assignments';
const scenes = [{ id: 'scene:consultation', visualRequirement: 'A client consultation' }];
const asset = { id: 'clip', entitlement_id: 'license', provider_item_id: 'item', public_url: 'https://media.example/clip.mp4', license_evidence_url: 'https://media.example/license.pdf', visual_coverage_verified: true, visual_requirements: ['A client consultation'] };
describe('automatic licensed scene assignment', () => {
  it('creates an assignment without pre-existing scene metadata and preserves the license', () => {
    const result = buildSceneAssignments(scenes, [asset]);
    expect(result.gaps).toEqual([]);
    expect(result.assignments[0]).toMatchObject({ sceneId: 'scene:consultation', assetId: 'clip', licenseEvidenceUrl: asset.license_evidence_url, assignmentMethod: 'verified-coverage' });
    expect(asset).not.toHaveProperty('scene_id');
  });
  it('does not treat a title or an unverified description as visual proof', () => {
    expect(buildSceneAssignments(scenes, [{ ...asset, visual_coverage_verified: false, title: 'A client consultation' }]).gaps).toHaveLength(1);
  });
  it('reports every uncovered scene rather than stopping at the first', () => {
    expect(buildSceneAssignments([...scenes, { id: 'scene:assessment', visualRequirement: 'Knowledge assessment' }], []).gaps.map(g => g.sceneId)).toEqual(['scene:consultation', 'scene:assessment']);
  });
  it('rejects missing license evidence and repeated source footage', () => {
    expect(buildSceneAssignments(scenes, [{ ...asset, license_evidence_url: '' }]).gaps).toHaveLength(1);
    expect(buildSceneAssignments([...scenes, { ...scenes[0], id: 'second' }], [asset]).gaps).toHaveLength(1);
  });
  it('uses lesson-scoped mappings without rewriting global license metadata', () => {
    expect(buildSceneAssignments(scenes, [asset], [{ sceneId: scenes[0].id, assetId: 'clip', relevanceReason: 'Consultation supports clarification practice.' }]).assignments[0].assignmentMethod).toBe('lesson-scoped');
  });
});
