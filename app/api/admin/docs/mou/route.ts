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
  if (!body?.title || !body?.party_name || !body?.party_email) {
    return safeError('title, party_name, and party_email are required', 400);
  }

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('mou_documents')
    .insert({
      title: body.title,
      party_name: body.party_name,
      party_email: body.party_email,
      party_type: body.party_type || 'employer',
      program: body.program || null,
      effective_date: body.effective_date || null,
      expiration_date: body.expiration_date || null,
      notes: body.notes || null,
      status: 'draft',
      created_by: auth.user.id,
    })
    .select('id')
    .single();

  if (error) return safeDbError(error, 'Failed to create MOU document');
  return NextResponse.json({ success: true, id: data.id });
}
