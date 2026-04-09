import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Standalone lead capture for campaigns, landing pages, and partner referrals.
 * Lighter than the full intake — just name, email, and optional context.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json();

    const full_name = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();

    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required.' },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    const supabase = await getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
    }

    const { error } = await supabase.from('leads').insert({
      full_name,
      email,
      phone: body.phone ? String(body.phone).trim() : null,
      program_interest: body.program_interest ? String(body.program_interest).trim() : null,
      funding_interest: body.funding_interest ? String(body.funding_interest).trim() : null,
      state: body.state ? String(body.state).trim() : null,
      source: body.source ? String(body.source).trim() : 'website',
      status: 'new',
    });

    if (error) {
      logger.error('Failed to create lead', error);
      return NextResponse.json({ error: 'Failed to save lead.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
