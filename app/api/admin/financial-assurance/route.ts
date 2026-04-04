import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError, safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try { await apiRequireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const db = createAdminClient();
  const { data, error } = await db
    .from('financial_assurance_records')
    .select('*')
    .order('expiration_date', { ascending: true, nullsFirst: false });
  if (error) return safeDbError(error, 'Failed to fetch records');
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  try { await apiRequireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const db = createAdminClient();
  const body = await request.json().catch(() => null);
  if (!body?.record_type || !body?.provider_name) {
    return NextResponse.json({ error: 'record_type and provider_name are required' }, { status: 400 });
  }
  const { data, error } = await db
    .from('financial_assurance_records')
    .insert({
      record_type: body.record_type,
      provider_name: body.provider_name,
      policy_or_reference_number: body.policy_or_reference_number ?? null,
      coverage_amount: body.coverage_amount ?? null,
      effective_date: body.effective_date ?? null,
      expiration_date: body.expiration_date ?? null,
      status: body.status ?? 'active',
      state: body.state ?? null,
      notes: body.notes ?? null,
      document_url: body.document_url ?? null,
    })
    .select()
    .single();
  if (error) return safeDbError(error, 'Failed to create record');
  return NextResponse.json({ data }, { status: 201 });
}
