import { createHash } from 'node:crypto';
import { ULTIMATE_BUILD_STEPS, type UltimateBuildStep } from './types';

/** Changing this version invalidates every checkpoint and release certificate. */
export const ULTIMATE_LESSON_CONTRACT_VERSION = 'ultimate-lesson-2026-10-03.2';
export const MAX_TARGETED_REPAIRS = 8;
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
  const dependencies = ULTIMATE_BUILD_STEPS.slice(0, ULTIMATE_BUILD_STEPS.indexOf(step));
  return contractHash({
    version: ULTIMATE_LESSON_CONTRACT_VERSION,
    profile,
    step,
    dependencies: dependencies.map((s) => [s, contractHash(artifactPayload(prior[s] ?? {}))]),
  });
}
export function currentEvidence(a: Artifact | undefined, inputHash?: string): boolean {
  const e = a?.contractEvidence;
  return Boolean(
    e?.version === ULTIMATE_LESSON_CONTRACT_VERSION &&
    e.passed === true &&
    e.outputHash === contractHash(artifactPayload(a!)) &&
    (!inputHash || e.inputHash === inputHash),
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
        a.objectives.every(
          (o: any) => nonempty(o.id) && nonempty(o.text) && populated(o.sourceRequirementIds),
        ), 'OBJECTIVE_SOURCE_MAPPING_REQUIRED');
      break;
    case 'prerequisites':
      require(a.prerequisites?.reviewRequired === false &&
        (populated(a.prerequisites.checks) ||
          nonempty(a.prerequisites.noneReason)), 'PREREQUISITE_CHECKS_REQUIRED');
      break;
    case 'teaching_sequence':
      require(a.sequence?.stages?.length === 13 &&
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
            populated(s.sourceRequirementIds),
        ), 'SCRIPT_SEGMENTS_REQUIRED');
      break;
    case 'storyboard':
      require(a.storyboard?.scenes?.length === 13 &&
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
      require(assignments.length === 13 &&
        new Set(assignments.map((s: any) => s.sceneId)).size === 13 &&
        assignments.every(
          (s: any) =>
            nonempty(s.sceneId) &&
            nonempty(s.assetId) &&
            nonempty(s.relevanceReason) &&
            (s.generatedInstructionalVisual === true
              ? s.assignmentMethod === 'instructional-render' &&
                String(s.assetId).startsWith('instructional:')
              : nonempty(s.licenseEvidenceUrl)),
        ), 'VISUAL_13_SCENE_COVERAGE_REQUIRED');
      const reuse = new Map<string, number>();
      for (const assignment of assignments) {
        const id = String(assignment.assetId ?? '');
        reuse.set(id, (reuse.get(id) ?? 0) + 1);
      }
      require([...reuse.values()].every((count) => count === 1), 'VISUAL_PROHIBITED_REPETITION');
      break;
    }
    case 'scene_construction':
      require(populated(a.scenes?.shots) &&
        a.scenes.shots.every(
          (s: any) => s.loop === false && nonempty(s.sceneId) && nonempty(s.assetId),
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
      require(nonempty(a.render?.videoUrl) &&
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
        a.release.accessibility?.pass === true, 'RELEASE_TRACEABILITY_ACCESSIBILITY_REQUIRED');
      break;
  }
  return failures;
}
export function assertCompleteLesson(
  artifacts: Partial<Record<UltimateBuildStep, Artifact>>,
  profile?: unknown,
): void {
  for (const step of ULTIMATE_BUILD_STEPS) {
    const a = artifacts[step];
    if (
      !currentEvidence(a, profile ? stepInputHash(step, profile, artifacts) : undefined) ||
      validateStepOutput(step, a ?? {}).length
    )
      throw new Error(`ULTIMATE_CURRENT_CONTRACT_EVIDENCE_REQUIRED:${step}`);
  }
}
