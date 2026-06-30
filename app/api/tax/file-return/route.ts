import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiAuthGuard } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => null) as { tax_year?: number; filing_status?: string; notes?: string } | null;
  if (!body?.tax_year) return safeError('tax_year is required', 400);
  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);
    const { data, error } = await db.from('tax_return_requests').insert({
      user_id: auth.id,
      tax_year: body.tax_year,
      filing_status: body.filing_status ?? null,
      notes: body.notes ?? null,
      status: 'submitted',
      created_at: new Date().toISOString(),
    }).select('id, status').maybeSingle();
    if (error) return NextResponse.json({ error: 'Failed to submit tax return request' }, { status: 500 });
    return NextResponse.json({ ok: true, request: data }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'Tax return request failed');
  }
}
