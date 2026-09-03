import { courseFactory } from '@/lib/course-factory';
import { normalizeGeneratedCourseForGovernance } from '@/lib/course-factory/post-generation-governance';
import { finalizeCourseAutomaticallyIfReadyWithClient } from '@/lib/course-builder/persisted-publish-service';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { FactoryInput, FactoryStage } from '@/lib/course-factory/types';

export interface CourseBuildJob {
  id: string;
  tool_args: FactoryInput;
  attempts: number;
  max_attempts: number;
}

export async function processCourseBuild(job: CourseBuildJob): Promise<void> {
  const db = await requireAdminClient();
  const progressWrites: PromiseLike<unknown>[] = [];

  const progress = (stage: FactoryStage, message: string, value = 0) => {
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
  try {
    result = await courseFactory(job.tool_args, progress);
  } finally {
    clearInterval(heartbeat);
    await Promise.allSettled(progressWrites);
  }
  if (!result.ok || !result.courseId) {
    throw new Error(
      result.errors?.join('; ') ||
        `Course Factory stopped with status ${result.status ?? 'unknown'}`,
    );
  }

  const governance = await normalizeGeneratedCourseForGovernance(result.courseId);
  const finalization = await finalizeCourseAutomaticallyIfReadyWithClient({
    db,
    courseId: result.courseId,
  });
  if (finalization.state === 'quality_gate_failed') {
    const blockers = finalization.publication.blocking_issues.join('; ');
    throw new Error(`Automated course repair exhausted: ${blockers}`);
  }
  if (!finalization.ok) {
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
