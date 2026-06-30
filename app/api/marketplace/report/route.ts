import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

// PUBLIC ROUTE: marketplace abuse/report form.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;
  const body = await request.json().catch(() => null) as { product_id?: string; reason?: string; email?: string; details?: string } | null;
  if (!body?.reason) return safeError('reason is required', 400);
  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);
    const { data, error } = await db.from('marketplace_reports').insert({
      product_id: body.product_id ?? null,
      reason: body.reason,
      reporter_email: body.email ?? null,
      details: body.details ?? null,
      status: 'new',
      created_at: new Date().toISOString(),
    }).select('id').maybeSingle();
    if (error) return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    return NextResponse.json({ ok: true, report_id: data?.id ?? null }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'Marketplace report failed');
  }
}
