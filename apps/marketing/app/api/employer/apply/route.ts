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
    const companyName = clean(body.companyName, 255);
    const contactName = clean(body.contactName, 255);
    const email = clean(body.email, 254).toLowerCase();
    const phone = clean(body.phone, 50);
    const industry = clean(body.industry, 120);
    const employeeCount = clean(body.employeeCount, 50);
    const hiringNeeds = clean(body.hiringNeeds || body.interestedIn, 1500);
    const notes = clean(body.notes, 2000);

    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { ok: false, error: 'Company name, contact name, and email are required.' },
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
          error: `Employer applications are temporarily unavailable. Please call ${PLATFORM_DEFAULTS.supportPhone}.`,
        },
        { status: 503 },
      );
    }

    const payload = {
      company_name: companyName,
      contact_name: contactName,
      email,
      phone,
      industry,
      employee_count: employeeCount,
      hiring_needs: hiringNeeds,
      notes,
    };

    const { data, error } = await admin
      .from('application_intake')
      .insert({
        application_type: 'employer',
        payload,
        source: 'public_form',
      })
      .select('id, created_at')
      .maybeSingle();

    if (error || !data?.id) {
      logger.error('[employer/apply] intake insert failed', error ?? undefined, { email, companyName });
      return NextResponse.json(
        { ok: false, error: 'We could not save the employer application. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        applicationId: data.id,
        referenceNumber: data.id,
        applicationType: 'employer',
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error('[employer/apply] unexpected error', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { ok: false, error: 'Unable to submit the employer application. Please try again.' },
      { status: 500 },
    );
  }
}
