/**
 * GET /api/admin/applications/[id]/readiness
 *
 * Returns the readiness state for an application before staff clicks approve.
 * Shows exact blockers so staff know what to resolve.
 *
 * Returns:
 *   200 { ready: bool, blockers: [...], application_id, program_slug, status }
 *   401 Unauthorized
 *   500 Unexpected error
 */


import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { id: applicationId } = await params;

    const supabase = await createClient();
    const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

    if (!supabase) return safeError('Database not configured', 503);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return safeError('Forbidden', 403);
    }

    const { data, error } = await db.rpc('check_application_access_readiness', {
      p_application_id: applicationId,
    });

    if (error) return safeInternalError(error, 'Readiness check failed');

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return safeInternalError(err, 'Unexpected error');
  }
}
