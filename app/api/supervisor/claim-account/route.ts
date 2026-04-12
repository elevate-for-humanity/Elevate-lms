import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/supervisor/claim-account
 *
 * Links the authenticated user's ID to their shop_supervisors row,
 * matched by the email on their profile.
 *
 * Called once after a supervisor completes account creation via the
 * approval onboarding email. After this call, verify-rep uses the
 * shop_supervisors.user_id path (primary auth) instead of email fallback.
 *
 * Idempotent — safe to call multiple times.
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const db = await getAdminClient();

    // Resolve the caller's email from their profile
    const { data: profile } = await db
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.email) return safeError('Profile email not found', 400);

    // Find the shop_supervisors row(s) matching this email with no user_id yet
    const { data: supervisorRows, error: fetchErr } = await db
      .from('shop_supervisors')
      .select('id, shop_id, user_id')
      .eq('email', profile.email)
      .eq('is_active', true);

    if (fetchErr) return safeInternalError(fetchErr, 'Failed to look up supervisor record');

    if (!supervisorRows || supervisorRows.length === 0) {
      return safeError(
        'No supervisor record found for this email. Contact your program administrator.',
        404,
      );
    }

    // Link user_id on any unclaimed rows for this email
    const unclaimed = supervisorRows.filter(r => !r.user_id);
    if (unclaimed.length === 0) {
      // Already claimed — idempotent success
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        shopIds: supervisorRows.map(r => r.shop_id),
      });
    }

    const { error: updateErr } = await db
      .from('shop_supervisors')
      .update({ user_id: user.id })
      .in('id', unclaimed.map(r => r.id));

    if (updateErr) return safeDbError(updateErr, 'Failed to claim supervisor account');

    return NextResponse.json({
      success: true,
      claimed: unclaimed.length,
      shopIds: unclaimed.map(r => r.shop_id),
    });
  } catch (err) {
    return safeInternalError(err, 'Account claim failed');
  }
}
