import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';

export type JobType =
  | 'deployment'
  | 'container'
  | 'cfd_simulation'
  | 'evaluation'
  | 'content_generation'
  | 'backup'
  | 'sync'
  | 'cleanup'
  | 'custom';

export type JobStatus =
  | 'draft'
  | 'queued'
  | 'running'
  | 'verifying'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface PlatformJob {
  id: string;
  organization_id: string;
  job_type: JobType;
  status: JobStatus;
  priority: number;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error_message?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobInput {
  organizationId: string;
  jobType: JobType;
  payload: Record<string, unknown>;
  priority?: number;
  scheduledAt?: Date;
  createdBy: string;
}

export async function createJob(input: CreateJobInput): Promise<PlatformJob | null> {
  const db = await requireAdminClient();

  const { data, error } = await db
    .from('platform_jobs')
    .insert({
      organization_id: input.organizationId,
      job_type: input.jobType,
      payload: input.payload,
      priority: input.priority ?? 5,
      scheduled_at: input.scheduledAt?.toISOString() ?? null,
      created_by: input.createdBy,
      status: 'queued',
    })
    .select('*')
    .single();

  if (error) {
    console.error('[CREATE_JOB_FAILED]', { error: error.message });
    return null;
  }

  return data as PlatformJob;
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  result?: Record<string, unknown>,
  errorMessage?: string,
): Promise<boolean> {
  const db = await requireAdminClient();

  const updates: Record<string, unknown> = { status };

  if (status === 'running') {
    updates.started_at = new Date().toISOString();
  }

  if (status === 'succeeded' || status === 'failed' || status === 'cancelled') {
    updates.completed_at = new Date().toISOString();
    if (result) updates.result = result;
    if (errorMessage) updates.error_message = errorMessage;
  }

  const { error } = await db
    .from('platform_jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) {
    console.error('[UPDATE_JOB_STATUS_FAILED]', { jobId, error: error.message });
    return false;
  }

  return true;
}

export async function logJobEvent(
  jobId: string,
  eventType: string,
  message?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const db = await requireAdminClient();

  const { error } = await db.from('platform_job_events').insert({
    job_id: jobId,
    event_type: eventType,
    message: message ?? null,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error('[LOG_JOB_EVENT_FAILED]', { jobId, eventType, error: error.message });
  }
}

export async function getJob(jobId: string): Promise<PlatformJob | null> {
  const db = await requireAdminClient();

  const { data, error } = await db
    .from('platform_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PlatformJob;
}

export async function getJobs(
  organizationId: string,
  options?: {
    jobType?: JobType;
    status?: JobStatus;
    limit?: number;
    offset?: number;
  },
): Promise<PlatformJob[]> {
  const db = await requireAdminClient();

  let query = db
    .from('platform_jobs')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 50);

  if (options?.jobType) {
    query = query.eq('job_type', options.jobType);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[GET_JOBS_FAILED]', { error: error.message });
    return [];
  }

  return (data ?? []) as PlatformJob[];
}

export async function getQueuedJobs(limit: number = 10): Promise<PlatformJob[]> {
  const db = await requireAdminClient();

  const now = new Date().toISOString();

  const { data, error } = await db
    .from('platform_jobs')
    .select('*')
    .eq('status', 'queued')
    .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[GET_QUEUED_JOBS_FAILED]', { error: error.message });
    return [];
  }

  return (data ?? []) as PlatformJob[];
}

export async function cancelJob(jobId: string): Promise<boolean> {
  return updateJobStatus(jobId, 'cancelled');
}
