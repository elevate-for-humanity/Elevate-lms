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

    const safeCompany = escapeHtml(companyName);
    const safeName = escapeHtml(contactName);
    const safeEmail = escapeHtml(email);
    const safeRef = escapeHtml(data.id);
    const notifications = await notifyApplicationSubmission({
      db: admin,
      applicationId: data.id,
      applicationType: 'employer',
      applicantName: contactName,
      applicantEmail: email,
      applicantSubject: 'Employer Partnership Application Received | Elevate for Humanity',
      applicantHtml: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h2>Employer Partnership Application Received</h2><p>Hello ${safeName},</p><p>We received the employer partnership application for <strong>${safeCompany}</strong>.</p><p><strong>Reference:</strong> ${safeRef}</p><h3>What happens next</h3><ol><li>Our workforce team reviews your hiring, OJT, WEX, apprenticeship, and training needs.</li><li>If additional employer verification or agreements are needed, we will send the exact next step.</li><li>Once the partnership is approved, your employer/partner portal access and onboarding instructions will be issued to <strong>${safeEmail}</strong>.</li></ol><p>You do not need to submit another application. Questions? Call ${PLATFORM_DEFAULTS.supportPhone}.</p></div>`,
      staffSubject: `[EMPLOYER APPLICATION] ${companyName}`,
      staffHtml: `<h2>New Employer Partnership Application</h2><p><strong>${safeCompany}</strong><br>${safeName}<br>${safeEmail}<br>${escapeHtml(phone || 'No phone')}</p><p><strong>Reference:</strong> ${safeRef}</p><p><strong>Industry:</strong> ${escapeHtml(industry || 'Not provided')}</p><p><strong>Hiring/workforce needs:</strong> ${escapeHtml(hiringNeeds || 'Not provided')}</p><p>Review the application and initiate employer onboarding when approved.</p>`,
      metadata: { company_name: companyName, industry },
    });

    return NextResponse.json(
      {
        ok: true,
        applicationId: data.id,
        referenceNumber: data.id,
        applicationType: 'employer',
        notificationStatus: notifications,
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
