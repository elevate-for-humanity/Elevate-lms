import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReviewBody = {
  action?: 'approve' | 'reject' | 'under_review';
  review_notes?: string;
};

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const approvalId = params.id;
  if (!approvalId) return safeError('approval id is required', 400);

  const body = (await request.json().catch(() => null)) as ReviewBody | null;
  if (!body?.action || !['approve', 'reject', 'under_review'].includes(body.action)) {
    return safeError('action must be approve, reject, or under_review', 400);
  }

  const status = body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : 'under_review';
  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  try {
    const { data: approval, error } = await db
      .from('provider_program_approvals')
      .update({
        status,
        reviewed_by: auth.id,
        reviewed_at: new Date().toISOString(),
        review_notes: body.review_notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', approvalId)
      .select('id, tenant_id, program_id, status, reviewed_at, review_notes')
      .maybeSingle();

    if (error) return safeDbError(error, 'Provider program review failed');
    if (!approval) return safeError('Program approval not found', 404);

    return NextResponse.json({ ok: true, approval });
  } catch (error) {
    return safeInternalError(error, 'Provider program review failed');
  }
}
