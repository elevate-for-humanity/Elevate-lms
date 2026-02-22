import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

// app/api/webhooks/partners/[partner]/route.ts
// Webhook endpoint for partner progress updates

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPartnerClient, PartnerType, WebhookPayload } from '@/lib/partners';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ partner: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { partner: partnerName } = await params;
  const partner = partnerName as PartnerType;

  const supabase = getSupabaseClient();

  try {
    // Get webhook secret from headers
    const providedSecret = request.headers.get('x-webhook-secret') || '';
    const rawBody = await request.text();

    // Verify webhook secret
    const webhookSecret = process.env.PARTNER_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      logger.error(`[Webhook] PARTNER_WEBHOOK_SECRET not configured`);
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    if (providedSecret !== webhookSecret) {
      logger.error(`[Webhook] Invalid secret for ${partner}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook payload
    const payload: WebhookPayload = JSON.parse(rawBody);

    logger.info({
      event: payload.event,
      timestamp: payload.timestamp,
    });

    // Process webhook based on event type
    switch (payload.event) {
      case 'enrollment.created':
        await handleEnrollmentCreated(partner, payload.data);
        break;

      case 'progress.updated':
        await handleProgressUpdated(partner, payload.data);
        break;

      case 'course.completed':
        await handleCourseCompleted(partner, payload.data);
        break;

      case 'certificate.issued':
        await handleCertificateIssued(partner, payload.data);
        break;

      default:
        logger.warn(`[Webhook] Unknown event type: ${payload.event}`);
    }

    // Process webhook through partner-specific handler
    const client = getPartnerClient(partner);
    await client.processWebhook(payload);

    return NextResponse.json({ success: true });
  } catch (error) { 
    logger.error(
      `[Webhook] Error processing ${partner} webhook:`,
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleEnrollmentCreated(
  partner: PartnerType,
  data: Record<string, any>
): Promise<void> {
  const supabase = getSupabaseClient();

  // Update enrollment status in database
  const { error } = await db
    .from('partner_lms_enrollments')
    .update({
      status: 'active',
      metadata: {
        webhook_received_at: new Date().toISOString(),
        external_data: data,
      },
    })
    .eq('external_enrollment_id', data.enrollmentId);

  if (error) {
    logger.error('[Webhook] Failed to update enrollment:', error);
  }
}

async function handleProgressUpdated(
  partner: PartnerType,
  data: Record<string, any>
): Promise<void> {
  const supabase = getSupabaseClient();

  // Update progress in database
  const { error } = await db
    .from('partner_lms_enrollments')
    .update({
      progress_percentage: data.percentage || data.progress || 0,
      metadata: {
        last_synced_at: new Date().toISOString(),
        lessons_completed: data.lessonsCompleted,
        total_lessons: data.totalLessons,
      },
    })
    .eq('external_enrollment_id', data.enrollmentId);

  if (error) {
    logger.error('[Webhook] Failed to update progress:', error);
  }
}

async function handleCourseCompleted(
  partner: PartnerType,
  data: Record<string, any>
): Promise<void> {
  const supabase = getSupabaseClient();

  // Get the enrollment step
  const { data: step, error: stepError } = await db
    .from('enrollment_steps')
    .select('id, enrollment_id, provider_id')
    .eq('external_enrollment_id', data.enrollmentId)
    .eq('status', 'in_progress')
    .single();

  if (stepError || !step) {
    logger.error('[Webhook] Failed to find enrollment step:', stepError);
    return;
  }

  // Mark step complete and advance to next
  const { data: nextStepId, error: advanceError } = await supabase.rpc(
    'mark_step_complete',
    {
      p_step_id: step.id,
      p_external_enrollment_id: data.enrollmentId as string,
    }
  );

  if (advanceError) {
    logger.error('[Webhook] Failed to advance step:', advanceError);
    return;
  }

  // Update partner enrollment record
  const { error } = await db
    .from('partner_lms_enrollments')
    .update({
      status: 'completed',
      progress_percentage: 100,
      completed_at: data.completedAt || new Date().toISOString(),
      metadata: {
        completion_webhook_received_at: new Date().toISOString(),
      },
    })
    .eq('external_enrollment_id', data.enrollmentId);

  if (error) {
    logger.error('[Webhook] Failed to update completion:', error);
  }

  // If there's a next step, auto-enroll
  if (nextStepId) {
    const { data: nextStep } = await db
      .from('enrollment_steps')
      .select(
        '*, provider:partner_lms_providers(*), enrollment:enrollments(user_id)'
      )
      .eq('id', nextStepId)
      .single();

    if (nextStep) {
      // Trigger auto-enrollment in next partner
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/partner/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: nextStep.enrollment.user_id,
            providerId: nextStep.provider_id,
            enrollmentId: nextStep.enrollment_id,
            stepId: nextStep.id,
          }),
        });
      } catch (enrollError) {
        logger.error(
          '[Webhook] Failed to auto-enroll in next partner:',
          enrollError
        );
      }
    }
  } else {
    // All steps complete - check if enrollment is done
    const { data: isComplete } = await supabase.rpc('is_enrollment_complete', {
      p_enrollment_id: step.enrollment_id,
    });

    if (isComplete) {
      // Generate completion certificate
      await db
        .from('program_enrollments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', step.enrollment_id);

      // Trigger completion email
      await supabase.functions.invoke('send-completion-email', {
        body: {
          enrollmentId: step.enrollment_id,
          partner,
        },
      });
    }
  }
}

async function handleCertificateIssued(
  partner: PartnerType,
  data: Record<string, any>
): Promise<void> {
  const supabase = getSupabaseClient();

  // Update enrollment with certificate data
  const { error } = await db
    .from('partner_lms_enrollments')
    .update({
      metadata: {
        certificate_id: data.certificateId,
        certificate_number: data.certificateNumber,
        certificate_url: data.downloadUrl,
        certificate_issued_at: data.issuedDate || new Date().toISOString(),
      },
    })
    .eq('external_enrollment_id', data.enrollmentId);

  if (error) {
    logger.error('[Webhook] Failed to update certificate:', error);
  }
}
