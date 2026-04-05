/**
 * GET /api/credentials/funding-decision?attemptId=<uuid>
 *
 * Returns the funding decision for a credential attempt.
 * Called by /lms/payments/checkout before creating a Stripe session.
 *
 * Response shape:
 *   { fundingSource, fundingStatus, requiresCheckout, amountCents, authorizationId, reason }
 */


import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { resolvePaymentResponsibility } from '@/lib/services/credential-pipeline';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard();
  const { user } = auth;

  const attemptId = req.nextUrl.searchParams.get('attemptId');
  if (!attemptId) {
    return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  // Load the attempt — verify it belongs to this learner
  const { data: attempt } = await db
    .from('credential_attempts')
    .select('id, learner_id, credential_id, program_id')
    .eq('id', attemptId)
    .eq('learner_id', user.id)
    .maybeSingle();

  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  }

  const decision = await resolvePaymentResponsibility(
    attempt.learner_id,
    attempt.credential_id,
    attempt.program_id ?? null,
    attempt.id
  );

  return NextResponse.json(decision);
}
