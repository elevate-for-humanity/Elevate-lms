import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { tenantId } = await params;

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  let body: { reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* reason is optional */
  }

  const { data, error } = await db.rpc('suspend_provider', {
    p_tenant_id: tenantId,
    p_admin_user_id: auth.id,
    p_reason: body.reason ?? null,
  });

  if (error) return safeInternalError(error, 'Suspension failed');
  if (!data?.success) return safeError(data?.message ?? 'Suspension failed', 409);

  return NextResponse.json({ success: true });
}
