import { requireAdminClient } from '@/lib/supabase/admin';
import { requestCanonicalGeneration } from '@/lib/ultimate-course-builder/core/generation-request';
import type { FactoryInput } from '@/lib/course-factory/types';

export interface CourseBuildJob {
  id: string;
  user_id?: string | null;
  tool_args: FactoryInput;
  attempts: number;
  max_attempts: number;
  result?: Record<string, unknown> | null;
}

/** The Studio job hands off once; Ultimate owns execution, retries, QA and release. */
export async function processCourseBuild(job: CourseBuildJob): Promise<void> {
  if (!job.user_id) throw new Error('AUTHENTICATED_GENERATION_ACTOR_REQUIRED');
  const db = await requireAdminClient();
  const courseId = typeof job.result?.courseId === 'string' ? job.result.courseId : job.tool_args.courseId;
  const result = await requestCanonicalGeneration(db, { ...job.tool_args, courseId }, job.user_id);
  if (!result.ok) throw new Error(result.errors?.join('; ') || 'CANONICAL_GENERATION_NOT_STARTED');
  const saved = await db.from('devstudio_jobs').update({
    status: 'completed', stage: 'handed_off', progress: 0,
    result: { ...result, completionState: 'media_pending' },
    error: null, finished_at: new Date().toISOString(),
    locked_at: null, locked_by: null, updated_at: new Date().toISOString(),
  }).eq('id', job.id).select('id').single();
  if (saved.error || !saved.data) throw saved.error ?? new Error('GENERATION_HANDOFF_NOT_RECORDED');
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
