import { inheritCourseProductionPolicy } from '../core/production-policy.mjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UltimatePersistencePort } from '../core/ports';
import { instructionView } from '../core/repair-policy.mjs';
import { currentEvidence } from '../core/lesson-contract';
import { ULTIMATE_BUILD_STEPS } from '../core/types';
import { MIN_LESSON_VIDEO_SCENES } from '@/lib/video/media-director';
import { measuredNarrationRepair } from '../instructional/narration-checkpoint-repair.mjs';
export class UltimateSupabasePersistence implements UltimatePersistencePort {
  constructor(private db: SupabaseClient) {}
  async createBuild(input: any) {
    const { data, error } = await this.db
      .from('ultimate_course_builds')
      .insert({...input, profile: inheritCourseProductionPolicy(input.profile)})
      .select('id')
      .single();
    if (error) throw error;
    return data;
  }
  async createLesson(input: any) {
    const { data, error } = await this.db
      .from('ultimate_lesson_builds')
      .upsert(
        {
          build_id: input.buildId,
          lesson_key: input.lessonKey,
          competency_id: input.competencyId,
          status: 'running',
        },
        { onConflict: 'build_id,lesson_key' },
      )
      .select('id')
      .single();
    if (error) throw error;
    return data;
  }
  async loadLessonCheckpoint(input: any) {
    const [{ data: lesson, error: lessonError }, { data: steps, error: stepsError }] =
      await Promise.all([
        this.db
          .from('ultimate_lesson_builds')
          .select('artifacts,findings')
          .eq('id', input.lessonBuildId)
          .single(),
        this.db
          .from('ultimate_lesson_steps')
          .select('step,state,artifacts,completed_at')
          .eq('lesson_build_id', input.lessonBuildId),
      ]);
    if (lessonError) throw lessonError;
    if (stepsError) throw stepsError;
    const passed = (steps ?? []).filter((x: any) => x.state === 'passed' && currentEvidence(x.artifacts));
    const artifacts = { ...((lesson?.artifacts ?? {}) as Record<string, unknown>) };
    for (const step of passed) artifacts[String(step.step)] = step.artifacts ?? {};
    // The safety classifier was repaired after these certified lessons were
    // authored. An old safety-only directive must retry its failing render
    // gate rather than force the media role to re-author valid objectives.
    // This does not certify the render: all preflight, source, licensing and
    // downstream media checks execute normally on the retained checkpoints.
    const safetyDirective = (artifacts.__repairState as any)?.directive;
    const safetySource = artifacts.learning_objectives as any;
    const safetyBoard = artifacts.storyboard as any;
    const safetyInspectorRetry = safetyDirective?.failedStep === 'lesson_film_render' &&
      safetyDirective?.target === 'learning_objectives' &&
      currentEvidence(safetyDirective.previous) && currentEvidence(safetySource) &&
      safetyDirective.previous.contractEvidence.outputHash === safetySource.contractEvidence.outputHash &&
      passed.some((row: any) => row.step === 'learning_objectives') &&
      currentEvidence(safetyBoard) &&
      Array.isArray(safetyDirective.requirements) && safetyDirective.requirements.length > 0 &&
      safetyDirective.requirements.every((finding: any) =>
        finding.code === 'INSTRUCTIONAL_QUALITY_FAILED' &&
        finding.message === 'practical beauty instruction must include an explicit safety or sanitation scene') &&
      instructionView(safetyBoard.storyboard).scenes.some((scene: any) =>
        scene.sceneType === 'safety_warning' || scene.procedurePhase === 'safety');
    if (safetyInspectorRetry) {
      artifacts.__repairState = {
        ...(artifacts.__repairState as any),
        directive: {
          ...safetyDirective,
          target: 'lesson_film_render',
          previous: artifacts.lesson_film_render,
          previousTarget: safetyDirective.target,
        },
      };
    }
    // Strict rendering compares the recording with its storyboard. If the
    // saved recording already matches every approved script segment, repeating
    // synthesis cannot repair a divergent storyboard. Rebuild only that
    // upstream producer from the canonical blueprint, with normal validation.
    const audioDirective = (artifacts.__repairState as any)?.directive;
    const approvedScript = (artifacts.instructor_script as any)?.script?.segments;
    const recordedScript = (artifacts.natural_narration as any)?.narration?.segments;
    const recordedBoard = (artifacts.storyboard as any)?.storyboard?.scenes;
    // Older failed renders persisted the finding but no repair state. Without
    // reconstructing its bounded diagnosis, every resumed media role repeats
    // the same mismatch and consumes another attempt. Use only the current
    // saved failure, never an unrelated or superseded historical observation.
    const savedRenderFailure = (steps ?? []).find((row: any) =>
      row.step === 'lesson_film_render' && row.state === 'failed');
    const savedErrors = Array.isArray(lesson?.findings)
      ? lesson.findings.filter((finding: any) => finding.severity === 'error') : [];
    const sourceSteps = ['instructor_script', 'natural_narration', 'storyboard'].map(step =>
      passed.find((row: any) => row.step === step));
    const savedFailureIsCurrent = savedRenderFailure?.completed_at &&
      Number.isFinite(Date.parse(savedRenderFailure.completed_at)) &&
      sourceSteps.every((row: any) => row?.completed_at &&
        Number.isFinite(Date.parse(row.completed_at)) &&
        Date.parse(row.completed_at) <= Date.parse(savedRenderFailure.completed_at));
    const recoverMissingAudioDirective = !artifacts.__repairState && savedFailureIsCurrent &&
      savedErrors.length > 0 && savedErrors.every((finding: any) =>
        finding.step === 'lesson_film_render' && finding.code === 'ULTIMATE_VIDEO_RENDER_FAILED' &&
        finding.message === 'ULTIMATE_VIDEO_RENDER_FAILED:ULTIMATE_RENDER_APPROVED_AUDIO_REQUIRED');
    const approvedRecordingHasDivergentBoard =
      currentEvidence(artifacts.instructor_script as any) &&
      currentEvidence(artifacts.natural_narration as any) &&
      currentEvidence(artifacts.storyboard as any) &&
      Array.isArray(approvedScript) && approvedScript.length > 0 &&
      Array.isArray(recordedScript) && approvedScript.length === recordedScript.length &&
      approvedScript.every((segment: any, index: number) => segment.text === recordedScript[index]?.text) &&
      Array.isArray(recordedBoard) &&
      (recordedBoard.length !== approvedScript.length || recordedBoard.some((scene: any, index: number) =>
        String(scene.dialogue ?? '').trim() !== String(approvedScript[index]?.text ?? '').trim()));
    if (recoverMissingAudioDirective && approvedRecordingHasDivergentBoard) {
      artifacts.__repairState = {status:'diagnosed', directive:{
        version:'verified-repair-v1', failedStep:'lesson_film_render', target:'storyboard',
        previousTarget:'natural_narration', attempt:1, previous:artifacts.storyboard,
        requirements:savedErrors.map((finding: any) => ({code:finding.code,message:finding.message})),
        instructions:'Restore the storyboard from the approved source that owns the saved script and recording. Preserve authorized sources and competency IDs. Rendering and independent media QA must pass again.',
      }};
    }
    const storyboardAudioRetry = audioDirective?.failedStep === 'lesson_film_render' &&
      audioDirective?.target === 'natural_narration' &&
      Array.isArray(audioDirective.requirements) && audioDirective.requirements.length > 0 &&
      audioDirective.requirements.every((finding: any) =>
        finding.code === 'ULTIMATE_VIDEO_RENDER_FAILED' &&
        finding.message === 'ULTIMATE_VIDEO_RENDER_FAILED:ULTIMATE_RENDER_APPROVED_AUDIO_REQUIRED') &&
      approvedRecordingHasDivergentBoard;
    if (storyboardAudioRetry) {
      artifacts.__repairState = {
        ...(artifacts.__repairState as any), status: 'diagnosed',
        directive: {...audioDirective, target: 'storyboard',
          previousTarget: audioDirective.target, previous: artifacts.storyboard},
      };
    }
    // A legacy ASR finding was routed to a deterministic timeline producer.
    // Recover its exact certified timeline and already encoded film; the new
    // independent decoded-audio QA still has to pass before acceptance.
    const narrationDirective = (artifacts.__repairState as any)?.directive;
    const narrationInspectorRetry = narrationDirective?.failedStep === 'finished_media_qa' &&
      narrationDirective?.target === 'synchronization' &&
      Array.isArray(narrationDirective.requirements) && narrationDirective.requirements.length > 0 &&
      narrationDirective.requirements.every((finding: any) => finding.code === 'MEDIA_SCENE_NARRATION_MISMATCH') &&
      currentEvidence(narrationDirective.previous) && currentEvidence(artifacts.lesson_film_render as any);
    if (narrationInspectorRetry) {
      artifacts.synchronization = narrationDirective.previous;
      if (!passed.some((step: any) => step.step === 'synchronization'))
        passed.push({step:'synchronization',state:'passed',artifacts:narrationDirective.previous,completed_at:null});
      artifacts.__repairState = {...artifacts.__repairState as any,status:'producer-validated',
        directive:{...narrationDirective,target:'finished_media_qa'}};
    }
    // Recover a legacy picture-cue repair that was incorrectly routed
    // to the deterministic synchronization producer.
    //
    // Cue quotations originate in the storyboard; repair their source.
    // Preserve certified narration and timeline evidence, but do not
    // certify rendering or downstream media QA.
    const pictureCueDirective =
      (artifacts.__repairState as any)?.directive;

    const legacyPictureCueRetry =
      pictureCueDirective?.target === 'synchronization' &&
      pictureCueDirective?.failedStep === 'lesson_film_render' &&
      Array.isArray(pictureCueDirective.requirements) &&
      pictureCueDirective.requirements.length > 0 &&
      pictureCueDirective.requirements.every((finding: any) =>
        finding.code === 'ULTIMATE_VIDEO_RENDER_FAILED' &&
        /PICTURE_CUE_NOT_ALIGNED_TO_SPEECH|PREMIUM_TEACHING_CUE_NOT_ALIGNED/
          .test(String(finding.message ?? ''))
      ) &&
      currentEvidence(pictureCueDirective.previous);

    if (legacyPictureCueRetry) {
      artifacts.synchronization = pictureCueDirective.previous;

      if (!passed.some((step: any) =>
        step.step === 'synchronization')) {
        passed.push({
          step: 'synchronization',
          state: 'passed',
          artifacts: pictureCueDirective.previous,
          completed_at: null,
        });
      }

      // The next runner pass must reconsider the original storyboard
      // cues rather than replaying the obsolete sync repair.
      artifacts.__repairState = {
        ...(artifacts.__repairState as any),
        status: 'diagnosed',
        directive: {
          ...pictureCueDirective,
          target: 'storyboard',
          previous: artifacts.storyboard,
        },
      };
    }

    // The old full-frame premium OCR can reject a readable heading, then strand
    // its unchanged scene producer. Retry that inspection using the previously
    // certified producer and saved film. The runner still verifies every input
    // hash and stage contract; media QA is never marked passed here.
    const directive = (artifacts.__repairState as any)?.directive;
    const legacyTitleRetry = directive?.failedStep === 'finished_media_qa' &&
      directive?.target === 'scene_construction' &&
      (artifacts.lesson_film_render as any)?.render?.presentationVersion === 'approved-moment-cues-v2' &&
      currentEvidence(artifacts.lesson_film_render as any) &&
      Array.isArray(directive.requirements) && directive.requirements.length > 0 &&
      directive.requirements.every((finding: any) => finding.code === 'MEDIA_TEXT_UNREADABLE') &&
      currentEvidence(directive.previous);
    if (legacyTitleRetry) {
      artifacts.scene_construction = directive.previous;
      if (!passed.some((step: any) => step.step === 'scene_construction')) {
        passed.push({ step: 'scene_construction', state: 'passed', artifacts: directive.previous, completed_at: null });
      }
      delete artifacts.__repairState;
    }
    // A repaired provider or renderer must rebuild downstream media instead of
    // replaying a failed QA result against the same cached audio/video. Keep
    // all earlier instructional work and licensed visual assignments.
    const failedNarration = (steps ?? []).find((row: any) => row.step === 'narration_qa' && row.state === 'failed');
    const synthesized = (steps ?? []).find((row: any) => row.step === 'natural_narration' && row.state === 'passed');
    // A newer synthesis must receive fresh QA, rather than inheriting the old
    // film's pace finding and being regenerated on every role handoff.
    const failedNarrationIsCurrent = failedNarration?.completed_at &&
      (!synthesized?.completed_at || Date.parse(failedNarration.completed_at) >= Date.parse(synthesized.completed_at));
    const narrationQA = (artifacts.narration_qa as any)?.narrationQA ??
      (failedNarrationIsCurrent ? failedNarration.artifacts?.narrationQA : undefined);
    const narrationNeedsRepair = narrationQA?.failures?.some((failure: string) =>
      ['PACE_OUT_OF_RANGE', 'CLIPPED_WORDS'].includes(failure));
    const measuredRepair = measuredNarrationRepair(narrationQA, artifacts.natural_narration);
    if (measuredRepair) artifacts.__repairState = {
      directive: measuredRepair, status: 'diagnosed',
    };
    const render = (artifacts.lesson_film_render as any)?.render;
    const oldLayout = render && ![2, 4].includes(render.layoutVersion);
    const storyboard = (artifacts.storyboard as any)?.storyboard ?? artifacts.storyboard;
    const insufficientScenes = Array.isArray(storyboard?.scenes) &&
      storyboard.scenes.length < MIN_LESSON_VIDEO_SCENES;
    const emptyObjectives = Array.isArray((artifacts.learning_objectives as any)?.objectives) &&
      (artifacts.learning_objectives as any).objectives.length === 0;
    const emptyTraceability = Array.isArray((artifacts.credential_release as any)?.release?.rows) &&
      (artifacts.credential_release as any).release.rows.length === 0;
    const firstRebuildStep = insufficientScenes ? 'storyboard'
      : narrationNeedsRepair ? 'natural_narration'
      : oldLayout ? 'lesson_film_render'
      : emptyObjectives ? 'finished_media_qa'
      : emptyTraceability ? 'credential_release' : null;
    const ordered: readonly string[] = ULTIMATE_BUILD_STEPS;
    const rebuildIndex = firstRebuildStep ? ordered.indexOf(firstRebuildStep) : -1;
    const reusable = rebuildIndex < 0 ? passed : passed.filter((step: any) => ordered.indexOf(String(step.step)) < rebuildIndex);
    return {
      artifacts,
      passedSteps: reusable.map((x: any) => String(x.step)),
      recoveredSteps: (narrationInspectorRetry || legacyPictureCueRetry) && reusable.some((step: any) => step.step === 'synchronization')
        ? ['synchronization' as const] : legacyTitleRetry && reusable.some((step: any) => step.step === 'scene_construction')
        ? ['scene_construction' as const] : [],
      findings: Array.isArray(lesson?.findings) ? lesson.findings : [],
    };
  }
  async recordStep(input: any) {
    const now = new Date().toISOString();
    const { error } = await this.db
      .from('ultimate_lesson_steps')
      .upsert(
        {
          lesson_build_id: input.lessonBuildId,
          step: input.step,
          state: input.state,
          artifacts: input.artifacts ?? {},
          findings: input.findings ?? [],
          started_at: input.state === 'running' ? now : undefined,
          completed_at: ['passed', 'failed'].includes(input.state) ? now : undefined,
        },
        { onConflict: 'lesson_build_id,step' },
      );
    if (error) throw error;
  }
  async saveArtifact(input: any) {
    const { error } = await this.db
      .from('ultimate_lesson_builds')
      .update({ artifacts: input.artifacts, updated_at: new Date().toISOString() })
      .eq('id', input.lessonBuildId);
    if (error) throw error;
  }
  async recordFinding(input: any) {
    const { data, error } = await this.db
      .from('ultimate_course_builds')
      .select('findings')
      .eq('id', input.buildId)
      .single();
    if (error) throw error;
    const findings = Array.isArray(data?.findings) ? data.findings : [];
    // Repeated repairs must not append the same unresolved finding on each pass.
    // Keep distinct errors and their evidence; never mark a failed QA gate as passed.
    const key = (finding: any) => JSON.stringify([
      finding?.step ?? null,
      finding?.code ?? null,
      finding?.message ?? null,
      finding?.severity ?? null,
    ]);
    const unique = [...new Map([...findings, input.finding].map((finding: any) => [key(finding), finding])).values()];
    if (unique.length === findings.length && findings.some((finding: any) => key(finding) === key(input.finding))) return;
    const { error: e } = await this.db
      .from('ultimate_course_builds')
      .update({ findings: unique, updated_at: new Date().toISOString() })
      .eq('id', input.buildId);
    if (e) throw e;
  }
  async finishLesson(input: any) {
    const { error } = await this.db
      .from('ultimate_lesson_builds')
      .update({
        status: input.status,
        artifacts: input.artifacts,
        findings: input.findings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.lessonBuildId);
    if (error) throw error;
  }
  async updateBuild(input: any) {
    const update: any = { status: input.status, updated_at: new Date().toISOString() };
    if (input.currentStep !== undefined) update.current_step = input.currentStep;
    if (input.findings !== undefined) update.findings = input.findings;
    const { error } = await this.db
      .from('ultimate_course_builds')
      .update(update)
      .eq('id', input.buildId);
    if (error) throw error;
  }
}
