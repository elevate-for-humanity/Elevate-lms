import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/sendgrid';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BUSINESS_TYPE_MAP: Record<string, string> = {
  barbershop: 'barbershop',
  salon: 'salon',
  esthetics_spa: 'esthetics_studio',
  nail_salon: 'nail_studio',
  mobile: 'other',
  other: 'other',
};

function clean(value: unknown, max = 500): string {
  return String(value ?? '').trim().slice(0, max);
}

function normalizeEmail(value: unknown): string {
  return clean(value, 254).toLowerCase();
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  try {
    const body = await request.json();
    const businessName = clean(body.businessName, 255);
    const contactName = clean(body.contactName, 255);
    const email = normalizeEmail(body.email);
    const phone = clean(body.phone, 50);
    const city = clean(body.city, 120);
    const state = clean(body.state || 'Indiana', 80);
    const licenseNumber = clean(body.licenseNumber, 100);
    const programs = Array.isArray(body.programs)
      ? body.programs.map((p: unknown) => clean(p, 80)).filter(Boolean).slice(0, 10)
      : [];

    if (!businessName || !contactName || !email || !phone || !city || programs.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Business name, contact name, email, phone, city, and at least one program are required.' },
        { status: 400 },
      );
    }
    if (!validEmail(email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
    }

    const admin = await getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: `Applications are temporarily unavailable. Please call ${PLATFORM_DEFAULTS.supportPhone}.` },
        { status: 503 },
      );
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await admin
      .from('host_shop_applications')
      .select('id')
      .eq('contact_email', email)
      .gte('created_at', oneDayAgo)
      .limit(1)
      .maybeSingle();

    if (recent) {
      return NextResponse.json(
        { ok: false, error: 'A host shop application from this email was already received in the last 24 hours.' },
        { status: 409 },
      );
    }

    const businessType = BUSINESS_TYPE_MAP[clean(body.industryType, 50)] || 'other';
    const notes = [
      `Programs requested: ${programs.join(', ')}`,
      body.yearsInBusiness ? `Years in business: ${clean(body.yearsInBusiness, 20)}` : '',
      body.numberOfChairs ? `Number of chairs/workstations: ${clean(body.numberOfChairs, 20)}` : '',
      body.hasInsurance ? `Liability insurance: ${clean(body.hasInsurance, 40)}` : '',
      body.howHeard ? `How heard: ${clean(body.howHeard, 80)}` : '',
      body.message ? `Applicant notes: ${clean(body.message, 2000)}` : '',
    ].filter(Boolean).join('\n');

    const { data, error } = await admin
      .from('host_shop_applications')
      .insert({
        status: 'pending_review',
        fee_status: 'pending',
        fee_amount_cents: 0,
        business_name: businessName,
        business_type: businessType,
        license_number: licenseNumber || null,
        address: [city, state].filter(Boolean).join(', '),
        contact_name: contactName,
        contact_email: email,
        contact_phone: phone,
        partner_tier: 'free',
        internal_notes: notes || null,
      })
      .select('id')
      .maybeSingle();

    if (error || !data?.id) {
      logger.error('[host-shop/apply] insert failed', error ?? undefined, { email, businessName });
      return NextResponse.json(
        { ok: false, error: `We could not save the application. Please call ${PLATFORM_DEFAULTS.supportPhone}.` },
        { status: 500 },
      );
    }

    const applicantEmail = sendEmail({
      to: email,
      subject: 'Host Shop Application Received | Elevate for Humanity',
      html: `<p>Hello ${contactName},</p><p>We received the host shop application for <strong>${businessName}</strong>.</p><p>Reference: <strong>${data.id}</strong></p><p>Our team will review the business, licensing, supervision, and program fit before approval.</p>`,
    });
    const adminEmail = sendEmail({
      to: process.env.PARTNER_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com',
      subject: `[HOST SHOP APPLICATION] ${businessName}`,
      html: `<p>New host shop application.</p><p><strong>${businessName}</strong><br>${contactName}<br>${email}<br>${phone}</p><p>Programs: ${programs.join(', ')}</p><p>Reference: ${data.id}</p>`,
    });
    await Promise.allSettled([applicantEmail, adminEmail]);

    return NextResponse.json({ ok: true, applicationId: data.id }, { status: 201 });
  } catch (error) {
    logger.error('[host-shop/apply] unexpected error', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { ok: false, error: 'Unable to submit the host shop application. Please try again.' },
      { status: 500 },
    );
  }
}
