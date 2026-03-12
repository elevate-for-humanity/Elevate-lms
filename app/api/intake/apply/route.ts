import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IntakePayload {
  full_name: string;
  email: string;
  phone?: string;
  program_interest?: string;
  funding_interest?: string;
  state?: string;
  has_indiana_career_connect?: boolean;
  has_workone_appointment?: boolean;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Determine initial pipeline stage based on funding prerequisites */
function determineStage(payload: IntakePayload): string {
  if (!payload.has_indiana_career_connect) return 'needs_icc';
  if (!payload.has_workone_appointment) return 'needs_workone';
  return 'advisor_review';
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = (await request.json()) as IntakePayload;

    // Validation
    if (!body.full_name?.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }
    if (!body.email?.trim() || !isValidEmail(body.email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
    }

    const normalizedEmail = body.email.trim().toLowerCase();
    const stage = determineStage(body);

    // 1. Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        full_name: body.full_name.trim(),
        email: normalizedEmail,
        phone: body.phone?.trim() || null,
        program_interest: body.program_interest || null,
        funding_interest: body.funding_interest || null,
        state: body.state || null,
        source: 'website-start-page',
        status: 'new',
      })
      .select('id')
      .single();

    if (leadError) {
      logger.error('Failed to create lead', leadError);
      return NextResponse.json({ error: 'Failed to save your information.' }, { status: 500 });
    }

    // 2. Create application with pipeline stage
    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({
        lead_id: lead.id,
        full_name: body.full_name.trim(),
        email: normalizedEmail,
        phone: body.phone?.trim() || null,
        program_interest: body.program_interest || null,
        state: body.state || null,
        has_indiana_career_connect: !!body.has_indiana_career_connect,
        has_workone_appointment: !!body.has_workone_appointment,
        intake_stage: stage,
        status: 'submitted',
        source: 'start-page',
      })
      .select('id, public_status_token, intake_stage')
      .single();

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
        program_interest: body.program_interest || 'Not specified',
        stage,
        status_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/status/application?token=${application.public_status_token}`,
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
        program_interest: body.program_interest || 'Not specified',
        funding_interest: body.funding_interest || 'Not specified',
        stage,
        has_icc: body.has_indiana_career_connect ? 'Yes' : 'No',
        has_workone: body.has_workone_appointment ? 'Yes' : 'No',
        application_id: application.id,
      },
      status: 'queued',
      scheduled_for: new Date().toISOString(),
      entity_type: 'application',
      entity_id: application.id,
    });

    // Stage-specific follow-up (delayed 1 hour)
    if (stage === 'needs_icc' || stage === 'needs_workone') {
      notifications.push({
        to_email: normalizedEmail,
        template_key: stage === 'needs_icc' ? 'intake_needs_icc' : 'intake_needs_workone',
        template_data: {
          full_name: body.full_name.trim(),
          status_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/status/application?token=${application.public_status_token}`,
        },
        status: 'queued',
        scheduled_for: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour delay
        entity_type: 'application',
        entity_id: application.id,
      });
    }

    await supabase.from('notification_outbox').insert(notifications).catch((err) => {
      logger.warn('Failed to queue intake notifications', err);
    });

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      statusToken: application.public_status_token,
      stage: application.intake_stage,
    });
  } catch (error) {
    logger.error('Intake application error', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
