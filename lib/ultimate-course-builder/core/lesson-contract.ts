import { STORYBOARD_RENDER_PRODUCER } from '../../video/render-checkpoint-contract.mjs';
import { createHash } from 'node:crypto';
import { approvedDeliveryFailures, hasTextCardPhotographs } from '../instructional/approved-delivery.mjs';
import { ULTIMATE_BUILD_STEPS, type UltimateBuildStep } from './types';
import { renderMediaUrl, renderPlaybackUrl } from '../media/playback-source.mjs';
import { isExternalCourseVideoReference } from '../../storage/course-video-policy.mjs';

/** Changing this version invalidates every checkpoint and release certificate. */
export const ULTIMATE_LESSON_CONTRACT_VERSION = 'ultimate-lesson-2026-10-29.1';
export const MAX_TARGETED_REPAIRS = 8;
// Only the manually approved Cosmetology build; never the automated build.
const MANUAL_COSMETOLOGY_COURSE_ID = 'a6b0b712-1cf0-475a-ba79-ee2023dea8ec';
export function nonblockingManualReview(profile: unknown): boolean {
  return (profile as any)?.id === 'course:' + MANUAL_COSMETOLOGY_COURSE_ID;
}
export function optionalManualReviewStage(step: UltimateBuildStep, profile: unknown): boolean {
  return nonblockingManualReview(profile) && (step === 'instructional_qa' || step === 'learner_runthrough');
}

type Artifact = Record<string, any>;
export function contractHash(value: unknown): string {
  function canonical(v: any): any {
    if (Array.isArray(v)) return v.map(canonical);
    if (v && typeof v === 'object')
      return Object.fromEntries(
        Object.keys(v)
          .sort()
          .map((k) => [k, canonical(v[k])]),
      );
    return v;
  }
  return createHash('sha256')
    .update(JSON.stringify(canonical(value)) ?? 'null')
    .digest('hex');
}
export function artifactPayload(a: Artifact): Artifact {
  const { contractEvidence: _evidence, ...payload } = a;
  return payload;
}
export function stepInputHash(
  step: UltimateBuildStep,
  profile: unknown,
  prior: Partial<Record<UltimateBuildStep, Artifact>>,
): string {
  // Publication settings and resume history do not change instructional inputs.
  const { pauseResumeAudit: _resumeAudit, publishCompletedLessons: _publishAsYouGo,
    preservedPublishedLessonIds: _preservedPublications, parallelAutopilot: _parallelAutopilot, ...instructionalProfile } = (profile ?? {}) as Record<string, unknown>;
  const dependencies = ULTIMATE_BUILD_STEPS.slice(0, ULTIMATE_BUILD_STEPS.indexOf(step));
  return contractHash({
    version: ULTIMATE_LESSON_CONTRACT_VERSION,
    // Publication is an operational policy, not a reason to regenerate saved lessons.
    // Preserve the existing hash identity when upgrading legacy review profiles.
    profile: { ...instructionalProfile, ...(instructionalProfile.publicationPolicy === 'automatic-quality-verified'
      ? { publicationPolicy: 'owner-review-required' } : {}) },
    step,
    // Invalidate source-generated teaching after the full-section authoring
    // fix, while retaining the unchanged standards checkpoint. Downstream
    // stages are rebuilt from the new teaching artifact by the runner.
    ...(step === 'learning_objectives' ? { instructionalProducer: 'approved-moment-photos-and-fresh-recaps-v4' } : {}),
    ...(step === 'natural_narration' ? { narrationProducer: 'warm-native-pace-24khz-delivery-word-alignment-v3' } : {}),
    ...(step === 'instructor_script' ? { scriptProducer: 'stage-aligned-scenes-v1' } : {}),
    ...(step === 'visual_assignment' ? { visualAssignmentProducer: 'approved-course-provenance-v4' } : {}),
    ...(step === 'finished_media_qa' ? { approvedDeliveryValidator: 'approved-delivery-v1' } : {}),
    ...(step === 'lesson_film_render' ? { renderProducer: STORYBOARD_RENDER_PRODUCER } : {}),
    dependencies: dependencies.map((s) => [s, contractHash(artifactPayload(prior[s] ?? {}))]),
  });
}
export function stepInputHashes(step: UltimateBuildStep, profile: unknown, prior: Partial<Record<UltimateBuildStep, Artifact>>): string[] {
  // Legacy certificates included the pause flag. Accept its three historic
  // representations without accepting changes to teaching, media, or sources.
  const { ownerPaused: _pause, ...base } = (profile ?? {}) as Record<string, unknown>;
  return [base, { ...base, ownerPaused: true }, { ...base, ownerPaused: false }]
    .map(candidate => stepInputHash(step, candidate, prior));
}
export function currentEvidence(a: Artifact | undefined, inputHash?: string | string[]): boolean {
  const e = a?.contractEvidence;
  return Boolean(
    e?.version === ULTIMATE_LESSON_CONTRACT_VERSION &&
    e.passed === true &&
    e.outputHash === contractHash(artifactPayload(a!)) &&
    (!inputHash || (Array.isArray(inputHash) ? inputHash.includes(e.inputHash) : e.inputHash === inputHash)),
  );
}
const nonempty = (v: any) => typeof v === 'string' && v.trim().length > 0;
const populated = (v: any) => Array.isArray(v) && v.length > 0;
/** These are evidence requirements, not claims inferred from labels or URLs. */
export function validateStepOutput(step: UltimateBuildStep, a: Artifact): string[] {
  const failures: string[] = [];
  const require = (ok: unknown, code: string) => {
    if (!ok) failures.push(code);
  };
  switch (step) {
    case 'standards_lock':
      require(populated(a.requirements?.competencies), 'STANDARDS_COMPETENCIES_REQUIRED');
      require(nonempty(a.requirements?.version), 'STANDARDS_VERSION_REQUIRED');
      break;
    case 'learning_objectives':
      require(populated(a.objectives) &&
        a.objectives.every((o: any) =>
          nonempty(o.id) && nonempty(o.text) &&
          (populated(o.sourceRequirementIds) || nonempty(o.courseDefinedReason)),
        ), 'OBJECTIVE_EVIDENCE_MAPPING_REQUIRED');
      break;
    case 'prerequisites':
      require(
        populated(a.prerequisites?.checks) || nonempty(a.prerequisites?.noneReason),
        'PREREQUISITE_CHECKS_REQUIRED',
      );
      break;
    case 'teaching_sequence':
      require(populated(a.sequence?.stages) &&
        a.sequence.stages.every(
          (s: any) => nonempty(s.instruction) && populated(s.objectiveIds),
        ), 'TEACHING_CONTENT_REQUIRED');
      break;
    case 'instructor_script':
      require(populated(a.script?.segments) &&
        a.script.segments.every(
          (s: any) =>
            nonempty(s.id) &&
            nonempty(s.text) &&
            populated(s.objectiveIds) &&
            (populated(s.sourceRequirementIds) || nonempty(s.courseDefinedReason)),
        ), 'SCRIPT_SEGMENTS_REQUIRED');
      break;
    case 'storyboard':
      require(populated(a.storyboard?.scenes) &&
        a.storyboard.scenes.every(
          (s: any) =>
            nonempty(s.id) &&
            nonempty(s.scriptSegmentId) &&
            nonempty(s.dialogue) &&
            nonempty(s.visualRequirement) &&
            populated(s.objectiveIds),
        ), 'STORYBOARD_SCRIPT_MAPPING_REQUIRED');
      break;
    case 'visual_assignment': {
      const assignments = Array.isArray(a.media?.assignments) ? a.media.assignments : [];
      require(assignments.length > 0 &&
        new Set(assignments.map((s: any) => s.sceneId)).size === assignments.length &&
        assignments.every(
          (s: any) =>
            nonempty(s.sceneId) &&
            nonempty(s.assetId) &&
            nonempty(s.relevanceReason) &&
            (s.requestedInstructionalVisual === true
              ? s.assignmentMethod === 'instructional-visual-request' &&
                String(s.assetId).startsWith('instructional-visual-request:')
              : s.requestedTeachingPhotograph === true
                ? s.assignmentMethod === 'teaching-photograph-request' &&
                  String(s.assetId).startsWith('teaching-photo-request:')
              : nonempty(s.licenseEvidenceUrl) ||
                (s.approvedSource === true &&
                  nonempty(s.sourceProvider) &&
                  nonempty(s.entitlementId))),
        ), 'VISUAL_SCENE_COVERAGE_REQUIRED');
      // Licensed media can be reused for a distinct teaching purpose.
      // Reject unreasoned duplication; retain source provenance and relevance evidence.
      const seen = new Map<string, string>();
      for (const assignment of assignments) {
        const id = String(assignment.assetId ?? '');
        const reason = String(assignment.relevanceReason ?? '').trim().toLowerCase();
        if (seen.has(id) && seen.get(id) === reason) {
          failures.push('VISUAL_UNJUSTIFIED_REPETITION');
        }
        seen.set(id, reason);
      }
      break;
    }
    case 'scene_construction':
      require(populated(a.scenes?.shots) &&
        a.scenes.shots.every(
          (s: any) => typeof s.loop === 'boolean' && nonempty(s.sceneId) && nonempty(s.assetId),
        ), 'SCENE_SHOT_PLAN_REQUIRED');
      break;
    case 'natural_narration':
      require(populated(a.narration?.segments) &&
        a.narration.segments.every(
          (s: any) =>
            nonempty(s.segmentId) &&
            nonempty(s.audioUrl) &&
            s.durationSeconds > 0 &&
            nonempty(s.text),
        ), 'NARRATION_MEASUREMENTS_REQUIRED');
      break;
    case 'synchronization':
      require(populated(a.timeline?.segments) &&
        a.timeline.segments.every(
          (s: any) => s.endSeconds > s.startSeconds && populated(s.captions),
        ), 'TIMELINE_TIMED_CAPTIONS_REQUIRED');
      break;
    case 'active_teaching':
      require(populated(a.activities) &&
        a.activities.every(
          (s: any) =>
            nonempty(s.id) &&
            nonempty(s.prompt) &&
            nonempty(s.feedback) &&
            populated(s.objectiveIds),
        ), 'LEARNER_ACTIVITIES_REQUIRED');
      break;
    case 'mistakes_and_corrections':
      require(populated(a.mistakes) &&
        a.mistakes.every(
          (s: any) => nonempty(s.mistake) && nonempty(s.correction) && nonempty(s.reason),
        ), 'SPECIFIC_CORRECTIONS_REQUIRED');
      break;
    case 'assessment_alignment':
      require(populated(a.assessment?.questions) &&
        a.assessment.questions.every(
          (s: any) =>
            populated(s.objectiveIds) &&
            populated(s.choices) &&
            Number.isInteger(s.answerIndex) &&
            s.answerIndex >= 0 &&
            s.answerIndex < s.choices.length &&
            nonempty(s.explanation) &&
            nonempty(s.remediation),
        ) &&
        populated(a.assessment.reassessment), 'ASSESSMENT_SCORING_REMEDIATION_REQUIRED');
      break;
    case 'lesson_film_render':
      require(!hasTextCardPhotographs(a.render), 'PHOTOGRAPHIC_PRESENTATION_REQUIRES_REFRESH');
      require(isExternalCourseVideoReference(renderMediaUrl(a.render)), 'VIDEO_EXTERNAL_STORAGE_REQUIRED');
      require(renderPlaybackUrl(a.render) && renderMediaUrl(a.render) &&
        a.render.duration > 0 &&
        nonempty(a.render.captionsUrl) &&
        nonempty(a.render.transcriptUrl), 'RENDER_DELIVERY_ASSETS_REQUIRED');
      break;
    case 'finished_media_qa':
      require(a.mediaQA?.pass === true &&
        nonempty(a.mediaQA?.inspection?.mediaSha256) &&
        nonempty(a.mediaQA?.inspection?.actualTranscript) &&
        populated(a.mediaQA?.inspection?.readability) &&
        a.mediaQA.inspection.readability.every(
          (r: any) => r.wordCoverage >= 0.75,
        ), 'ENCODED_MP4_INSPECTION_REQUIRED');
      break;
    case 'instructional_qa':
      require(a.instructionalQA?.pass === true &&
        populated(a.instructionalQA.objectiveEvidence) &&
        a.instructionalQA.objectiveEvidence.every(
          (s: any) => nonempty(s.objectiveId) && nonempty(s.deliveredExcerpt),
        ), 'DELIVERED_INSTRUCTION_REVIEW_REQUIRED');
      break;
    case 'narration_qa':
      require(a.narrationQA?.pass === true &&
        a.narrationQA?.source === 'delivered-mp4' &&
        nonempty(a.narrationQA.mediaSha256), 'DELIVERED_NARRATION_ANALYSIS_REQUIRED');
      break;
    case 'learner_runthrough':
      require(a.learnerQA?.pass === true &&
        nonempty(a.learnerRuntimeEvidence?.evidence?.testRunId) &&
        populated(a.learnerRuntimeEvidence?.evidence?.observations), 'BROWSER_RUNTHROUGH_REQUIRED');
      break;
    case 'selective_repair':
      require(a.repair?.unresolved === 0 &&
        Array.isArray(a.repair?.attempts), 'REPAIR_EXECUTION_RECORD_REQUIRED');
      break;
    case 'credential_release':
      require(a.release?.blocked === false &&
        a.release.traceability?.pass === true &&
        populated(a.release.rows) &&
        (a.release.accessibility?.pass === true || (a.release.courseId === MANUAL_COSMETOLOGY_COURSE_ID && a.release.accessibility?.deferred === true)), 'RELEASE_TRACEABILITY_ACCESSIBILITY_REQUIRED');
      break;
  }
  return failures;
}
export function assertCompleteLesson(
  artifacts: Partial<Record<UltimateBuildStep, Artifact>>,
  profile?: unknown,
  competencyId?: string,
): void {
  if ((profile as any)?.lessonPresentation === 'approved-premium-v1') {
    const failures = approvedDeliveryFailures(artifacts.lesson_film_render?.render,
      artifacts.natural_narration?.narration, (profile as any).presentationContract);
    if (failures.length) throw new Error(failures.join(';'));
    const encoded = artifacts.finished_media_qa?.mediaQA?.inspection?.approvedPresentationInspection;
    const sceneCount = artifacts.lesson_film_render?.render?.sceneData?.scenes?.length ?? 0;
    if (encoded?.pass !== true || encoded.backgrounds?.length !== sceneCount ||
        encoded.backgrounds.some((row:any)=>row.passed!==true) ||
        !(encoded.captions?.length >= sceneCount*2) ||
        encoded.captions.some((row:any)=>row.wordCoverage<0.85))
      throw new Error('APPROVED_ENCODED_PRESENTATION_INSPECTION_REQUIRED');
  }
  const competencies = (profile as any)?.competencies ?? [];
  const competency = competencies.find((c: any) => c.id === competencyId) ?? (competencies.length === 1 ? competencies[0] : undefined);
  if (practicalVisualFailures(artifacts, competency).length)
    throw new Error('ULTIMATE_PRACTICAL_DEMONSTRATION_VIDEO_REQUIRED');
  for (const step of ULTIMATE_BUILD_STEPS) {
    // These are omitted, not passed or certified, on this owner-approved build.
    if (optionalManualReviewStage(step, profile)) continue;
    const a = artifacts[step];
    if (
      !currentEvidence(a, profile ? stepInputHashes(step, profile, artifacts) : undefined) ||
      validateStepOutput(step, a ?? {}).length
    )
      throw new Error(`ULTIMATE_CURRENT_CONTRACT_EVIDENCE_REQUIRED:${step}`);
  }
}

/** Recheck saved assignments without invalidating usable media checkpoints. */
export function practicalVisualFailures(artifacts: Partial<Record<UltimateBuildStep, Artifact>>, competency: any): string[] {
  if (competency?.requiresPracticalEvidence !== true || (competency.type && competency.type !== 'practical_skill')) return [];
  const scenes = artifacts.storyboard?.storyboard?.scenes ?? [];
  const media = artifacts.visual_assignment?.media ?? {};
  const physical = scenes.filter((scene: any) => [scene.stage, scene.title, scene.sceneType, scene.scene_type].some(value =>
    /^(demonstration|guided_practice|independent_practice|mistake_and_correction|mistake and correction)$/.test(String(value ?? '').trim().toLowerCase())));
  return physical.some((scene: any) => {
    const assignment = media.assignments?.find((a: any) => a.sceneId === scene.id);
    const asset = media.readyAssets?.find((a: any) => a.id === assignment?.assetId);
    return !assignment || assignment.requestedInstructionalVisual || assignment.requestedTeachingPhotograph || assignment.generatedInstructionalVisual || ['instructional-render','instructional-visual-request','teaching-photograph-request'].includes(assignment.assignmentMethod) ||
      !asset?.entitlement_id || !assignment.licenseEvidenceUrl ||
      !(String(asset.mime_type ?? '').startsWith('video/') || /\.(mp4|webm|mov)(?:[?#]|$)/i.test(String(asset.public_url ?? '')));
  }) ? ['ULTIMATE_PRACTICAL_DEMONSTRATION_VIDEO_REQUIRED'] : [];
}
