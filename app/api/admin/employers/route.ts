import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('employers')
    .select('id, company_name, contact_name, contact_email, industry, city, state, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return safeDbError(error, 'Failed to fetch employers');
  return NextResponse.json({ employers: data });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.company_name || !body?.contact_email) {
    return safeError('company_name and contact_email are required', 400);
  }

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('employers')
    .insert({
      company_name: body.company_name,
      contact_name: body.contact_name || null,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone || null,
      industry: body.industry || null,
      city: body.city || null,
      state: body.state || 'IN',
      website: body.website || null,
      notes: body.notes || null,
    })
    .select('id')
    .single();

  if (error) return safeDbError(error, 'Failed to create employer');
  return NextResponse.json({ success: true, id: data.id });
}
