import { visualRequirementCompatibility } from './visual-compatibility';

/** Produce an assignment from actual, persisted frame observations. This is
 * contextual coverage only: sampled frames cannot certify a whole procedure.
 * Equivalent observed actions may satisfy differently worded requirements. */
export function reviewedSceneEvidence(scene: any, asset: any) {
  const observation = asset.visual_observation;
  if (!observation || observation.method !== 'sampled-frame-inspection') return null;
  if (!/^[a-f0-9]{64}$/i.test(String(asset.content_sha256 ?? ''))) return null;
  if (observation.contentSha256 !== asset.content_sha256) return null;
  if (!Number.isFinite(Date.parse(String(observation.reviewedAt ?? '')))) return null;
  const fractions = observation.sampleFractions;
  if (!Array.isArray(fractions) || !fractions.length ||
      fractions.some((fraction: unknown) => typeof fraction !== 'number' ||
        !Number.isFinite(fraction) || fraction < 0 || fraction > 1)) return null;
  // Never substitute a still-frame observation for a procedural video check.
  if (scene.sceneType === 'demonstration' || scene.scene_type === 'demonstration' ||
      scene.stage === 'demonstration' ||
      String(scene.title ?? '').trim().toLowerCase() === 'demonstration') return null;
  const requirement = String(scene.visualRequirement ?? '').trim();
  const actions: string[] = Array.isArray(observation.visibleActions)
    ? observation.visibleActions.filter((value: unknown): value is string =>
        typeof value === 'string' && Boolean(value.trim())) : [];
  const compatibility = visualRequirementCompatibility(requirement, actions);
  if (!compatibility.compatible) return null;
  const matched = actions.filter((action) =>
    visualRequirementCompatibility(requirement, action).matchedConcepts.length > 0);
  return {
    contentSha256: asset.content_sha256,
    method: observation.method,
    reviewedAt: observation.reviewedAt,
    sampleFractions: [...fractions],
    matchedActions: matched,
    compatibility: { method: 'instructional-compatibility-v1', ...compatibility },
    scope: String(observation.scope ?? 'Visible actions at sampled times only.'),
  };
}
