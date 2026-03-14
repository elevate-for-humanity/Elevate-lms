import { createSupabaseClient } from '@/lib/supabase-api';
import { logger } from '@/lib/logger';

/**
 * STEP 6A: Database-backed job queue
 * 
 * Job types:
 * - license_provision: Create/activate license
 * - license_suspend: Suspend license (refund/dispute)
 * - license_reactivate: Restore suspended license
 * - email_send: Send transactional email
 * - tenant_setup: Initialize tenant resources
 * - webhook_process: Process Stripe webhook event
 */

export type JobType = 
  | 'license_provision'
  | 'license_suspend'
  | 'license_reactivate'
  | 'email_send'
  | 'tenant_setup'
  | 'webhook_process';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'dead';

export interface ProvisioningJob {
  id: string;
  stripe_event_id: string | null;
  payment_intent_id: string | null;
  tenant_id: string | null;
  correlation_id: string;
  job_type: JobType;
  payload: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  run_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnqueueJobParams {
  jobType: JobType;
  payload: Record<string, unknown>;
  correlationId: string;
  stripeEventId?: string;
  paymentIntentId?: string;
  tenantId?: string;
  runAt?: Date;
}

/**
 * Enqueue a job for async processing
 * Returns immediately - job processed by worker
 */
export async function enqueueJob(params: EnqueueJobParams): Promise<string> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('provisioning_jobs')
    .insert({
      job_type: params.jobType,
      payload: params.payload,
      correlation_id: params.correlationId,
      stripe_event_id: params.stripeEventId || null,
      payment_intent_id: params.paymentIntentId || null,
      tenant_id: params.tenantId || null,
      run_at: params.runAt?.toISOString() || new Date().toISOString(),
    })
    .select('id')
    .single();
  
  if (error) {
    // Check for duplicate (idempotency)
    if (error.code === '23505' && params.stripeEventId) {
      logger.info('Job already exists (idempotent)', { 
        stripeEventId: params.stripeEventId 
      });
      return 'duplicate';
    }
    
    logger.error('Failed to enqueue job', error, { 
      jobType: params.jobType,
      correlationId: params.correlationId 
    });
    throw error;
  }
  
  logger.info('Job enqueued', { 
    jobId: data.id, 
    jobType: params.jobType,
    correlationId: params.correlationId 
  });
  
  return data.id;
}

/**
 * Claim jobs for processing (used by worker)
 * Uses SELECT FOR UPDATE SKIP LOCKED to prevent double-processing
 */
export async function claimJobs(limit: number = 25): Promise<ProvisioningJob[]> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.rpc('claim_provisioning_jobs', {
    p_limit: limit,
  });
  
  if (error) {
    logger.error('Failed to claim jobs', error);
    throw error;
  }
  
  return (data || []) as ProvisioningJob[];
}

/**
 * Mark job as completed
 */
export async function completeJob(jobId: string): Promise<void> {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase.rpc('complete_provisioning_job', {
    p_job_id: jobId,
    p_success: true,
  });
  
  if (error) {
    logger.error('Failed to complete job', error, { jobId });
    throw error;
  }
}

/**
 * Mark job as failed (will retry or go to dead letter)
 */
export async function failJob(jobId: string, errorMessage: string): Promise<void> {
  const supabase = createSupabaseClient();
  
  const { error } = await supabase.rpc('complete_provisioning_job', {
    p_job_id: jobId,
    p_success: false,
    p_error: errorMessage,
  });
  
  if (error) {
    logger.error('Failed to mark job as failed', error, { jobId });
    throw error;
  }
}

/**
 * Get dead letter jobs for admin review
 */
export async function getDeadLetterJobs(): Promise<ProvisioningJob[]> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('provisioning_jobs')
    .select('*')
    .eq('status', 'dead')
    .order('updated_at', { ascending: false });
  
  if (error) {
    logger.error('Failed to fetch dead letter jobs', error);
    throw error;
  }
  
  return (data || []) as ProvisioningJob[];
}

/**
 * Retry a dead letter job (admin action)
 */
export async function retryDeadLetterJob(
  jobId: string, 
  adminUserId: string
): Promise<boolean> {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.rpc('retry_dead_letter_job', {
    p_job_id: jobId,
    p_admin_user_id: adminUserId,
  });
  
  if (error) {
    logger.error('Failed to retry dead letter job', error, { jobId });
    throw error;
  }
  
  return data as boolean;
}
