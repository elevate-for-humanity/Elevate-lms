/**
 * POST /api/admin/jobs/retry
 *
 * Resets a failed job back to pending so the processor will retry it.
 * Requires admin auth. Does not reset the attempt counter — the job
 * will fail permanently if it exceeds MAX_ATTEMPTS again.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify admin role
  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { jobId } = body as { jobId?: string };

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const { data: job, error: fetchError } = await db
    .from('job_queue')
    .select('id, status, type')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.status !== 'failed') {
    return NextResponse.json({ error: `Job is ${job.status}, not failed` }, { status: 400 });
  }

  const { error: updateError } = await db
    .from('job_queue')
    .update({ status: 'pending', run_after: new Date().toISOString(), last_error: null })
    .eq('id', jobId);

  if (updateError) {
    logger.error('Failed to retry job', updateError as Error, { jobId });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  logger.info('Job queued for retry by admin', { jobId, type: job.type, adminId: user.id });
  return NextResponse.json({ ok: true, jobId });
}
