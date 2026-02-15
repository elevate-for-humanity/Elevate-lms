import { logger } from '@/lib/logger';

/**
 * SECTION 7: Lightweight async queue using Supabase
 * For production, consider Upstash QStash or similar
 * 
 * This implementation uses a database table as a simple queue
 * with a cron job to process pending items
 */

export interface QueueJob {
  id?: string;
  type: 'provision_license' | 'send_email' | 'suspend_license';
  payload: Record<string, unknown>;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  attempts?: number;
  maxAttempts?: number;
  error?: string;
  createdAt?: string;
  processedAt?: string;
}

/**
 * Enqueue a job for async processing
 */
export async function enqueueJob(
  supabase: { from: (table: string) => { insert: (data: unknown) => { select: () => { single: () => Promise<{ data: unknown; error: unknown }> } } } },
  job: QueueJob
): Promise<string | null> {
  const { data, error } = await supabase
    .from('job_queue')
    .insert({
      type: job.type,
      payload: job.payload,
      status: 'pending',
      attempts: 0,
      max_attempts: job.maxAttempts || 3,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to enqueue job', error);
    return null;
  }

  return (data as { id: string })?.id || null;
}

/**
 * Process pending jobs (called by cron)
 */
export async function processPendingJobs(
  adminSupabase: { 
    from: (table: string) => { 
      select: (columns?: string) => { 
        eq: (col: string, val: string) => { 
          lt: (col: string, val: number) => { 
            order: (col: string, opts: { ascending: boolean }) => { 
              limit: (n: number) => Promise<{ data: unknown[]; error: unknown }> 
            } 
          } 
        } 
      };
      update: (data: unknown) => { eq: (col: string, val: string) => Promise<{ error: unknown }> }
    } 
  },
  handlers: Record<string, (payload: Record<string, unknown>) => Promise<void>>
): Promise<{ processed: number; failed: number }> {
  // Get pending jobs
  const { data: jobs, error } = await adminSupabase
    .from('job_queue')
    .select('*')
    .eq('status', 'pending')
    .lt('attempts', 3)
    .order('created_at', { ascending: true })
    .limit(10);

  if (error || !jobs) {
    logger.error('Failed to fetch pending jobs', error);
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const job of jobs as QueueJob[]) {
    const handler = handlers[job.type];
    if (!handler) {
      logger.warn('No handler for job type', { type: job.type });
      continue;
    }

    // Mark as processing
    await adminSupabase
      .from('job_queue')
      .update({ status: 'processing', attempts: (job.attempts || 0) + 1 })
      .eq('id', job.id!);

    try {
      await handler(job.payload);
      
      await adminSupabase
        .from('job_queue')
        .update({ status: 'completed', processed_at: new Date().toISOString() })
        .eq('id', job.id!);
      
      processed++;
    } catch (err) {
      const errorMessage = 'Operation failed';
      
      await adminSupabase
        .from('job_queue')
        .update({ 
          status: (job.attempts || 0) + 1 >= 3 ? 'failed' : 'pending',
          error: errorMessage,
        })
        .eq('id', job.id!);
      
      failed++;
      logger.error('Job processing failed', { jobId: job.id, error: errorMessage });
    }
  }

  return { processed, failed };
}
