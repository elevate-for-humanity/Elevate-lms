import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const { full_name, email, phone, preferred_start_date, city_state, employed_in_healthcare } = body;

  if (!full_name || !email || !phone || !preferred_start_date || !city_state) {
    return safeError('Missing required fields', 400);
  }

  const db = createAdminClient();
  const { error } = await db.from('cna_waitlist').insert({
    full_name,
    email,
    phone,
    program_of_interest: 'CNA Certification',
    preferred_start_date,
    city_state,
    employed_in_healthcare: employed_in_healthcare || null,
    submitted_at: new Date().toISOString(),
  });

  if (error) return safeInternalError(error, 'Failed to save waitlist entry');

  return NextResponse.json({ success: true }, { status: 201 });
}
