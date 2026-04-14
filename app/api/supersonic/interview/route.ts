// PUBLIC ROUTE: Supersonic interview scheduling form
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  if (!body?.email) {
    return safeError('email is required', 400);
  }

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('supersonic_applications')
    .insert({
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      email: body.email,
      phone: body.phone || null,
      date_of_birth: body.date_of_birth || null,
      ssn_last_4: body.ssn_last_4 || null,
      street_address: body.street_address || null,
      city: body.city || null,
      state: body.state || null,
      zip_code: body.zip_code || null,
      filing_status: body.filing_status || null,
      dependents: body.dependents ? parseInt(body.dependents) : null,
      status: 'interview_submitted',
    })
    .select('id')
    .single();

  if (error) return safeDbError(error, 'Failed to save interview');
  return NextResponse.json({ success: true, id: data.id });
}
