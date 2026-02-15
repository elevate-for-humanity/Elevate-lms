import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantContext, logAdminAccess } from '@/lib/tenant';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * STEP 6E: Retry dead letter job
 * 
 * POST /api/admin/jobs/:id/retry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { id: jobId } = await params;
    const tenantContext = await getTenantContext();
    const supabase = await createClient();

    // Verify super_admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', tenantContext.userId)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get job details for audit
    const { data: job } = await supabase
      .from('provisioning_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'dead' && job.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only dead or failed jobs can be retried' },
        { status: 400 }
      );
    }

    // Retry the job
    const { data, error } = await supabase.rpc('retry_dead_letter_job', {
      p_job_id: jobId,
      p_admin_user_id: tenantContext.userId,
    });

    if (error) {
      logger.error('Failed to retry job', error, { jobId });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Log admin action
    await logAdminAccess(
      job.tenant_id,
      'retry_dead_letter_job',
      'provisioning_jobs',
      `Retried job ${jobId} of type ${job.job_type}`
    );

    logger.info('Dead letter job retried', {
      jobId,
      jobType: job.job_type,
      adminUserId: tenantContext.userId,
      correlationId: job.correlation_id,
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Job queued for retry',
    });
  } catch (error) {
    logger.error('Retry job endpoint error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
