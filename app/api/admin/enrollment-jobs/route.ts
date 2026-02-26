import { NextResponse } from 'next/server';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * Admin API for Enrollment Jobs
 *
 * GET - List failed/retrying jobs for staff visibility
 * POST - Manually trigger orchestrator or retry failed job
 */

export async function GET(req: Request) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Verify staff role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get failed and retrying jobs
  const { data: jobs, error } = await db
    .from('enrollment_jobs')
    .select(
      `
      *,
      program_enrollments (
        id,
        program_id,
        student_id,
        status,
        profiles (
          email,
          first_name,
          last_name
        )
      )
    `
    )
    .in('status', ['failed', 'retrying'])
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Verify staff role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { action, job_id } = body;

  if (action === 'retry' && job_id) {
    // Reset failed job to retry
    const { error } = await db
      .from('enrollment_jobs')
      .update({
        status: 'pending',
        attempt_count: 0,
        last_error: null,
        scheduled_for: new Date().toISOString(),
      })
      .eq('id', job_id)
      .eq('status', 'failed');

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    await logAdminAudit({ action: AdminAction.ENROLLMENT_JOB_UPDATED, actorId: user.id, entityType: 'enrollment_jobs', entityId: job_id, metadata: { retry: true }, req });

    return NextResponse.json({ success: true, message: 'Job reset for retry' });
  }

  if (action === 'trigger_orchestrator') {
    // Trigger orchestrator edge function
    const { data, error }: any = await supabase.functions.invoke(
      'enrollment-orchestrator'
    );

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
