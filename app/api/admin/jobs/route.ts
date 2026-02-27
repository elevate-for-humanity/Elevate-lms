import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenantContext } from '@/lib/tenant';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * STEP 6E: Admin endpoint for dead letter jobs
 * 
 * GET /api/admin/jobs?status=dead - List dead letter jobs
 * GET /api/admin/jobs?status=failed - List failed jobs
 * GET /api/admin/jobs - List all jobs
 */
async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const tenantContext = await getTenantContext();
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Verify super_admin role
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', tenantContext.userId)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let query = db
      .from('provisioning_jobs')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query;

    if (error) {
      logger.error('Failed to fetch jobs', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Get counts by status
    const { data: counts } = await db
      .from('provisioning_jobs')
      .select('status')
      .then(({ data }) => {
        const statusCounts: Record<string, number> = {};
        (data || []).forEach((job: { status: string }) => {
          statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
        });
        return { data: statusCounts };
      });

    return NextResponse.json({
      jobs: jobs || [],
      counts: counts || {},
      total: jobs?.length || 0,
    });
  } catch (error) {
    logger.error('Admin jobs endpoint error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/jobs', _GET);
