import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.provider_name || !body?.policy_number) {
    return safeError('provider_name and policy_number are required', 400);
  }

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('financial_assurance_records')
    .insert({
      provider_name: body.provider_name,
      policy_number: body.policy_number,
      coverage_type: body.coverage_type || 'surety_bond',
      coverage_amount: body.coverage_amount || null,
      effective_date: body.effective_date || null,
      expiration_date: body.expiration_date || null,
      notes: body.notes || null,
      created_by: auth.user.id,
    })
    .select('id')
    .single();

  if (error) return safeDbError(error, 'Failed to save financial assurance record');
  return NextResponse.json({ success: true, id: data.id });
}
