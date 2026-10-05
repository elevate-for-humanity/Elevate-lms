/** Produce an assignment from actual, persisted frame observations. This is
 * contextual coverage only: sampled frames cannot certify a whole procedure.
 * Match functional compatibility after basic normalization; footage does not
 * need to repeat the storyboard requirement word-for-word. */
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
  const terms = (value: string) => normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2 &&
      !['show','relevant','non','looping','instructional','visual','during','client','scene'].includes(term));
  const requiredTerms = terms(requirement);
  const compatible = (action: string) => {
    const actionTerms = new Set(terms(action));
    const overlap = requiredTerms.filter((term) => actionTerms.has(term));
    const minimum = Math.min(2, Math.max(1, requiredTerms.length));
    return overlap.length >= minimum;
  };
  const matched = actions.filter(compatible);
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
