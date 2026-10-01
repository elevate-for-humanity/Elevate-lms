import type { SupabaseClient } from '@supabase/supabase-js';
import type { UltimatePersistencePort } from '../core/ports';
import { ULTIMATE_BUILD_STEPS } from '../core/types';
export class UltimateSupabasePersistence implements UltimatePersistencePort {
  constructor(private db: SupabaseClient) {}
  async createBuild(input: any) {
    const { data, error } = await this.db
      .from('ultimate_course_builds')
      .insert(input)
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
          .select('step,state,artifacts')
          .eq('lesson_build_id', input.lessonBuildId),
      ]);
    if (lessonError) throw lessonError;
    if (stepsError) throw stepsError;
    const passed = (steps ?? []).filter((x: any) => x.state === 'passed');
    const artifacts = { ...((lesson?.artifacts ?? {}) as Record<string, unknown>) };
    for (const step of passed) artifacts[String(step.step)] = step.artifacts ?? {};
    // A repaired provider or renderer must rebuild downstream media instead of
    // replaying a failed QA result against the same cached audio/video. Keep
    // all earlier instructional work and licensed visual assignments.
    const narrationQA = (artifacts.narration_qa as any)?.narrationQA;
    const paceFailed = narrationQA?.failures?.includes('PACE_OUT_OF_RANGE');
    const render = (artifacts.lesson_film_render as any)?.render;
    const oldLayout = render && render.layoutVersion !== 2;
    const firstRebuildStep = paceFailed ? 'natural_narration' : oldLayout ? 'lesson_film_render' : null;
    const ordered: readonly string[] = ULTIMATE_BUILD_STEPS;
    const rebuildIndex = firstRebuildStep ? ordered.indexOf(firstRebuildStep) : -1;
    const reusable = rebuildIndex < 0 ? passed : passed.filter((step: any) => ordered.indexOf(String(step.step)) < rebuildIndex);
    return {
      artifacts,
      passedSteps: reusable.map((x: any) => String(x.step)),
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
    const { error: e } = await this.db
      .from('ultimate_course_builds')
      .update({ findings: [...findings, input.finding], updated_at: new Date().toISOString() })
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
