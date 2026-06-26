// Fixed inquiry route - resilient three-tier retry logic + proper auditing
import { getAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const db = await getAdminClient();

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const nameParts = body.name.trim().split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Inquiry';
    const programId = body.program || body.program_interest || 'general-inquiry';

    // Core insert payload
    const corePayload: Record<string, any> = {
      first_name: firstName,
      last_name: lastName,
      full_name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone || 'N/A',
      city: body.city || 'Not provided',
      zip: body.zip || '00000',
      program_interest: programId,
      status: 'submitted',
      source: 'inquiry_form',
      contact_preference: body.contactPreference || 'email',
      normalized_email: body.email.toLowerCase().trim(),
      normalized_phone: (body.phone || '').replace(/\D/g, ''),
    };

    let { data, error }: any = await db
      .from('applications')
      .insert(corePayload)
      .select('id, email')
      .maybeSingle();

    // Three-tier retry for resilient inserts
    const isRetryableError = (e: any) =>
      e &&
      (e.code === '42703' ||
        e.code === '23514' ||
        e.code === '23502' ||
        e.message?.includes('column') ||
        e.message?.includes('constraint') ||
        e.message?.includes('check') ||
        e.message?.includes('violates'));

    // Tier 2 — strip extended columns
    if (isRetryableError(error)) {
      logger.warn('[api/inquiries] Tier-2 retry — stripping extended columns', {
        code: error.code,
        message: error.message,
      });
      const tier2 = await db
        .from('applications')
        .insert({
          ...corePayload,
          normalized_email: undefined,
          normalized_phone: undefined,
          full_name: undefined,
        })
        .select('id, email')
        .maybeSingle();
      data = tier2.data;
      error = tier2.error;
    }

    // Tier 3 — absolute baseline
    if (isRetryableError(error)) {
      logger.warn('[api/inquiries] Tier-3 retry — baseline columns only', {
        code: error.code,
        message: error.message,
      });
      const tier3 = await db
        .from('applications')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: body.email.toLowerCase().trim(),
          phone: body.phone || 'N/A',
          city: body.city || 'Not provided',
          zip: body.zip || '00000',
          program_interest: programId,
          status: 'submitted',
          source: 'inquiry_form',
          contact_preference: body.contactPreference || 'email',
        })
        .select('id, email')
        .maybeSingle();
      data = tier3.data;
      error = tier3.error;
    }

    if (error || !data) {
      logger.error('[api/inquiries] All insert tiers failed', undefined, {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        email: body.email,
      });
      return NextResponse.json({ 
        error: 'Failed to save inquiry',
        details: error?.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      email: data.email,
      program: programId,
    }, { status: 200 });

  } catch (error) {
    logger.error('[api/inquiries] Unexpected error', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/inquiries', _POST);
