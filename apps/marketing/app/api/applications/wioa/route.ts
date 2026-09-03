// PUBLIC ROUTE: specialized WIOA intake adapter.
// Canonical application creation/reuse belongs exclusively to /api/applications.
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function buildWioaNotes(body: Record<string, any>, fingerprint: string): string {
  return [
    `=== WIOA INTAKE ===`,
    `WIOA Intake Fingerprint: ${fingerprint}`,
    `Age 18+: ${body.isOver18 ? 'Yes' : 'No'}`,
    `HS Diploma: ${body.hasHighSchoolDiploma ? 'Yes' : 'No'}`,
    `Work Auth: ${body.hasWorkAuthorization ? 'Yes' : 'No'}`,
    `IN Resident: ${body.isIndianaResident ? 'Yes' : 'No'}`,
    `Can Commit: ${body.canCommitToSchedule ? 'Yes' : 'No'}`,
    `DOB: ${body.dateOfBirth || 'Not provided'}`,
    `Race: ${Array.isArray(body.race) ? body.race.join(', ') : 'Not specified'}`,
    `Gender: ${body.gender || 'Not specified'}`,
    `Education: ${body.educationLevel || 'Not specified'}`,
    `Veteran: ${body.isVeteran ? 'Yes' : 'No'}`,
    `Employment: ${body.employmentStatus || 'Not specified'}`,
    `Income: ${body.annualIncome ?? 'Not specified'}`,
    `Dependents: ${body.numberOfDependents ?? 'Not specified'}`,
    `Public Assistance: ${Array.isArray(body.receivesPublicAssistance) ? body.receivesPublicAssistance.join(', ') : 'None'}`,
    `Housing: ${body.housingStatus || 'Not specified'}`,
    `Justice Involvement: ${body.hasJusticeInvolvement ? 'Yes' : 'No'}`,
    `Work Auth Doc: ${body.workAuthDocument || 'Not specified'}`,
    body.documentExpirationDate ? `Expires: ${body.documentExpirationDate}` : '',
    `Barriers: ${Array.isArray(body.barriers) ? body.barriers.join(', ') : 'None'}`,
    body.otherBarrier ? `Other Barrier: ${body.otherBarrier}` : '',
    `Case Manager: ${body.hasCaseManager ? 'Yes' : 'No'}`,
    body.caseManagerAgency ? `Agency: ${body.caseManagerAgency}` : '',
    body.supportNeeds ? `Support Needs: ${body.supportNeeds}` : '',
    `Background Check Consent: ${body.consentBackgroundCheck ? 'Yes' : 'No'}`,
    `Photo/Video Consent: ${body.consentPhotoVideo ? 'Yes' : 'No'}`,
    `Data Sharing Consent: ${body.consentDataSharing ? 'Yes' : 'No'}`,
    `Text Messages Consent: ${body.consentTextMessages ? 'Yes' : 'No'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const body = (await req.json()) as Record<string, any>;
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const program = String(body.program || '').trim();

    if (!firstName || !lastName || !email || !phone || !program) {
      return NextResponse.json({ error: 'Missing required application fields.' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
    const canonicalUrl = new URL('/api/applications', siteUrl);
    const canonicalResponse = await fetch(canonicalUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: canonicalUrl.origin,
        'X-Idempotency-Key': `wioa-${crypto.randomUUID()}`,
      },
      cache: 'no-store',
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        city: body.city || 'Indianapolis',
        zip: body.zip || '',
        program,
        programSlug: body.programSlug || program,
        fundingType: 'wioa',
        fundingSource: 'wioa',
        fundingEligibilityStatus: body.hasWorkOneReferral ? null : 'needs_appointment',
        hasWorkOneReferral: body.hasWorkOneReferral ? 'yes' : 'no',
        workoneIntakeCompleted: body.hasWorkOneReferral ? 'yes' : 'no',
        dateOfBirth: body.dateOfBirth || null,
        employmentStatus: body.employmentStatus || null,
        source: body.source || 'wioa-application',
        preferredContact: body.preferredContact || 'phone',
        hasCaseManager: body.hasCaseManager ? 'yes' : 'no',
        caseManagerAgency: body.caseManagerAgency || null,
        supportNeeds: body.supportNeeds || null,
      }),
    });

    const canonical = (await canonicalResponse.json().catch(() => ({}))) as {
      ok?: boolean;
      id?: string;
      referenceNumber?: string;
      existing?: boolean;
      error?: string;
    };

    if (!canonicalResponse.ok || !canonical.ok || !canonical.id) {
      return NextResponse.json(
        {
          error:
            canonical.error ||
            `Failed to save application. Please call ${PLATFORM_DEFAULTS.supportPhone} for assistance.`,
        },
        { status: canonicalResponse.status || 500 },
      );
    }

    // WIOA owns only its supplemental intake facts. It enriches the canonical
    // application created/reused above; it never creates another application.
    const supabase = await requireAdminClient();
    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        email,
        program,
        dateOfBirth: body.dateOfBirth || null,
        employmentStatus: body.employmentStatus || null,
        annualIncome: body.annualIncome ?? null,
        numberOfDependents: body.numberOfDependents ?? null,
        receivesPublicAssistance: body.receivesPublicAssistance || [],
        barriers: body.barriers || [],
      }))
      .digest('hex')
      .slice(0, 20);
    const wioaNotes = buildWioaNotes(body, fingerprint);

    const { data: current, error: readError } = await supabase
      .from('applications')
      .select('support_notes')
      .eq('id', canonical.id)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: 'Application saved, but WIOA intake details could not be verified.' }, { status: 500 });
    }

    const existingNotes = String(current?.support_notes || '');
    if (!existingNotes.includes(`WIOA Intake Fingerprint: ${fingerprint}`)) {
      const nextNotes = [existingNotes.trim(), wioaNotes].filter(Boolean).join('\n\n');
      const { error: updateError } = await supabase
        .from('applications')
        .update({ support_notes: nextNotes })
        .eq('id', canonical.id);
      if (updateError) {
        return NextResponse.json({ error: 'Application saved, but WIOA intake details could not be attached.' }, { status: 500 });
      }
    }

    return NextResponse.json(
      {
        ok: true,
        id: canonical.id,
        referenceNumber: canonical.referenceNumber,
        existing: Boolean(canonical.existing),
        canonicalAuthority: 'applications',
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/applications/wioa', _POST);
