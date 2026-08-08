import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(value: unknown, max = 2000): string {
  return String(value ?? '').trim().slice(0, max);
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export async function POST(request: Request) {
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  try {
    const body = await request.json();
    const organizationName = clean(body.organizationName, 255);
    const contactName = clean(body.contactName, 255);
    const email = clean(body.email, 254).toLowerCase();
    const phone = clean(body.phone, 50);
    const website = clean(body.website, 300);
    const programTypes = Array.isArray(body.programTypes)
      ? body.programTypes.map((value: unknown) => clean(value, 100)).filter(Boolean).slice(0, 20)
      : [];
    const notes = clean(body.notes, 4000);

    if (!organizationName || !contactName || !email) {
      return NextResponse.json(
        { ok: false, error: 'Organization name, contact name, and email are required.' },
        { status: 400 },
      );
    }
    if (!validEmail(email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
    }

    const admin = await getAdminClient();
    if (!admin) {
      return NextResponse.json(
        {
          ok: false,
          error: `Program Holder applications are temporarily unavailable. Please call ${PLATFORM_DEFAULTS.supportPhone}.`,
        },
        { status: 503 },
      );
    }

    const { data, error } = await admin
      .from('application_intake')
      .insert({
        application_type: 'program_holder',
        payload: {
          organization_name: organizationName,
          contact_name: contactName,
          email,
          phone,
          website,
          program_types: programTypes,
          notes,
        },
        source: 'public_form',
      })
      .select('id, created_at')
      .maybeSingle();

    if (error || !data?.id) {
      logger.error('[program-holder/apply] intake insert failed', error ?? undefined, {
        email,
        organizationName,
      });
      return NextResponse.json(
        { ok: false, error: 'We could not save the Program Holder application. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        applicationId: data.id,
        referenceNumber: data.id,
        applicationType: 'program_holder',
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error('[program-holder/apply] unexpected error', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { ok: false, error: 'Unable to submit the Program Holder application. Please try again.' },
      { status: 500 },
    );
  }
}
