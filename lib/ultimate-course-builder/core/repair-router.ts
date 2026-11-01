import type { UltimateBuildStep } from './types';
import type { UltimateInstructionalFinding } from './execution-policy';

/**
 * Recovery contract v2: delivery faults never invalidate approved teaching or
 * trigger a new render. These failures require a separate storage/delivery
 * retry of the existing durable artifact, not a producer rebuild.
 * QA defects remain blocking and must be repaired and reinspected.
 */
export const COURSE_RECOVERY_CONTRACT_VERSION = 'course-recovery-v2';
export function requiresIndependentMediaDelivery(finding: Pick<UltimateInstructionalFinding, 'code' | 'message'>): boolean {
  return /COURSE_OBJECT_STORAGE_(?:UPLOAD_FAILED|DELIVERY_NOT_CONFIGURED|READBACK_SIGNING_FAILED)|storage cap exceeded|storage quota exceeded|quota exceeded/i
    .test(String(finding.message ?? '') + ' ' + String(finding.code ?? ''));
}

const PREFIX_ROUTES: Array<[RegExp, UltimateBuildStep]> = [
  [/^(ENCODED_MP4_INSPECTION_REQUIRED|MEDIA_INSPECTION_|TRANSCRIPTION_)/, 'finished_media_qa'],
  [/^APPROVED_ENCODED_BOTTOM_CAPTIONS_REQUIRED/, 'finished_media_qa'],
  [/^(MEDIA_FREEZE_DETECTED|MEDIA_BLACK_FRAMES|MEDIA_VISUAL_CHANGES_REQUIRED)/, 'lesson_film_render'],
  [/^ULTIMATE_VIDEO_RENDER_FAILED/, 'lesson_film_render'],
  [/^BLUEPRINT_/, 'learning_objectives'],
  [/^(TEACHING_RECAP_|EVERY_TEACHING_MOMENT_RECAP_REQUIRED|FRESH_TEACHING_RECAP_REQUIRED|ULTIMATE_GOOGLE_AUTHORING_JSON_INVALID|ULTIMATE_GOOGLE_AUTHORING_INCOMPLETE|INSTRUCTIONAL_QUALITY_FAILED)/, 'learning_objectives'],
  [/^(APPROVED_WORD_ALIGNMENT_REQUIRED|APPROVED_NARRATION_TEXT_MISMATCH|APPROVED_AUDIO_PART_|APPROVED_SEPARATE_FRESH_RECAP_REQUIRED|APPROVED_SPEECH_TIMELINE_MISMATCH|APPROVED_NARRATION_SCENE_COVERAGE_REQUIRED)/, 'natural_narration'],
  [/^(GOOGLE_TEACHING_PHOTO_|ULTIMATE_GOOGLE_TEACHING_PHOTO_|TEACHING_PHOTO_|INSTRUCTIONAL_VISUAL_|APPROVED_|MULTIPLE_DISTINCT_TEACHING_PHOTOS_REQUIRED|FRESH_NARRATED_RECAP_TIMING_REQUIRED|PICTURE_CUE_NOT_ALIGNED_TO_SPEECH)/, 'lesson_film_render'],
  [/^NARRATION_DUPLICATION$/, 'learning_objectives'],
  [/^MEDIA_TEXT_UNREADABLE/, 'scene_construction'],
  [/^MEDIA_TEACHING_STATE_NOT_VISIBLE/, 'scene_construction'],
  [/^MEDIA_SCENE_NARRATION_MISMATCH/, 'finished_media_qa'],
  [/^(ULTIMATE_APPROVED_AUDIO_DURATION_CHANGED|ULTIMATE_RENDER_APPROVED_AUDIO_REQUIRED)/, 'natural_narration'],
  [/^(PACE_OUT_OF_RANGE|ROBOTIC_CADENCE|MONOTONE|CLIPPED_WORDS|UNNATURAL_PAUSES|PRONUNCIATION_FAILURE|REPEATED_AUDIO|NARRATION_MEASUREMENT_INCOMPLETE)/, 'natural_narration'],
  [/^(LOOP_DETECTED|DUPLICATE_VISUAL|EXCESSIVE_VISUAL_DUPLICATION|MEDIA_RELEVANCE_LOW|MEDIA_QUALITY_LOW|MEDIA_TOO_DARK|WATERMARK|SCENES_MISSING|INSUFFICIENT_DISTINCT_SHOTS|ULTIMATE_ENVATO_VISUALS_REQUIRED|ULTIMATE_SCENE_LICENSE_RELEVANCE_ASSIGNMENT_REQUIRED|ULTIMATE_RENDER_VISUAL_ASSETS_MISSING|ULTIMATE_RENDER_SAVED_ASSIGNMENT_REQUIRED|ULTIMATE_RENDER_DISTINCT_VISUALS_REQUIRED)/, 'visual_assignment'],
  [/^(ULTIMATE_INSTRUCTIONAL_REVIEW_FAILED|ULTIMATE_CONCISE_TEACHING_VISUAL_REQUIRED|ULTIMATE_TEACHING_SEQUENCE_ORDER_REQUIRED|ULTIMATE_SUBSTANTIVE_ASSESSMENT_REQUIRED)/, 'learning_objectives'],
  [/^ULTIMATE_PRACTICAL_DEMONSTRATION_VIDEO_REQUIRED/, 'visual_assignment'],
  [/^(SCENE_TOO_FAST|NARRATION_TRUNCATION_RISK)/, 'synchronization'],
  [/^(CAPTION_SYNC_FAILED|CAPTIONS_MISSING|AUDIO_SYNC_FAILED)/, 'synchronization'],
  [/^ASSESSMENT_/, 'assessment_alignment'],
  [/^OBJECTIVE_/, 'instructor_script'],
];

/** External evidence that automation must never manufacture. */
const DURABLE_EXTERNAL_BLOCKERS = /^(LICENSE_APPROVAL_REQUIRED|MEDIA_LICENSE_REQUIRED|MEDIA_SOURCE_APPROVAL_REQUIRED|PAID_INFERENCE_AUTHORIZATION_REQUIRED|BROWSER_AUTHORIZATION_REQUIRED|ULTIMATE_INSTRUCTIONAL_SOURCES_REQUIRED|ULTIMATE_SCENE_LICENSE_RELEVANCE_ASSIGNMENT_REQUIRED|ULTIMATE_AUTHORING_SOURCE_GAP|ULTIMATE_GOOGLE_MODEL_REQUIRED|ULTIMATE_GOOGLE_PROJECT_REQUIRED|ULTIMATE_GOOGLE_SERVICE_IDENTITY_UNAVAILABLE|ULTIMATE_GOOGLE_AUTHORING_HTTP_(?:401|403|404))$/;

export function isDurableExternalBlocker(finding: UltimateInstructionalFinding) {
  // Storage account limits are operational restrictions, not render defects.
  // Rebuilding the same approved video cannot raise the account's quota.
  // Preserve checkpoints and require a configured, writable delivery backend.
  if (requiresIndependentMediaDelivery(finding)) return true;
  return DURABLE_EXTERNAL_BLOCKERS.test(finding.code);
}

export function routeSelectiveRepairs(findings: UltimateInstructionalFinding[]) {
  const targets = new Map<UltimateBuildStep, string[]>();
  for (const f of findings) {
    if (isDurableExternalBlocker(f)) continue;
    const renderAssignmentFailure = f.code === 'ULTIMATE_VIDEO_RENDER_FAILED' && /ULTIMATE_RENDER_SAVED_ASSIGNMENT_REQUIRED|ULTIMATE_RENDER_VISUAL_ASSETS_MISSING|ULTIMATE_RENDER_DISTINCT_VISUALS_REQUIRED|MEDIA_RESOLVED_VISUALS_(?:REPEATED|MISSING)/.test(f.message);
    const renderNarrationFailure = f.code === 'ULTIMATE_VIDEO_RENDER_FAILED' && /ULTIMATE_RENDER_APPROVED_AUDIO_REQUIRED/.test(f.message);
    const renderInputFailure = f.code === 'ULTIMATE_VIDEO_RENDER_FAILED' && /PICTURE_CUE_NOT_ALIGNED_TO_SPEECH|PREMIUM_TEACHING_CUE_NOT_ALIGNED/.test(f.message);
    // The finished-film gate can report two *independent* defects in one
    // finding. Route both; choosing visual_assignment alone for a replay masks
    // the frozen-frame/assembly defect and causes expensive unchanged retries.
    if (f.code === 'Media quality gate failed') {
      const visual = /insufficient visual changes|repeats .* earlier moving sequence|backward timeline jump/i.test(f.message);
      const assembly = /frozen interval|blank\/black interval/i.test(f.message);
      if (visual) targets.set('visual_assignment', [...(targets.get('visual_assignment') ?? []), f.code]);
      if (assembly) targets.set('lesson_film_render', [...(targets.get('lesson_film_render') ?? []), f.code]);
      if (!visual && !assembly) targets.set('finished_media_qa', [...(targets.get('finished_media_qa') ?? []), f.code]);
      continue;
    }
    // Cue quotations originate in the storyboard, not the deterministic timeline.
    const target = renderAssignmentFailure ? 'visual_assignment' : renderNarrationFailure ? 'natural_narration' : renderInputFailure ? 'storyboard' : PREFIX_ROUTES.find(([re]) => re.test(f.code))?.[1];
    if (!target) continue;
    targets.set(target, [...(targets.get(target) ?? []), f.code]);
  }
  return [...targets.entries()].map(([step, codes]) => ({
    step,
    codes: [...new Set(codes)],
    rebuildOnlyThisStage: true,
  }));
}

