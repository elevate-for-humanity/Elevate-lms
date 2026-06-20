import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const admin = await apiRequireAdmin(req);
  if (admin.error) return admin.error;

  const { id } = await params;
  if (!id) return safeError('Missing log ID', 400);

  const db = await requireAdminClient();

  // Confirm the record exists and is not already approved
  const { data: existing, error: fetchError } = await db
    .from('progress_entries')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return safeInternalError(fetchError, 'Failed to fetch progress entry');
  if (!existing) return safeError('Progress entry not found', 404);
  if (existing.status === 'verified') return safeError('Hours already approved', 409);

  // Use the admin_approve_progress_entries RPC which bypasses the partner-only trigger
  const { data: count, error: rpcError } = await db
    .rpc('admin_approve_progress_entries', {
      p_ids: [id],
      p_approver_id: admin.id,
    });

  if (rpcError) return safeInternalError(rpcError, 'Failed to approve progress entry');
  if (!count) return safeError('Progress entry not updated — may already be verified', 409);

  logger.info('[admin/apprenticeships/hours/approve]', { entryId: id, approvedBy: admin.id });

  await logAdminAudit({
    action: AdminAction.ENROLLMENT_UPDATED,
    actorId: admin.id,
    entityType: 'progress_entries',
    entityId: id,
    metadata: { decision: 'approved' },
  });

  return NextResponse.json({ success: true });
}
