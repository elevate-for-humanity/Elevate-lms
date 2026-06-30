import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.status) {
    return safeError('id and status are required', 400);
  }

  const { id, status } = body;
  if (!['approved', 'denied', 'pending'].includes(status)) {
    return safeError('status must be approved, denied, or pending', 400);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('barbershop_partner_applications')
    .update({ status })
    .eq('id', id);

  if (error) return safeDbError(error, 'Failed to update application status');

  return NextResponse.json({ ok: true });
}
