export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const { tenantId } = await params;

  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  let body: { reason?: string } = {};
  try { body = await request.json(); } catch { /* reason is optional */ }

  const { data, error } = await db.rpc('suspend_provider', {
    p_tenant_id: tenantId,
    p_admin_user_id: user.id,
    p_reason: body.reason ?? null,
  });

  if (error) return safeInternalError(error, 'Suspension failed');
  if (!data?.success) return safeError(data?.message ?? 'Suspension failed', 409);

  return NextResponse.json({ success: true });
}
