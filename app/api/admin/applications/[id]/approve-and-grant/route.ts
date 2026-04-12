/**
 * POST /api/admin/applications/[id]/approve-and-grant
 *
 * Atomic approval + access grant. Delegates all logic to
 * approve_application_and_grant_access_atomic() DB function.
 *
 * Returns:
 *   200 { status: 'enrolled' | 'already_processed', ... }
 *   409 { status: 'blocked', blockers: [...] }
 *   401 Unauthorized
 *   403 Forbidden (role check enforced in DB function)
 *   500 Unexpected error
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
  if (!db) return NextResponse.json({ error: 'Admin client failed to initialize' }, { status: 500 });

    if (!supabase) return safeError('Database not configured', 503);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return safeError('Forbidden', 403);
    }

    const { data, error } = await db.rpc('approve_application_and_grant_access_atomic', {
      p_application_id: applicationId,
      p_actor_user_id:  user.id,
      p_request_id:     requestId,
    });

    if (error) {
      logger.error('[approve-and-grant] RPC error', { applicationId, requestId, error: error.message });
      // Surface structured DB exceptions as 409 or 403 where appropriate
      if (error.message.includes('ACTOR_NOT_AUTHORIZED')) return safeError('Forbidden', 403);
      if (error.message.includes('APPLICATION_NOT_FOUND')) return safeError('Application not found', 404);
      return safeInternalError(error, 'Approval failed');
    }

    if (data?.status === 'blocked') {
      return NextResponse.json(data, { status: 409 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return safeInternalError(err, 'Unexpected approval failure');
  }
}
