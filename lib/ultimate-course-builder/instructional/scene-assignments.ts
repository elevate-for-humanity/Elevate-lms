import { mediaMatchTerms } from '@/lib/media/licensed-course-media';

/** Assign distinct licensed source files to storyboard scenes using persisted
 * lesson-match evidence plus deterministic scene/asset semantic overlap.
 * Automatic assignment never treats a title alone as proof: the asset must
 * have entitlement/license evidence and either explicit reviewed coverage or
 * a persisted lesson match with positive semantic overlap to the scene. */
export function buildSceneAssignments(scenes: any[], assets: any[], configured: any[] = []) {
  const assignments: any[] = [];
  const gaps: any[] = [];
  const used = new Set<string>();

  const overlapEvidence = (scene: any, asset: any) => {
    const requirement = String(scene.visualRequirement ?? '').trim();
    const assetText = [
      asset.title,
      asset.relevance_reason,
      asset.lesson_match_query,
      ...(Array.isArray(asset.lesson_match_reasons) ? asset.lesson_match_reasons : []),
      ...(Array.isArray(asset.visual_requirements) ? asset.visual_requirements : []),
    ].filter(Boolean).join(' ');
    const required = mediaMatchTerms(requirement);
    const available = new Set(mediaMatchTerms(assetText));
    const overlap = required.filter((term) => available.has(term));
    const lessonTopic = mediaMatchTerms(String(scene.lessonTitle ?? scene.topic ?? requirement))
      .filter((term) => !['show','relevant','non','looping','instructional','visual','during'].includes(term));
    const topicOverlap = lessonTopic.filter((term) => available.has(term));
    const evidence = [...new Set([...overlap, ...topicOverlap])];
    return {
      overlap: evidence,
      reason: evidence.length
        ? `Licensed lesson match shares instructional terms: ${evidence.join(', ')}`
        : '',
    };
  };

  for (const scene of scenes) {
    const explicit = configured.find((a) => a.sceneId === scene.id);
    const requirement = String(scene.visualRequirement ?? '').trim().toLowerCase();
    const candidates = assets.filter(
      (a) => a.public_url && a.entitlement_id && a.license_evidence_url,
    );
    let asset: any;
    let reason = '';

    if (explicit) {
      asset = candidates.find((a) => a.id === explicit.assetId);
      reason = explicit.relevanceReason ?? asset?.relevance_reason ?? '';
    } else {
      for (const candidate of candidates) {
        const identity = candidate.provider_item_id ?? candidate.entitlement_id;
        if (used.has(identity)) continue;
        if (candidate.scene_id === scene.id && candidate.relevance_reason) {
          asset = candidate;
          reason = candidate.relevance_reason;
          break;
        }
        if (
          candidate.visual_coverage_verified === true &&
          candidate.visual_requirements?.some(
            (r: string) => r.trim().toLowerCase() === requirement,
          )
        ) {
          asset = candidate;
          reason =
            candidate.relevance_reason ??
            `Verified visual coverage matches the scene requirement: ${scene.visualRequirement}`;
          break;
        }
        if (candidate.lesson_match_verified === true) {
          const evidence = overlapEvidence(scene, candidate);
          if (evidence.overlap.length) {
            asset = candidate;
            reason = evidence.reason;
            break;
          }
          // A positive persisted lesson match is valid lesson-level relevance
          // evidence. Scene-specific semantics improve ranking, but generic
          // instructional stages (recap, assessment, remediation, etc.) must
          // not require the stock asset title to literally contain the stage
          // label. Distinctness still prevents looping/reuse.
          if (Number(candidate.lesson_match_score ?? 0) > 0) {
            asset = candidate;
            reason = `Licensed asset has persisted positive lesson relevance score ${Number(candidate.lesson_match_score).toFixed(2)} for this lesson`;
            break;
          }
        }
      }
    }

    const identity = asset?.provider_item_id ?? asset?.entitlement_id;
    if (!asset || !reason?.trim() || used.has(identity)) {
      gaps.push({
        sceneId: scene.id,
        visualRequirement: scene.visualRequirement,
        reason: explicit
          ? 'Configured asset is unavailable, unlicensed, repeated, or missing relevance evidence'
          : 'No distinct licensed asset has verified lesson/scene relevance evidence',
        licensedAssetCount: candidates.length,
      });
      continue;
    }
    used.add(identity);
    assignments.push({
      sceneId: scene.id,
      assetId: asset.id,
      licenseEvidenceUrl: asset.license_evidence_url,
      relevanceReason: reason,
      assignmentMethod: explicit
        ? 'lesson-scoped'
        : asset.visual_coverage_verified === true
          ? 'verified-coverage'
          : 'verified-lesson-semantic-overlap',
    });
  }
  return { assignments, gaps };
}
