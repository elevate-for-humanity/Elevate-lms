import { mediaMatchTerms } from '@/lib/media/licensed-course-media';

/** Assign distinct licensed source files to storyboard scenes using persisted
 * lesson-match evidence plus deterministic scene/asset semantic overlap.
 * Automatic assignment never treats a title alone as proof: the asset must
 * have entitlement/license evidence and either explicit reviewed coverage or
 * a persisted lesson match with positive semantic overlap to the scene. */
export function buildSceneAssignments(scenes: any[], assets: any[], configured: any[] = []) {
  const assignments: any[] = [];
  const gaps: any[] = [];

  const overlapEvidence = (scene: any, asset: any) => {
    const requirement = String(scene.visualRequirement ?? '').trim();
    const assetText = [
      asset.title,
      asset.relevance_reason,
      asset.lesson_match_query,
      ...(Array.isArray(asset.lesson_match_reasons) ? asset.lesson_match_reasons : []),
      ...(Array.isArray(asset.visual_requirements) ? asset.visual_requirements : []),
    ]
      .filter(Boolean)
      .join(' ');
    const required = mediaMatchTerms(requirement);
    const available = new Set(mediaMatchTerms(assetText));
    const overlap = required.filter((term) => available.has(term));
    const lessonTopic = mediaMatchTerms(
      String(scene.lessonTitle ?? scene.topic ?? requirement),
    ).filter(
      (term) =>
        !['show', 'relevant', 'non', 'looping', 'instructional', 'visual', 'during'].includes(term),
    );
    const topicOverlap = lessonTopic.filter((term) => available.has(term));
    const evidence = [...new Set([...overlap, ...topicOverlap])];
    return {
      overlap: evidence,
      reason: evidence.length
        ? `Licensed lesson match shares instructional terms: ${evidence.join(', ')}`
        : '',
    };
  };

  const candidates = assets.filter(
    (a) => a.public_url && a.entitlement_id && a.license_evidence_url,
  );
  const identity = (asset: any) =>
    String(asset.content_sha256 ?? asset.provider_item_id ?? asset.entitlement_id);
  const choices = scenes.map((scene) => {
    const explicit = configured.find((a) => a.sceneId === scene.id);
    const requirement = String(scene.visualRequirement ?? '')
      .trim()
      .toLowerCase();
    return candidates
      .flatMap((asset) => {
        let reason = '';
        let method = '';
        if (explicit) {
          if (asset.id !== explicit.assetId) return [];
          reason = explicit.relevanceReason ?? asset.relevance_reason ?? '';
          method = 'lesson-scoped';
        } else if (asset.scene_id === scene.id && asset.relevance_reason) {
          reason = asset.relevance_reason;
          method = 'verified-coverage';
        } else if (
          asset.visual_coverage_verified === true &&
          asset.visual_requirements?.some((r: string) => r.trim().toLowerCase() === requirement)
        ) {
          reason =
            asset.relevance_reason ??
            `Verified visual coverage matches the scene requirement: ${scene.visualRequirement}`;
          method = 'verified-coverage';
        } else if (asset.lesson_match_verified === true) {
          const evidence = overlapEvidence(scene, asset);
          if (evidence.overlap.length) {
            reason = evidence.reason;
            method = 'verified-lesson-semantic-overlap';
          }
        }
        return reason?.trim() ? [{ asset, reason, method }] : [];
      })
      .sort((a, b) => {
        const rank = (m: string) => (m === 'lesson-scoped' ? 0 : m === 'verified-coverage' ? 1 : 2);
        return (
          rank(a.method) - rank(b.method) || String(a.asset.id).localeCompare(String(b.asset.id))
        );
      });
  });
  // Reassign earlier choices before requesting more files. Eligibility stays
  // unchanged; this cannot manufacture coverage or license evidence.
  const owners = new Map<string, number>();
  const selected = new Map<number, (typeof choices)[number][number]>();
  const assign = (index: number, visited: Set<string>): boolean => {
    for (const choice of choices[index]) {
      const key = identity(choice.asset);
      if (visited.has(key)) continue;
      visited.add(key);
      const owner = owners.get(key);
      if (owner === undefined || assign(owner, visited)) {
        owners.set(key, index);
        selected.set(index, choice);
        return true;
      }
    }
    return false;
  };
  const order = scenes
    .map((_, index) => index)
    .sort((a, b) => choices[a].length - choices[b].length || a - b);
  for (const index of order) assign(index, new Set());
  for (const [index, scene] of scenes.entries()) {
    const choice = selected.get(index);
    if (!choice) {
      gaps.push({
        sceneId: scene.id,
        visualRequirement: scene.visualRequirement,
        reason: configured.some((a) => a.sceneId === scene.id)
          ? 'Configured asset is unavailable, unlicensed, repeated, or missing relevance evidence'
          : 'No distinct licensed asset has verified lesson/scene relevance evidence',
        licensedAssetCount: candidates.length,
      });
      continue;
    }
    assignments.push({
      sceneId: scene.id,
      assetId: choice.asset.id,
      licenseEvidenceUrl: choice.asset.license_evidence_url,
      relevanceReason: choice.reason,
      assignmentMethod: choice.method,
    });
  }
  return { assignments, gaps };
}
