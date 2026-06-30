import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

// PUBLIC ROUTE: tax appointment request form.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;
  const body = await request.json().catch(() => null) as { name?: string; email?: string; phone?: string; preferred_time?: string; notes?: string } | null;
  if (!body?.name || !body?.email) return safeError('name and email are required', 400);
  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);
    const { data, error } = await db.from('leads').insert({
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      source: 'tax_appointment',
      status: 'new',
      notes: [body.preferred_time, body.notes].filter(Boolean).join('\n') || null,
      created_at: new Date().toISOString(),
    }).select('id').maybeSingle();
    if (error) return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 });
    return NextResponse.json({ ok: true, appointment_request_id: data?.id ?? null }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'Tax appointment request failed');
  }
}
