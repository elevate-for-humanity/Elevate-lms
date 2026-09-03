import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _PATCH(request: NextRequest, { params }: { params: Promise<{ claimId: string }> }) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const { claimId } = await params;
  const body = await request.json().catch(() => ({}));
  const decision = body.decision === 'verify' ? 'verify' : body.decision === 'reject' ? 'reject' : null;
  if (!decision) return NextResponse.json({ error: 'decision must be verify or reject' }, { status: 400 });
  const rejectionReason = typeof body.rejectionReason === 'string' ? body.rejectionReason.trim().slice(0, 1000) : '';
  const reviewedUpdatedAt = typeof body.reviewedUpdatedAt === 'string' ? body.reviewedUpdatedAt.trim() : '';
  if (!reviewedUpdatedAt || Number.isNaN(Date.parse(reviewedUpdatedAt))) {
    return NextResponse.json({ error: 'The reviewed claim version is required.' }, { status: 400 });
  }
  if (decision === 'reject' && !rejectionReason) {
    return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const update = decision === 'verify'
    ? { status: 'verified', verified_at: new Date().toISOString(), verified_by: auth.id, public_claim_allowed: true, rejection_reason: null, updated_at: new Date().toISOString() }
    : { status: 'rejected', verified_at: null, verified_by: null, public_claim_allowed: false, rejection_reason: rejectionReason, updated_at: new Date().toISOString() };
  const { data, error } = await db
    .from('website_claim_registry')
    .update(update)
    .eq('id', claimId)
    .eq('status', 'pending_review')
    .eq('updated_at', reviewedUpdatedAt)
    .select('id,website_id,claim_key,status,verified_at,verified_by,public_claim_allowed,rejection_reason')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'This claim changed after it was opened. Refresh and review the current evidence before deciding.' }, { status: 409 });
  return NextResponse.json({ claim: data });
}

export const PATCH = withApiAudit('/api/admin/website-claims/[claimId]', _PATCH);
