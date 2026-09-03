import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';

async function requireCertificationReviewer(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'staff', 'super_admin'].includes(profile.role)) {
    return {
      supabase,
      error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
    };
  }

  return { supabase, user, error: null };
}

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireCertificationReviewer(request);
  if (auth.error || !auth.user) return auth.error!;

  const body = await request.json().catch(() => null);
  const submissionId = body?.submissionId;
  const action = body?.action;

  if (!submissionId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'A certification id and valid action are required' }, { status: 400 });
  }

  // The Manage Certifications UI is backed by user_certifications. The old
  // certification_submissions route targeted a different, incomplete table and
  // attempted to write columns that do not exist in the live schema.
  const newStatus = action === 'approve' ? 'active' : 'revoked';
  const { data, error } = await auditedMutation({
    table: 'user_certifications',
    operation: 'update',
    rowData: {
      status: newStatus,
      updated_at: new Date().toISOString(),
    },
    filter: { id: submissionId },
    audit: {
      action: 'api:post:/api/admin/certifications/review',
      actorId: auth.user.id,
      targetType: 'user_certifications',
      targetId: submissionId,
      metadata: { decision: action },
    },
  });

  if (error || !data) {
    logger.error('Failed to review certification:', error as Error);
    return NextResponse.json({ error: 'Failed to update certification' }, { status: 500 });
  }

  await logAdminAudit({
    action: AdminAction.CERTIFICATION_REVIEWED,
    actorId: auth.user.id,
    entityType: 'user_certifications',
    entityId: submissionId,
    metadata: { decision: action },
    req: request,
  });

  return NextResponse.json({
    success: true,
    certification: data,
    message: `Certification ${newStatus}`,
  });
}

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireCertificationReviewer(request);
  if (auth.error) return auth.error;

  const status = new URL(request.url).searchParams.get('status');
  let query = auth.supabase
    .from('user_certifications')
    .select(
      'id,user_id,certification_type_id,certification_name,certification_type,status,earned_date,created_at,updated_at',
    )
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    logger.error('Failed to fetch certifications:', error);
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }

  const userIds = [...new Set((data ?? []).map((row) => row.user_id).filter(Boolean))];
  const { data: profiles, error: profileError } = userIds.length
    ? await auth.supabase.from('profiles').select('id,full_name,email').in('id', userIds)
    : { data: [], error: null };
  if (profileError) {
    logger.error('Failed to fetch certification profiles:', profileError);
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return NextResponse.json({
    certifications: (data ?? []).map((row) => ({
      ...row,
      profiles: profileMap.get(row.user_id) ?? null,
    })),
  });
}

export const GET = withApiAudit('/api/admin/certifications/review', _GET, { critical: true });
export const POST = withApiAudit('/api/admin/certifications/review', _POST, { critical: true });
