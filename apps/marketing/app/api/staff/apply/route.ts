import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { notifyApplicationSubmission } from '@/lib/applications/submission-notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(value: unknown, max = 2000): string {
  return String(value ?? '').trim().slice(0, max);
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export async function POST(request: Request) {
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  try {
    const body = await request.json();
    const firstName = clean(body.firstName, 120);
    const lastName = clean(body.lastName, 120);
    const email = clean(body.email, 254).toLowerCase();
    const phone = clean(body.phone, 50);
    const position = clean(body.position, 120) || 'general';
    const city = clean(body.city, 120);
    const experience = clean(body.experience, 5000);
    const resume = clean(body.resume, 2000);

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ ok: false, error: 'First name, last name, and email are required.' }, { status: 400 });
    }
    if (!validEmail(email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
    }

    const db = await getAdminClient();
    if (!db) {
      return NextResponse.json({ ok: false, error: `Staff applications are temporarily unavailable. Please call ${PLATFORM_DEFAULTS.supportPhone}.` }, { status: 503 });
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const { data, error } = await db
      .from('application_intake')
      .insert({
        application_type: 'staff',
        source: 'public_form',
        payload: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          email,
          phone,
          position,
          city,
          experience,
          resume,
        },
      })
      .select('id, created_at')
      .maybeSingle();

    if (error || !data?.id) {
      logger.error('[staff/apply] intake insert failed', error ?? undefined, { email, position });
      return NextResponse.json({ ok: false, error: 'We could not save the staff application. Please try again.' }, { status: 500 });
    }

    const safeName = escapeHtml(fullName);
    const safeEmail = escapeHtml(email);
    const safePosition = escapeHtml(position);
    const safeRef = escapeHtml(data.id);
    const notifications = await notifyApplicationSubmission({
      db,
      applicationId: data.id,
      applicationType: 'staff',
      applicantName: fullName,
      applicantEmail: email,
      applicantSubject: 'Employment Application Received | Elevate for Humanity',
      applicantHtml: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h2>Employment Application Received</h2><p>Hello ${safeName},</p><p>We received your application for <strong>${safePosition}</strong>.</p><p><strong>Reference:</strong> ${safeRef}</p><h3>What happens next</h3><ol><li>Our team reviews your experience and the current staffing need.</li><li>If selected for the next stage, we will contact you about an interview and any required credentials/background documentation.</li><li>Staff portal access is only issued after a hiring/authorization decision; no login is required while your application is under review.</li></ol><p>You do not need to submit another application. Questions? Call ${PLATFORM_DEFAULTS.supportPhone}.</p></div>`,
      staffSubject: `[STAFF APPLICATION] ${fullName} — ${position}`,
      staffHtml: `<h2>New Staff Application</h2><p><strong>${safeName}</strong><br>${safeEmail}<br>${escapeHtml(phone || 'No phone')}</p><p><strong>Position:</strong> ${safePosition}</p><p><strong>Reference:</strong> ${safeRef}</p><p><strong>Experience:</strong> ${escapeHtml(experience || 'Not provided')}</p><p>Review and move the applicant to the hiring/onboarding process if selected.</p>`,
      metadata: { position, city },
    });

    return NextResponse.json({
      ok: true,
      applicationId: data.id,
      referenceNumber: data.id,
      applicationType: 'staff',
      notificationStatus: notifications,
    }, { status: 201 });
  } catch (error) {
    logger.error('[staff/apply] unexpected error', error instanceof Error ? error : undefined);
    return NextResponse.json({ ok: false, error: 'Unable to submit the staff application. Please try again.' }, { status: 500 });
  }
}
