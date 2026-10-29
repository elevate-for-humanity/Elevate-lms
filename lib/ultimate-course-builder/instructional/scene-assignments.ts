import { mediaMatchTerms } from '@/lib/media/licensed-course-media';
import { compatibleVisualTask, reviewedSceneEvidence } from './reviewed-scene-evidence';

/** Assign distinct approved course source files to storyboard scenes.
 * Exact reviewed relevance remains preferred. Stored, course-scoped Envato
 * media may also serve as contextual theory illustration without a separate
 * per-scene license URL. Practical demonstrations still require inspected,
 * action-matched motion evidence. */
export function buildSceneAssignments(scenes: any[], assets: any[], configured: any[] = [], options: {requiresPracticalEvidence?: boolean; competencyType?: string; allowInspectedMotionExcerpts?: boolean} = {}) {
  const assignments: any[] = [];
  const gaps: any[] = [];

  const overlapEvidence = (scene: any, asset: any) => {
    const requirement = String(scene.visualRequirement ?? '').trim();
    const observed = Array.isArray(asset.observed_visual_actions)
      ? asset.observed_visual_actions
      : [];
    const assetText = observed.length
      ? observed.join(' ')
      : [
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

  const candidates = assets.filter((a) => {
    if (!a.public_url || !a.entitlement_id) return false;
    const approvedCourseSource =
      String(a.provider ?? '').toLowerCase() === 'envato' &&
      (Boolean(a.storage_path) || Boolean(a.license_evidence_url));
    return Boolean(a.license_evidence_url) || approvedCourseSource;
  });
  // Separate records do not establish separate shots. Prefer verified bytes,
  // then the stored object, then the file URL without its expiring signature.
  // Truly distinct attached segments retain their own object paths/hashes.
  const parents = candidates.map((_, index) => index);
  const root = (index: number): number => parents[index] === index ? index : (parents[index] = root(parents[index]));
  const keys = new Map<string, number>();
  candidates.forEach((asset, index) => {
    for (const key of [asset.provider_item_id && `item:${asset.provider_item_id}`,
      asset.content_sha256 && `hash:${asset.content_sha256}`, asset.storage_path && `object:${asset.storage_path}`,
      `url:${String(asset.public_url).split(/[?#]/)[0]}`].filter(Boolean) as string[]) {
      const existing = keys.get(key);
      if (existing !== undefined) parents[root(index)] = root(existing);
      else keys.set(key, index);
    }
  });
  const identity = (asset: any) => `source:${root(candidates.indexOf(asset))}`;
  const physicalScene = (scene: any) => (options.competencyType ? options.competencyType === 'practical_skill' : options.requiresPracticalEvidence !== false) &&
    [scene.stage, scene.title, scene.sceneType, scene.scene_type].some(value =>
      /^(demonstration|guided_practice|independent_practice|mistake_and_correction|mistake and correction)$/.test(String(value ?? '').trim().toLowerCase()));
  const choices = scenes.map((scene) => {
    const explicit = configured.find((a) => a.sceneId === scene.id);
    const requirement = String(scene.visualRequirement ?? '')
      .trim()
      .toLowerCase();
    return candidates
      .flatMap((asset) => {
        let reason = '';
        let method = '';
        let visualEvidence: ReturnType<typeof reviewedSceneEvidence> = null;
        if (explicit) {
          if (asset.id !== explicit.assetId) return [];
          reason = explicit.relevanceReason ?? asset.relevance_reason ?? '';
          method = 'lesson-scoped';
        } else if (asset.scene_id === scene.id && asset.relevance_reason) {
          reason = asset.relevance_reason;
          method = 'verified-coverage';
        } else if (
          asset.visual_coverage_verified === true &&
          asset.visual_requirements?.some((r: string) =>
            typeof r === 'string' && compatibleVisualTask(requirement, r))
        ) {
          reason =
            asset.relevance_reason ??
            `Verified visual coverage is compatible with the scene requirement: ${scene.visualRequirement}`;
          method = 'verified-coverage';
        } else if (physicalScene(scene) && options.allowInspectedMotionExcerpts &&
          String(asset.mime_type??'').startsWith('video/') &&
          asset.visual_observation?.method === 'sampled-frame-inspection' &&
          asset.visual_observation.contentSha256 === asset.content_sha256) {
          const quotes=scene.teachingVisual?.steps?.map((step:any)=>step.narrationQuote)??[];
          const supported=quotes.find((quote:string)=>(asset.visual_observation.visibleActions??[]).some((action:string)=>compatibleVisualTask(quote,action)));
          if(supported){reason='Inspected motion excerpt supports the spoken action: '+supported;method='inspected-motion-excerpt';}
        } else if ((visualEvidence = reviewedSceneEvidence(scene, asset))) {
          reason = `Inspected source shows ${visualEvidence.matchedActions.join('; ')}. ` +
            `This supports the scene's contextual visual task through compatible action coverage. ${visualEvidence.scope}`;
          method = 'reviewed-action-coverage';
        } else if (asset.lesson_match_verified === true && !asset.visual_observation && !physicalScene(scene)) {
          // A failed inspected-action comparison must not fall back to a weaker
          // lesson keyword match (including a demonstration or stale hash).
          const evidence = overlapEvidence(scene, asset);
          if (evidence.overlap.length) {
            reason = evidence.reason;
            method = 'verified-lesson-semantic-overlap';
          }
        }
        return reason?.trim() ? [{ asset, reason, method, visualEvidence }] : [];
      })
      .sort((a, b) => {
        const rank = (m: string) => (m === 'lesson-scoped' ? 0 : m === 'verified-coverage' ? 1 : 2);
        return (
          rank(a.method) - rank(b.method) ||
          (b.visualEvidence?.requirementCoverage ?? 0) - (a.visualEvidence?.requirementCoverage ?? 0) ||
          String(a.asset.id).localeCompare(String(b.asset.id))
        );
      });
  });
  // Reassign earlier choices before requesting more files. Eligibility stays
  // restricted to stored, course-scoped entitlement records.
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
    let choice = selected.get(index);
    if (!choice && !physicalScene(scene)) {
      const contextual = candidates.find((asset) => !owners.has(identity(asset)));
      if (contextual) {
        owners.set(identity(contextual), index);
        choice = {
          asset: contextual,
          reason: `Approved course-scoped contextual illustration for: ${scene.visualRequirement}`,
          method: 'approved-course-context',
          visualEvidence: null,
        };
      }
    }
    if (!choice) {
      if (physicalScene(scene) || !scene.teachingVisual?.steps?.length) {
        gaps.push({sceneId:scene.id, visualRequirement:scene.visualRequirement,
          reason: 'No distinct approved course asset is available for this scene', licensedAssetCount:candidates.length});
        continue;
      }
      assignments.push({
        sceneId: scene.id,
        assetId: `instructional-visual-request:${scene.id}`,
        relevanceReason: `Instructional visual supporting: ${scene.visualRequirement}`,
        assignmentMethod: 'instructional-visual-request',
        requestedInstructionalVisual: true,
        visualRequirement: scene.visualRequirement,
      });
      continue;
    }
    assignments.push({
      sceneId: scene.id,
      assetId: choice.asset.id,
      approvedSource: true,
      sourceProvider: String(choice.asset.provider ?? 'envato'),
      entitlementId: String(choice.asset.entitlement_id),
      ...(choice.asset.license_evidence_url ? { licenseEvidenceUrl: choice.asset.license_evidence_url } : {}),
      relevanceReason: choice.reason,
      assignmentMethod: choice.method,
      ...(choice.visualEvidence ? { visualEvidence: choice.visualEvidence } : {}),
    });
  }
  return { assignments, gaps };
}
