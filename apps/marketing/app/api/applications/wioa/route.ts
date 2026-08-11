// PUBLIC ROUTE: WIOA program application — public intake
import { NextResponse } from 'next/server';

import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { notifyApplicationSubmission } from '@/lib/applications/submission-notifications';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const supabase = await requireAdminClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
    }

    const referenceNumber = `EFH-${Date.now().toString(36).toUpperCase()}`;
    const notes = [
      `Reference: ${referenceNumber}`,
      `\n=== ELIGIBILITY ===`,
      `Age 18+: ${body.isOver18 ? 'Yes' : 'No'}`,
      `HS Diploma: ${body.hasHighSchoolDiploma ? 'Yes' : 'No'}`,
      `Work Auth: ${body.hasWorkAuthorization ? 'Yes' : 'No'}`,
      `IN Resident: ${body.isIndianaResident ? 'Yes' : 'No'}`,
      `Can Commit: ${body.canCommitToSchedule ? 'Yes' : 'No'}`,
      `\n=== DEMOGRAPHICS ===`,
      `DOB: ${body.dateOfBirth}`,
      `Race: ${Array.isArray(body.race) ? body.race.join(', ') : 'Not specified'}`,
      `Gender: ${body.gender}`,
      `Education: ${body.educationLevel}`,
      `Veteran: ${body.isVeteran ? 'Yes' : 'No'}`,
      `\n=== WIOA ELIGIBILITY ===`,
      `Employment: ${body.employmentStatus}`,
      `Income: ${body.annualIncome}`,
      `Dependents: ${body.numberOfDependents}`,
      `Public Assistance: ${Array.isArray(body.receivesPublicAssistance) ? body.receivesPublicAssistance.join(', ') : 'None'}`,
      `Housing: ${body.housingStatus}`,
      `Justice Involvement: ${body.hasJusticeInvolvement ? 'Yes' : 'No'}`,
      `\n=== AUTHORIZATION ===`,
      `Work Auth Doc: ${body.workAuthDocument}`,
      body.documentExpirationDate ? `Expires: ${body.documentExpirationDate}` : '',
      `Barriers: ${Array.isArray(body.barriers) ? body.barriers.join(', ') : 'None'}`,
      body.otherBarrier ? `Other Barrier: ${body.otherBarrier}` : '',
      `Case Manager: ${body.hasCaseManager ? 'Yes' : 'No'}`,
      body.caseManagerAgency ? `Agency: ${body.caseManagerAgency}` : '',
      body.supportNeeds ? `Support Needs: ${body.supportNeeds}` : '',
      `\n=== CONSENTS ===`,
      `Background Check: ${body.consentBackgroundCheck ? 'Yes' : 'No'}`,
      `Photo/Video: ${body.consentPhotoVideo ? 'Yes' : 'No'}`,
      `Data Sharing: ${body.consentDataSharing ? 'Yes' : 'No'}`,
      `Text Messages: ${body.consentTextMessages ? 'Yes' : 'No'}`,
    ]
      .filter(Boolean)
      .join('\n');

    const { data, error }: any = await supabase
      .from('applications')
      .insert({
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone || '',
        city: body.city || 'Indianapolis',
        zip: body.zip || '00000',
        program_interest: body.program || 'Not specified',
        status: 'submitted',
        support_notes: notes,
      })
      .select()
      .maybeSingle();

    if (error || !data?.id) {
      return NextResponse.json(
        {
          error: `Failed to save application. Please call ${PLATFORM_DEFAULTS.supportPhone} for assistance.`,
          details: process.env.NODE_ENV === 'development' ? 'Internal server error' : undefined,
        },
        { status: 500 },
      );
    }

    const applicantName = `${String(body.firstName || '').trim()} ${String(body.lastName || '').trim()}`.trim();
    const applicantEmail = String(body.email || '').trim().toLowerCase();
    const safeFirst = escapeHtml(body.firstName);
    const safeName = escapeHtml(applicantName);
    const safeEmail = escapeHtml(applicantEmail);
    const safeProgram = escapeHtml(body.program || 'your selected program');
    const safeReference = escapeHtml(referenceNumber);

    const notifications = await notifyApplicationSubmission({
      db: supabase,
      applicationId: data.id,
      applicationType: 'wioa',
      applicantName,
      applicantEmail,
      applicantSubject: `WIOA Application Received [${referenceNumber}] | ${PLATFORM_DEFAULTS.orgName}`,
      applicantHtml: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto"><h2>WIOA Application Received</h2><p>Hi ${safeFirst},</p><p>We received your WIOA/funding application for <strong>${safeProgram}</strong>.</p><p><strong>Reference:</strong> ${safeReference}</p><h3>What happens next</h3><ol><li>Elevate reviews the application for completeness and funding-readiness.</li><li>A workforce advisor verifies WIOA eligibility and identifies any WorkOne documentation still needed.</li><li>You receive the exact next step for orientation, funding verification, or self-pay options as applicable.</li><li>Program portal/enrollment access is activated when the enrollment/funding requirements for your training path are satisfied.</li></ol><p>You do not need to submit another application. Questions? Call ${PLATFORM_DEFAULTS.supportPhone}.</p></div>`,
      staffSubject: `New WIOA Application [${referenceNumber}]: ${applicantName}`,
      staffHtml: `<h2>New WIOA Application Received</h2><p><strong>Reference:</strong> ${safeReference}</p><p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Phone:</strong> ${escapeHtml(body.phone)}</p><p><strong>Program:</strong> ${safeProgram}</p><p><strong>Location:</strong> ${escapeHtml(body.city)}, ${escapeHtml(body.zip)}</p><p><strong>Income:</strong> ${escapeHtml(body.annualIncome)}</p><p><strong>Employment:</strong> ${escapeHtml(body.employmentStatus)}</p><p><strong>Public Assistance:</strong> ${escapeHtml(Array.isArray(body.receivesPublicAssistance) ? body.receivesPublicAssistance.join(', ') : 'None')}</p><p><strong>Justice Involvement:</strong> ${body.hasJusticeInvolvement ? 'Yes' : 'No'}</p><p><strong>Barriers:</strong> ${escapeHtml(Array.isArray(body.barriers) ? body.barriers.join(', ') : 'None')}</p><p>Review in the Admin application queue and assign the appropriate funding/onboarding next action.</p>`,
      metadata: { reference_number: referenceNumber, program: body.program || null },
    });

    return NextResponse.json(
      {
        ok: true,
        id: data.id,
        referenceNumber,
        notificationStatus: notifications,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/applications/wioa', _POST);
