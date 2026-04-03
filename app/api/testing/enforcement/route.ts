/**
 * GET /api/testing/enforcement?email=...
 *
 * Returns any unpaid enforcement holds (no-show, retake, reschedule fees)
 * for a given email address. Called by the booking form before allowing
 * submission — if a hold exists, the form shows a "pay fee first" gate.
 *
 * POST /api/testing/enforcement/checkout
 * Creates a Stripe session to pay an enforcement fee.
 * Body: { enforcementId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'public');
  if (rateLimited) return rateLimited;

  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim();
  if (!email) return safeError('email is required', 400);

  const db = createAdminClient();
  if (!db) return safeError('Database unavailable', 500);

  try {
    const { data: holds, error } = await db
      .from('testing_enforcement')
      .select('id, enforcement_type, fee_cents, locked_at, booking_id')
      .eq('email', email)
      .eq('fee_paid', false)
      .order('locked_at', { ascending: false });

    if (error) return safeInternalError(error, 'Failed to check enforcement holds');

    return NextResponse.json({
      hasHold: (holds ?? []).length > 0,
      holds: holds ?? [],
    });
  } catch (err) {
    return safeInternalError(err, 'Enforcement check failed');
  }
}
