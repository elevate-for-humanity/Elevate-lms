import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/supervisor/verify-rep
 *
 * Flips competency_log.supervisor_verified = true for a pending rep entry.
 *
 * Auth rules (either satisfies):
 *   1. Caller has a shop_supervisors row with user_id = current user AND
 *      the competency_log entry's apprentice has an apprentice_placements row
 *      at the same shop.
 *   2. Caller's email matches the shop_placements.supervisor_email for the
 *      apprentice (legacy text-based placement path).
 *
 * Body: { competencyLogId: string }
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const body = await request.json().catch(() => ({}));
    const { competencyLogId } = body;

    if (!competencyLogId) return safeError('competencyLogId required', 400);

    const db = await getAdminClient();

    // Fetch the log entry
    const { data: logEntry, error: logErr } = await db
      .from('competency_log')
      .select('id, apprentice_id, skill_id, supervisor_verified, service_count')
      .eq('id', competencyLogId)
      .maybeSingle();

    if (logErr) return safeInternalError(logErr, 'Failed to fetch log entry');
    if (!logEntry) return safeError('Log entry not found', 404);
    if (logEntry.supervisor_verified) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    // --- Auth path 1: shop_supervisors row with user_id = caller (primary) ---
    const { data: supervisorRow } = await db
      .from('shop_supervisors')
      .select('id, shop_id, user_id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    let authorized       = false;
    let authPath         = '';
    let verifiedShopId: string | null = null;
    let supervisorRowId: string | null = null;

    if (supervisorRow) {
      // Verify the apprentice has an active placement at this supervisor's shop
      const { data: placement } = await db
        .from('apprentice_placements')
        .select('id')
        .eq('student_id', logEntry.apprentice_id)
        .eq('shop_id', supervisorRow.shop_id)
        .eq('status', 'active')
        .maybeSingle();

      if (placement) {
        authorized      = true;
        authPath        = 'shop_supervisors';
        verifiedShopId  = supervisorRow.shop_id;
        supervisorRowId = supervisorRow.id;
      }
    }

    // --- Auth path 2: shop_placements supervisor_email (temporary fallback) ---
    // Gated by SUPERVISOR_EMAIL_FALLBACK_ENABLED=true.
    // Disabled by default — only enable during the supervisor migration window
    // while existing supervisors are completing account claim.
    // Remove this block entirely once all shop_supervisors rows have user_id set.
    const emailFallbackEnabled = process.env.SUPERVISOR_EMAIL_FALLBACK_ENABLED === 'true';

    if (!authorized && emailFallbackEnabled) {
      const { data: callerProfile } = await db
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .maybeSingle();

      if (callerProfile?.email) {
        const { data: textPlacement } = await db
          .from('shop_placements')
          .select('id')
          .eq('student_id', logEntry.apprentice_id)
          .eq('supervisor_email', callerProfile.email)
          .eq('status', 'active')
          .maybeSingle();

        if (textPlacement) {
          authorized     = true;
          authPath       = 'email_fallback';
          verifiedShopId = null; // shop_placements has no shop_id FK
        }
      }
    }

    if (!authorized) {
      return safeError('Not authorized to verify reps for this apprentice', 403);
    }

    // Flip the flag and write full audit record
    const { error: updateErr } = await db
      .from('competency_log')
      .update({
        supervisor_verified:      true,
        supervisor_verified_at:   new Date().toISOString(),
        status:                   'verified',
        // Audit fields — immutable record of who verified, from which shop,
        // via which auth path. Required for DOL/state board compliance review.
        verifier_user_id:         user.id,
        verifier_supervisor_id:   supervisorRowId,
        verified_shop_id:         verifiedShopId,
        verification_auth_path:   authPath,
      })
      .eq('id', competencyLogId);

    if (updateErr) return safeDbError(updateErr, 'Failed to verify rep');

    return NextResponse.json({
      success:      true,
      verified:     true,
      authPath,                          // surface to caller for logging/debugging
      verifiedShopId,
    });
  } catch (err) {
    return safeInternalError(err, 'Rep verification failed');
  }
}
