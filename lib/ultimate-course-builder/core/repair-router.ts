import type { UltimateBuildStep } from './types';
import type { UltimateInstructionalFinding } from './execution-policy';

const PREFIX_ROUTES: Array<[RegExp, UltimateBuildStep]> = [
  [/^NARRATION_DUPLICATION$/, 'learning_objectives'],
  [/^MEDIA_TEXT_UNREADABLE/, 'scene_construction'],
  [/^MEDIA_TEACHING_STATE_NOT_VISIBLE/, 'scene_construction'],
  [/^MEDIA_SCENE_NARRATION_MISMATCH/, 'synchronization'],
  [/^ULTIMATE_APPROVED_AUDIO_DURATION_CHANGED/, 'natural_narration'],
  [/^(PACE_OUT_OF_RANGE|ROBOTIC_CADENCE|MONOTONE|CLIPPED_WORDS|UNNATURAL_PAUSES|PRONUNCIATION_FAILURE|REPEATED_AUDIO|NARRATION_MEASUREMENT_INCOMPLETE)/, 'natural_narration'],
  [/^(LOOP_DETECTED|DUPLICATE_VISUAL|EXCESSIVE_VISUAL_DUPLICATION|MEDIA_RELEVANCE_LOW|MEDIA_QUALITY_LOW|MEDIA_TOO_DARK|WATERMARK|SCENES_MISSING|INSUFFICIENT_DISTINCT_SHOTS|ULTIMATE_ENVATO_VISUALS_REQUIRED|ULTIMATE_SCENE_LICENSE_RELEVANCE_ASSIGNMENT_REQUIRED|ULTIMATE_RENDER_VISUAL_ASSETS_MISSING)/, 'visual_assignment'],
  [/^(SCENE_TOO_FAST|NARRATION_TRUNCATION_RISK)/, 'synchronization'],
  [/^(CAPTION_SYNC_FAILED|CAPTIONS_MISSING|AUDIO_SYNC_FAILED)/, 'synchronization'],
  [/^ASSESSMENT_/, 'assessment_alignment'],
  [/^OBJECTIVE_/, 'instructor_script'],
];

/** External evidence that automation must never manufacture. */
const DURABLE_EXTERNAL_BLOCKERS = /^(LICENSE_APPROVAL_REQUIRED|MEDIA_LICENSE_REQUIRED|MEDIA_SOURCE_APPROVAL_REQUIRED|PAID_INFERENCE_AUTHORIZATION_REQUIRED|BROWSER_AUTHORIZATION_REQUIRED)$/;

export function isDurableExternalBlocker(finding: UltimateInstructionalFinding) {
  return DURABLE_EXTERNAL_BLOCKERS.test(finding.code);
}

export function routeSelectiveRepairs(findings: UltimateInstructionalFinding[]) {
  const targets = new Map<UltimateBuildStep, string[]>();
  for (const f of findings) {
    if (isDurableExternalBlocker(f)) continue;
    const target = PREFIX_ROUTES.find(([re]) => re.test(f.code))?.[1];
    if (!target) continue;
    targets.set(target, [...(targets.get(target) ?? []), f.code]);
  }
  return [...targets.entries()].map(([step, codes]) => ({
    step,
    codes: [...new Set(codes)],
    rebuildOnlyThisStage: true,
  }));
}
