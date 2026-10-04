/** Produce an assignment from actual, persisted frame observations. This is
 * contextual coverage only: sampled frames cannot certify a whole procedure.
 * Exact action comparison deliberately avoids title/keyword inference. */
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
  const normalize = (value: string) => value.toLowerCase().trim()
    .replace(/^show\s+/, '').replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
  const requirement = normalize(String(scene.visualRequirement ?? ''));
  const actions = Array.isArray(observation.visibleActions)
    ? observation.visibleActions.filter((value: unknown): value is string =>
        typeof value === 'string' && Boolean(value.trim())) : [];
  const matched = actions.filter((action: string) => normalize(action) === requirement);
  if (!requirement || !matched.length) return null;
  return {
    contentSha256: asset.content_sha256,
    method: observation.method,
    reviewedAt: observation.reviewedAt,
    sampleFractions: [...fractions],
    matchedActions: matched,
    scope: String(observation.scope ?? 'Visible actions at sampled times only.'),
  };
}
