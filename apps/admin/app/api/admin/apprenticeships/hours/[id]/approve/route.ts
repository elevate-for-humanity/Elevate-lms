import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  if (!UUID_RE.test(id)) return safeError('Valid progress entry id is required', 400);

  try {
    const db = await requireAdminClient();
    const { data: entry, error: entryError } = await db
      .from('progress_entries')
      .select('id,status,verified_by,verified_at')
      .eq('id', id)
      .maybeSingle();

    if (entryError) return safeDbError(entryError, 'Failed to load progress entry');
    if (!entry) return safeError('Progress entry not found', 404);

    if (entry.status === 'verified') {
      return NextResponse.json({
        ok: true,
        id,
        approved: false,
        alreadyVerified: true,
        verifiedBy: entry.verified_by,
        verifiedAt: entry.verified_at,
      });
    }

    if (entry.status !== 'submitted') {
      return safeError(`Only submitted progress entries can be approved (current status: ${entry.status})`, 409);
    }

    const { data: approvedCount, error: approveError } = await db.rpc(
      'admin_approve_progress_entries',
      {
        p_ids: [id],
        p_approver_id: auth.id,
      },
    );

    if (approveError) return safeDbError(approveError, 'Failed to approve progress entry');
    if (Number(approvedCount ?? 0) !== 1) {
      return safeError('Progress entry was not approved; reload the queue and try again', 409);
    }

    const { data: verified, error: verifyError } = await db
      .from('progress_entries')
      .select('id,status,verified_by,verified_at')
      .eq('id', id)
      .maybeSingle();

    if (verifyError) return safeDbError(verifyError, 'Approval succeeded but verification read-back failed');

    return NextResponse.json({
      ok: true,
      id,
      approved: true,
      status: verified?.status ?? 'verified',
      verifiedBy: verified?.verified_by ?? auth.id,
      verifiedAt: verified?.verified_at ?? null,
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to approve progress entry');
  }
}
