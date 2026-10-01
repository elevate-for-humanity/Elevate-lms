/** Reuse a course's licensed source files without mutating global entitlement metadata.
 * Automatic assignment requires reviewed, explicit visual coverage; titles alone are not evidence. */
export function buildSceneAssignments(scenes: any[], assets: any[], configured: any[] = []) {
  const assignments: any[] = [];
  const gaps: any[] = [];
  const used = new Set<string>();
  for (const scene of scenes) {
    const explicit = configured.find((a) => a.sceneId === scene.id);
    const requirement = String(scene.visualRequirement ?? '').trim().toLowerCase();
    const candidates = assets.filter((a) => a.public_url && a.entitlement_id && a.license_evidence_url);
    const asset = explicit
      ? candidates.find((a) => a.id === explicit.assetId)
      : candidates.find((a) => !used.has(a.provider_item_id ?? a.entitlement_id) && (
          (a.scene_id === scene.id && a.relevance_reason) ||
          (a.visual_coverage_verified === true && a.visual_requirements?.some(
            (r: string) => r.trim().toLowerCase() === requirement,
          ))
        ));
    const reason = explicit?.relevanceReason ?? asset?.relevance_reason ??
      (asset ? `Verified visual coverage matches the scene requirement: ${scene.visualRequirement}` : '');
    if (!asset || !reason?.trim() || used.has(asset.provider_item_id ?? asset.entitlement_id)) {
      gaps.push({ sceneId: scene.id, visualRequirement: scene.visualRequirement,
        reason: explicit ? 'Configured asset is unavailable, unlicensed, repeated, or missing relevance evidence' : 'No distinct licensed asset has verified coverage for this scene',
        licensedAssetCount: candidates.length });
      continue;
    }
    used.add(asset.provider_item_id ?? asset.entitlement_id);
    assignments.push({ sceneId: scene.id, assetId: asset.id,
      licenseEvidenceUrl: asset.license_evidence_url, relevanceReason: reason,
      assignmentMethod: explicit ? 'lesson-scoped' : 'verified-coverage' });
  }
  return { assignments, gaps };
}
