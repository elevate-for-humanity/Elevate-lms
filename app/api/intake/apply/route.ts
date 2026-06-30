// PUBLIC ROUTE: public intake apply form
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { normalizeProgramInterest } from '@/lib/intake/normalize-program-interest';
import { resolveZip } from '@/lib/intake/normalize-zip';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { isValidEmail } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IntakePayload {
  full_name: string;
  email: string;
  phone?: string;
  program_interest?: string;
  funding_interest?: string;
  state?: string;
  is_indiana_resident?: boolean;
  // Legacy fields — kept for backwards compat with any existing callers
  has_indiana_career_connect?: boolean;
  has_workone_appointment?: boolean;
  zip?: string;
  zipcode?: string;
  zipCode?: string;
  zip_code?: string;
  postal_code?: string;
  postalCode?: string;
}

/**
 * Determine initial pipeline stage.
 * Indiana residents go to advisor_review — they qualify for WIOA/WRG funding.
 * Out-of-state leads go to self_pay_path — no workforce funding available.
 */
function determineStage(payload: IntakePayload): string {
  if (payload.is_indiana_resident === false) return 'self_pay_path';
  return 'advisor_review';
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const body = (await request.json()) as IntakePayload;

    // Validation
    if (!body.full_name?.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }
    if (!body.email?.trim() || !isValidEmail(body.email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    const supabase = await requireAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
    }

    const normalizedEmail = body.email.trim().toLowerCase();
    const programInterest = normalizeProgramInterest(body.program_interest);
    const stage = determineStage(body);
    const zipCode = resolveZip([
      body.zip,
      body.zipcode,
      body.zipCode,
      body.zip_code,
      body.postal_code,
      body.postalCode,
    ]);

    // Dedup: block same email + program within 24 hours.
    // Prevents double-submissions from network retries or impatient re-submits.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentApp } = await supabase
      .from('applications')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('program_interest', programInterest || '')
      .gte('created_at', oneDayAgo)
      .maybeSingle();

    if (recentApp) {
      return NextResponse.json(
        { error: 'An application for this program was already submitted recently. Please wait 24 hours before reapplying.' },
        { status: 409 },
      );
    }

    // 1. Create lead
    // Split full_name for NOT NULL first_name / last_name columns on leads table
    const leadNameParts = body.full_name.trim().split(' ');
    const leadFirstName = leadNameParts[0] || body.full_name.trim();
    const leadLastName = leadNameParts.slice(1).join(' ') || '';

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        full_name: body.full_name.trim(),
        first_name: leadFirstName,
        last_name: leadLastName,
        email: normalizedEmail,
        phone: body.phone?.trim() || null,
        program_interest: programInterest || null,
        funding_interest: body.funding_interest || null,
        state: body.state || null,
        source: 'website-start-page',
        status: 'new',
      })
      .select('id')
      .maybeSingle();

    if (leadError) {
      logger.error('Failed to create lead', leadError);
      return NextResponse.json({ error: 'Failed to save your information.' }, { status: 500 });
    }

    // 2. Create application with pipeline stage
    const intakeRef = `EFH-${Date.now().toString(36).toUpperCase()}`;
    // Split full_name into first/last for NOT NULL columns
    const nameParts = body.full_name.trim().split(' ');
    const intakeFirstName = nameParts[0] || '';
    const intakeLastName = nameParts.slice(1).join(' ') || '';

    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({
        first_name: intakeFirstName,
        last_name: intakeLastName,
        email: normalizedEmail,
        normalized_email: normalizedEmail,
        normalized_phone: (body.phone?.trim() || '').replace(/\D/g, '') || null,
        phone: body.phone?.trim() || '',
        city: 'Not provided',
        zip: zipCode,
        program_interest: programInterest || null,
        reference_number: intakeRef,
        status: 'submitted',
        source: 'start-page',
        type: 'student',
        funding_type: body.funding_interest || null,
        // intake flags and stage stored in eligibility_data (JSONB)
        eligibility_data: {
          lead_id: lead.id,
          state: body.state || null,
          is_indiana_resident: !!body.is_indiana_resident,
          intake_stage: stage,
        },
      })
      .select('id, public_status_token')
      .maybeSingle();

    if (appError) {
      logger.error('Failed to create application', appError);
      return NextResponse.json({ error: 'Failed to create application.' }, { status: 500 });
    }

    // 3. Queue notifications via outbox
    const notifications = [];

    // Applicant confirmation
    notifications.push({
      to_email: normalizedEmail,
      template_key: 'intake_confirmation',
      template_data: {
        full_name: body.full_name.trim(),
          program_interest: programInterest || 'Not specified',
        stage,
        status_url: `${process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl}/status/application?token=${application.public_status_token}`,
      },
      status: 'queued',
      scheduled_for: new Date().toISOString(),
      entity_type: 'application',
      entity_id: application.id,
    });

    // Advisor notification
    notifications.push({
      to_email: 'elevate4humanityedu@gmail.com',
      template_key: 'intake_advisor_alert',
      template_data: {
        full_name: body.full_name.trim(),
        email: normalizedEmail,
        phone: body.phone?.trim() || 'Not provided',
          program_interest: programInterest || 'Not specified',
        funding_interest: body.funding_interest || 'Not specified',
        stage,
        is_indiana_resident: body.is_indiana_resident ? 'Yes' : 'No',
        application_id: application.id,
      },
      status: 'queued',
      scheduled_for: new Date().toISOString(),
      entity_type: 'application',
      entity_id: application.id,
    });

    // Out-of-state follow-up — direct to self-pay options (delayed 1 hour)
    if (stage === 'self_pay_path') {
      notifications.push({
        to_email: normalizedEmail,
        template_key: 'intake_self_pay_options',
        template_data: {
          full_name: body.full_name.trim(),
          status_url: `${process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl}/status/application?token=${application.public_status_token}`,
        },
        status: 'queued',
        scheduled_for: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        entity_type: 'application',
        entity_id: application.id,
      });
    }

    await Promise.resolve(
      supabase
        .from('notification_outbox')
        .insert(notifications)
    ).catch((err) => {
      logger.warn('Failed to queue intake notifications', err);
    });

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      statusToken: application.public_status_token,
      stage: stage,
    });
  } catch (error) {
    logger.error('Intake application error', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
