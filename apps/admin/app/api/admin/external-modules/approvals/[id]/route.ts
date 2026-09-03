import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { AdminAction, logAdminAudit } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    if (!id) return safeError('Approval id is required', 400);

    const db = await requireAdminClient();
    if (!db) return safeError('Database unavailable', 503);

    const body = await req.json();
    const action = String(body.action || '').trim();
    if (!['approve', 'reject'].includes(action)) {
      return safeError('Invalid action', 400);
    }

    const payload =
      action === 'approve'
        ? {
            status: 'approved',
            approved_by: auth.id,
            approved_at: new Date().toISOString(),
          }
        : {
            status: 'in_progress',
            proof_file_url: null,
          };

    const { error } = await db.from('external_partner_progress').update(payload).eq('id', id);
    if (error) return safeError('Failed to update external module approval', 400);

    await logAdminAudit({
      action: AdminAction.EXTERNAL_MODULE_APPROVAL_REVIEWED,
      actorId: auth.id,
      entityType: 'external_partner_progress',
      entityId: id,
      metadata: { action },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}

export const PATCH = withApiAudit('/api/admin/external-modules/approvals/[id]', _PATCH);
