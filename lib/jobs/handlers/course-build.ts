import { courseFactory } from '@/lib/course-factory';
import { normalizeGeneratedCourseForGovernance } from '@/lib/course-factory/post-generation-governance';
import { finalizeUnifiedCourseBuildWithClient } from '@/lib/course-builder/build-lifecycle';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { FactoryInput, FactoryStage } from '@/lib/course-factory/types';
import { assertCourseBuilderGenerationEnabled } from '@/lib/course-builder/generation-control';

export interface CourseBuildJob {
  id: string;
  tool_args: FactoryInput;
  attempts: number;
  max_attempts: number;
  result?: Record<string, unknown> | null;
}

const productionStageMap: Partial<Record<FactoryStage, { worker: string; state: string }>> = {
  init: { worker: 'orchestrator', state: 'requested' },
  resolve: { worker: 'orchestrator', state: 'planning' },
  blueprint: { worker: 'instructional_llm', state: 'planning' },
  instructional_plan: { worker: 'instructional_llm', state: 'planning' },
  technical_review: { worker: 'technical_verification', state: 'technical_review' },
  storyboard: { worker: 'storyboard', state: 'storyboard_ready' },
  enrich: { worker: 'instructional_llm', state: 'planning' },
  assess: { worker: 'technical_verification', state: 'technical_review' },
  validate: { worker: 'technical_verification', state: 'technical_review' },
  generating_assets: { worker: 'image', state: 'generating_assets' },
  generating_narration: { worker: 'narration', state: 'generating_narration' },
  media: { worker: 'gpu_render', state: 'rendering' },
  rendering: { worker: 'gpu_render', state: 'rendering' },
  quality_review: { worker: 'quality_control', state: 'quality_review' },
  human_review: { worker: 'publisher', state: 'human_review' },
  publish: { worker: 'publisher', state: 'human_review' },
  complete: { worker: 'quality_control', state: 'human_review' },
};

function resumableMediaCheckpoint(job: CourseBuildJob): string | null {
  const checkpoint = job.result;
  if (!checkpoint || checkpoint.ok !== true || typeof checkpoint.courseId !== 'string') return null;
  const finalization = checkpoint.finalization;
  if (!finalization || typeof finalization !== 'object') return null;
  if ((finalization as { state?: unknown }).state !== 'media_pending') return null;
  const requestedCourseId = job.tool_args.courseId;
  return !requestedCourseId || requestedCourseId === checkpoint.courseId
    ? checkpoint.courseId
    : null;
}

export async function processCourseBuild(job: CourseBuildJob): Promise<void> {
  const db = await requireAdminClient();
  await assertCourseBuilderGenerationEnabled(db, job.tool_args.courseId);
  const progressWrites: PromiseLike<unknown>[] = [];
  const checkpointCourseId = resumableMediaCheckpoint(job);

  const progress = (stage: FactoryStage, message: string, value = 0) => {
    const production = productionStageMap[stage];
    progressWrites.push(
      db
        .from('devstudio_jobs')
        .update({
          stage,
          progress: Math.max(0, Math.min(99, Math.round(value))),
          log_lines: [message],
          locked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .then(({ error }) => {
          if (error)
            logger.warn('[course-build] progress update failed', {
              jobId: job.id,
              error: error.message,
            });
        }),
    );
    if (production) {
      progressWrites.push(
        db
          .rpc('record_course_production_stage', {
            p_job_id: job.id,
            p_course_id: job.tool_args.courseId ?? null,
            p_worker_kind: production.worker,
            p_run_state: production.state,
            p_worker_status: 'running',
            p_evidence: { message, progress: Math.max(0, Math.min(99, Math.round(value))) },
            p_error: null,
          })
          .then(({ error }) => {
            if (error)
              logger.warn('[course-build] production-stage update failed', {
                jobId: job.id,
                stage,
                error: error.message,
              });
          }),
      );
    }
  };

  // Long provider calls can be quiet for several minutes. Renew the lease on
  // an independent cadence so healthy builds are not reclaimed mid-request.
  const heartbeat = setInterval(() => {
    progressWrites.push(
      db
        .from('devstudio_jobs')
        .update({
          locked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .eq('status', 'running')
        .then(({ error }) => {
          if (error)
            logger.warn('[course-build] heartbeat failed', {
              jobId: job.id,
              error: error.message,
            });
        }),
    );
  }, 60_000);

  let result;
  if (checkpointCourseId) {
    clearInterval(heartbeat);
    result = job.result as Record<string, unknown> & { ok: true; courseId: string };
    const { error: resumeError } = await db
      .from('courses')
      .update({
        generation_status: 'generating',
        generation_progress: 95,
        updated_at: new Date().toISOString(),
      })
      .eq('id', checkpointCourseId);
    if (resumeError) throw resumeError;
    logger.info('[course-build] Resuming completed build at media finalization', {
      jobId: job.id,
      courseId: checkpointCourseId,
    });
  } else {
    try {
      result = await courseFactory(job.tool_args, progress);
    } finally {
      clearInterval(heartbeat);
      await Promise.allSettled(progressWrites);
    }
  }
  if (!result.ok || !result.courseId) {
    throw new Error(
      result.errors?.join('; ') ||
        `Course Factory stopped with status ${result.status ?? 'unknown'}`,
    );
  }

  const governance = checkpointCourseId
    ? (result.governance ?? (await normalizeGeneratedCourseForGovernance(result.courseId)))
    : await normalizeGeneratedCourseForGovernance(result.courseId);
  const finalization = await finalizeUnifiedCourseBuildWithClient({
    db,
    courseId: result.courseId,
  });
  if (!finalization.ok) {
    await db.rpc('record_course_production_stage', {
      p_job_id: job.id,
      p_course_id: result.courseId,
      p_worker_kind: 'quality_control',
      p_run_state: 'quality_review',
      p_worker_status: 'blocked',
      p_evidence: { media: finalization.media },
      p_error: 'Required media or quality evidence is incomplete',
    });
    const now = new Date();
    const retryAt = new Date(now.getTime() + 5 * 60_000);
    const { error: pendingError } = await db
      .from('devstudio_jobs')
      .update({
        status: 'queued',
        stage: finalization.state,
        progress: 99,
        result: { ...result, governance, finalization },
        error: null,
        run_at: retryAt.toISOString(),
        finished_at: null,
        locked_at: null,
        locked_by: null,
        updated_at: now.toISOString(),
      })
      .eq('id', job.id);
    if (pendingError) throw pendingError;
    return;
  }
  const finishedAt = new Date().toISOString();
  await db.rpc('record_course_production_stage', {
    p_job_id: job.id,
    p_course_id: result.courseId,
    p_worker_kind: 'quality_control',
    p_run_state: 'human_review',
    p_worker_status: 'completed',
    p_evidence: { media: finalization.media, governance },
    p_error: null,
  });
  const { error } = await db
    .from('devstudio_jobs')
    .update({
      status: 'completed',
      stage: 'complete',
      progress: 100,
      result: { ...result, governance, finalization },
      error: null,
      finished_at: finishedAt,
      locked_at: null,
      locked_by: null,
      updated_at: finishedAt,
    })
    .eq('id', job.id);
  if (error) throw error;
}

export async function failCourseBuild(job: CourseBuildJob, error: unknown): Promise<void> {
  const db = await requireAdminClient();
  const message = error instanceof Error ? error.message : 'Course build failed';
  const retry = job.attempts < job.max_attempts;
  const now = new Date();
  const retryAt = new Date(now.getTime() + Math.min(30, 2 ** job.attempts) * 60_000);
  await db.rpc('record_course_production_stage', {
    p_job_id: job.id,
    p_course_id: job.tool_args.courseId ?? null,
    p_worker_kind: 'orchestrator',
    p_run_state: retry ? 'retryable_failed' : 'permanent_failed',
    p_worker_status: retry ? 'retryable_failed' : 'permanent_failed',
    p_evidence: { attempts: job.attempts, maxAttempts: job.max_attempts },
    p_error: message.slice(0, 4000),
  });
  await db
    .from('devstudio_jobs')
    .update({
      status: retry ? 'queued' : 'failed',
      stage: 'error',
      error: message.slice(0, 4000),
      run_at: retryAt.toISOString(),
      finished_at: retry ? null : now.toISOString(),
      locked_at: null,
      locked_by: null,
      updated_at: now.toISOString(),
    })
    .eq('id', job.id);
}
