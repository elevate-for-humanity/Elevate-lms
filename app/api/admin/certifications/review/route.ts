import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';

async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  
  // Get current user and verify admin role
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { submissionId, action, notes } = body;

  if (!submissionId || !action) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  const { data, error } = await auditedMutation({
    table: 'certification_submissions',
    operation: 'update',
    rowData: {
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: notes || null,
    },
    filter: { id: submissionId },
    audit: {
      action: 'api:post:/api/admin/certifications/review',
      actorId: user.id,
      targetType: 'certification_submissions',
      targetId: submissionId,
      metadata: { decision: action, notes: notes || null },
    },
  });

  if (error) {
    logger.error('Failed to update submission:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }

  // Secondary audit via admin audit log (non-transactional, supplementary)
  await logAdminAudit({
    action: AdminAction.CERTIFICATION_REVIEWED,
    actorId: user.id,
    entityType: 'certification_submissions',
    entityId: submissionId,
    metadata: { decision: action, notes: notes || null },
    req: request,
  });

  // HVAC workflow: advance credential sequence when admin approves a cert
  if (action === 'approve' && data?.program_id === 'hvac-technician' && data?.user_id) {
    try {
      const { advanceHvacWorkflow } = await import('@/lib/courses/hvac-completion-workflow');
      const wfResult = await advanceHvacWorkflow(data.user_id);
      logger.info('[hvac-workflow] Advanced on admin approval', { userId: data.user_id, ...wfResult });
    } catch (wfErr) {
      logger.error('[hvac-workflow] Advance failed (non-fatal):', wfErr);
    }
  }

  return NextResponse.json({ 
    success: true, 
    submission: data,
    message: `Certification ${newStatus}` 
  });
}

async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  
  // Get current user and verify admin role
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('certification_submissions')
    .select(`
      *,
      profiles:user_id (id, full_name, email),
      programs:program_id (id, name)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }

  return NextResponse.json({ submissions: data });
}
export const GET = withApiAudit('/api/admin/certifications/review', _GET, { critical: true });
export const POST = withApiAudit('/api/admin/certifications/review', _POST, { critical: true });
