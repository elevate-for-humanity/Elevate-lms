/**
 * PATCH /api/admin/license-requests
 * Body: { id: string; status: 'approved' | 'rejected' }
 * Approves or rejects a license request. Admin-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _PATCH(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const { id, status } = body as { id?: string; status?: string };

  if (!id || !['approved', 'rejected'].includes(status ?? '')) {
    return NextResponse.json({ error: 'id and status (approved|rejected) required' }, { status: 400 });
  }

  const db = await requireAdminClient();

  const { error } = await db
    .from('license_requests')
    .update({
      status,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      approved_by: status === 'approved' ? auth.id : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

  await logAdminAudit({
    action: AdminAction.ENROLLMENT_UPDATED,
    actorId: auth.id,
    entityType: 'license_requests',
    entityId: id,
    metadata: { status },
    req,
  });

  return NextResponse.json({ ok: true });
}

export const PATCH = withApiAudit('/api/admin/license-requests', _PATCH);
