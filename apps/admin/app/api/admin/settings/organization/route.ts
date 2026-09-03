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
  const db = await requireAdminClient();

  const { data, error } = await db
    .from('sos_organizations')
    .insert({
      legal_name: body.legal_name || null,
      dba_name: body.dba_name || null,
      ein: body.ein || null,
      uei: body.uei || null,
      sam_status: body.sam_status || null,
      sam_expiration: body.sam_expiration || null,
      website: body.website || null,
      phone: body.phone || null,
      general_email: body.general_email || null,
      address_line_1: body.address_line_1 || null,
      address_line_2: body.address_line_2 || null,
      city: body.city || null,
      state: body.state || null,
      zip: body.zip || null,
      authorized_signatory_name: body.authorized_signatory_name || null,
      authorized_signatory_title: body.authorized_signatory_title || null,
    })
    .select()
    .single();

  if (error) return safeDbError(error, 'Failed to create organization');
  return NextResponse.json({ org: data });
}

export async function PATCH(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.id) return safeError('id required', 400);

  const db = await requireAdminClient();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fields = [
    'legal_name','dba_name','ein','uei','sam_status','sam_expiration',
    'website','phone','general_email','address_line_1','address_line_2',
    'city','state','zip','authorized_signatory_name','authorized_signatory_title',
  ];
  for (const f of fields) {
    if (f in body) updates[f] = body[f] || null;
  }

  const { data, error } = await db
    .from('sos_organizations')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return safeDbError(error, 'Failed to update organization');
  return NextResponse.json({ org: data });
}
