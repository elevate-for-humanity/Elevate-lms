import { safeInternalError } from '@/lib/api/safe-error';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  // Use service-role client — compliance_items RLS may block user-session reads
  const supabase = await requireAdminClient();

  const { data: items, error } = await supabase
    .from('compliance_items')
    .select('*, compliance_evidence(*)')
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  if (error) {
    return safeInternalError(error as Error, 'Internal server error');
  }

  return NextResponse.json({ items });
}

async function _PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const supabase = await requireAdminClient();

  const { id, status } = await request.json();

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('compliance_items')
    .update({
      status,
      updated_at: new Date().toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return safeInternalError(error as Error, 'Internal server error');
  }

  await supabase.from('audit_logs').insert({
    actor_id: auth.id,
    actor_email: auth.email,
    action: 'compliance_item_updated',
    resource_type: 'compliance_item',
    resource_id: id,
    metadata: { status },
  });

  return NextResponse.json({ ok: true });
}
export const GET = withApiAudit('/api/compliance/items', _GET, { critical: true });
export const PATCH = withApiAudit('/api/compliance/items', _PATCH, { critical: true });
