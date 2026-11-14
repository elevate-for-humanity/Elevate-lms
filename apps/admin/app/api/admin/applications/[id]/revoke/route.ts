/**
 * POST /api/admin/applications/[id]/revoke
 *
 * Revokes access atomically. Delegates to revoke_application_access_atomic().
 * Does not delete rows — preserves audit trail.
 *
 * Returns:
 *   200 { status: 'revoked', ... }
 *   401/403/404/500
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;
    const auth = await apiRequireAdmin(request);
    if (auth.error) return auth.error;

    const { id: applicationId } = await params;
    const requestId = randomUUID();

    const supabase = await createClient();
    const db = await requireAdminClient();
    if (!db)
      return NextResponse.json({ error: 'Admin client failed to initialize' }, { status: 500 });

    if (!supabase) return safeError('Database not configured', 503);

    const { data, error } = await db.rpc('revoke_application_access_atomic', {
      p_application_id: applicationId,
      p_actor_user_id: auth.id,
      p_request_id: requestId,
    });

    if (error) {
      logger.error('[revoke] RPC error', undefined, { applicationId, requestId, error: error.message });
      if (error.message.includes('ACTOR_NOT_AUTHORIZED')) return safeError('Forbidden', 403);
      if (error.message.includes('APPLICATION_NOT_FOUND'))
        return safeError('Requested application is unavailable', 404);
      // RPC not yet deployed — migration 20260503000011_approval_hardening.sql
      // must be applied in Supabase Dashboard before revoke is available.
      if (
        error.message.includes('Could not find the function') ||
        error.message.includes('schema cache')
      ) {
        return safeError(
          'Revoke RPC not available. Apply migration 20260503000011_approval_hardening.sql in Supabase Dashboard.',
          503,
        );
      }
      return safeInternalError(error, 'Revoke failed');
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return safeInternalError(err, 'Unexpected revoke failure');
  }
}
