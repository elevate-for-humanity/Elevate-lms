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
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const { id: applicationId } = await params;
    const requestId = randomUUID();

    const supabase = await createClient();
    const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

    if (!supabase) return safeError('Database not configured', 503);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return safeError('Forbidden', 403);
    }

    const { data, error } = await db.rpc('revoke_application_access_atomic', {
      p_application_id: applicationId,
      p_actor_user_id:  user.id,
      p_request_id:     requestId,
    });

    if (error) {
      logger.error('[revoke] RPC error', { applicationId, requestId, error: error.message });
      if (error.message.includes('ACTOR_NOT_AUTHORIZED')) return safeError('Forbidden', 403);
      if (error.message.includes('APPLICATION_NOT_FOUND')) return safeError('Application not found', 404);
      return safeInternalError(error, 'Revoke failed');
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return safeInternalError(err, 'Unexpected revoke failure');
  }
}
