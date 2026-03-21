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

  const notes = [
    `Preferred start: ${preferred_start_date}`,
    `Location: ${city_state}`,
    employed_in_healthcare ? `Currently in healthcare: ${employed_in_healthcare}` : null,
  ].filter(Boolean).join(' | ');

  const db = createAdminClient();
  const { error } = await db.from('waitlist').insert({
    name: full_name,
    email,
    phone,
    program: 'cna-certification',
    program_slug: 'cna-certification',
    status: 'waiting',
    notes,
  });

  if (error) return safeInternalError(error, 'Failed to save waitlist entry');

  return NextResponse.json({ success: true }, { status: 201 });
}
