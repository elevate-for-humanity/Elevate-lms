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

    const safeOrganization = escapeHtml(organizationName);
    const safeName = escapeHtml(contactName);
    const safeEmail = escapeHtml(email);
    const safeRef = escapeHtml(data.id);
    const safePrograms = programTypes.length ? programTypes.map(escapeHtml).join(', ') : 'Not specified';
    const notifications = await notifyApplicationSubmission({
      db: admin,
      applicationId: data.id,
      applicationType: 'program_holder',
      applicantName: contactName,
      applicantEmail: email,
      applicantSubject: 'Program Holder Application Received | Elevate for Humanity',
      applicantHtml: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h2>Program Holder Application Received</h2><p>Hello ${safeName},</p><p>We received the Program Holder application for <strong>${safeOrganization}</strong>.</p><p><strong>Reference:</strong> ${safeRef}</p><p><strong>Programs/services listed:</strong> ${safePrograms}</p><h3>What happens next</h3><ol><li>Elevate reviews organizational eligibility, program scope, required credentials, and operating documents.</li><li>If documents or an agreement are required, we will send a specific checklist.</li><li>After approval, portal access and Program Holder onboarding instructions will be issued to <strong>${safeEmail}</strong>.</li><li>Approved Program Holders can then manage authorized programs, documents, participants, and reporting from the partner portal.</li></ol><p>You do not need to submit another application. Questions? Call ${PLATFORM_DEFAULTS.supportPhone}.</p></div>`,
      staffSubject: `[PROGRAM HOLDER APPLICATION] ${organizationName}`,
      staffHtml: `<h2>New Program Holder Application</h2><p><strong>${safeOrganization}</strong><br>${safeName}<br>${safeEmail}<br>${escapeHtml(phone || 'No phone')}</p><p><strong>Reference:</strong> ${safeRef}</p><p><strong>Program types:</strong> ${safePrograms}</p><p><strong>Website:</strong> ${escapeHtml(website || 'Not provided')}</p><p>Review eligibility/documents and initiate Program Holder onboarding when approved.</p>`,
      metadata: { organization_name: organizationName, program_types: programTypes },
    });

    return NextResponse.json(
      {
        ok: true,
        applicationId: data.id,
        referenceNumber: data.id,
        applicationType: 'program_holder',
        notificationStatus: notifications,
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
