// PUBLIC ROUTE: Barber Apprenticeship application adapter.
// Canonical application creation/reuse belongs exclusively to /api/applications.
import crypto from 'node:crypto';
import { logger } from '@/lib/logger';

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { DOT_CODES } from '@/lib/compliance/rapids-integration';
import { RAPIDS_CONFIG, getRAPIDSEnrollmentData } from '@/lib/compliance/rapids-config';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const barberApplicationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  dateOfBirth: z.string(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2),
  zipCode: z.string().min(5),
  hasHostShop: z.string(),
  hostShopName: z.string().optional(),
  hostShopAddress: z.string().optional(),
  hostShopContact: z.string().optional(),
  enrolledInBarberSchool: z.string(),
  barberSchoolName: z.string().optional(),
  priorExperience: z.string().optional(),
  program: z.string(),
  programType: z.string(),
  fundingSource: z.string(),
});

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const validated = barberApplicationSchema.parse(await req.json());
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
    const canonicalUrl = new URL('/api/applications', siteUrl);

    const canonicalResponse = await fetch(canonicalUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: canonicalUrl.origin,
        'X-Idempotency-Key': `barber-${crypto.randomUUID()}`,
      },
      cache: 'no-store',
      body: JSON.stringify({
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        phone: validated.phone,
        dateOfBirth: validated.dateOfBirth,
        address: validated.address,
        city: validated.city,
        state: validated.state,
        zip: validated.zipCode,
        program: 'barber-apprenticeship',
        programSlug: 'barber-apprenticeship',
        fundingType: validated.fundingSource || 'self-pay',
        fundingSource: validated.fundingSource || 'self-pay',
        hasHostShop: validated.hasHostShop,
        hostShopName: validated.hostShopName || null,
        source: 'barber-apply-form',
        preferredContact: 'phone',
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
            `Failed to submit application. Please call ${PLATFORM_DEFAULTS.supportPhone}.`,
        },
        { status: canonicalResponse.status || 500 },
      );
    }

    const supabase = await requireAdminClient();

    // Barber-specific intake facts enrich the same canonical application.
    // They never create a second application or alter authorized approval state.
    const detailFingerprint = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          applicationId: canonical.id,
          hasHostShop: validated.hasHostShop,
          hostShopName: validated.hostShopName || null,
          hostShopAddress: validated.hostShopAddress || null,
          hostShopContact: validated.hostShopContact || null,
          enrolledInBarberSchool: validated.enrolledInBarberSchool,
          barberSchoolName: validated.barberSchoolName || null,
          priorExperience: validated.priorExperience || null,
        }),
      )
      .digest('hex')
      .slice(0, 20);

    const { data: application, error: readError } = await supabase
      .from('applications')
      .select('id, support_notes, eligibility_data')
      .eq('id', canonical.id)
      .maybeSingle();

    if (readError || !application) {
      return NextResponse.json(
        { error: 'Application saved, but Barber Apprenticeship details could not be verified.' },
        { status: 500 },
      );
    }

    const marker = `Barber Intake Fingerprint: ${detailFingerprint}`;
    const supportNotes = String(application.support_notes || '');
    if (!supportNotes.includes(marker)) {
      const barberNotes = [
        marker,
        'Program type: apprenticeship',
        `Host shop: ${validated.hasHostShop}`,
        validated.hostShopName ? `Shop name: ${validated.hostShopName}` : '',
        validated.hostShopAddress ? `Shop address: ${validated.hostShopAddress}` : '',
        validated.hostShopContact ? `Shop contact: ${validated.hostShopContact}` : '',
        `Enrolled in barber school: ${validated.enrolledInBarberSchool}`,
        validated.barberSchoolName ? `School: ${validated.barberSchoolName}` : '',
        validated.priorExperience ? `Prior experience: ${validated.priorExperience}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const eligibilityData = {
        ...(application.eligibility_data && typeof application.eligibility_data === 'object'
          ? application.eligibility_data
          : {}),
        date_of_birth: validated.dateOfBirth,
        address: validated.address,
        state: validated.state,
        host_shop: {
          has_host_shop: validated.hasHostShop,
          name: validated.hostShopName || null,
          address: validated.hostShopAddress || null,
          contact: validated.hostShopContact || null,
        },
        prior_training: {
          enrolled_in_barber_school: validated.enrolledInBarberSchool,
          school_name: validated.barberSchoolName || null,
          prior_experience: validated.priorExperience || null,
        },
      };

      const { error: updateError } = await supabase
        .from('applications')
        .update({
          support_notes: [supportNotes.trim(), barberNotes].filter(Boolean).join('\n\n'),
          eligibility_data: eligibilityData,
        })
        .eq('id', canonical.id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Application saved, but Barber Apprenticeship details could not be attached.' },
          { status: 500 },
        );
      }
    }

    // RAPIDS preregistration is Barber-specific and remains a specialized
    // post-application action. Reuse an existing preregistration if one exists.
    const rapidsEnrollmentData = getRAPIDSEnrollmentData('barber-apprenticeship');
    const { data: existingRapids } = await supabase
      .from('rapids_registrations')
      .select('id, program_number')
      .eq('application_id', canonical.id)
      .eq('program_number', RAPIDS_CONFIG.programNumber)
      .limit(1)
      .maybeSingle();

    if (!existingRapids) {
      const { error: rapidsError } = await supabase.from('rapids_registrations').insert({
        application_id: canonical.id,
        program_number: RAPIDS_CONFIG.programNumber,
        sponsor_name: RAPIDS_CONFIG.sponsorOfRecord,
        occupation_code: DOT_CODES.BARBER,
        occupation_title: 'Barber',
        status: 'submitted',
        created_at: new Date().toISOString(),
        ...(rapidsEnrollmentData || {}),
      });
      if (rapidsError) {
        logger.error('[barber/apply] RAPIDS preregistration failed', {
          applicationId: canonical.id,
          message: rapidsError.message,
        });
      }
    }

    if (!canonical.existing) {
      await auditLog({
        actorId: canonical.id,
        actorRole: 'student',
        action: AuditAction.CASE_CREATED,
        entity: AuditEntity.APPLICATION,
        entityId: canonical.id,
        metadata: {
          program: 'barber-apprenticeship',
          email: validated.email,
          fundingSource: validated.fundingSource || 'self-pay',
          rapidsProgram: RAPIDS_CONFIG.programNumber,
          canonicalAuthority: 'applications',
        },
      });
    }

    // Do not send a separate Barber "onboarding" email here. The canonical
    // application authority already sends the correct application/account next
    // steps, while enrollment onboarding is gated by authorized approval.
    return NextResponse.json({
      success: true,
      applicationId: canonical.id,
      referenceNumber: canonical.referenceNumber,
      existing: Boolean(canonical.existing),
      canonicalAuthority: 'applications',
      rapidsPreRegistration: existingRapids?.program_number || RAPIDS_CONFIG.programNumber,
      message: canonical.existing
        ? 'Your existing Barber Apprenticeship application is still active.'
        : 'Application submitted. Continue with the next required step shown in your application status.',
    });
  } catch (err: any) {
    logger.error('Barber application error:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid Barber Apprenticeship application.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
