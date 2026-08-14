import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { fact_key, fact_value_json, source_type, source_reference, status } = body;
  if (!fact_key) return safeError('fact_key required', 400);

  const db = await requireAdminClient();

  // Get org id
  const { data: org } = await db.from('sos_organizations').select('id').limit(1).maybeSingle();

  const { data: fact, error } = await db
    .from('sos_organization_facts')
    .upsert({
      organization_id: org?.id ?? null,
      fact_key,
      fact_value_json: fact_value_json ?? null,
      source_type: source_type ?? 'admin_manual',
      source_reference: source_reference ?? null,
      status: status ?? 'approved',
      approved_by: auth.id,
      approved_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,fact_key' })
    .select()
    .single();

  if (error) return safeDbError(error, 'Failed to save fact');
  return NextResponse.json({ fact });
}

export async function DELETE(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return safeError('id required', 400);

  const db = await requireAdminClient();
  const { error } = await db.from('sos_organization_facts').delete().eq('id', id);
  if (error) return safeDbError(error, 'Failed to delete fact');
  return NextResponse.json({ ok: true });
}
