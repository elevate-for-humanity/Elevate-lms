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
  if (!body?.participant_name || !body?.participant_email) {
    return safeError('participant_name and participant_email are required', 400);
  }

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('wioa_participants')
    .insert({
      participant_name: body.participant_name,
      participant_email: body.participant_email,
      participant_phone: body.participant_phone || null,
      program: body.program || null,
      workone_center: body.workone_center || null,
      case_manager: body.case_manager || null,
      authorization_date: body.authorization_date || null,
      expiration_date: body.expiration_date || null,
      funding_amount: body.funding_amount ? parseFloat(body.funding_amount) : null,
      notes: body.notes || null,
      status: 'pending',
      created_by: auth.user.id,
    })
    .select('id')
    .single();

  if (error) return safeDbError(error, 'Failed to create WIOA participant record');
  return NextResponse.json({ success: true, id: data.id });
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('wioa_participants')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return safeDbError(error, 'Failed to fetch WIOA participants');
  return NextResponse.json({ participants: data });
}
